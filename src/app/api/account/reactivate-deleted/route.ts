export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import {
  canStartDeletedAccountReactivation,
  normalizePublicReactivationType,
} from '@/lib/accountReactivation';
import { getAdminApp, getAdminDb, jsonError, normalizeAdminEmail } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeAdminEmail(typeof body?.email === 'string' ? body.email : null);
    const requestedType = normalizePublicReactivationType(body?.requestedType);

    if (!email || !requestedType) {
      throw new Response(JSON.stringify({ error: 'A valid email and public account type are required.' }), { status: 400 });
    }

    const auth = getAuth(getAdminApp());
    const authUser = await auth.getUserByEmail(email).catch((err) => {
      if (err?.code === 'auth/user-not-found') {
        throw new Response(JSON.stringify({ error: 'No deleted account is eligible for recreation with this email.' }), { status: 404 });
      }
      throw err;
    });

    const db = getAdminDb();
    const userRef = db.doc(`users/${authUser.uid}`);
    const snap = await userRef.get();
    const profile = snap.exists ? snap.data() ?? {} : null;

    if (!canStartDeletedAccountReactivation(profile, requestedType)) {
      throw new Response(JSON.stringify({ error: 'This account is not eligible for self-service recreation.' }), { status: 403 });
    }

    const nowMs = Date.now();
    const reactivationToken = randomBytes(32).toString('base64url');
    await userRef.set({
      pendingReactivation: {
        requestedType,
        reactivationToken,
        requestedAt: FieldValue.serverTimestamp(),
        requestedAtMs: nowMs,
        source: 'self-service',
      },
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    if (authUser.disabled) {
      await auth.updateUser(authUser.uid, { disabled: false });
    }

    return NextResponse.json({ ok: true, reactivationToken, requestedType });
  } catch (err) {
    return jsonError(err);
  }
}
