export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCallerProfile, jsonError } from '@/lib/firebaseAdmin';
import { reserveWalletBalance } from '@/lib/walletAdmin';

type Body = {
  mode?: string;
  sessionId?: string;
  jobTitle?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { decoded, profile, db } = await getCallerProfile(req);
    const accountType = profile?.accountType === 'agency' ? 'agency' : profile?.accountType === 'talent' ? 'talent' : null;
    if (!accountType) {
      return NextResponse.json({ error: 'Interview minutes are available to Talent and Agency accounts.' }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const reservation = await reserveWalletBalance(db, {
      uid: decoded.uid,
      amount: 1,
      reason: `Interview minute reservation${body.jobTitle ? `: ${body.jobTitle}` : ''}`,
      metadata: {
        feature: 'audition',
        accountType,
        mode: body.mode ?? null,
        sessionId: body.sessionId ?? null,
        jobTitle: body.jobTitle ?? null,
      },
    });

    return NextResponse.json({
      meterId: reservation.meterId,
      reservedMinutes: reservation.reservedAmount,
      transactionId: reservation.transactionId,
      wallet: reservation.wallet,
    });
  } catch (err) {
    return jsonError(err);
  }
}
