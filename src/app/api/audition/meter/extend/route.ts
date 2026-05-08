export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCallerProfile, jsonError } from '@/lib/firebaseAdmin';
import { reserveWalletBalance } from '@/lib/walletAdmin';

type Body = {
  meterId?: string;
  jobTitle?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { decoded, profile, db } = await getCallerProfile(req);
    if (profile?.accountType !== 'talent' && profile?.accountType !== 'agency') {
      return NextResponse.json({ error: 'Interview minutes are available to Talent and Agency accounts.' }, { status: 403 });
    }

    const body = (await req.json()) as Body;
    if (!body.meterId) {
      return NextResponse.json({ error: 'Missing meter id.' }, { status: 400 });
    }

    const reservation = await reserveWalletBalance(db, {
      uid: decoded.uid,
      meterId: body.meterId,
      amount: 1,
      reason: `Interview minute extension${body.jobTitle ? `: ${body.jobTitle}` : ''}`,
      metadata: { feature: 'audition', extension: true, jobTitle: body.jobTitle ?? null },
    });

    return NextResponse.json({
      meterId: reservation.meterId,
      addedMinutes: reservation.reservedAmount,
      transactionId: reservation.transactionId,
      wallet: reservation.wallet,
    });
  } catch (err) {
    return jsonError(err);
  }
}
