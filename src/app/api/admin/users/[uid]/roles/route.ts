export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { auditSnapshot, writeAdminAuditLog } from '@/lib/adminAudit';
import { jsonError, requireOwner } from '@/lib/firebaseAdmin';
import { buildOperationalRoleUpdate, canModifyOperationalRolesForProfile, getOperationalRolesForProfile } from '@/lib/operationalRoles';

export async function PATCH(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const { decoded, profile: actorProfile, db } = await requireOwner(req);
    const body = await req.json().catch(() => ({}));
    const userRef = db.doc(`users/${params.uid}`);
    const snap = await userRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const current = snap.data() ?? {};
    if (!canModifyOperationalRolesForProfile(current)) {
      return NextResponse.json({ error: 'Owner roles cannot be changed from the admin UI.' }, { status: 400 });
    }

    const before = auditSnapshot(current, ['blogRole']);
    const { updates, changed } = buildOperationalRoleUpdate(current, body.roleId, body.enabled);
    const nextProfile = { ...current, ...updates };
    const after = {
      ...auditSnapshot(nextProfile, ['blogRole']),
      operationalRoles: getOperationalRolesForProfile(nextProfile),
    };

    if (changed) {
      await userRef.update({
        ...updates,
        lastAdminActionBy: decoded.uid,
        lastAdminActionAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      await writeAdminAuditLog({
        db,
        actor: decoded,
        actorRole: actorProfile?.accountType ?? null,
        targetUid: params.uid,
        targetEmail: current.email ?? null,
        action: 'user.operational_roles.updated',
        before: {
          ...before,
          operationalRoles: getOperationalRolesForProfile(current),
        },
        after,
        reason: `${body.enabled ? 'enabled' : 'disabled'} ${body.roleId}`,
      });
    }

    return NextResponse.json({ ok: true, changed, operationalRoles: after.operationalRoles });
  } catch (err) {
    return jsonError(err);
  }
}
