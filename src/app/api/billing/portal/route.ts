export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCallerProfile, jsonError } from "@/lib/firebaseAdmin";
import { getStripe } from "@/lib/stripeServer";

function getBaseUrl(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  try {
    const { profile } = await getCallerProfile(req);
    const customerId = profile?.billing?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: "No billing profile found. Please subscribe to a plan first." },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(req);
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return jsonError(err);
  }
}
