export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireAdmin } from '@/lib/firebaseAdmin';

const ACCOUNT_TYPES = ['talent', 'business', 'agency', 'admin', 'owner'];

export async function GET(req: NextRequest) {
  try {
    const { db } = await requireAdmin(req);
    const params = req.nextUrl.searchParams;
    const search = params.get('q')?.trim().toLowerCase() ?? '';
    const accountType = params.get('accountType') ?? 'all';
    const status = params.get('status') ?? 'all';
    const publicProfile = params.get('publicProfile') ?? 'all';
    const limitParam = Math.min(Math.max(Number(params.get('limit') ?? 50), 1), 100);

    const snap = await db.collection('users').orderBy('updatedAt', 'desc').limit(250).get();
    const users = snap.docs
      .map((doc) => serializeAdminUser(doc.id, doc.data()))
      .filter((user) => {
        if (accountType !== 'all' && user.accountType !== accountType) return false;
        if (status === 'active' && (user.moderationStatus === 'suspended' || user.disabled)) return false;
        if (status === 'suspended' && user.moderationStatus !== 'suspended') return false;
        if (status === 'disabled' && !user.disabled) return false;
        if (publicProfile === 'visible' && !user.publicProfileEnabled) return false;
        if (publicProfile === 'hidden' && user.publicProfileEnabled) return false;
        if (!search) return true;
        return [
          user.email,
          user.displayName,
          user.uid,
          user.accountType,
        ].some((value) => String(value ?? '').toLowerCase().includes(search));
      })
      .slice(0, limitParam);

    return NextResponse.json({ users });
  } catch (err) {
    return jsonError(err);
  }
}

function serializeAdminUser(uid: string, data: FirebaseFirestore.DocumentData) {
  const accountType = normalizeAccountType(data.accountType);
  return {
    uid,
    email: data.email ?? null,
    displayName: data.displayName ?? '',
    photoURL: data.photoURL ?? null,
    accountType,
    accountTypeLocked: Boolean(data.accountTypeLocked),
    publicProfileEnabled: data.publicProfileEnabled !== false,
    moderationStatus: data.moderationStatus ?? 'active',
    disabled: Boolean(data.disabled),
    profileComplete: Number(data.profileComplete ?? 0),
    publicProfileComplete: Number(data.publicProfileComplete ?? 0),
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
    lastAdminActionAt: serializeTimestamp(data.lastAdminActionAt),
    lastAdminActionBy: data.lastAdminActionBy ?? null,
  };
}

function normalizeAccountType(value: unknown): string | null {
  if (value === 'user') return 'talent';
  if (ACCOUNT_TYPES.includes(String(value))) return String(value);
  return null;
}

function serializeTimestamp(value: any): string | null {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
