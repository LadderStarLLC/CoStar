import type { PublicAccountType } from "./profile";

export type BillingCycle = "monthly" | "annual";
export type PricingAudienceKey = PublicAccountType;

export type PricingTierId =
  | "talent-free"
  | "talent-plus"
  | "talent-pro"
  | "business-free"
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
    summary: "Practice interviews, refine your story, and move from discovery to offer with stronger signals.",
    signupHref: "/sign-up?type=talent",
    currencyLabel: "Interview minutes",
    tiers: [
      {
        id: "talent-free",
        name: "Free",
        description: "Start practicing with enough AI time to build a weekly habit.",
        monthlyPrice: 0,
        monthlyAllowance: 30,
        allowance: "30 minutes",
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
        monthlyPrice: 19,
        monthlyAllowance: 240,
        allowance: "240 minutes",
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
        description: "High-volume preparation for serious interview loops and career transitions.",
        monthlyPrice: 49,
        monthlyAllowance: 900,
        allowance: "900 minutes",
        allowanceDetail: "Monthly AI audition allowance",
        cta: "Go Pro",
        features: [
          "Everything in Plus",
          "Unlimited saved feedback reports",
          "Deep post-interview analysis",
          "Compensation and positioning prompts",
          "Premium career momentum workflows",
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
        description: "Launch a hiring presence and test candidate screening on a light workflow.",
        monthlyPrice: 0,
        monthlyAllowance: 5,
        allowance: "5 screenings",
        allowanceDetail: "Monthly candidate screening allowance",
        cta: "Start free",
        features: [
          "Company profile",
          "One active job post",
          "Basic applicant messaging",
          "Light AI screening capacity",
        ],
      },
      {
        id: "business-growth",
        name: "Growth",
        description: "A practical operating plan for steady hiring and repeat candidate evaluation.",
        monthlyPrice: 99,
        monthlyAllowance: 80,
        allowance: "80 screenings",
        allowanceDetail: "Monthly candidate screening allowance",
        featured: true,
        cta: "Choose Growth",
        features: [
          "Everything in Free",
          "Up to 10 active job posts",
          "Branded company profile",
          "Candidate screening summaries",
          "Hiring pipeline organization",
        ],
      },
      {
        id: "business-scale",
        name: "Scale",
        description: "For teams managing higher volume, multiple roles, and faster shortlist decisions.",
        monthlyPrice: 249,
        monthlyAllowance: 250,
        allowance: "250 screenings",
        allowanceDetail: "Monthly candidate screening allowance",
        cta: "Scale hiring",
        features: [
          "Everything in Growth",
          "Unlimited active job posts",
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
        monthlyAllowance: 60,
        allowance: "60 minutes",
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
        monthlyPrice: 79,
        monthlyAllowance: 600,
        allowance: "600 minutes",
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
        monthlyPrice: 199,
        monthlyAllowance: 2000,
        allowance: "2,000 minutes",
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

export function getTierAmountCents(tier: PricingTier, billingCycle: BillingCycle) {
  const amount = billingCycle === "annual" ? annualPrice(tier.monthlyPrice) : tier.monthlyPrice;
  return amount * 100;
}
