import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Mic,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import HomeHeader from "@/components/HomeHeader";
import BrandLogo from "@/components/BrandLogo";
import FeaturedJobsPreview from "@/components/FeaturedJobsPreview";

const coachingTracks = [
  "Interview rehearsal with AI voice practice",
  "Offer positioning and compensation strategy",
  "Resume, portfolio, and profile optimization",
  "Weekly accountability for targeted career moves",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1A1D20] text-[#F4F5F7]">
      <HomeHeader />

      <main>
        <section className="relative overflow-hidden ladderstar-surface">
          <div className="absolute inset-x-0 top-0 h-px ladderstar-emerald-line" />
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <div className="grid lg:grid-cols-[1.02fr_0.98fr] gap-10 lg:gap-14 items-center">
              <div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-balance">
                  Roles worth
                  <span className="block bg-gradient-to-r from-[#E5B536] to-[#5DC99B] bg-clip-text text-transparent">
                    reaching for.
                  </span>
                </h1>

                <p className="mt-6 max-w-2xl text-lg md:text-xl leading-8 text-[#F4F5F7]/76">
                  A digital-native job board and career coaching platform built for ambitious professionals ready for their next ascent.
                </p>

                <div className="mt-9 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/jobs"
                    className="inline-flex items-center justify-center gap-2 rounded-lg ladderstar-action px-6 py-3.5 font-bold text-[#1A1D20] transition hover:brightness-110"
                  >
                    Start Climbing
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#coaching"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#5DC99B]/35 bg-[#262A2E] px-6 py-3.5 font-semibold text-[#F4F5F7] transition hover:border-[#5DC99B] hover:text-[#5DC99B]"
                  >
                    Book coaching
                    <Mic className="w-5 h-5" />
                  </Link>
                </div>

                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
                  {[
                    ["18k+", "curated listings"],
                    ["92%", "clear next steps"],
                    ["24/7", "AI practice"],
                  ].map(([value, label]) => (
                    <div key={label} className="border-l border-[#5DC99B]/40 pl-4">
                      <div className="text-2xl font-black text-[#E5B536]">{value}</div>
                      <div className="text-xs uppercase tracking-[0.18em] text-[#F4F5F7]/55">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <FeaturedJobsPreview />
            </div>
          </div>
        </section>

        <section id="outcomes" className="border-y border-white/10 bg-[#262A2E] px-6 py-16">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-5">
            {[
              ["Curated database", "Search a focused job board with clear salary, remote, and match signals."],
              ["Actionable guidance", "Convert job discovery into outreach, prep, applications, and follow-through."],
              ["Premium momentum", "Use coaching and AI interview practice to move faster with higher confidence."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-lg border border-white/10 bg-[#1A1D20]/65 p-6">
                <BadgeCheck className="w-6 h-6 text-[#5DC99B]" />
                <h2 className="mt-5 text-xl font-bold">{title}</h2>
                <p className="mt-3 leading-7 text-[#F4F5F7]/68">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="coaching" className="px-6 py-20">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E5B536]/30 px-3 py-1.5 text-sm font-semibold text-[#E5B536]">
                <Sparkles className="w-4 h-4" />
                Career coaching layer
              </div>
              <h2 className="mt-5 text-4xl md:text-5xl font-black tracking-tight text-balance">
                Separate from the database. Built for the climb after discovery.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#F4F5F7]/70">
                The job board helps you find openings. Coaching helps you become the obvious candidate, sharpen your narrative, and turn applications into interviews and offers.
              </p>
              <Link
                href="/sign-up?type=talent"
                className="mt-8 inline-flex items-center gap-2 rounded-lg ladderstar-action px-6 py-3.5 font-bold text-[#1A1D20] transition hover:brightness-110"
              >
                Book coaching
                <Star className="w-5 h-5 fill-[#1A1D20]" />
              </Link>
            </div>

            <div className="rounded-lg border border-[#5DC99B]/25 ladderstar-ascent-gradient p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {coachingTracks.map((track) => (
                  <div key={track} className="rounded-lg border border-white/10 bg-[#262A2E]/85 p-5">
                    <CheckCircle2 className="w-5 h-5 text-[#5DC99B]" />
                    <p className="mt-4 font-semibold leading-7">{track}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" />
            <span className="font-bold">LadderStar</span>
          </div>
          <p className="text-sm text-[#F4F5F7]/45">Premium job discovery and career coaching.</p>
        </div>
      </footer>
    </div>
  );
}
