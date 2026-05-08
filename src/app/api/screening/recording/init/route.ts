export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb, jsonError } from '@/lib/firebaseAdmin';
import {
  findActiveScreeningLink,
  getRecordingConfig,
  isBusinessScreeningRecordingEnabled,
  retentionDate,
  writeRecordingEvent,
} from '@/lib/screeningRecording';

type Body = {
  token?: string;
  consentId?: string;
  participantName?: string;
  participantEmail?: string;
  mimeType?: string;
  recordingStartedAt?: string;
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
    if (!body.consentId) {
      return NextResponse.json({ error: 'Consent is required before recording.' }, { status: 400 });
    }

    const consentSnap = await db.collection('businessScreeningRecordingConsents').doc(body.consentId).get();
    const consent = consentSnap.data();
    if (!consentSnap.exists || consent?.linkId !== link.id || consent?.consentGiven !== true) {
      return NextResponse.json({ error: 'Valid recording consent is required.' }, { status: 400 });
    }

    const recordingRef = db.collection('businessScreeningRecordings').doc();
    const retentionDays = Number(link.data.recordingRetentionDays ?? getRecordingConfig().retentionDays);
    await recordingRef.set({
      businessUid: link.data.businessUid,
      jobId: link.data.jobId ?? null,
      linkId: link.id,
      reportId: null,
      consentId: body.consentId,
      sessionType: 'business_screening',
      participantName: body.participantName?.trim() ?? '',
      participantEmail: body.participantEmail?.trim().toLowerCase() ?? consent.candidateEmail ?? '',
      status: 'uploading',
      storageKey: null,
      mimeType: body.mimeType ?? null,
      fileSizeBytes: null,
      durationSeconds: null,
      recordingStartedAt: body.recordingStartedAt ? Timestamp.fromDate(new Date(body.recordingStartedAt)) : FieldValue.serverTimestamp(),
      recordingEndedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      deletedAt: null,
      retentionDeleteAt: Timestamp.fromDate(retentionDate(retentionDays)),
      uploadedBy: 'candidate_token',
    });

    await writeRecordingEvent(db, {
      recordingId: recordingRef.id,
      consentId: body.consentId,
      linkId: link.id,
      businessUid: link.data.businessUid,
      action: 'recording.initialized',
    });

    return NextResponse.json({ ok: true, recordingId: recordingRef.id, maxBytes: getRecordingConfig().maxBytes });
  } catch (err) {
    return jsonError(err);
  }
}
