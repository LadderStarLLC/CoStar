"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Check,
  Clock3,
  Star,
  Users2,
  WalletCards,
} from "lucide-react";
import NavHeader from "@/components/NavHeader";
import { useAuth } from "@/context/AuthContext";
import {
  annualPrice,
  pricingAudiences,
  type BillingCycle,
  type PricingAudienceKey,
  type PricingTier,
} from "@/lib/pricing";

const audienceIcons = {
  talent: Star,
  business: Briefcase,
  agency: Users2,
} satisfies Record<PricingAudienceKey, typeof Star>;

function formatPrice(tier: PricingTier, billingCycle: BillingCycle) {
  if (tier.monthlyPrice === 0) return "$0";
  const price = billingCycle === "monthly" ? tier.monthlyPrice : annualPrice(tier.monthlyPrice);
  return `$${price.toLocaleString("en-US")}`;
}

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [activeAudience, setActiveAudience] = useState<PricingAudienceKey>("talent");
  const [checkoutTierId, setCheckoutTierId] = useState<string | null>(null);

  const audience = useMemo(
    () => pricingAudiences.find((item) => item.key === activeAudience) ?? pricingAudiences[0],
    [activeAudience],
  );
  const AudienceIcon = audienceIcons[audience.key];

  async function handleSelectTier(tier: PricingTier) {
    if (tier.monthlyPrice === 0 || !user) {
      router.push(audience.signupHref);
      return;
    }

    if (user.accountType && user.accountType !== audience.key) {
      alert(`This plan is for ${audience.label}. Your current account type is ${user.accountType}.`);
      return;
    }

    setCheckoutTierId(tier.id);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tierId: tier.id, billingCycle }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout.");
      }
      window.location.href = data.url;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to start checkout.");
      setCheckoutTierId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1D20] text-[#F4F5F7]">
      <NavHeader />

      <main>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="grid grid-cols-3 rounded-lg border border-white/10 bg-[#262A2E] p-1">
              {pricingAudiences.map((item) => {
                const Icon = audienceIcons[item.key];
                const isActive = item.key === activeAudience;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveAudience(item.key)}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-bold transition ${
                      isActive
                        ? "ladderstar-action text-[#1A1D20]"
                        : "text-[#F4F5F7]/68 hover:bg-white/5 hover:text-[#5DC99B]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="inline-grid grid-cols-2 rounded-lg border border-white/10 bg-[#262A2E] p-1 md:self-auto">
              {(["monthly", "annual"] as BillingCycle[]).map((cycle) => {
                const isActive = cycle === billingCycle;
                return (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBillingCycle(cycle)}
                    className={`min-h-11 rounded-md px-4 text-sm font-bold capitalize transition ${
                      isActive
                        ? "bg-[#F4F5F7] text-[#1A1D20]"
                        : "text-[#F4F5F7]/68 hover:bg-white/5 hover:text-[#5DC99B]"
                    }`}
                  >
                    {cycle === "annual" ? "Annual - 2 months free" : "Monthly"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-lg border border-[#5DC99B]/20 bg-[#262A2E]/60 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ladderstar-gold-gradient">
                <AudienceIcon className="h-5 w-5 text-[#1A1D20]" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#E5B536]">{audience.eyebrow}</p>
                <h1 className="mt-1 text-2xl font-black">{audience.label} plans</h1>
                <p className="mt-2 max-w-3xl leading-7 text-[#F4F5F7]/68">{audience.summary}</p>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#1A1D20]/70 px-4 py-3">
              <div className="flex items-center gap-2 text-[#5DC99B]">
                <WalletCards className="h-5 w-5" />
                <span className="text-sm font-bold">{audience.currencyLabel}</span>
              </div>
              <p className="mt-1 text-xs text-[#F4F5F7]/52">Allowance resets monthly</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col lg:flex-row items-stretch gap-5 w-full">
            {audience.tiers.map((tier) => {
              const isCheckingOut = checkoutTierId === tier.id;
              return (
                <article
                  key={tier.id}
                  className={`relative flex-1 min-w-[280px] min-h-[590px] flex-col rounded-lg border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl will-change-transform ${
                    tier.featured
                      ? "border-[#E5B536]/55 bg-[#262A2E] shadow-[0_24px_70px_rgba(229,181,54,0.12)]"
                      : "border-white/10 bg-[#262A2E]/72"
                  }`}
                >
                  {tier.featured && (
                    <div className="absolute right-4 top-4 rounded-full bg-[#E5B536] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#1A1D20]">
                      Popular
                    </div>
                  )}

                  <div className="pr-24">
                    <h2 className="text-2xl font-black">{tier.name}</h2>
                    <p className="mt-3 min-h-20 leading-7 text-[#F4F5F7]/66">{tier.description}</p>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-black tracking-tight">{formatPrice(tier, billingCycle)}</span>
                      <span className="pb-2 text-sm font-semibold text-[#F4F5F7]/55">
                        /{billingCycle === "monthly" ? "mo" : "yr"}
                      </span>
                    </div>
                    {billingCycle === "annual" && tier.monthlyPrice > 0 && (
                      <p className="mt-2 text-sm font-semibold text-[#5DC99B]">
                        Equal to ${(annualPrice(tier.monthlyPrice) / 12).toFixed(2)}/mo when billed annually
                      </p>
                    )}
                  </div>

                  <div className="mt-6 rounded-lg border border-[#5DC99B]/25 bg-[#1A1D20]/72 p-4">
                    <div className="flex items-center gap-2 text-[#E5B536]">
                      <Clock3 className="h-5 w-5" />
                      <span className="text-sm font-bold uppercase tracking-[0.12em]">Monthly reset</span>
                    </div>
                    <p className="mt-3 text-2xl font-black">{tier.allowance}</p>
                    <p className="mt-1 text-sm text-[#F4F5F7]/58">{tier.allowanceDetail}</p>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm leading-6 text-[#F4F5F7]/74">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#5DC99B]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={Boolean(checkoutTierId)}
                    onClick={() => handleSelectTier(tier)}
                    className={`mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      tier.featured
                        ? "ladderstar-action text-[#1A1D20] hover:brightness-110"
                        : "border border-[#5DC99B]/35 bg-[#1A1D20]/65 text-[#F4F5F7] hover:border-[#5DC99B] hover:text-[#5DC99B]"
                    }`}
                  >
                    {isCheckingOut ? "Opening checkout..." : tier.monthlyPrice > 0 && !user ? "Sign up to subscribe" : tier.cta}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#262A2E] px-4 sm:px-6 py-12">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {[
              ["Stripe checkout", "Paid plans use secure hosted checkout and renew on the selected monthly or annual cycle."],
              ["No rollover in v1", "Unused premium currency expires when the next monthly allowance refreshes."],
              ["Free plans stay useful", "Every account type can create a profile and begin using the core LadderStar workflow."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-lg border border-white/10 bg-[#1A1D20]/65 p-6">
                <BadgeCheck className="h-6 w-6 text-[#5DC99B]" />
                <h2 className="mt-5 text-xl font-bold">{title}</h2>
                <p className="mt-3 leading-7 text-[#F4F5F7]/66">{copy}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
