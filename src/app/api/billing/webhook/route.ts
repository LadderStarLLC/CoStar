export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleStripeEvent } from "@/lib/stripeBilling";
import { getStripe } from "@/lib/stripeServer";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  try {
    const event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
    await handleStripeEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[billing/webhook]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handling failed." },
      { status: 400 },
    );
  }
}
