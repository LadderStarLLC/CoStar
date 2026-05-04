export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getCallerProfile, jsonError } from '@/lib/firebaseAdmin';

type QuestionMode = 'exact' | 'bank' | 'auto';

type Body = {
  jobId?: string;
  questionMode?: QuestionMode;
  questions?: string[];
};

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { decoded, profile, db } = await getCallerProfile(req);
    if (profile?.accountType !== 'business') {
      return NextResponse.json({ error: 'Only Business accounts can create screening links.' }, { status: 403 });
    }

    const body = (await req.json()) as Body;
    if (!body.jobId?.trim()) {
      return NextResponse.json({ error: 'Job id is required.' }, { status: 400 });
    }

    const jobSnap = await db.doc(`jobs/${body.jobId}`).get();
    if (!jobSnap.exists) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }
    const job = jobSnap.data() ?? {};
    if (job.employerId !== decoded.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const questionMode = body.questionMode === 'exact' || body.questionMode === 'bank' ? body.questionMode : 'auto';
    const questions = (body.questions ?? []).map((q) => q.trim()).filter(Boolean).slice(0, 20);
    if ((questionMode === 'exact' || questionMode === 'bank') && questions.length === 0) {
      return NextResponse.json({ error: 'Add at least one question.' }, { status: 400 });
    }

    const token = crypto.randomBytes(24).toString('base64url');
    const linkRef = db.collection('businessScreeningLinks').doc();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    await linkRef.set({
      businessUid: decoded.uid,
      jobId: body.jobId,
      jobTitle: job.title ?? 'Screening',
      companyName: job.companyName ?? '',
      jobDescription: job.description ?? job.shortDescription ?? '',
      questionMode,
      questions,
      tokenHash: hashToken(token),
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });

    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
    return NextResponse.json({
      linkId: linkRef.id,
      token,
      url: `${origin}/screening/${token}`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    return jsonError(err);
  }
}
