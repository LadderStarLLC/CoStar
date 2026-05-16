import type { PublicAccountType } from "./profile";

export type HomepageAccountType = PublicAccountType;

export interface HomepageAnnouncement {
  enabled: boolean;
  text: string;
  label: string;
  href: string;
}

export interface HomepageMarqueeSlide {
  id: string;
  profileType: string;
  title: string;
  description: string;
  image: string;
  accent: string;
  cta: HomepageCta;
}

export interface HomepageCta {
  label: string;
  href: string;
}

export interface HomepageAccountCard {
  enabled: boolean;
  title: string;
  subtitle: string;
  body: string;
  image: string;
  primaryCta: HomepageCta;
  secondaryCta: HomepageCta;
}

export interface HomepageAuthenticatedHero {
  greeting: string;
  headline: string;
  sub: string;
  cta: HomepageCta;
  bgImage: string;
}

export interface HomepageFeaturedJobs {
  enabled: boolean;
  eyebrow: string;
  headline: string;
  body: string;
  cta: HomepageCta;
  backgroundImage: string;
  searchQuery: string;
  searchDisplayText: string;
  buttonLabel: string;
}

export interface HomepageContent {
  announcement: HomepageAnnouncement;
  marqueeSlides: HomepageMarqueeSlide[];
  cards: Record<HomepageAccountType, HomepageAccountCard>;
  authenticatedHeroes: Record<HomepageAccountType, HomepageAuthenticatedHero>;
  featuredJobs: HomepageFeaturedJobs;
  version?: number;
  publishedAt?: string | null;
}

export const defaultHomepageContent: HomepageContent = {
  announcement: {
    enabled: false,
    text: "LadderStar is evolving how talent and teams find each other.",
    label: "Explore Jobs Board",
    href: "/jobs",
  },
  marqueeSlides: [
    {
      id: "interview-practice",
      profileType: "Talent",
      title: "Practice, apply, and get discovered",
      description: "Build your profile, master AI mock interviews, and land high-signal roles curated for top-tier talent.",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2000&auto=format&fit=crop",
      accent: "#5DC99B",
      cta: { label: "Join as Talent", href: "/sign-up?type=talent" },
    },
    {
      id: "curated-job-board",
      profileType: "Business",
      title: "Hire with more signal and less noise",
      description: "Post roles, screen top candidates with AI, and streamline your entire hiring workflow.",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2000&auto=format&fit=crop",
      accent: "#E5B536",
      cta: { label: "Start Hiring", href: "/sign-up?type=business" },
    },
    {
      id: "professional-profiles",
      profileType: "Agency",
      title: "Represent talent and grow your roster",
      description: "Showcase your roster, manage talent relationships, and effortlessly connect with the exact candidates your clients demand.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop",
      accent: "#60A5FA",
      cta: { label: "Build Your Roster", href: "/sign-up?type=agency" },
    },
  ],
  cards: {
    talent: {
      enabled: true,
      title: "Talent",
      subtitle: "Build Your Profile",
      body: "Be seen, practice interviews, and find jobs that fit. Get discovered, sharpen your pitch, find aligned jobs, and walk in prepared.",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800&auto=format&fit=crop",
      primaryCta: { label: "Build Your LadderStar Profile", href: "/sign-up" },
      secondaryCta: { label: "Practice Your Next Interview", href: "/audition" },
    },
    business: {
      enabled: true,
      title: "Business",
      subtitle: "Find Talent Faster",
      body: "Create a company profile, post roles, screen stronger candidates, and manage hiring in one place.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop",
      primaryCta: { label: "Find Talent Faster", href: "/sign-up?type=business" },
      secondaryCta: { label: "Post a Job", href: "/dashboard/jobs" },
    },
    agency: {
      enabled: true,
      title: "Agency",
      subtitle: "Grow Your Talent Network",
      body: "Discover, evaluate, and organize talent in one place. Connect the right people with the right opportunities.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop",
      primaryCta: { label: "Manage Your Talent Roster", href: "/sign-up?type=agency" },
      secondaryCta: { label: "Discover Representable Talent", href: "/search" },
    },
  },
  authenticatedHeroes: {
    talent: {
      greeting: "Welcome back",
      headline: "Practice Your Next Interview",
      sub: "Sharpen your pitch with AI-powered mock interviews. Get real-time voice feedback and walk in prepared.",
      cta: { label: "Start an Interview", href: "/audition" },
      bgImage: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2500&auto=format&fit=crop",
    },
    business: {
      greeting: "Welcome back",
      headline: "Find Your Next Great Hire",
      sub: "Post roles, screen candidates with AI, and manage your hiring pipeline in one place.",
      cta: { label: "Post a Job", href: "/dashboard/jobs" },
      bgImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2500&auto=format&fit=crop",
    },
    agency: {
      greeting: "Welcome back",
      headline: "Grow Your Talent Network",
      sub: "Discover, evaluate, and organize talent. Connect the right people with the right opportunities.",
      cta: { label: "Discover Talent", href: "/search" },
      bgImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2500&auto=format&fit=crop",
    },
  },
  featuredJobs: {
    enabled: true,
    eyebrow: "Live Market Data",
    headline: "High-signal roles, refreshed daily.",
    body: "We filter for seniority, compensation transparency, and impact. No ghost jobs, no multi-level marketing, just real opportunities for top talent.",
    cta: { label: "Browse all active roles", href: "/jobs" },
    backgroundImage: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=2000&auto=format&fit=crop",
    searchQuery: "senior executive director principal AI product engineering strategy",
    searchDisplayText: "senior, AI, product, strategy",
    buttonLabel: "View roles",
  },
};

const accountTypes: HomepageAccountType[] = ["talent", "business", "agency"];

export function normalizeHomepageContent(input: unknown): HomepageContent {
  const raw = isRecord(input) ? input : {};
  const defaults = defaultHomepageContent;

  return {
    announcement: normalizeAnnouncement(raw.announcement, defaults.announcement),
    marqueeSlides: normalizeSlides(raw.marqueeSlides, defaults.marqueeSlides),
    cards: normalizeAccountMap(raw.cards, defaults.cards, normalizeCard),
    authenticatedHeroes: normalizeAccountMap(raw.authenticatedHeroes, defaults.authenticatedHeroes, normalizeHero),
    featuredJobs: normalizeFeaturedJobs(raw.featuredJobs, defaults.featuredJobs),
    version: numberOrUndefined(raw.version),
    publishedAt: stringOrNull(raw.publishedAt),
  };
}

export function validateHomepageContent(content: HomepageContent): string[] {
  const errors: string[] = [];

  if (content.announcement.enabled) {
    requireText(errors, content.announcement.text, "Announcement text");
    requireHref(errors, content.announcement.href, "Announcement href");
  }

  if (content.marqueeSlides.length === 0) {
    errors.push("At least one marquee slide is required.");
  }
  content.marqueeSlides.forEach((slide, index) => {
    requireText(errors, slide.profileType, `Marquee slide ${index + 1} profile type`);
    requireText(errors, slide.title, `Marquee slide ${index + 1} title`);
    requireText(errors, slide.description, `Marquee slide ${index + 1} description`);
    requireHref(errors, slide.image, `Marquee slide ${index + 1} image URL`);
    requireCta(errors, slide.cta, `Marquee slide ${index + 1} CTA`);
    if (!/^#[0-9a-fA-F]{6}$/.test(slide.accent)) {
      errors.push(`Marquee slide ${index + 1} accent must be a hex color.`);
    }
  });

  accountTypes.forEach((accountType) => {
    const card = content.cards[accountType];
    if (card.enabled) {
      requireText(errors, card.title, `${accountType} card title`);
      requireText(errors, card.subtitle, `${accountType} card subtitle`);
      requireText(errors, card.body, `${accountType} card body`);
      requireHref(errors, card.image, `${accountType} card image URL`);
      requireCta(errors, card.primaryCta, `${accountType} card primary CTA`);
      requireCta(errors, card.secondaryCta, `${accountType} card secondary CTA`);
    }

    const hero = content.authenticatedHeroes[accountType];
    requireText(errors, hero.greeting, `${accountType} hero greeting`);
    requireText(errors, hero.headline, `${accountType} hero headline`);
    requireText(errors, hero.sub, `${accountType} hero subcopy`);
    requireHref(errors, hero.bgImage, `${accountType} hero background image URL`);
    requireCta(errors, hero.cta, `${accountType} hero CTA`);
  });

  if (content.featuredJobs.enabled) {
    requireText(errors, content.featuredJobs.eyebrow, "Featured jobs eyebrow");
    requireText(errors, content.featuredJobs.headline, "Featured jobs headline");
    requireText(errors, content.featuredJobs.body, "Featured jobs body");
    requireCta(errors, content.featuredJobs.cta, "Featured jobs CTA");
    requireHref(errors, content.featuredJobs.backgroundImage, "Featured jobs background image URL");
    requireText(errors, content.featuredJobs.searchQuery, "Featured jobs search query");
    requireText(errors, content.featuredJobs.searchDisplayText, "Featured jobs search display text");
    requireText(errors, content.featuredJobs.buttonLabel, "Featured jobs button label");
  }

  return errors;
}

function normalizeAnnouncement(input: unknown, defaults: HomepageAnnouncement): HomepageAnnouncement {
  const raw = isRecord(input) ? input : {};
  return {
    enabled: booleanOrDefault(raw.enabled, defaults.enabled),
    text: stringOrDefault(raw.text, defaults.text),
    label: stringOrDefault(raw.label, defaults.label),
    href: stringOrDefault(raw.href, defaults.href),
  };
}

function normalizeSlides(input: unknown, defaults: HomepageMarqueeSlide[]): HomepageMarqueeSlide[] {
  const incoming = Array.isArray(input) ? input : defaults;
  const slides = incoming
    .slice(0, 6)
    .map((item, index) => {
      const fallback = defaults[index] ?? defaults[0];
      const raw = isRecord(item) ? item : {};
      return {
        id: stringOrDefault(raw.id, fallback.id || `slide-${index + 1}`),
        profileType: stringOrDefault(raw.profileType, fallback.profileType),
        title: stringOrDefault(raw.title, fallback.title),
        description: stringOrDefault(raw.description, fallback.description),
        image: stringOrDefault(raw.image, fallback.image),
        accent: stringOrDefault(raw.accent, fallback.accent),
        cta: normalizeCta(raw.cta, fallback.cta),
      };
    });
  return slides.length > 0 ? slides : defaults;
}

function normalizeAccountMap<T>(
  input: unknown,
  defaults: Record<HomepageAccountType, T>,
  normalizeItem: (input: unknown, defaults: T) => T,
): Record<HomepageAccountType, T> {
  const raw = isRecord(input) ? input : {};
  return accountTypes.reduce<Record<HomepageAccountType, T>>((next, accountType) => {
    next[accountType] = normalizeItem(raw[accountType], defaults[accountType]);
    return next;
  }, {} as Record<HomepageAccountType, T>);
}

function normalizeCard(input: unknown, defaults: HomepageAccountCard): HomepageAccountCard {
  const raw = isRecord(input) ? input : {};
  return {
    enabled: booleanOrDefault(raw.enabled, defaults.enabled),
    title: stringOrDefault(raw.title, defaults.title),
    subtitle: stringOrDefault(raw.subtitle, defaults.subtitle),
    body: stringOrDefault(raw.body, defaults.body),
    image: stringOrDefault(raw.image, defaults.image),
    primaryCta: normalizeCta(raw.primaryCta, defaults.primaryCta),
    secondaryCta: normalizeCta(raw.secondaryCta, defaults.secondaryCta),
  };
}

function normalizeHero(input: unknown, defaults: HomepageAuthenticatedHero): HomepageAuthenticatedHero {
  const raw = isRecord(input) ? input : {};
  return {
    greeting: stringOrDefault(raw.greeting, defaults.greeting),
    headline: stringOrDefault(raw.headline, defaults.headline),
    sub: stringOrDefault(raw.sub, defaults.sub),
    cta: normalizeCta(raw.cta, defaults.cta),
    bgImage: stringOrDefault(raw.bgImage, defaults.bgImage),
  };
}

function normalizeFeaturedJobs(input: unknown, defaults: HomepageFeaturedJobs): HomepageFeaturedJobs {
  const raw = isRecord(input) ? input : {};
  return {
    enabled: booleanOrDefault(raw.enabled, defaults.enabled),
    eyebrow: stringOrDefault(raw.eyebrow, defaults.eyebrow),
    headline: stringOrDefault(raw.headline, defaults.headline),
    body: stringOrDefault(raw.body, defaults.body),
    cta: normalizeCta(raw.cta, defaults.cta),
    backgroundImage: stringOrDefault(raw.backgroundImage, defaults.backgroundImage),
    searchQuery: stringOrDefault(raw.searchQuery, defaults.searchQuery),
    searchDisplayText: stringOrDefault(raw.searchDisplayText, defaults.searchDisplayText),
    buttonLabel: stringOrDefault(raw.buttonLabel, defaults.buttonLabel),
  };
}

function normalizeCta(input: unknown, defaults: HomepageCta): HomepageCta {
  const raw = isRecord(input) ? input : {};
  return {
    label: stringOrDefault(raw.label, defaults.label),
    href: stringOrDefault(raw.href, defaults.href),
  };
}

function requireCta(errors: string[], cta: HomepageCta, label: string) {
  requireText(errors, cta.label, `${label} label`);
  requireHref(errors, cta.href, `${label} href`);
}

function requireText(errors: string[], value: string, label: string) {
  if (!value.trim()) errors.push(`${label} is required.`);
}

function requireHref(errors: string[], value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    errors.push(`${label} is required.`);
    return;
  }
  if (!trimmed.startsWith("/") && !/^https?:\/\//.test(trimmed)) {
    errors.push(`${label} must start with /, http://, or https://.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function booleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
