export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, jsonError } from '@/lib/firebaseAdmin';
import {
  buildRecordingStorageKey,
  findActiveScreeningLink,
  getRecordingConfig,
  isAllowedRecordingMimeType,
  isBusinessScreeningRecordingEnabled,
  uploadPrivateRecording,
  writeRecordingEvent,
} from '@/lib/screeningRecording';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const token = String(form.get('token') ?? '');
    const consentId = String(form.get('consentId') ?? '');
    const recordingId = String(form.get('recordingId') ?? '');
    const durationSeconds = Number(form.get('durationSeconds') ?? 0);
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Recording file is required.' }, { status: 400 });
    }

    const config = getRecordingConfig();
    if (file.size <= 0 || file.size > config.maxBytes) {
      return NextResponse.json({ error: 'Recording file is too large.' }, { status: 413 });
    }
    if (!isAllowedRecordingMimeType(file.type)) {
      return NextResponse.json({ error: 'Recording file type is not supported.' }, { status: 400 });
    }

    const db = getAdminDb();
    const link = token ? await findActiveScreeningLink(db, token) : null;
    if (!link || !isBusinessScreeningRecordingEnabled(link)) {
      return NextResponse.json({ error: 'Recording is not enabled for this screening.' }, { status: 403 });
    }

    const [consentSnap, recordingSnap] = await Promise.all([
      db.collection('businessScreeningRecordingConsents').doc(consentId).get(),
      db.collection('businessScreeningRecordings').doc(recordingId).get(),
    ]);
    const consent = consentSnap.data();
    const recording = recordingSnap.data();
    if (!consentSnap.exists || consent?.linkId !== link.id || consent?.consentGiven !== true) {
      return NextResponse.json({ error: 'Valid recording consent is required.' }, { status: 400 });
    }
    if (
      !recordingSnap.exists ||
      recording?.businessUid !== link.data.businessUid ||
      recording?.linkId !== link.id ||
      recording?.consentId !== consentId ||
      recording?.status !== 'uploading'
    ) {
      return NextResponse.json({ error: 'Recording upload is not valid for this session.' }, { status: 400 });
    }

    const storageKey = buildRecordingStorageKey({
      businessUid: link.data.businessUid,
      linkId: link.id,
      recordingId,
      mimeType: file.type,
    });
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadPrivateRecording(storageKey, buffer, file.type);

    await db.collection('businessScreeningRecordings').doc(recordingId).set({
      status: 'ready',
      storageKey,
      mimeType: file.type,
      fileSizeBytes: file.size,
      durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : null,
      recordingEndedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await writeRecordingEvent(db, {
      recordingId,
      consentId,
      linkId: link.id,
      businessUid: link.data.businessUid,
      action: 'recording.uploaded',
      fileSizeBytes: file.size,
      mimeType: file.type,
    });

    return NextResponse.json({ ok: true, recordingId });
  } catch (err) {
    return jsonError(err);
  }
}
