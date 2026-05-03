export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCallerProfile, jsonError } from "@/lib/firebaseAdmin";
import {
  findPricingTier,
  getTierAmountCents,
  type BillingCycle,
} from "@/lib/pricing";

type CheckoutBody = {
  tierId?: string;
  billingCycle?: BillingCycle;
};

function getBaseUrl(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return req.nextUrl.origin;
}

function appendOptional(params: URLSearchParams, key: string, value?: string | null) {
  if (value) params.append(key, value);
}

function isCheckoutAccountType(value: unknown): value is "talent" | "business" | "agency" {
  return value === "talent" || value === "business" || value === "agency";
}

export async function POST(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
    }

    const { decoded, profile } = await getCallerProfile(req);
    const body = await req.json() as CheckoutBody;
    const billingCycle = body.billingCycle;
    if (billingCycle !== "monthly" && billingCycle !== "annual") {
      return NextResponse.json({ error: "Invalid billing cycle." }, { status: 400 });
    }

    const plan = body.tierId ? findPricingTier(body.tierId) : null;
    if (!plan) {
      return NextResponse.json({ error: "Invalid pricing tier." }, { status: 400 });
    }

    if (plan.tier.monthlyPrice <= 0) {
      return NextResponse.json({ error: "Free tiers do not require checkout." }, { status: 400 });
    }

    const accountType = profile?.accountType;
    if (!isCheckoutAccountType(accountType) || accountType !== plan.audience.key) {
      return NextResponse.json(
        { error: `This checkout is only available for ${plan.audience.label} accounts.` },
        { status: 403 },
      );
    }

    const baseUrl = getBaseUrl(req);
    const amountCents = getTierAmountCents(plan.tier, billingCycle);
    const interval = billingCycle === "monthly" ? "month" : "year";
    const productName = `LadderStar ${plan.audience.label} ${plan.tier.name}`;
    const description = `${plan.tier.allowance} ${plan.audience.currencyLabel.toLowerCase()} reset monthly.`;

    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("success_url", `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append("cancel_url", `${baseUrl}/pricing/cancel`);
    params.append("client_reference_id", decoded.uid);
    appendOptional(params, "customer_email", decoded.email ?? profile?.email ?? null);
    params.append("line_items[0][quantity]", "1");
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][unit_amount]", String(amountCents));
    params.append("line_items[0][price_data][recurring][interval]", interval);
    params.append("line_items[0][price_data][product_data][name]", productName);
    params.append("line_items[0][price_data][product_data][description]", description);
    params.append("subscription_data[metadata][uid]", decoded.uid);
    params.append("subscription_data[metadata][accountType]", plan.audience.key);
    params.append("subscription_data[metadata][tierId]", plan.tier.id);
    params.append("subscription_data[metadata][billingCycle]", billingCycle);
    params.append("metadata[uid]", decoded.uid);
    params.append("metadata[accountType]", plan.audience.key);
    params.append("metadata[tierId]", plan.tier.id);
    params.append("metadata[billingCycle]", billingCycle);

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("[billing/checkout]", data);
      return NextResponse.json(
        { error: data?.error?.message || "Unable to create Stripe checkout session." },
        { status: response.status },
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (err) {
    return jsonError(err);
  }
}
