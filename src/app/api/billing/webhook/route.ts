export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { findPricingTier } from "@/lib/pricing";
import { setWalletBalance } from "@/lib/walletAdmin";
import { syncCheckoutSession } from "@/lib/stripeBilling";

type StripeEvent = {
  type: string;
  data: {
    object: Record<string, any>;
  };
};

function verifySignature(payload: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

async function fetchStripeSubscription(subscriptionId: string) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return null;

  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return response.json() as Promise<Record<string, any>>;
}

async function resetAllowanceFromMetadata(input: {
  metadata?: Record<string, string | undefined> | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodStart?: number | null;
  currentPeriodEnd?: number | null;
}) {
  const uid = input.metadata?.uid;
  const tierId = input.metadata?.tierId;
  const billingCycle = input.metadata?.billingCycle;
  const plan = tierId ? findPricingTier(tierId) : null;
  if (!uid || !plan || (billingCycle !== "monthly" && billingCycle !== "annual")) return;

  const db = getAdminDb();
  await db.doc(`users/${uid}`).set({
    billing: {
      provider: "stripe",
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      subscriptionStatus: input.subscriptionStatus ?? "active",
      accountType: plan.audience.key,
      tierId: plan.tier.id,
      tierName: plan.tier.name,
      billingCycle,
      monthlyAllowance: plan.tier.monthlyAllowance,
      currencyLabel: plan.audience.currencyLabel,
      currentPeriodStart: input.currentPeriodStart ? new Date(input.currentPeriodStart * 1000).toISOString() : null,
      currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd * 1000).toISOString() : null,
      updatedAt: FieldValue.serverTimestamp(),
    },
  }, { merge: true });

  await setWalletBalance(db, {
    uid,
    balance: plan.tier.monthlyAllowance,
    reason: `Stripe renewal allowance: ${plan.audience.label} ${plan.tier.name}`,
  });
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const payload = await req.text();
  if (!verifySignature(payload, req.headers.get("stripe-signature"), webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;
  const object = event.data.object;

  if (event.type === "checkout.session.completed" && typeof object.id === "string") {
    await syncCheckoutSession(object.id);
    return NextResponse.json({ received: true });
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
    const subscriptionId =
      typeof object.subscription === "string"
        ? object.subscription
        : typeof object.parent?.subscription_details?.subscription === "string"
        ? object.parent.subscription_details.subscription
        : null;
    const subscription = subscriptionId ? await fetchStripeSubscription(subscriptionId) : null;
    const metadata =
      object.subscription_details?.metadata ??
      object.parent?.subscription_details?.metadata ??
      subscription?.metadata ??
      object.metadata ??
      null;

    await resetAllowanceFromMetadata({
      metadata,
      stripeCustomerId: typeof object.customer === "string" ? object.customer : subscription?.customer ?? null,
      stripeSubscriptionId: subscriptionId ?? subscription?.id ?? null,
      subscriptionStatus: subscription?.status ?? "active",
      currentPeriodStart: subscription?.current_period_start ?? null,
      currentPeriodEnd: subscription?.current_period_end ?? null,
    });
  }

  return NextResponse.json({ received: true });
}
