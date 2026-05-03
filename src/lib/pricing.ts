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
  monthlyAllowance: number;
  allowance: string;
  allowanceDetail: string;
  featured?: boolean;
  cta: string;
  features: string[];
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

export const annualPrice = (monthlyPrice: number) => monthlyPrice * 10;

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
        description: "Try a focused audition and see where your answers need work.",
        monthlyPrice: 0,
        monthlyAllowance: 15,
        allowance: "15 minutes",
        allowanceDetail: "Monthly AI audition allowance",
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
        monthlyPrice: 24,
        monthlyAllowance: 200,
        allowance: "200 minutes",
        allowanceDetail: "Monthly AI audition allowance",
        featured: true,
        cta: "Choose Plus",
        features: [
          "Everything in Free",
          "Expanded audition history",
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
        monthlyAllowance: 1000,
        allowance: "1,000 minutes",
        allowanceDetail: "Monthly AI audition allowance",
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
    eyebrow: "For hiring teams",
    summary: "Promote roles, screen candidates with AI-assisted consistency, and keep applicant review moving.",
    signupHref: "/sign-up?type=business",
    currencyLabel: "AI screenings",
    tiers: [
      {
        id: "business-free",
        name: "Free",
        description: "Launch a hiring presence with one active role.",
        monthlyPrice: 0,
        monthlyAllowance: 0,
        allowance: "1 active job",
        allowanceDetail: "Free hiring presence",
        cta: "Start free",
        features: [
          "Company profile",
          "One active job post",
          "Basic applicant messaging",
          "Manual candidate review",
        ],
      },
      {
        id: "business-starter",
        name: "Starter",
        description: "A practical paid entry point for active hiring teams.",
        monthlyPrice: 79,
        monthlyAllowance: 40,
        allowance: "40 screenings",
        allowanceDetail: "Monthly candidate screening allowance",
        featured: true,
        cta: "Choose Starter",
        features: [
          "Everything in Free",
          "Up to 3 active job posts",
          "Branded company profile",
          "Candidate screening summaries",
          "Hiring pipeline organization",
        ],
      },
      {
        id: "business-growth",
        name: "Growth",
        description: "For teams repeatedly hiring across multiple roles.",
        monthlyPrice: 149,
        monthlyAllowance: 125,
        allowance: "125 screenings",
        allowanceDetail: "Monthly candidate screening allowance",
        cta: "Choose Growth",
        features: [
          "Everything in Starter",
          "Up to 10 active job posts",
          "Priority job visibility",
          "Shortlist-ready summaries",
          "Hiring pipeline organization",
        ],
      },
      {
        id: "business-scale",
        name: "Scale",
        description: "For teams managing higher volume, multiple roles, and faster shortlist decisions.",
        monthlyPrice: 299,
        monthlyAllowance: 350,
        allowance: "350 screenings",
        allowanceDetail: "Monthly candidate screening allowance",
        cta: "Scale hiring",
        features: [
          "Everything in Growth",
          "Expanded active job capacity",
          "Priority listing placement",
          "Team collaboration support",
          "Executive-ready candidate shortlists",
        ],
      },
    ],
  },
  {
    key: "agency",
    label: "Agencies",
    eyebrow: "For recruiters and talent reps",
    summary: "Represent talent, prep candidates for client conversations, and package submissions with confidence.",
    signupHref: "/sign-up?type=agency",
    currencyLabel: "Interview minutes",
    tiers: [
      {
        id: "agency-free",
        name: "Free",
        description: "Build an agency profile and support a small roster with guided interview practice.",
        monthlyPrice: 0,
        monthlyAllowance: 30,
        allowance: "30 minutes",
        allowanceDetail: "Monthly represented talent allowance",
        cta: "Start free",
        features: [
          "Agency profile",
          "Basic talent roster tools",
          "AI practice for represented talent",
          "Client-ready profile links",
        ],
      },
      {
        id: "agency-studio",
        name: "Studio",
        description: "A stronger workflow for boutique teams preparing talent across multiple roles.",
        monthlyPrice: 99,
        monthlyAllowance: 750,
        allowance: "750 minutes",
        allowanceDetail: "Monthly represented talent allowance",
        featured: true,
        cta: "Choose Studio",
        features: [
          "Everything in Free",
          "Expanded roster visibility",
          "Saved audition feedback",
          "Submission support summaries",
          "Specialty and client positioning tools",
        ],
      },
      {
        id: "agency-network",
        name: "Network",
        description: "High-capacity preparation and presentation tools for active recruiting networks.",
        monthlyPrice: 249,
        monthlyAllowance: 2500,
        allowance: "2,500 minutes",
        allowanceDetail: "Monthly represented talent allowance",
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

export function findPricingTier(tierId: string) {
  for (const audience of pricingAudiences) {
    const tier = audience.tiers.find((item) => item.id === tierId);
    if (tier) return { audience, tier };
  }
  return null;
}

export function getFreeTierForAccountType(accountType: PricingAudienceKey) {
  const audience = pricingAudiences.find((item) => item.key === accountType);
  return audience?.tiers.find((tier) => tier.monthlyPrice === 0) ?? null;
}

export function getTierAmountCents(tier: PricingTier, billingCycle: BillingCycle) {
  const amount = billingCycle === "annual" ? annualPrice(tier.monthlyPrice) : tier.monthlyPrice;
  return amount * 100;
}
