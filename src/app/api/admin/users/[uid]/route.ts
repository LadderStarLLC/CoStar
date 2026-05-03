export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireAdmin } from '@/lib/firebaseAdmin';
import { getOrCreateWalletSummary } from '@/lib/walletAdmin';

export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const { db } = await requireAdmin(req);
    const uid = params.uid;
    const profileSnap = await db.doc(`users/${uid}`).get();
    if (!profileSnap.exists) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const profile = profileSnap.data() ?? {};
    const [publicProfileSnap, walletSummary, auditSnap] = await Promise.all([
      db.doc(`publicProfiles/${uid}`).get(),
      getOrCreateWalletSummary(db, uid),
      db.collection('adminAuditLogs')
        .where('targetUid', '==', uid)
        .limit(50)
        .get(),
    ]);

    return NextResponse.json({
      profile: serializeProfile(uid, profile),
      publicProfile: publicProfileSnap.exists ? serializePublicProfile(publicProfileSnap.data() ?? {}) : null,
      walletSummary,
      auditLogs: auditSnap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: serializeTimestamp(doc.data().createdAt),
        }))
        .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
        .slice(0, 20),
    });
  } catch (err) {
    return jsonError(err);
  }
}

function serializeProfile(uid: string, data: FirebaseFirestore.DocumentData) {
  return {
    uid,
    email: data.email ?? null,
    displayName: data.displayName ?? '',
    photoURL: data.photoURL ?? null,
    accountType: data.accountType === 'user' ? 'talent' : data.accountType ?? null,
    role: data.role ?? null,
    accountTypeLocked: Boolean(data.accountTypeLocked),
    headline: data.headline ?? '',
    location: data.location ?? '',
    slug: data.slug ?? '',
    publicProfileEnabled: data.publicProfileEnabled !== false,
    profileComplete: Number(data.profileComplete ?? 0),
    publicProfileComplete: Number(data.publicProfileComplete ?? 0),
    moderationStatus: data.moderationStatus ?? 'active',
    disabled: Boolean(data.disabled),
    adminNotes: data.adminNotes ?? '',
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
    lastAdminActionAt: serializeTimestamp(data.lastAdminActionAt),
    lastAdminActionBy: data.lastAdminActionBy ?? null,
  };
}

function serializePublicProfile(data: FirebaseFirestore.DocumentData) {
  return {
    status: data.status ?? 'draft',
    searchable: Boolean(data.searchable),
    moderationStatus: data.moderationStatus ?? 'active',
    slug: data.slug ?? '',
    accountType: data.accountType ?? null,
    updatedAt: serializeTimestamp(data.updatedAt),
    publishedAt: serializeTimestamp(data.publishedAt),
  };
}

function serializeTimestamp(value: any): string | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
