export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { auditSnapshot, writeAdminAuditLog } from '@/lib/adminAudit';
import { getAdminApp, jsonError, requireAdmin } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const caller = await requireAdmin(req);
    const { decoded, profile: actorProfile, db } = caller;
    const body = await req.json();
    const moderationStatus = body.moderationStatus as 'active' | 'suspended' | undefined;
    const disabled = typeof body.disabled === 'boolean' ? body.disabled : undefined;
    const reason = String(body.reason ?? '').trim();

    if (!moderationStatus && typeof disabled !== 'boolean') {
      return NextResponse.json({ error: 'Status update is required.' }, { status: 400 });
    }
    if (moderationStatus && !['active', 'suspended'].includes(moderationStatus)) {
      return NextResponse.json({ error: 'Invalid moderation status.' }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ error: 'Reason is required.' }, { status: 400 });
    }

    const userRef = db.doc(`users/${params.uid}`);
    const snap = await userRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const data = snap.data() ?? {};
    if (data.accountType === 'owner') {
      return NextResponse.json({ error: 'Owner account cannot be moderated from the admin UI.' }, { status: 400 });
    }
    if (typeof disabled === 'boolean' && disabled && actorProfile?.accountType !== 'owner') {
      return NextResponse.json({ error: 'Owner access required for disabling accounts.' }, { status: 403 });
    }

    const nextDisabled = typeof disabled === 'boolean'
      ? disabled
      : moderationStatus === 'suspended'
        ? true
        : moderationStatus === 'active'
          ? false
          : Boolean(data.disabled);
    const nextModerationStatus = moderationStatus ?? (nextDisabled ? 'suspended' : 'active');

    const before = auditSnapshot(data, ['moderationStatus', 'disabled']);
    const updates = {
      moderationStatus: nextModerationStatus,
      disabled: nextDisabled,
      lastAdminActionBy: decoded.uid,
      lastAdminActionAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await getAuth(getAdminApp()).updateUser(params.uid, { disabled: nextDisabled });
    await userRef.update(updates);
    await db.doc(`publicProfiles/${params.uid}`).set({
      moderationStatus: nextModerationStatus,
      ...(nextModerationStatus === 'suspended' ? { status: 'suspended', searchable: false } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await writeAdminAuditLog({
      db,
      actor: decoded,
      actorRole: actorProfile?.accountType ?? null,
      targetUid: params.uid,
      targetEmail: data.email ?? null,
      action: nextDisabled && disabled ? 'user.lifecycle.disabled' : 'user.status.updated',
      before,
      after: { moderationStatus: nextModerationStatus, disabled: nextDisabled },
      reason,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
