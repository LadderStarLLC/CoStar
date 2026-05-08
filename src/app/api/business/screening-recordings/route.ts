export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCallerProfile, jsonError } from '@/lib/firebaseAdmin';
import { canReviewBusinessScreening, writeRecordingEvent } from '@/lib/screeningRecording';

export async function GET(req: NextRequest) {
  try {
    const { decoded, profile, db } = await getCallerProfile(req);
    const reportId = req.nextUrl.searchParams.get('reportId');
    if (!reportId) {
      return NextResponse.json({ error: 'Report id is required.' }, { status: 400 });
    }
    const reportSnap = await db.collection('businessScreeningReports').doc(reportId).get();
    if (!reportSnap.exists) {
      return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
    }
    const report = reportSnap.data() ?? {};
    if (!(await canReviewBusinessScreening(db, decoded, profile, report.businessUid))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const snap = await db.collection('businessScreeningRecordings')
      .where('reportId', '==', reportId)
      .where('businessUid', '==', report.businessUid)
      .limit(1)
      .get();
    const recordingDoc = snap.docs[0];
    if (!recordingDoc) return NextResponse.json({ recording: null });
    const recording = recordingDoc.data();
    const consentSnap = recording.consentId
      ? await db.collection('businessScreeningRecordingConsents').doc(recording.consentId).get()
      : null;
    await writeRecordingEvent(db, {
      recordingId: recordingDoc.id,
      reportId,
      businessUid: report.businessUid,
      actorUid: decoded.uid,
      action: 'recording.metadata_viewed',
    });
    return NextResponse.json({
      recording: serializeRecording(recordingDoc.id, recording, consentSnap?.data() ?? null),
    });
  } catch (err) {
    return jsonError(err);
  }
}

function serializeRecording(id: string, data: Record<string, any>, consent: Record<string, any> | null) {
  return {
    id,
    status: data.status ?? 'failed',
    mimeType: data.mimeType ?? null,
    fileSizeBytes: data.fileSizeBytes ?? null,
    durationSeconds: data.durationSeconds ?? null,
    participantName: data.participantName ?? '',
    participantEmail: data.participantEmail ?? '',
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
    recordingStartedAt: data.recordingStartedAt?.toDate?.()?.toISOString?.() ?? null,
    recordingEndedAt: data.recordingEndedAt?.toDate?.()?.toISOString?.() ?? null,
    retentionDeleteAt: data.retentionDeleteAt?.toDate?.()?.toISOString?.() ?? null,
    deletedAt: data.deletedAt?.toDate?.()?.toISOString?.() ?? null,
    consent: consent ? {
      consentGiven: consent.consentGiven === true,
      consentedAt: consent.consentedAt?.toDate?.()?.toISOString?.() ?? null,
      consentTextVersion: consent.consentTextVersion ?? null,
      consentTextSnapshot: consent.consentTextSnapshot ?? null,
    } : null,
  };
}
