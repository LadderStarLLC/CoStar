export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/adminAudit";
import { jsonError, requireOwner } from "@/lib/firebaseAdmin";
import {
  getAdminPricingConfig,
  publishPricingCatalog,
  savePricingDraft,
} from "@/lib/pricingCatalogServer";
import type { PricingCatalog } from "@/lib/pricing";

type PricingBody = {
  catalog?: PricingCatalog;
  reason?: string;
};

export async function GET(req: NextRequest) {
  try {
    const { db } = await requireOwner(req);
    return NextResponse.json(await getAdminPricingConfig(db));
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { decoded, profile, db } = await requireOwner(req);
    const body = await req.json() as PricingBody;
    if (!body.catalog) {
      return NextResponse.json({ error: "Missing pricing catalog." }, { status: 400 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    if (action === "publish") {
      const reason = body.reason?.trim();
      if (!reason) {
        return NextResponse.json({ error: "Publish reason is required." }, { status: 400 });
      }
      const result = await publishPricingCatalog(db, body.catalog, decoded.uid, reason);
      await writeAdminAuditLog({
        db,
        actor: decoded,
        actorRole: profile?.accountType ?? null,
        targetUid: "platform:pricing",
        targetEmail: null,
        action: "pricing.catalog.published",
        before: { version: result.version - 1, catalog: result.before },
        after: { version: result.version, catalog: result.after },
        reason,
      });
      return NextResponse.json({ ok: true, catalog: result.after, version: result.version });
    }

    const draftCatalog = await savePricingDraft(db, body.catalog, decoded.uid);
    return NextResponse.json({ ok: true, draftCatalog });
  } catch (err) {
    return jsonError(err);
  }
}
