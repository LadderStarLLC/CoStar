import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type Stripe from "stripe";
import { getAdminDb } from "./firebaseAdmin";
import { findPricingTier, type BillingCycle, type PricingAudienceKey } from "./pricing";
import { resolveEntitlements, statusFromStripe, type EntitlementStatus } from "./entitlements";
import { getStripe } from "./stripeServer";
import { setWalletBalance } from "./walletAdmin";

type StripeState = {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodStart?: number | null;
  currentPeriodEnd?: number | null;
  lastCheckoutSessionId?: string | null;
};

type BillingMetadata = {
  uid?: string;
  accountType?: string;
  tierId?: string;
  billingCycle?: string;
};

function fromUnix(value?: number | null) {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function validBillingCycle(value?: string | null): BillingCycle {
  return value === "annual" ? "annual" : "monthly";
}

function validAccountType(value?: string | null): PricingAudienceKey | null {
  return value === "talent" || value === "business" || value === "agency" ? value : null;
}

function subscriptionPeriod(subscription?: Stripe.Subscription | null) {
  const item = subscription?.items?.data?.[0];
  return {
    currentPeriodStart: item?.current_period_start ?? null,
    currentPeriodEnd: item?.current_period_end ?? null,
  };
}

export async function applyBillingPlan(
  db: Firestore,
  input: {
    uid: string;
    accountType: PricingAudienceKey;
    tierId: string;
    billingCycle: BillingCycle;
    status: EntitlementStatus;
    stripe?: StripeState;
    reason: string;
  },
) {
  const plan = findPricingTier(input.tierId);
  if (!plan || plan.audience.key !== input.accountType) {
    throw new Error("Billing tier does not match account type.");
  }

  const entitlements = resolveEntitlements({
    accountType: input.accountType,
    tierId: input.tierId,
    status: input.status,
    billingCycle: input.billingCycle,
  });

  await db.doc(`users/${input.uid}`).set({
    billing: {
      provider: "stripe",
      stripeCustomerId: input.stripe?.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripe?.stripeSubscriptionId ?? null,
      subscriptionStatus: input.stripe?.subscriptionStatus ?? input.status,
      accountType: input.accountType,
      tierId: input.tierId,
      tierName: plan.tier.name,
      billingCycle: input.billingCycle,
      monthlyAllowance: plan.tier.monthlyAllowance,
      currencyLabel: plan.audience.currencyLabel,
      lastCheckoutSessionId: input.stripe?.lastCheckoutSessionId ?? null,
      currentPeriodStart: fromUnix(input.stripe?.currentPeriodStart),
      currentPeriodEnd: fromUnix(input.stripe?.currentPeriodEnd),
      updatedAt: FieldValue.serverTimestamp(),
    },
    entitlements: {
      ...entitlements,
      updatedAt: FieldValue.serverTimestamp(),
    },
  }, { merge: true });

  await setWalletBalance(db, {
    uid: input.uid,
    balance: entitlements.monthlyAllowance,
    reason: input.reason,
  });

  return entitlements;
}

export async function revertToFreePlan(
  db: Firestore,
  input: {
    uid: string;
    accountType: PricingAudienceKey;
    status: Exclude<EntitlementStatus, "active">;
    stripe?: StripeState;
    reason: string;
  },
) {
  const entitlements = resolveEntitlements({
    accountType: input.accountType,
    status: input.status,
    billingCycle: "free",
  });

  await db.doc(`users/${input.uid}`).set({
    billing: {
      provider: "stripe",
      stripeCustomerId: input.stripe?.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripe?.stripeSubscriptionId ?? null,
      subscriptionStatus: input.stripe?.subscriptionStatus ?? input.status,
      accountType: input.accountType,
      tierId: entitlements.tierId,
      tierName: entitlements.tierName,
      billingCycle: "free",
      monthlyAllowance: entitlements.monthlyAllowance,
      currentPeriodStart: fromUnix(input.stripe?.currentPeriodStart),
      currentPeriodEnd: fromUnix(input.stripe?.currentPeriodEnd),
      updatedAt: FieldValue.serverTimestamp(),
    },
    entitlements: {
      ...entitlements,
      updatedAt: FieldValue.serverTimestamp(),
    },
  }, { merge: true });

  await setWalletBalance(db, {
    uid: input.uid,
    balance: entitlements.monthlyAllowance,
    reason: input.reason,
  });

  return entitlements;
}

export async function syncCheckoutSession(sessionId: string) {
  if (!sessionId.startsWith("cs_")) throw new Error("Invalid checkout session.");

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });
  if (session.status !== "complete") {
    throw new Error("Checkout session is not complete.");
  }

  const subscription = typeof session.subscription === "object" ? session.subscription as Stripe.Subscription : null;
  const metadata: BillingMetadata = {
    ...subscription?.metadata,
    ...session.metadata,
  };
  const uid = metadata.uid;
  const accountType = validAccountType(metadata.accountType);
  const tierId = metadata.tierId;
  const billingCycle = validBillingCycle(metadata.billingCycle);
  if (!uid || !accountType || !tierId) {
    throw new Error("Checkout session metadata is incomplete.");
  }

  const db = getAdminDb();
  const current = (await db.doc(`users/${uid}`).get()).data() ?? {};
  if (current.billing?.lastCheckoutSessionId === session.id && current.entitlements?.status === "active") {
    return { alreadySynced: true, tierId };
  }

  return applyBillingPlan(db, {
    uid,
    accountType,
    tierId,
    billingCycle,
    status: "active",
    stripe: {
      stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
      stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : subscription?.id ?? null,
      subscriptionStatus: subscription?.status ?? "active",
      lastCheckoutSessionId: session.id,
      ...subscriptionPeriod(subscription),
    },
    reason: `Stripe subscription allowance: ${accountType} ${tierId}`,
  });
}

async function claimStripeEvent(db: Firestore, event: Stripe.Event) {
  const ref = db.doc(`stripeEvents/${event.id}`);
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const status = snap.exists ? snap.data()?.status : null;
    if (status === "processed" || status === "processing") return false;
    transaction.set(ref, {
      id: event.id,
      type: event.type,
      status: "processing",
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: snap.exists ? snap.data()?.createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
    }, { merge: true });
    return true;
  });
}

async function finishStripeEvent(db: Firestore, event: Stripe.Event, status: "processed" | "failed", error?: unknown) {
  await db.doc(`stripeEvents/${event.id}`).set({
    status,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function fetchSubscription(subscriptionId?: string | null) {
  if (!subscriptionId) return null;
  return getStripe().subscriptions.retrieve(subscriptionId);
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const raw = invoice as unknown as {
    subscription?: string | { id?: string } | null;
    parent?: { subscription_details?: { subscription?: string | null } | null } | null;
  };
  if (typeof raw.subscription === "string") return raw.subscription;
  if (raw.subscription && typeof raw.subscription.id === "string") return raw.subscription.id;
  if (typeof raw.parent?.subscription_details?.subscription === "string") {
    return raw.parent.subscription_details.subscription;
  }
  return null;
}

function metadataFromSubscription(subscription: Stripe.Subscription | null): BillingMetadata {
  return subscription?.metadata ?? {};
}

async function applySubscriptionState(db: Firestore, subscription: Stripe.Subscription, reason: string) {
  const metadata = metadataFromSubscription(subscription);
  const uid = metadata.uid;
  const accountType = validAccountType(metadata.accountType);
  const tierId = metadata.tierId;
  const billingCycle = validBillingCycle(metadata.billingCycle);
  if (!uid || !accountType || !tierId) return;

  const stripeState = {
    stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    ...subscriptionPeriod(subscription),
  };

  const status = statusFromStripe(subscription.status);
  if (status === "active") {
    await applyBillingPlan(db, {
      uid,
      accountType,
      tierId,
      billingCycle,
      status,
      stripe: stripeState,
      reason,
    });
  } else {
    await revertToFreePlan(db, {
      uid,
      accountType,
      status,
      stripe: stripeState,
      reason,
    });
  }
}

export async function handleStripeEvent(event: Stripe.Event) {
  const db = getAdminDb();
  const claimed = await claimStripeEvent(db, event);
  if (!claimed) return { ignored: true };

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (typeof session.id === "string") await syncCheckoutSession(session.id);
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoiceSubscriptionId(invoice);
      const subscription = await fetchSubscription(subscriptionId);
      if (subscription) {
        await applySubscriptionState(db, subscription, `Stripe renewal allowance: ${subscription.metadata.accountType} ${subscription.metadata.tierId}`);
      }
    } else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoiceSubscriptionId(invoice);
      const subscription = await fetchSubscription(subscriptionId);
      if (subscription) {
        const metadata = metadataFromSubscription(subscription);
        const uid = metadata.uid;
        const accountType = validAccountType(metadata.accountType);
        if (uid && accountType) {
          await revertToFreePlan(db, {
            uid,
            accountType,
            status: "past_due",
            stripe: {
              stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: "past_due",
              ...subscriptionPeriod(subscription),
            },
            reason: "Stripe payment failed: reverted to free allowance",
          });
        }
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await applySubscriptionState(db, subscription, `Stripe subscription ${subscription.status}: entitlement sync`);
    }

    await finishStripeEvent(db, event, "processed");
    return { processed: true };
  } catch (error) {
    await finishStripeEvent(db, event, "failed", error);
    throw error;
  }
}
