export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCallerProfile, jsonError } from '@/lib/firebaseAdmin';
import { getOrCreateWalletSummary } from '@/lib/walletAdmin';

export async function GET(req: NextRequest) {
  try {
    const { decoded, db } = await getCallerProfile(req);
    const summary = await getOrCreateWalletSummary(db, decoded.uid);
    return NextResponse.json(summary);
  } catch (err) {
    return jsonError(err);
  }
}
