export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCallerProfile, jsonError } from "@/lib/firebaseAdmin";
import { consumeWalletBalance } from "@/lib/walletAdmin";
import { currencyForAccountType, type PremiumCurrency } from "@/lib/wallet";

type UsageBody = {
  currency?: PremiumCurrency;
  amount?: number;
  reason?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { decoded, profile, db } = await getCallerProfile(req);
    const body = await req.json() as UsageBody;
    const expectedCurrency = currencyForAccountType(profile?.accountType);
    if (!expectedCurrency || body.currency !== expectedCurrency) {
      return NextResponse.json({ error: "Usage currency does not match this account." }, { status: 400 });
    }
    if (!Number.isInteger(body.amount) || Number(body.amount) <= 0) {
      return NextResponse.json({ error: "Usage amount must be a positive integer." }, { status: 400 });
    }

    const wallet = await consumeWalletBalance(db, {
      uid: decoded.uid,
      amount: Number(body.amount),
      reason: body.reason || "Premium feature usage",
    });
    return NextResponse.json({ ok: true, wallet });
  } catch (err) {
    return jsonError(err);
  }
}
