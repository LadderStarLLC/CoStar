export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adjustWalletBalance } from '@/lib/walletAdmin';
import { jsonError, requireAdmin } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { decoded, db } = await requireAdmin(req);
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

    return NextResponse.json({ ok: true, wallet });
  } catch (err) {
    return jsonError(err);
  }
}
