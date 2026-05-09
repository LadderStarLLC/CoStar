export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, jsonError, verifyBearerToken } from '@/lib/firebaseAdmin';
import { generateUniqueUserSlug } from '@/lib/profileSlug';

export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyBearerToken(req);
    const body = await req.json().catch(() => ({}));
    const value = typeof body?.value === 'string' ? body.value : '';
    const slug = await generateUniqueUserSlug(getAdminDb(), value, decoded.uid);

    return NextResponse.json({ slug });
  } catch (err) {
    return jsonError(err);
  }
}
