import Link from "next/link";
import {
  ArrowRight,
  Mic,
  TrendingUp,
  Briefcase,
  Users,
  Search
} from "lucide-react";
import NavHeader from "@/components/NavHeader";
import FeaturedJobsPreview from "@/components/FeaturedJobsPreview";
import ImageMarquee from "@/components/ImageMarquee";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1A1D20] text-[#F4F5F7] overflow-x-hidden">
      <NavHeader />

      <main>
        {/* Hero Section: Platform Overview with Marquee */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 bg-[#1A1D20]">
          {/* Faded background image/gradient effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#5DC99B]/10 via-[#1A1D20] to-[#1A1D20] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px ladderstar-emerald-line" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-balance">
                Get Seen. Get Ready. <span className="text-[#5DC99B]">Get Hired.</span>
              </h1>
              <p className="text-xl md:text-2xl text-[#F4F5F7]/70 font-medium max-w-3xl mx-auto mb-4 text-balance">
                Hire With Better Signals. Represent Talent With More Clarity.
              </p>
              <p className="text-lg text-[#F4F5F7]/50 max-w-2xl mx-auto text-balance">
                Everything you need to navigate your next career move, find top candidates, or manage your roster.
              </p>
            </div>
            
            <ImageMarquee />
          </div>
        </section>

        {/* Three Big Cards Section */}
        <section className="px-6 py-20 bg-[#262A2E]/30 border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Talent Card */}
              <div className="flex flex-col p-8 rounded-2xl border border-white/10 bg-[#1A1D20] relative overflow-hidden group hover:border-[#5DC99B]/50 transition-colors">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Mic className="w-24 h-24 text-[#5DC99B]" />
                </div>
                <div className="relative z-10 flex-grow">
                  <h2 className="text-3xl font-black mb-2">Talent</h2>
                  <h3 className="text-xl text-[#5DC99B] font-bold mb-4">Build Your Profile</h3>
                  <p className="text-[#F4F5F7]/70 mb-8 leading-relaxed">
                    Be seen, practice interviews, and find jobs that fit. Get discovered, sharpen your pitch, find aligned jobs, and walk in prepared.
                  </p>
                </div>
                <div className="relative z-10 flex flex-col gap-3 mt-auto">
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center justify-center gap-2 rounded-xl ladderstar-action px-6 py-3.5 text-base font-bold text-[#1A1D20] transition hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Build Your LadderStar Profile
                  </Link>
                  <Link
                    href="/audition"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#262A2E] px-6 py-3.5 text-base font-bold text-[#F4F5F7] transition hover:bg-[#32373C] hover:border-white/20"
                  >
                    <Mic className="w-4 h-4 text-[#5DC99B]" />
                    Practice Your Next Interview
                  </Link>
                </div>
              </div>

              {/* Business Card */}
              <div className="flex flex-col p-8 rounded-2xl border border-white/10 bg-[#1A1D20] relative overflow-hidden group hover:border-[#E5B536]/50 transition-colors">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Briefcase className="w-24 h-24 text-[#E5B536]" />
                </div>
                <div className="relative z-10 flex-grow">
                  <h2 className="text-3xl font-black mb-2">Business</h2>
                  <h3 className="text-xl text-[#E5B536] font-bold mb-4">Find Talent Faster</h3>
                  <p className="text-[#F4F5F7]/70 mb-8 leading-relaxed">
                    Create a company profile, post roles, screen stronger candidates, and manage hiring in one place.
                  </p>
                </div>
                <div className="relative z-10 flex flex-col gap-3 mt-auto">
                  <Link
                    href="/sign-up?type=business"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E5B536] px-6 py-3.5 text-base font-bold text-[#1A1D20] transition hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
                  >
                    Find Talent Faster
                  </Link>
                  <Link
                    href="/dashboard/jobs"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#262A2E] px-6 py-3.5 text-base font-bold text-[#F4F5F7] transition hover:bg-[#32373C] hover:border-white/20"
                  >
                    Post a Job
                  </Link>
                </div>
              </div>

              {/* Agency Card */}
              <div className="flex flex-col p-8 rounded-2xl border border-white/10 bg-[#1A1D20] relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users className="w-24 h-24 text-blue-400" />
                </div>
                <div className="relative z-10 flex-grow">
                  <h2 className="text-3xl font-black mb-2">Agency</h2>
                  <h3 className="text-xl text-blue-400 font-bold mb-4">Grow Your Talent Network</h3>
                  <p className="text-[#F4F5F7]/70 mb-8 leading-relaxed">
                    Discover, evaluate, and organize talent in one place. Connect the right people with the right opportunities.
                  </p>
                </div>
                <div className="relative z-10 flex flex-col gap-3 mt-auto">
                  <Link
                    href="/sign-up?type=agency"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 text-base font-bold text-white transition hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
                  >
                    Manage Your Talent Roster
                  </Link>
                  <Link
                    href="/search"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#262A2E] px-6 py-3.5 text-base font-bold text-[#F4F5F7] transition hover:bg-[#32373C] hover:border-white/20"
                  >
                    <Search className="w-4 h-4 text-blue-400" />
                    Discover Representable Talent
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Jobs Section */}
        <section className="px-6 py-24 bg-[#1A1D20] border-t border-white/5 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-16 items-start">
              <div className="min-w-0 max-w-full">
                <div className="inline-flex items-center gap-2 text-[#E5B536] font-bold mb-4">
                  <TrendingUp className="w-5 h-5" />
                  Live Market Data
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6 text-balance break-words">
                  High-signal roles, refreshed daily.
                </h2>
                <p className="text-lg text-[#F4F5F7]/70 leading-relaxed mb-8 text-balance break-words">
                  We filter for seniority, compensation transparency, and impact. No ghost jobs, no multi-level marketing, just real opportunities for top talent.
                </p>
                <Link
                  href="/jobs"
                  className="group inline-flex items-center gap-2 text-[#5DC99B] font-bold text-lg hover:underline break-words"
                >
                  Browse all active roles
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 shrink-0" />
                </Link>
              </div>
              <div className="relative min-w-0 max-w-full">
                <div className="absolute -inset-4 bg-[#5DC99B]/5 blur-3xl rounded-full" />
                <FeaturedJobsPreview />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
