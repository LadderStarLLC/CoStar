import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./firebaseAdmin";
import { findPricingTier } from "./pricing";
import { setWalletBalance } from "./walletAdmin";

type StripeCheckoutSession = {
  id: string;
  status?: string;
  customer?: string | null;
  subscription?: string | {
    id?: string;
    status?: string;
    current_period_start?: number;
    current_period_end?: number;
  } | null;
  metadata?: Record<string, string | undefined> | null;
};

function stripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured.");
  return key;
}

function fromUnix(value?: number) {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

export async function syncCheckoutSession(sessionId: string) {
  if (!sessionId.startsWith("cs_")) throw new Error("Invalid checkout session.");

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey()}`,
      },
      cache: "no-store",
    },
  );
  const session = await response.json() as StripeCheckoutSession & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(session.error?.message || "Unable to verify checkout session.");
  }
  if (session.status !== "complete") {
    throw new Error("Checkout session is not complete.");
  }

  const uid = session.metadata?.uid;
  const tierId = session.metadata?.tierId;
  const billingCycle = session.metadata?.billingCycle;
  const plan = tierId ? findPricingTier(tierId) : null;
  if (!uid || !plan || (billingCycle !== "monthly" && billingCycle !== "annual")) {
    throw new Error("Checkout session metadata is incomplete.");
  }

  const db = getAdminDb();
  const userRef = db.doc(`users/${uid}`);
  const userSnap = await userRef.get();
  const user = userSnap.exists ? userSnap.data() ?? {} : {};
  if (user.billing?.lastCheckoutSessionId === session.id) {
    return { alreadySynced: true, plan };
  }

  const subscription = typeof session.subscription === "object" ? session.subscription : null;
  await userRef.set({
    billing: {
      provider: "stripe",
      stripeCustomerId: session.customer ?? null,
      stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : subscription?.id ?? null,
      subscriptionStatus: subscription?.status ?? "active",
      accountType: plan.audience.key,
      tierId: plan.tier.id,
      tierName: plan.tier.name,
      billingCycle,
      monthlyAllowance: plan.tier.monthlyAllowance,
      currencyLabel: plan.audience.currencyLabel,
      lastCheckoutSessionId: session.id,
      currentPeriodStart: fromUnix(subscription?.current_period_start),
      currentPeriodEnd: fromUnix(subscription?.current_period_end),
      updatedAt: FieldValue.serverTimestamp(),
    },
  }, { merge: true });

  await setWalletBalance(db, {
    uid,
    balance: plan.tier.monthlyAllowance,
    reason: `Stripe subscription allowance: ${plan.audience.label} ${plan.tier.name}`,
  });

  return { alreadySynced: false, plan };
}
