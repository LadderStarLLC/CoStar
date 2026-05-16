export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { jsonError, requireOwner } from '@/lib/firebaseAdmin';
import { operationalRoles } from '@/lib/operationalRoles';

export async function GET(req: Request) {
  try {
    await requireOwner(req);
    return NextResponse.json({ roles: operationalRoles });
  } catch (err) {
    return jsonError(err);
  }
}
