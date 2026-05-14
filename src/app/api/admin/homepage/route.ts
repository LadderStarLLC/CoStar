export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/adminAudit";
import { jsonError, requireAdmin, requireOwner } from "@/lib/firebaseAdmin";
import {
  getAdminHomepageContent,
  publishHomepageContent,
  saveHomepageDraft,
} from "@/lib/homepageContentServer";
import type { HomepageContent } from "@/lib/homepageContent";

type HomepageBody = {
  content?: HomepageContent;
  reason?: string;
};

export async function GET(req: NextRequest) {
  try {
    const { db } = await requireAdmin(req);
    return NextResponse.json(await getAdminHomepageContent(db));
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json() as HomepageBody;
    if (!body.content) {
      return NextResponse.json({ error: "Missing homepage content." }, { status: 400 });
    }

    if (action === "publish") {
      const { decoded, profile, db } = await requireOwner(req);
      const reason = body.reason?.trim();
      if (!reason) {
        return NextResponse.json({ error: "Publish reason is required." }, { status: 400 });
      }

      const result = await publishHomepageContent(db, body.content, decoded.uid, reason);
      await writeAdminAuditLog({
        db,
        actor: decoded,
        actorRole: profile?.accountType ?? null,
        targetUid: "platform:homepage",
        targetEmail: null,
        action: "homepage.content.published",
        before: { version: result.version - 1, content: result.before },
        after: { version: result.version, content: result.after },
        reason,
      });

      return NextResponse.json({ ok: true, content: result.after, version: result.version });
    }

    const { decoded, db } = await requireAdmin(req);
    const draftContent = await saveHomepageDraft(db, body.content, decoded.uid);
    return NextResponse.json({ ok: true, draftContent });
  } catch (err) {
    return jsonError(err);
  }
}
