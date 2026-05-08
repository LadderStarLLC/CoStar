export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCallerProfile, jsonError } from '@/lib/firebaseAdmin';
import { giftAgencyMinutes } from '@/lib/walletAdmin';

type Body = {
  recipientUid?: string;
  recipientEmail?: string;
  amount?: number;
};

export async function POST(req: NextRequest) {
  try {
    const { decoded, profile, db } = await getCallerProfile(req);
    if (profile?.accountType !== 'agency') {
      return NextResponse.json({ error: 'Only Agency accounts can gift minutes.' }, { status: 403 });
    }

    const body = (await req.json()) as Body;
    const result = await giftAgencyMinutes(db, {
      agencyUid: decoded.uid,
      recipientUid: body.recipientUid,
      recipientEmail: body.recipientEmail,
      amount: Number(body.amount),
      reason: 'Agency gifted interview minutes',
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return jsonError(err);
  }
}
