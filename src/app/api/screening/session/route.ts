export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, jsonError } from '@/lib/firebaseAdmin';
import { consumeWalletBalance } from '@/lib/walletAdmin';

type GetBody = never;
type SubmitBody = {
  token?: string;
  participantName?: string;
  participantEmail?: string;
  answers?: Array<{ question: string; answer: string }>;
};

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function findLink(token: string) {
  const db = getAdminDb();
  const snap = await db.collection('businessScreeningLinks')
    .where('tokenHash', '==', hashToken(token))
    .where('status', '==', 'active')
    .limit(1)
    .get();
  const doc = snap.docs[0];
  if (!doc) return null;
  const data = doc.data();
  const expiresAt = data.expiresAt?.toDate?.() as Date | undefined;
  if (!expiresAt || expiresAt.getTime() < Date.now()) return null;
  return { id: doc.id, data };
}

function buildQuestions(link: Record<string, any>): string[] {
  const stored = Array.isArray(link.questions) ? link.questions.filter((q: unknown) => typeof q === 'string' && q.trim()) : [];
  if (link.questionMode === 'exact') return stored.slice(0, 10);
  if (link.questionMode === 'bank') return stored.sort(() => 0.5 - Math.random()).slice(0, Math.min(8, stored.length));
  const title = link.jobTitle || 'this role';
  return [
    `What makes you a strong fit for ${title}?`,
    'Describe a recent project or responsibility that best demonstrates your relevant experience.',
    'Which requirements in this role would be your biggest strengths, and where would you need ramp-up time?',
    'Tell us about a time you solved a difficult problem under constraints.',
    'Why are you interested in this opportunity?',
  ];
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token') ?? '';
    const link = token ? await findLink(token) : null;
    if (!link) {
      return NextResponse.json({ error: 'Screening link is invalid or expired.' }, { status: 404 });
    }
    return NextResponse.json({
      jobTitle: link.data.jobTitle ?? 'Screening',
      companyName: link.data.companyName ?? '',
      expiresAt: link.data.expiresAt?.toDate?.()?.toISOString?.() ?? null,
      questions: buildQuestions(link.data),
    });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubmitBody;
    const token = body.token ?? '';
    const link = token ? await findLink(token) : null;
    if (!link) {
      return NextResponse.json({ error: 'Screening link is invalid or expired.' }, { status: 404 });
    }
    const answers = (body.answers ?? [])
      .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
      .filter((item) => item.question && item.answer);
    if (answers.length === 0) {
      return NextResponse.json({ error: 'At least one answered question is required.' }, { status: 400 });
    }

    const db = getAdminDb();
    await consumeWalletBalance(db, {
      uid: link.data.businessUid,
      amount: 1,
      reason: `Business screening: ${link.data.jobTitle ?? 'candidate session'}`,
    });

    const analysis = await generateScreeningAnalysis({
      jobTitle: link.data.jobTitle ?? 'Screening',
      companyName: link.data.companyName ?? '',
      jobDescription: link.data.jobDescription ?? '',
      answers,
    });

    const reportRef = db.collection('businessScreeningReports').doc();
    await reportRef.set({
      businessUid: link.data.businessUid,
      linkId: link.id,
      jobId: link.data.jobId,
      jobTitle: link.data.jobTitle ?? 'Screening',
      companyName: link.data.companyName ?? '',
      participantName: body.participantName?.trim() ?? '',
      participantEmail: body.participantEmail?.trim().toLowerCase() ?? '',
      answers,
      analysis,
      screeningDebited: true,
      durationSeconds: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, reportId: reportRef.id });
  } catch (err) {
    return jsonError(err);
  }
}

async function generateScreeningAnalysis(input: {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  answers: Array<{ question: string; answer: string }>;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return 'Analysis unavailable: no Gemini API key configured.';

  const answerText = input.answers.map((item, index) => `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer}`).join('\n\n');
  const prompt = `You are a hiring screening analyst. Produce a detailed candidate screening report for ${input.jobTitle}${input.companyName ? ` at ${input.companyName}` : ''}.

Job context:
${input.jobDescription || 'No job description provided.'}

Candidate responses:
${answerText}

Return a complete markdown report with: executive summary, fit score from 0-100, role alignment, strengths, risks, communication signals, question-by-question notes, follow-up questions, and hiring recommendation. Ground every point in the candidate responses.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3 },
    }),
  });
  if (!res.ok) {
    console.error('[screening/session] Gemini error:', await res.text());
    return 'Analysis unavailable: Gemini report generation failed.';
  }
  const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Analysis unavailable: Gemini returned an empty report.';
}
