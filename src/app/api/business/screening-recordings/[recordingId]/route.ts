export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getCallerProfile, jsonError } from '@/lib/firebaseAdmin';
import { canReviewBusinessScreening, deletePrivateRecording, writeRecordingEvent } from '@/lib/screeningRecording';

export async function DELETE(
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
    await deletePrivateRecording(recording.storageKey ?? null);
    await snap.ref.set({
      status: 'deleted',
      deletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await writeRecordingEvent(db, {
      recordingId: snap.id,
      reportId: recording.reportId ?? null,
      businessUid: recording.businessUid ?? null,
      actorUid: decoded.uid,
      action: 'recording.deleted',
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
