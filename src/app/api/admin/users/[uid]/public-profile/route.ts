export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { auditSnapshot, writeAdminAuditLog } from '@/lib/adminAudit';
import { jsonError, requireAdmin } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const { decoded, profile: actorProfile, db } = await requireAdmin(req);
    const body = await req.json();
    const publicProfileEnabled = typeof body.publicProfileEnabled === 'boolean'
      ? body.publicProfileEnabled
      : undefined;
    const searchable = typeof body.searchable === 'boolean' ? body.searchable : undefined;
    const reason = String(body.reason ?? '').trim();

    if (typeof publicProfileEnabled !== 'boolean' && typeof searchable !== 'boolean') {
      return NextResponse.json({ error: 'Public profile update is required.' }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ error: 'Reason is required.' }, { status: 400 });
    }

    const userRef = db.doc(`users/${params.uid}`);
    const snap = await userRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    const data = snap.data() ?? {};

    const publicRef = db.doc(`publicProfiles/${params.uid}`);
    const publicSnap = await publicRef.get();
    const publicData = publicSnap.exists ? publicSnap.data() ?? {} : {};
    const nextPublicEnabled = publicProfileEnabled ?? data.publicProfileEnabled !== false;
    const nextSearchable = searchable ?? nextPublicEnabled;
    const before = {
      user: auditSnapshot(data, ['publicProfileEnabled']),
      publicProfile: auditSnapshot(publicData, ['status', 'searchable']),
    };

    await userRef.update({
      ...(typeof publicProfileEnabled === 'boolean' ? { publicProfileEnabled } : {}),
      lastAdminActionBy: decoded.uid,
      lastAdminActionAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await publicRef.set({
      status: nextPublicEnabled ? 'published' : 'hidden',
      searchable: nextPublicEnabled && nextSearchable,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await writeAdminAuditLog({
      db,
      actor: decoded,
      actorRole: actorProfile?.accountType ?? null,
      targetUid: params.uid,
      targetEmail: data.email ?? null,
      action: 'user.public_profile.updated',
      before,
      after: {
        publicProfileEnabled: nextPublicEnabled,
        status: nextPublicEnabled ? 'published' : 'hidden',
        searchable: nextPublicEnabled && nextSearchable,
      },
      reason,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
