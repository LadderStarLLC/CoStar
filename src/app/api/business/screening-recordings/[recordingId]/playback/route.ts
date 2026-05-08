export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCallerProfile, jsonError } from '@/lib/firebaseAdmin';
import { canReviewBusinessScreening, getPrivateRecordingSignedUrl, writeRecordingEvent } from '@/lib/screeningRecording';

export async function GET(
  req: NextRequest,
  { params }: { params: { recordingId: string } },
) {
  try {
    const { decoded, profile, db } = await getCallerProfile(req);
    const snap = await db.collection('businessScreeningRecordings').doc(params.recordingId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Recording not found.' }, { status: 404 });
    }
    const recording = snap.data() ?? {};
    if (!(await canReviewBusinessScreening(db, decoded, profile, recording.businessUid))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (recording.deletedAt || recording.status !== 'ready' || !recording.storageKey) {
      return NextResponse.json({ error: 'Recording is not available.' }, { status: 404 });
    }
    const url = await getPrivateRecordingSignedUrl(recording.storageKey);
    await writeRecordingEvent(db, {
      recordingId: snap.id,
      reportId: recording.reportId ?? null,
      businessUid: recording.businessUid ?? null,
      actorUid: decoded.uid,
      action: 'recording.playback_url_created',
    });
    return NextResponse.json({ url, expiresInSeconds: 600 });
  } catch (err) {
    return jsonError(err);
  }
}
