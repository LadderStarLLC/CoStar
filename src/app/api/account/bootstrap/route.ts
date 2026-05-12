export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import {
  buildRecreatedAccountProfileUpdate,
  isSelfDeletedAccount,
  resolveBootstrapAccountType,
  resolveSelfDeletedReactivationType,
} from '@/lib/accountReactivation';
import {
  getAdminDb,
  isOwnerEmail,
  jsonError,
  normalizeAdminEmail,
  verifyBearerToken,
} from '@/lib/firebaseAdmin';
import type { AccountType } from '@/lib/profile';
import { resolveEntitlements } from '@/lib/entitlements';

const publicAccountTypes: AccountType[] = ['talent', 'business', 'agency'];

export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyBearerToken(req);
    const body = await req.json().catch(() => ({}));
    const requestedBodyType = body?.requestedType === 'user' ? 'talent' : body?.requestedType;
    const requestedType = publicAccountTypes.includes(requestedBodyType) ? requestedBodyType as AccountType : null;
    const db = getAdminDb();
    const userRef = db.doc(`users/${decoded.uid}`);
    const snap = await userRef.get();
    const existing = snap.exists ? snap.data() ?? {} : {};
    const email = normalizeAdminEmail(decoded.email);
    const now = FieldValue.serverTimestamp();
    const forcedOwner = isOwnerEmail(email);
    const reactivationType = forcedOwner
      ? null
      : resolveSelfDeletedReactivationType(existing, requestedType);
    const nextAccountType: AccountType | null = resolveBootstrapAccountType({
      forcedOwner,
      existingAccountType: existing.accountType,
      requestedType,
      reactivationType,
    });

    const baseData = {
      uid: decoded.uid,
      email: decoded.email ?? existing.email ?? null,
      emailNormalized: email || existing.emailNormalized || null,
      displayName: existing.displayName ?? decoded.name ?? decoded.email ?? '',
      photoURL: existing.photoURL ?? decoded.picture ?? null,
      updatedAt: now,
    };

    const accountData = nextAccountType ? {
      accountType: nextAccountType,
      role: nextAccountType,
      accountTypeLocked: true,
      accountTypeLockedAt: existing.accountTypeLockedAt ?? now,
      accountTypeSource: forcedOwner ? 'system' : existing.accountTypeSource ?? 'signup',
      moderationStatus: existing.moderationStatus ?? 'active',
      disabled: false,
    } : {
      accountType: null,
      role: 'talent',
      accountTypeLocked: false,
      moderationStatus: existing.moderationStatus ?? 'active',
      disabled: false,
    };
    const freeEntitlementData = publicAccountTypes.includes(nextAccountType as AccountType)
      ? (() => {
          const entitlements = resolveEntitlements({
            accountType: nextAccountType as 'talent' | 'business' | 'agency',
            status: 'free',
            billingCycle: 'free',
          });
          return {
            billing: existing.billing ?? {
              provider: null,
              subscriptionStatus: 'free',
              accountType: entitlements.accountType,
              tierId: entitlements.tierId,
              tierName: entitlements.tierName,
              billingCycle: 'free',
              monthlyAllowance: entitlements.monthlyAllowance,
              updatedAt: now,
            },
            entitlements: existing.entitlements ?? {
              ...entitlements,
              updatedAt: now,
            },
          };
        })()
      : {};

    if (snap.exists) {
      if (!forcedOwner && isSelfDeletedAccount(existing) && !reactivationType) {
        throw new Response(JSON.stringify({ error: 'Deleted account reactivation request has expired. Start account recreation again.' }), { status: 403 });
      }

      const reactivationData = reactivationType
        ? buildRecreatedAccountProfileUpdate(reactivationType, FieldValue.delete(), now)
        : {};

      await userRef.update({ ...baseData, ...accountData, ...freeEntitlementData, ...reactivationData });
    } else {
      await userRef.set({
        ...baseData,
        ...accountData,
        ...freeEntitlementData,
        publicProfileEnabled: true,
        socialConnections: [],
        workExperience: [],
        education: [],
        accolades: [],
        createdAt: now,
      });
    }

    const updated = await userRef.get();
    return NextResponse.json({ uid: decoded.uid, ...updated.data() });
  } catch (err) {
    return jsonError(err);
  }
}
