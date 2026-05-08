import { currencyForAccountType, type PremiumCurrency } from "./wallet";
import {
  findPricingTier,
  findPricingTierInCatalog,
  getFreeTierForAccountType,
  getFreeTierForAccountTypeInCatalog,
  type BillingCycle,
  type PricingCatalog,
  type PricingAudienceKey,
  type PricingTierId,
} from "./pricing";

export type EntitlementStatus = "free" | "active" | "past_due" | "canceled";

export interface EntitlementFeatures {
  auditionHistoryLimit: number | null;
  ultraFeedback: boolean;
  salaryNegotiation: boolean;
  priorityProfile: boolean;
  offerPrep: boolean;
  activeJobLimit: number | null;
  aiScreenings: boolean;
  candidateSummaries: boolean;
  priorityJobs: boolean;
  teamCollaboration: boolean;
  rosterLimit: number | null;
  clientReadyReports: boolean;
  featuredDiscovery: boolean;
}

export interface ResolvedEntitlements {
  accountType: PricingAudienceKey;
  tierId: PricingTierId;
  tierName: string;
  status: EntitlementStatus;
  billingCycle: BillingCycle | "free";
  currency: PremiumCurrency;
  monthlyAllowance: number;
  features: EntitlementFeatures;
}

const freeFeatures: EntitlementFeatures = {
  auditionHistoryLimit: 3,
  ultraFeedback: false,
  salaryNegotiation: false,
  priorityProfile: false,
  offerPrep: false,
  activeJobLimit: 1,
  aiScreenings: false,
  candidateSummaries: false,
  priorityJobs: false,
  teamCollaboration: false,
  rosterLimit: 5,
  clientReadyReports: false,
  featuredDiscovery: false,
};

export function featuresForTier(tierId: PricingTierId): EntitlementFeatures {
  switch (tierId) {
    case "talent-plus":
      return {
        ...freeFeatures,
        auditionHistoryLimit: 25,
        priorityProfile: true,
      };
    case "talent-pro":
      return {
        ...freeFeatures,
        auditionHistoryLimit: null,
        ultraFeedback: true,
        salaryNegotiation: true,
        priorityProfile: true,
        offerPrep: true,
      };
    case "business-starter":
      return {
        ...freeFeatures,
        activeJobLimit: 3,
        aiScreenings: true,
        candidateSummaries: true,
      };
    case "business-growth":
      return {
        ...freeFeatures,
        activeJobLimit: 10,
        aiScreenings: true,
        candidateSummaries: true,
        priorityJobs: true,
      };
    case "business-scale":
      return {
        ...freeFeatures,
        activeJobLimit: 50,
        aiScreenings: true,
        candidateSummaries: true,
        priorityJobs: true,
        teamCollaboration: true,
      };
    case "agency-studio":
      return {
        ...freeFeatures,
        auditionHistoryLimit: 50,
        rosterLimit: 50,
        clientReadyReports: true,
      };
    case "agency-network":
      return {
        ...freeFeatures,
        auditionHistoryLimit: null,
        rosterLimit: null,
        clientReadyReports: true,
        featuredDiscovery: true,
      };
    default:
      return freeFeatures;
  }
}

export function resolveEntitlements(input: {
  accountType: PricingAudienceKey;
  tierId?: string | null;
  status?: EntitlementStatus;
  billingCycle?: BillingCycle | "free" | null;
}): ResolvedEntitlements {
  return resolveEntitlementsInCatalog(undefined, input);
}

export function resolveEntitlementsInCatalog(
  catalog: PricingCatalog | undefined,
  input: {
    accountType: PricingAudienceKey;
    tierId?: string | null;
    status?: EntitlementStatus;
    billingCycle?: BillingCycle | "free" | null;
  },
): ResolvedEntitlements {
  const paidPlan = input.tierId ? catalog ? findPricingTierInCatalog(catalog, input.tierId) : findPricingTier(input.tierId) : null;
  const isActive = input.status === "active" && paidPlan?.audience.key === input.accountType;
  const plan = isActive ? paidPlan : null;
  const tier = plan?.tier ?? (catalog ? getFreeTierForAccountTypeInCatalog(catalog, input.accountType) : getFreeTierForAccountType(input.accountType));
  if (!tier) {
    throw new Error(`No free tier configured for account type ${input.accountType}.`);
  }

  const currency = currencyForAccountType(input.accountType);
  if (!currency) {
    throw new Error(`No premium currency configured for account type ${input.accountType}.`);
  }

  return {
    accountType: input.accountType,
    tierId: tier.id,
    tierName: tier.name,
    status: plan ? "active" : input.status === "past_due" ? "past_due" : input.status === "canceled" ? "canceled" : "free",
    billingCycle: plan ? input.billingCycle === "annual" ? "annual" : "monthly" : "free",
    currency,
    monthlyAllowance: tier.monthlyAllowance,
    features: featuresForTier(tier.id),
  };
}

export function resolveProfileEntitlements(profile: {
  accountType?: unknown;
  entitlements?: { tierId?: string | null; status?: EntitlementStatus; billingCycle?: BillingCycle | "free" | null } | null;
}) {
  const accountType = profile.accountType === "talent" || profile.accountType === "business" || profile.accountType === "agency"
    ? profile.accountType
    : null;
  if (!accountType) return null;
  return resolveEntitlements({
    accountType,
    tierId: profile.entitlements?.tierId,
    status: profile.entitlements?.status,
    billingCycle: profile.entitlements?.billingCycle,
  });
}

export function isBillableStripeStatus(status?: string | null) {
  return status === "active" || status === "trialing";
}

export function statusFromStripe(status?: string | null): EntitlementStatus {
  if (isBillableStripeStatus(status)) return "active";
  if (status === "past_due" || status === "unpaid" || status === "incomplete") return "past_due";
  return "canceled";
}
