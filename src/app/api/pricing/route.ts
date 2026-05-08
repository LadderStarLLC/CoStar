export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAdminDb, jsonError } from "@/lib/firebaseAdmin";
import { getPublishedPricingCatalog } from "@/lib/pricingCatalogServer";

export async function GET() {
  try {
    const catalog = await getPublishedPricingCatalog(getAdminDb());
    return NextResponse.json({ catalog }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
