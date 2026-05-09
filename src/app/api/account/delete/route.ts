export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp, getCallerProfile, jsonError } from '@/lib/firebaseAdmin';
import { buildSoftDeleteMetadata } from '@/lib/softDelete';

export async function POST(req: NextRequest) {
  try {
    const { decoded, db } = await getCallerProfile(req);
    const body = await req.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' && body.reason.trim()
      ? body.reason.trim().slice(0, 500)
      : 'User requested account deletion.';
    const now = FieldValue.serverTimestamp();
    const metadata = buildSoftDeleteMetadata({
      deletedAt: now,
      deletedBy: decoded.uid,
      deletionReason: reason,
      deleteSource: 'user',
    });

    await db.doc(`users/${decoded.uid}`).set({
      ...metadata,
      disabled: true,
      moderationStatus: 'suspended',
      publicProfileEnabled: false,
      updatedAt: now,
    }, { merge: true });

    await db.doc(`publicProfiles/${decoded.uid}`).set({
      ...metadata,
      status: 'hidden',
      searchable: false,
      updatedAt: now,
    }, { merge: true });

    await getAuth(getAdminApp()).updateUser(decoded.uid, { disabled: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
