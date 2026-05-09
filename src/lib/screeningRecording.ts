import crypto from 'crypto';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminApp } from './firebaseAdmin';
import { buildSoftDeleteMetadata } from './softDelete';

export const SCREENING_RECORDING_CONSENT_VERSION = 'business-screening-recording-v1';
export const SCREENING_RECORDING_CONSENT_TEXT =
  'This business screening session will be audio/video recorded. The recording will be saved to the interview session and may be reviewed by the business for hiring or screening purposes. You can decline, in which case the recorded session will not proceed. Do not continue unless you are comfortable being recorded.';

export const ALLOWED_RECORDING_MIME_TYPES = ['video/webm', 'video/mp4'];

export type ScreeningLinkRecord = {
  id: string;
  data: Record<string, any>;
};

export function hashScreeningToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRecordingConfig() {
  const enabled = process.env.RECORDED_SCREENINGS_ENABLED === 'true';
  const retentionDays = Number(process.env.RECORDED_SCREENING_RETENTION_DAYS ?? 90);
  const maxBytes = Number(process.env.RECORDED_SCREENING_MAX_BYTES ?? 200 * 1024 * 1024);
  return {
    enabled,
    retentionDays: Number.isFinite(retentionDays) && retentionDays > 0 ? retentionDays : 90,
    maxBytes: Number.isFinite(maxBytes) && maxBytes > 0 ? maxBytes : 200 * 1024 * 1024,
  };
}

export function retentionDate(days = getRecordingConfig().retentionDays) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function isAllowedRecordingMimeType(mimeType?: string | null) {
  if (!mimeType) return false;
  return ALLOWED_RECORDING_MIME_TYPES.some((allowed) => mimeType === allowed || mimeType.startsWith(`${allowed};`));
}

export async function findActiveScreeningLink(db: Firestore, token: string): Promise<ScreeningLinkRecord | null> {
  const snap = await db.collection('businessScreeningLinks')
    .where('tokenHash', '==', hashScreeningToken(token))
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

export function isBusinessScreeningRecordingEnabled(link: ScreeningLinkRecord) {
  return Boolean(link.data.recordingEnabled && link.data.sessionType === 'business_screening' && getRecordingConfig().enabled);
}

export async function canReviewBusinessScreening(
  db: Firestore,
  actor: DecodedIdToken,
  profile: Record<string, any> | null | undefined,
  businessUid: string,
) {
  if (profile?.accountType === 'admin' || profile?.accountType === 'owner') return true;
  if (profile?.accountType === 'business' && actor.uid === businessUid) return true;
  return false;
}

export async function writeRecordingEvent(db: Firestore, input: Record<string, unknown>) {
  await db.collection('businessScreeningRecordingEvents').add({
    ...stripUndefined(input),
    createdAt: FieldValue.serverTimestamp(),
  });
}

export function buildRecordingStorageKey(input: {
  businessUid: string;
  linkId: string;
  recordingId: string;
  mimeType: string;
}) {
  const ext = input.mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
  return [
    'business-screenings',
    safePathSegment(input.businessUid),
    safePathSegment(input.linkId),
    `${safePathSegment(input.recordingId)}.${ext}`,
  ].join('/');
}

export async function uploadPrivateRecording(storageKey: string, data: Buffer, mimeType: string) {
  const bucket = getStorage(getAdminApp()).bucket();
  const file = bucket.file(storageKey);
  await file.save(data, {
    resumable: false,
    metadata: {
      contentType: mimeType,
      cacheControl: 'private, max-age=0, no-transform',
    },
  });
}

export async function getPrivateRecordingSignedUrl(storageKey: string) {
  const bucket = getStorage(getAdminApp()).bucket();
  const [url] = await bucket.file(storageKey).getSignedUrl({
    action: 'read',
    expires: Date.now() + 10 * 60 * 1000,
  });
  return url;
}

export async function selectExpiredScreeningRecordings(db: Firestore, now = new Date()) {
  const expired = await db.collection('businessScreeningRecordings')
    .where('deletedAt', '==', null)
    .where('retentionDeleteAt', '<=', Timestamp.fromDate(now))
    .limit(50)
    .get();
  return expired.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
}

export async function cleanupExpiredScreeningRecordings(db: Firestore) {
  const expired = await selectExpiredScreeningRecordings(db);
  for (const item of expired) {
    const metadata = buildSoftDeleteMetadata({
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: null,
      deletionReason: 'Recording retention window expired.',
      deleteSource: 'retention',
    });
    await db.collection('businessScreeningRecordings').doc(item.id).set({
      ...metadata,
      status: 'deleted',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await writeRecordingEvent(db, {
      recordingId: item.id,
      businessUid: item.data.businessUid ?? null,
      action: 'recording.retention_deleted',
    });
  }
  return expired.length;
}

function safePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => stripUndefined(item)) as T;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((next, [key, entry]) => {
      if (entry !== undefined) next[key] = stripUndefined(entry);
      return next;
    }, {}) as T;
  }
  return value;
}
