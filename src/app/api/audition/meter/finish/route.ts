export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCallerProfile, jsonError } from '@/lib/firebaseAdmin';
import { settleWalletReservation } from '@/lib/walletAdmin';

type Body = {
  meterId?: string;
  durationSeconds?: number;
  status?: 'completed' | 'cancelled' | 'failed';
  jobTitle?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { decoded, db } = await getCallerProfile(req);
    const body = (await req.json()) as Body;
    if (!body.meterId) {
      return NextResponse.json({ error: 'Missing meter id.' }, { status: 400 });
    }
    const seconds = Number.isFinite(body.durationSeconds) ? Math.max(0, Math.floor(Number(body.durationSeconds))) : 0;
    const usedMinutes = seconds > 0 ? Math.max(1, Math.ceil(seconds / 60)) : 0;
    const settlement = await settleWalletReservation(db, {
      uid: decoded.uid,
      meterId: body.meterId,
      usedAmount: usedMinutes,
      reason: `Interview ${body.status ?? 'finished'} settlement${body.jobTitle ? `: ${body.jobTitle}` : ''}`,
      status: body.status ?? 'finished',
      durationSeconds: seconds,
    });

    return NextResponse.json({ ok: true, usedMinutes, wallet: settlement.wallet, transactionId: settlement.transactionId });
  } catch (err) {
    return jsonError(err);
  }
}
