export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adjustWalletBalance } from '@/lib/walletAdmin';
import { writeAdminAuditLog } from '@/lib/adminAudit';
import { jsonError, requireAdmin } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { decoded, profile, db } = await requireAdmin(req);
    const body = await req.json();
    const uid = String(body.uid ?? '');
    const delta = Number(body.delta);
    const reason = String(body.reason ?? '');

    const wallet = await adjustWalletBalance(db, {
      uid,
      delta,
      reason,
      actor: decoded,
    });
    const targetSnap = await db.doc(`users/${uid}`).get();
    const target = targetSnap.exists ? targetSnap.data() ?? {} : {};
    await writeAdminAuditLog({
      db,
      actor: decoded,
      actorRole: profile?.accountType ?? null,
      targetUid: uid,
      targetEmail: target.email ?? null,
      action: 'user.wallet.adjusted',
      before: { balance: wallet.balance - delta, currency: wallet.currency },
      after: { balance: wallet.balance, currency: wallet.currency, delta },
      reason,
    });

    return NextResponse.json({ ok: true, wallet });
  } catch (err) {
    return jsonError(err);
  }
}
