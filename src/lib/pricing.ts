import type { PublicAccountType } from "./profile";

export type BillingCycle = "monthly" | "annual";
export type PricingAudienceKey = PublicAccountType;

export type PricingTierId =
  | "talent-free"
  | "talent-plus"
  | "talent-pro"
  | "business-free"
  | "business-starter"
  | "business-growth"
  | "business-scale"
  | "agency-free"
  | "agency-studio"
  | "agency-network";

export interface PricingTier {
  id: PricingTierId;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice?: number;
  sale?: PricingSale;
  monthlyAllowance: number;
  allowance: string;
  allowanceDetail: string;
  featured?: boolean;
  earlyAccess?: boolean;
  contactHref?: string;
  cta: string;
  features: string[];
}

export interface PricingSale {
  enabled: boolean;
  percentOff: number;
  label?: string;
}

export interface PricingAudience {
  key: PricingAudienceKey;
  label: string;
  eyebrow: string;
  summary: string;
  signupHref: string;
  currencyLabel: string;
  tiers: PricingTier[];
}

export interface PricingCatalog {
  audiences: PricingAudience[];
  version?: number;
  publishedAt?: string | null;
}

export const getAnnualPrice = (tier: PricingTier) => tier.annualPrice ?? tier.monthlyPrice * 10;

export const pricingAudiences: PricingAudience[] = [
  {
    key: "talent",
    label: "Talent",
    eyebrow: "For ambitious candidates",
    summary: "Practice interviews, strengthen your story, and walk into offer-stage conversations with leverage.",
    signupHref: "/sign-up?type=talent",
    currencyLabel: "Interview minutes",
    tiers: [
      {
        id: "talent-free",
        name: "Free",
        description: "Try a focused interview and see where your answers need work.",
        monthlyPrice: 0,
        monthlyAllowance: 15,
        allowance: "15 minutes",
        allowanceDetail: "Monthly AI interview allowance",
        cta: "Start free",
        features: [
          "AI voice interview practice",
          "Basic feedback after each session",
          "Saved public talent profile",
          "Job board access and profile visibility",
        ],
      },
      {
        id: "talent-plus",
        name: "Plus",
        description: "More interview reps, better feedback, and faster preparation for active searches.",
        monthlyPrice: 14,
        annualPrice: 129,
        monthlyAllowance: 200,
        allowance: "200 minutes",
        allowanceDetail: "Monthly AI interview allowance",
        featured: true,
        cta: "Choose Plus",
        features: [
          "Everything in Free",
          "Expanded interview history",
          "Targeted role and company prep",
          "Advanced feedback summaries",
          "Priority profile presence in search",
        ],
      },
      {
        id: "talent-pro",
        name: "Pro",
        description: "Offer-stage preparation with deeper feedback and negotiation support.",
        monthlyPrice: 49,
        annualPrice: 399,
        monthlyAllowance: 1000,
        allowance: "1,000 minutes",
        allowanceDetail: "Monthly AI interview allowance",
        cta: "Go Pro",
        features: [
          "Everything in Plus",
          "Unlimited saved feedback reports",
          "Deep post-interview analysis",
          "Salary negotiation playbook",
          "Offer prep and positioning workflows",
        ],
      },
    ],
  },
  {
    key: "business",
    label: "Employers",
    eyebrow: "Early access for hiring teams",
    summary: "Create a company presence, test role visibility, and connect with visible talent profiles while LadderStar expands employer workflows.",
    signupHref: "/sign-up?type=business",
    currencyLabel: "AI screenings",
    tiers: [
      {
        id: "business-free",
        name: "Employer Launch",
        description: "For early partners who want to establish a credible company presence on LadderStar.",
        monthlyPrice: 0,
        monthlyAllowance: 0,
        allowance: "Early partner access",
        allowanceDetail: "Company presence and role visibility testing",
        cta: "Create company profile",
        features: [
          "Company profile",
          "Role visibility testing",
          "Browse visible talent profiles",
          "Early feedback channel",
        ],
      },
      {
        id: "business-starter",
        name: "Employer Growth",
        description: "For teams exploring multiple roles and candidate discovery with LadderStar.",
        monthlyPrice: 79,
        monthlyAllowance: 40,
        allowance: "Early partner access",
        allowanceDetail: "Candidate discovery and messaging workflows",
        featured: true,
        earlyAccess: true,
        contactHref: "/contact",
        cta: "Join employer waitlist",
        features: [
          "Multi-role visibility testing",
          "Candidate discovery workflows",
          "Messaging with visible profiles",
          "Early screening workflow feedback",
        ],
      },
      {
        id: "business-growth",
        name: "Employer Partner",
        description: "For early partners helping shape larger hiring and readiness workflows.",
        monthlyPrice: 149,
        monthlyAllowance: 125,
        allowance: "Early partner access",
        allowanceDetail: "Collaborative employer roadmap input",
        earlyAccess: true,
        contactHref: "/contact",
        cta: "Talk to LadderStar",
        features: [
          "Everything in Employer Growth",
          "Role and profile workflow review",
          "Hiring readiness workflow input",
          "Partner roadmap feedback",
        ],
      },
      {
        id: "business-scale",
        name: "Employer Scale",
        description: "For larger teams that want a structured conversation before expanding usage.",
        monthlyPrice: 299,
        monthlyAllowance: 350,
        allowance: "Partner discussion",
        allowanceDetail: "Available for early partners",
        earlyAccess: true,
        contactHref: "/contact",
        cta: "Contact sales",
        features: [
          "Everything in Employer Partner",
          "Expanded company presence planning",
          "Team workflow review",
          "Roadmap-aligned rollout discussion",
        ],
      },
    ],
  },
  {
    key: "agency",
    label: "Agencies",
    eyebrow: "Early access for agencies",
    summary: "Represent talent, publish an agency profile, and use interview practice workflows while LadderStar develops agency operations.",
    signupHref: "/sign-up?type=agency",
    currencyLabel: "Interview minutes",
    tiers: [
      {
        id: "agency-free",
        name: "Free",
        description: "Build an agency profile and support early talent preparation workflows.",
        monthlyPrice: 0,
        monthlyAllowance: 30,
        allowance: "30 minutes",
        allowanceDetail: "Monthly AI interview allowance",
        cta: "Start free",
        features: [
          "Agency profile",
          "Visible agency profile",
          "AI practice for represented talent",
          "Client-ready profile links",
        ],
      },
      {
        id: "agency-studio",
        name: "Studio",
        description: "For boutique teams preparing candidates across roles and client conversations.",
        monthlyPrice: 99,
        monthlyAllowance: 750,
        allowance: "750 minutes",
        allowanceDetail: "Monthly AI interview allowance",
        featured: true,
        earlyAccess: true,
        contactHref: "/contact",
        cta: "Choose Studio",
        features: [
          "Everything in Free",
          "Expanded talent preparation workflow",
          "Saved interview feedback",
          "Submission support summaries",
          "Specialty and client positioning tools",
        ],
      },
      {
        id: "agency-network",
        name: "Network",
        description: "For recruiting networks that want partner-level workflow input and preparation capacity.",
        monthlyPrice: 249,
        monthlyAllowance: 2500,
        allowance: "2,500 minutes",
        allowanceDetail: "Monthly AI interview allowance",
        earlyAccess: true,
        contactHref: "/contact",
        cta: "Build your network",
        features: [
          "Everything in Studio",
          "Large roster capacity",
          "Premium agency discovery",
          "Advanced client-ready reports",
          "Priority workflow support",
        ],
      },
    ],
  },
];

export const defaultPricingCatalog: PricingCatalog = {
  audiences: pricingAudiences,
};

export function findPricingTierInCatalog(catalog: PricingCatalog, tierId: string) {
  for (const audience of catalog.audiences) {
    const tier = audience.tiers.find((item) => item.id === tierId);
    if (tier) return { audience, tier };
  }
  return null;
}

export function findPricingTier(tierId: string) {
  return findPricingTierInCatalog(defaultPricingCatalog, tierId);
}

export function getFreeTierForAccountTypeInCatalog(catalog: PricingCatalog, accountType: PricingAudienceKey) {
  const audience = catalog.audiences.find((item) => item.key === accountType);
  return audience?.tiers.find((tier) => tier.monthlyPrice === 0) ?? null;
}

export function getFreeTierForAccountType(accountType: PricingAudienceKey) {
  return getFreeTierForAccountTypeInCatalog(defaultPricingCatalog, accountType);
}

export function getTierAmountCents(tier: PricingTier, billingCycle: BillingCycle) {
  const amount = billingCycle === "annual" ? getAnnualPrice(tier) : tier.monthlyPrice;
  return Math.round(amount * 100);
}

export function getEffectiveTierAmountCents(tier: PricingTier, billingCycle: BillingCycle) {
  const baseAmountCents = getTierAmountCents(tier, billingCycle);
  const sale = normalizeSale(tier.sale);
  if (!sale.enabled || sale.percentOff <= 0 || baseAmountCents <= 0) {
    return {
      baseAmountCents,
      effectiveAmountCents: baseAmountCents,
      salePercentOff: 0,
    };
  }

  return {
    baseAmountCents,
    effectiveAmountCents: Math.max(0, Math.round(baseAmountCents * (100 - sale.percentOff) / 100)),
    salePercentOff: sale.percentOff,
  };
}

export function normalizePricingCatalog(input: unknown): PricingCatalog {
  const raw = input as Partial<PricingCatalog> | null | undefined;
  const incomingAudiences = Array.isArray(raw?.audiences) ? raw.audiences : pricingAudiences;
  const audiences = pricingAudiences.map((defaultAudience) => {
    const incomingAudience = incomingAudiences.find((item) => item?.key === defaultAudience.key);
    return {
      ...defaultAudience,
      ...pickStringFields(incomingAudience, ["label", "eyebrow", "summary", "signupHref", "currencyLabel"]),
      tiers: defaultAudience.tiers.map((defaultTier) => {
        const incomingTier = incomingAudience?.tiers?.find((item) => item?.id === defaultTier.id);
        return normalizeTier(defaultTier, incomingTier);
      }),
    };
  });

  const catalog: PricingCatalog = { audiences };
  if (typeof raw?.version === "number" && Number.isFinite(raw.version)) catalog.version = raw.version;
  if (typeof raw?.publishedAt === "string" || raw?.publishedAt === null) catalog.publishedAt = raw.publishedAt;
  return catalog;
}

export function validatePricingCatalog(catalog: PricingCatalog) {
  const errors: string[] = [];
  for (const audience of catalog.audiences) {
    for (const tier of audience.tiers) {
      if (!Number.isFinite(tier.monthlyPrice) || tier.monthlyPrice < 0) {
        errors.push(`${tier.id} monthly price must be 0 or greater.`);
      }
      if (tier.annualPrice !== undefined && (!Number.isFinite(tier.annualPrice) || tier.annualPrice < 0)) {
        errors.push(`${tier.id} annual price must be 0 or greater.`);
      }
      if (!Number.isInteger(tier.monthlyAllowance) || tier.monthlyAllowance < 0) {
        errors.push(`${tier.id} monthly allowance must be a whole number 0 or greater.`);
      }
      const sale = normalizeSale(tier.sale);
      if (sale.enabled && (!Number.isInteger(sale.percentOff) || sale.percentOff < 1 || sale.percentOff > 100)) {
        errors.push(`${tier.id} sale percent must be between 1 and 100.`);
      }
    }
  }
  return errors;
}

function normalizeTier(defaultTier: PricingTier, input?: Partial<PricingTier>): PricingTier {
  const monthlyPrice = normalizeMoney(input?.monthlyPrice, defaultTier.monthlyPrice);
  const annualPrice = input && "annualPrice" in input
    ? input.annualPrice === undefined || input.annualPrice === null
      ? undefined
      : normalizeMoney(input.annualPrice, getAnnualPrice(defaultTier))
    : defaultTier.annualPrice;

  const tier: PricingTier = {
    ...defaultTier,
    ...pickStringFields(input, ["name", "description", "allowance", "allowanceDetail", "contactHref", "cta"]),
    monthlyPrice,
    monthlyAllowance: normalizeInteger(input?.monthlyAllowance, defaultTier.monthlyAllowance),
    featured: typeof input?.featured === "boolean" ? input.featured : defaultTier.featured,
    earlyAccess: typeof input?.earlyAccess === "boolean" ? input.earlyAccess : defaultTier.earlyAccess,
    sale: normalizeSale(input?.sale),
    features: Array.isArray(input?.features)
      ? input.features.map((item) => String(item).trim()).filter(Boolean).slice(0, 20)
      : defaultTier.features,
  };

  if (annualPrice !== undefined) tier.annualPrice = annualPrice;
  else delete tier.annualPrice;
  if (!tier.contactHref) delete tier.contactHref;
  if (tier.featured === undefined) delete tier.featured;
  if (tier.earlyAccess === undefined) delete tier.earlyAccess;
  return tier;
}

function normalizeSale(input?: Partial<PricingSale> | null): PricingSale {
  return {
    enabled: Boolean(input?.enabled),
    percentOff: normalizeInteger(input?.percentOff, 0),
    label: typeof input?.label === "string" ? input.label.trim().slice(0, 80) : "",
  };
}

function normalizeMoney(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.round(numeric * 100) / 100;
}

function normalizeInteger(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.round(numeric);
}

function pickStringFields<T extends string>(input: unknown, keys: T[]): Partial<Record<T, string>> {
  if (!input || typeof input !== "object") return {};
  const source = input as Record<string, unknown>;
  return keys.reduce<Partial<Record<T, string>>>((fields, key) => {
    if (typeof source[key] === "string") fields[key] = source[key].trim();
    return fields;
  }, {});
}
