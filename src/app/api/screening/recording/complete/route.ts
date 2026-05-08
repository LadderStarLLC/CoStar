export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, jsonError } from '@/lib/firebaseAdmin';
import { writeRecordingEvent } from '@/lib/screeningRecording';

type Body = {
  recordingId?: string;
  status?: 'ready' | 'failed';
  error?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body.recordingId) {
      return NextResponse.json({ error: 'Recording id is required.' }, { status: 400 });
    }
    const db = getAdminDb();
    const snap = await db.collection('businessScreeningRecordings').doc(body.recordingId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Recording not found.' }, { status: 404 });
    }
    const data = snap.data() ?? {};
    const nextStatus = body.status === 'failed' ? 'failed' : data.status === 'ready' ? 'ready' : 'failed';
    await snap.ref.set({
      status: nextStatus,
      failureReason: nextStatus === 'failed' ? body.error?.slice(0, 500) ?? 'Recording finalization failed.' : null,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await writeRecordingEvent(db, {
      recordingId: snap.id,
      businessUid: data.businessUid ?? null,
      action: nextStatus === 'ready' ? 'recording.completed' : 'recording.failed',
    });
    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (err) {
    return jsonError(err);
  }
}
