export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, jsonError } from '@/lib/firebaseAdmin';
import {
  findActiveScreeningLink,
  isBusinessScreeningRecordingEnabled,
  SCREENING_RECORDING_CONSENT_TEXT,
  SCREENING_RECORDING_CONSENT_VERSION,
  writeRecordingEvent,
} from '@/lib/screeningRecording';

type Body = {
  token?: string;
  participantName?: string;
  participantEmail?: string;
  consentGiven?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const db = getAdminDb();
    const link = body.token ? await findActiveScreeningLink(db, body.token) : null;
    if (!link) {
      return NextResponse.json({ error: 'Screening link is invalid or expired.' }, { status: 404 });
    }
    if (!isBusinessScreeningRecordingEnabled(link)) {
      return NextResponse.json({ error: 'Recording is not enabled for this screening.' }, { status: 403 });
    }

    const consentRef = db.collection('businessScreeningRecordingConsents').doc();
    const consentGiven = body.consentGiven === true;
    await consentRef.set({
      interviewSessionId: link.id,
      linkId: link.id,
      businessUid: link.data.businessUid,
      jobId: link.data.jobId ?? null,
      candidateUserId: null,
      candidateName: body.participantName?.trim() ?? '',
      candidateEmail: body.participantEmail?.trim().toLowerCase() ?? '',
      consentGiven,
      consentTextVersion: SCREENING_RECORDING_CONSENT_VERSION,
      consentTextSnapshot: SCREENING_RECORDING_CONSENT_TEXT,
      consentedAt: consentGiven ? FieldValue.serverTimestamp() : null,
      declinedAt: consentGiven ? null : FieldValue.serverTimestamp(),
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: req.headers.get('user-agent') ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });

    await writeRecordingEvent(db, {
      consentId: consentRef.id,
      linkId: link.id,
      businessUid: link.data.businessUid,
      action: consentGiven ? 'recording.consent_given' : 'recording.consent_declined',
    });

    return NextResponse.json({ ok: true, consentId: consentRef.id, consentGiven });
  } catch (err) {
    return jsonError(err);
  }
}
