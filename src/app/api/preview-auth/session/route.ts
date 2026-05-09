export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp, getAdminDb, jsonError } from '@/lib/firebaseAdmin';
import {
  PREVIEW_AUTH_COOKIE,
  PREVIEW_AUTH_EMAIL,
  PREVIEW_AUTH_UID,
  isPreviewAuthEnabled,
  previewBusinessProfile,
} from '@/lib/deploymentMode';
import { createPreviewSessionToken } from '@/lib/previewAuth';
import { resolveEntitlements } from '@/lib/entitlements';

export async function POST(req: NextRequest) {
  try {
    if (!isPreviewAuthEnabled(process.env)) {
      return NextResponse.json({ error: 'Preview auth is not enabled for this deployment.' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    if (body?.secret !== process.env.PREVIEW_AUTH_SECRET) {
      return NextResponse.json({ error: 'Invalid preview secret.' }, { status: 403 });
    }

    const auth = getAuth(getAdminApp());
    await auth.updateUser(PREVIEW_AUTH_UID, {
      email: PREVIEW_AUTH_EMAIL,
      displayName: previewBusinessProfile.displayName,
      disabled: false,
    }).catch(async (err) => {
      if (err?.code !== 'auth/user-not-found') throw err;
      await auth.createUser({
        uid: PREVIEW_AUTH_UID,
        email: PREVIEW_AUTH_EMAIL,
        displayName: previewBusinessProfile.displayName,
        disabled: false,
      });
    });

    const now = FieldValue.serverTimestamp();
    const entitlements = resolveEntitlements({
      accountType: 'business',
      status: 'free',
      billingCycle: 'free',
    });
    const db = getAdminDb();
    await db.doc(`users/${PREVIEW_AUTH_UID}`).set({
      ...previewBusinessProfile,
      accountTypeLockedAt: now,
      billing: {
        provider: null,
        subscriptionStatus: 'free',
        accountType: entitlements.accountType,
        tierId: entitlements.tierId,
        tierName: entitlements.tierName,
        billingCycle: 'free',
        monthlyAllowance: entitlements.monthlyAllowance,
        updatedAt: now,
      },
      entitlements: {
        ...entitlements,
        updatedAt: now,
      },
      updatedAt: now,
      createdAt: now,
    }, { merge: true });

    const customToken = await auth.createCustomToken(PREVIEW_AUTH_UID, { previewAuth: true });
    const sessionToken = createPreviewSessionToken(process.env.PREVIEW_AUTH_SECRET!);
    const response = NextResponse.json({ customToken, user: previewBusinessProfile });
    response.cookies.set(PREVIEW_AUTH_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 12 * 60 * 60,
    });
    return response;
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PREVIEW_AUTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 0,
  });
  return response;
}
