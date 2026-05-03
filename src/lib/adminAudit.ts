import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { AdminAuditAction } from './profile';

type AuditInput = {
  db: Firestore;
  actor: DecodedIdToken;
  actorRole?: string | null;
  targetUid: string;
  targetEmail?: string | null;
  action: AdminAuditAction;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
};

export async function writeAdminAuditLog({
  db,
  actor,
  actorRole,
  targetUid,
  targetEmail,
  action,
  before,
  after,
  reason,
}: AuditInput): Promise<void> {
  await db.collection('adminAuditLogs').add(stripUndefined({
    actorUid: actor.uid,
    actorEmail: actor.email ?? null,
    actorRole: actorRole ?? null,
    targetUid,
    targetEmail: targetEmail ?? null,
    action,
    before: before ? stripUndefined(before) : null,
    after: after ? stripUndefined(after) : null,
    reason: reason?.trim() || null,
    createdAt: FieldValue.serverTimestamp(),
  }));
}

export function auditSnapshot(data: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  return keys.reduce<Record<string, unknown>>((snapshot, key) => {
    snapshot[key] = data[key] ?? null;
    return snapshot;
  }, {});
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((next, [key, entry]) => {
      if (entry !== undefined) next[key] = stripUndefined(entry);
      return next;
    }, {}) as T;
  }
  return value;
}
