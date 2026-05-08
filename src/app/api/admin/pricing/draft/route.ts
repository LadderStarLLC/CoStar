export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireOwner } from "@/lib/firebaseAdmin";
import { savePricingDraft } from "@/lib/pricingCatalogServer";
import type { PricingCatalog } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const { decoded, db } = await requireOwner(req);
    const body = await req.json() as { catalog?: PricingCatalog };
    if (!body.catalog) {
      return NextResponse.json({ error: "Missing pricing catalog." }, { status: 400 });
    }
    const draftCatalog = await savePricingDraft(db, body.catalog, decoded.uid);
    return NextResponse.json({ ok: true, draftCatalog });
  } catch (err) {
    return jsonError(err);
  }
}
