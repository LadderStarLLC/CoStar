export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCallerProfile, jsonError } from "@/lib/firebaseAdmin";
import { resolveProfileEntitlements } from "@/lib/entitlements";
import { getOrCreateWalletSummary } from "@/lib/walletAdmin";

export async function GET(req: NextRequest) {
  try {
    const { decoded, profile, db } = await getCallerProfile(req);
    const entitlements = profile ? resolveProfileEntitlements(profile) : null;
    const walletSummary = await getOrCreateWalletSummary(db, decoded.uid);
    return NextResponse.json({ entitlements, walletSummary });
  } catch (err) {
    return jsonError(err);
  }
}
