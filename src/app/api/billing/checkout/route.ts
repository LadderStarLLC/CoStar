export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCallerProfile, jsonError } from "@/lib/firebaseAdmin";
import {
  findPricingTier,
  getTierAmountCents,
  type BillingCycle,
} from "@/lib/pricing";
import { getStripe } from "@/lib/stripeServer";

type CheckoutBody = {
  tierId?: string;
  billingCycle?: BillingCycle;
};

function getBaseUrl(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return req.nextUrl.origin;
}

function isCheckoutAccountType(value: unknown): value is "talent" | "business" | "agency" {
  return value === "talent" || value === "business" || value === "agency";
}

export async function POST(req: NextRequest) {
  try {
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

    // Prevent duplicate subscription
    if (
      profile?.billing?.tierId === plan.tier.id &&
      profile?.billing?.billingCycle === billingCycle &&
      profile?.billing?.subscriptionStatus === "active"
    ) {
      return NextResponse.json(
        { error: "You are already on this plan." },
        { status: 400 },
      );
    }

    const baseUrl = getBaseUrl(req);
    const amountCents = getTierAmountCents(plan.tier, billingCycle);
    const interval = billingCycle === "monthly" ? "month" : "year";
    const metadata = {
      uid: decoded.uid,
      accountType: plan.audience.key,
      tierId: plan.tier.id,
      billingCycle,
    };

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing/cancel`,
      client_reference_id: decoded.uid,
      customer_email: decoded.email ?? profile?.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            recurring: { interval },
            product_data: {
              name: `LadderStar ${plan.audience.label} ${plan.tier.name}`,
              description: `${plan.tier.allowance} ${plan.audience.currencyLabel.toLowerCase()} reset monthly.`,
            },
          },
        },
      ],
      metadata,
      subscription_data: {
        metadata,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return jsonError(err);
  }
}
