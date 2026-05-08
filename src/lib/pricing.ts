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
  earlyAccess?: boolean;
  contactHref?: string;
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
        monthlyPrice: 14.99,
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
