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
    const adminNotes = String(body.adminNotes ?? '').slice(0, 4000);

    const userRef = db.doc(`users/${params.uid}`);
    const snap = await userRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    const data = snap.data() ?? {};

    await userRef.update({
      adminNotes,
      lastAdminActionBy: decoded.uid,
      lastAdminActionAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await writeAdminAuditLog({
      db,
      actor: decoded,
      actorRole: actorProfile?.accountType ?? null,
      targetUid: params.uid,
      targetEmail: data.email ?? null,
      action: 'user.notes.updated',
      before: auditSnapshot(data, ['adminNotes']),
      after: { adminNotes },
      reason: 'Support notes updated',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
