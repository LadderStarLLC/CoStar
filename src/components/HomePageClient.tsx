"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Mic,
  TrendingUp,
  Briefcase,
  Users,
  Search,
} from "lucide-react";
import NavHeader from "@/components/NavHeader";
import FeaturedJobsPreview from "@/components/FeaturedJobsPreview";
import ImageMarquee from "@/components/ImageMarquee";
import { useAuth } from "@/context/AuthContext";
import type { HomepageAccountType, HomepageContent } from "@/lib/homepageContent";

const PROFILE_VISUALS: Record<
  HomepageAccountType,
  {
    accent: string;
    accentBg: string;
    accentShadow: string;
    subtitleClass: string;
    cardHoverClass: string;
    tintClass: string;
    iconClass: string;
    primaryClass: string;
    secondaryIcon: ReactNode;
    heroIcon: ReactNode;
    cardIcon: ReactNode;
  }
> = {
  talent: {
    accent: "#5DC99B",
    accentBg: "bg-[#5DC99B]",
    accentShadow: "shadow-[#5DC99B]/25",
    subtitleClass: "text-[#5DC99B]",
    cardHoverClass: "hover:border-[#5DC99B]/50 hover:shadow-[0_0_40px_rgba(93,201,155,0.15)]",
    tintClass: "bg-[#5DC99B]/10",
    iconClass: "text-[#5DC99B] drop-shadow-[0_0_10px_rgba(93,201,155,0.5)]",
    primaryClass: "ladderstar-action text-[#1A1D20] shadow-[#5DC99B]/20",
    secondaryIcon: <Mic className="w-4 h-4 text-[#5DC99B]" />,
    heroIcon: <Mic className="w-6 h-6" />,
    cardIcon: <Mic className="w-12 h-12" />,
  },
  business: {
    accent: "#E5B536",
    accentBg: "bg-[#E5B536]",
    accentShadow: "shadow-[#E5B536]/25",
    subtitleClass: "text-[#E5B536]",
    cardHoverClass: "hover:border-[#E5B536]/50 hover:shadow-[0_0_40px_rgba(229,181,54,0.1)]",
    tintClass: "bg-[#E5B536]/10",
    iconClass: "text-[#E5B536] drop-shadow-[0_0_10px_rgba(229,181,54,0.5)]",
    primaryClass: "bg-[#E5B536] text-[#1A1D20] hover:brightness-110 shadow-[#E5B536]/20",
    secondaryIcon: null,
    heroIcon: <Briefcase className="w-6 h-6" />,
    cardIcon: <Briefcase className="w-12 h-12" />,
  },
  agency: {
    accent: "#60A5FA",
    accentBg: "bg-blue-500",
    accentShadow: "shadow-blue-500/25",
    subtitleClass: "text-blue-400",
    cardHoverClass: "hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]",
    tintClass: "bg-blue-500/10",
    iconClass: "text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]",
    primaryClass: "bg-blue-500 text-white hover:brightness-110 shadow-blue-500/20",
    secondaryIcon: <Search className="w-4 h-4 text-blue-400" />,
    heroIcon: <Users className="w-6 h-6" />,
    cardIcon: <Users className="w-12 h-12" />,
  },
};

function LandingPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#1A1D20] text-[#F4F5F7]">
      <NavHeader />
      <div className="animate-pulse">
        <div className="w-full min-h-[480px] md:min-h-[540px] bg-[#0D0F11]" />
        <div className="px-6 py-20 bg-[#262A2E]/30">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[380px] rounded-2xl bg-[#1A1D20] border border-white/5"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnnouncementBanner({ content }: { content: HomepageContent }) {
  if (!content.announcement.enabled) return null;

  return (
    <div className="border-b border-[#E5B536]/20 bg-[#E5B536]/10 px-6 py-3 text-[#F4F5F7]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm font-semibold sm:flex-row sm:items-center sm:justify-center">
        <span>{content.announcement.text}</span>
        <Link href={content.announcement.href} className="inline-flex items-center gap-1 text-[#E5B536] hover:underline">
          {content.announcement.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function AuthenticatedHero({
  user,
  content,
}: {
  user: { displayName?: string | null; accountType?: string | null };
  content: HomepageContent;
}) {
  const accountType = normalizeHomepageAccountType(user.accountType);
  const hero = content.authenticatedHeroes[accountType];
  const visuals = PROFILE_VISUALS[accountType];
  const firstName = user.displayName?.split(" ")[0] ?? "";

  return (
    <section className="relative overflow-hidden min-h-[480px] md:min-h-[540px] flex items-center bg-[#0D0F11]">
      <Image
        src={hero.bgImage}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0D0F11]/95 via-[#0D0F11]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F11] via-[#0D0F11]/40 to-transparent" />
      <div
        className="absolute inset-0 mix-blend-soft-light opacity-15"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${visuals.accent}50, transparent 70%)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20 w-full">
        <div className="max-w-2xl">
          <div
            className="h-1 w-14 rounded-full mb-8"
            style={{ backgroundColor: visuals.accent }}
          />

          <p className="text-lg md:text-xl font-medium mb-2" style={{ color: visuals.accent }}>
            {hero.greeting}
            {firstName ? `, ${firstName}` : ""}
          </p>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6 text-[#F4F5F7] drop-shadow-lg">
            {hero.headline}
          </h1>

          <p className="text-lg md:text-xl text-[#F4F5F7]/70 leading-relaxed mb-10 max-w-lg font-medium">
            {hero.sub}
          </p>

          <Link
            href={hero.cta.href}
            className={`inline-flex items-center gap-3 ${visuals.accentBg} text-[#1A1D20] px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl ${visuals.accentShadow}`}
          >
            {visuals.heroIcon}
            {hero.cta.label}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1A1D20] to-transparent z-10 pointer-events-none" />
    </section>
  );
}

function AccountCard({ accountType, content }: { accountType: HomepageAccountType; content: HomepageContent }) {
  const card = content.cards[accountType];
  const visuals = PROFILE_VISUALS[accountType];
  if (!card.enabled) return null;

  return (
    <div className={`flex flex-col p-8 rounded-2xl border border-white/10 bg-[#1A1D20] relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 ${visuals.cardHoverClass}`}>
      <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none">
        <Image
          src={card.image}
          alt=""
          aria-hidden="true"
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="w-full h-full object-cover grayscale mix-blend-luminosity scale-105 group-hover:scale-100 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D20] via-[#1A1D20]/90 to-transparent" />
        <div className={`absolute inset-0 ${visuals.tintClass} mix-blend-color`} />
      </div>

      <div className={`absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 translate-x-4 group-hover:translate-x-0 group-hover:-translate-y-2 ${visuals.iconClass}`}>
        {visuals.cardIcon}
      </div>

      <div className="relative z-10 flex-grow">
        <h2 className="text-3xl font-black mb-2 drop-shadow-md">{card.title}</h2>
        <h3 className={`text-xl font-bold mb-4 ${visuals.subtitleClass}`}>{card.subtitle}</h3>
        <p className="text-[#F4F5F7]/80 mb-8 leading-relaxed font-medium">
          {card.body}
        </p>
      </div>
      <div className="relative z-10 flex flex-col gap-3 mt-auto">
        <Link
          href={card.primaryCta.href}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold transition hover:scale-[1.02] active:scale-[0.98] shadow-lg ${visuals.primaryClass}`}
        >
          {card.primaryCta.label}
        </Link>
        <Link
          href={card.secondaryCta.href}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#262A2E]/80 backdrop-blur-sm px-6 py-3.5 text-base font-bold text-[#F4F5F7] transition hover:bg-[#32373C] hover:border-white/20 hover:shadow-lg"
        >
          {visuals.secondaryIcon}
          {card.secondaryCta.label}
        </Link>
      </div>
    </div>
  );
}

export default function HomePageClient({ content }: { content: HomepageContent }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LandingPageSkeleton />;
  }

  const isLoggedIn = !!user;
  const normalizedType = normalizeHomepageAccountType(user?.accountType);

  return (
    <div className="min-h-screen bg-[#1A1D20] text-[#F4F5F7] overflow-x-hidden">
      <NavHeader />
      <AnnouncementBanner content={content} />

      <main>
        {isLoggedIn ? (
          <>
            <AuthenticatedHero user={user} content={content} />

            <section className="px-6 py-20 bg-[#262A2E]/30 border-y border-white/5 relative">
              <div className="max-w-2xl mx-auto relative z-10">
                <AccountCard accountType={normalizedType} content={content} />
              </div>
            </section>
          </>
        ) : (
          <>
            <ImageMarquee slides={content.marqueeSlides} />

            <section className="px-6 py-20 bg-[#262A2E]/30 border-y border-white/5 relative">
              <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <AccountCard accountType="talent" content={content} />
                  <AccountCard accountType="business" content={content} />
                  <AccountCard accountType="agency" content={content} />
                </div>
              </div>
            </section>

            {content.featuredJobs.enabled && (
              <section className="px-6 py-24 bg-[#1A1D20] border-t border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
                  <Image
                    src={content.featuredJobs.backgroundImage}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="100vw"
                    className="w-full h-full object-cover grayscale mix-blend-luminosity"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#1A1D20_70%)]" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                  <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-16 items-start">
                    <div className="min-w-0 max-w-full">
                      <div className="inline-flex items-center gap-2 text-[#E5B536] font-bold mb-4 drop-shadow-sm">
                        <TrendingUp className="w-5 h-5" />
                        {content.featuredJobs.eyebrow}
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6 text-balance break-words drop-shadow-md">
                        {content.featuredJobs.headline}
                      </h2>
                      <p className="text-lg text-[#F4F5F7]/80 leading-relaxed mb-8 text-balance break-words font-medium">
                        {content.featuredJobs.body}
                      </p>
                      <Link
                        href={content.featuredJobs.cta.href}
                        className="group inline-flex items-center gap-2 text-[#5DC99B] font-bold text-lg hover:underline break-words"
                      >
                        {content.featuredJobs.cta.label}
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 shrink-0" />
                      </Link>
                    </div>
                    <div className="relative min-w-0 max-w-full group">
                      <div className="absolute -inset-8 bg-[#5DC99B]/5 blur-3xl rounded-full transition-colors duration-700 group-hover:bg-[#E5B536]/5" />
                      <FeaturedJobsPreview content={content.featuredJobs} />
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function normalizeHomepageAccountType(value?: string | null): HomepageAccountType {
  if (value === "business" || value === "agency") return value;
  return "talent";
}
