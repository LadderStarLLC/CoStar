import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  MapPin,
  Mic,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import HomeHeader from "@/components/HomeHeader";
import BrandLogo from "@/components/BrandLogo";

const featuredJobs = [
  {
    title: "Senior Product Designer",
    company: "Northstar Labs",
    location: "Remote, US",
    salary: "$145k - $185k",
    tags: ["Remote", "New", "Equity"],
  },
  {
    title: "AI GTM Strategy Lead",
    company: "VentureScale",
    location: "New York, NY",
    salary: "$170k - $220k",
    tags: ["Hybrid", "Executive"],
  },
  {
    title: "Founding Full Stack Engineer",
    company: "SignalFrame",
    location: "Austin, TX",
    salary: "$155k - $210k",
    tags: ["Startup", "Top Match"],
  },
];

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
                <div className="inline-flex items-center gap-2 rounded-full border border-[#5DC99B]/30 bg-[#262A2E]/80 px-3 py-1.5 text-sm font-medium text-[#5DC99B]">
                  <TrendingUp className="w-4 h-4" />
                  Premium roles, guided ascent
                </div>

                <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-tight text-balance">
                  LadderStar
                  <span className="block bg-gradient-to-r from-[#E5B536] to-[#5DC99B] bg-clip-text text-transparent">
                    climb toward rare work.
                  </span>
                </h1>

                <p className="mt-6 max-w-2xl text-lg md:text-xl leading-8 text-[#F4F5F7]/76">
                  A digital-native job board and career coaching platform for ambitious professionals who want sharper guidance, better filters, and access to roles worth reaching for.
                </p>

                <div className="mt-9 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/jobs"
                    className="inline-flex items-center justify-center gap-2 rounded-lg ladderstar-action px-6 py-3.5 font-bold text-[#1A1D20] transition hover:brightness-110"
                  >
                    Search top roles
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

                <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl">
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

              <div className="rounded-lg border border-white/10 bg-[#262A2E]/90 p-4 shadow-2xl shadow-black/30">
                <div className="rounded-lg border border-[#5DC99B]/20 bg-[#1A1D20] p-4">
                  <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5DC99B]" />
                      <div className="rounded-lg border border-[#5DC99B]/45 bg-[#262A2E] py-3 pl-10 pr-4 text-[#F4F5F7]/86">
                        product, AI, strategy
                      </div>
                    </div>
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg ladderstar-action px-5 py-3 font-bold text-[#1A1D20]">
                      <SlidersHorizontal className="w-4 h-4" />
                      Filter
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {featuredJobs.map((job, index) => (
                    <div
                      key={job.title}
                      className={`rounded-lg border p-4 transition ${
                        index === 0
                          ? "border-[#E5B536]/45 ladderstar-ascent-gradient"
                          : "border-white/10 bg-[#1A1D20]/70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="font-bold text-[#F4F5F7]">{job.title}</h2>
                          <p className="mt-1 text-sm text-[#F4F5F7]/65">{job.company}</p>
                        </div>
                        <div className="rounded-lg ladderstar-gold-gradient p-2">
                          <Briefcase className="w-4 h-4 text-[#1A1D20]" />
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#F4F5F7]/65">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-[#5DC99B]" />
                          {job.location}
                        </span>
                        <span className="font-semibold text-[#E5B536]">{job.salary}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {job.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-[#5DC99B]/30 bg-[#5DC99B]/10 px-2.5 py-1 text-xs font-semibold text-[#5DC99B]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
