import Link from "next/link";
import {
  ArrowRight,
  Mic,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import NavHeader from "@/components/NavHeader";
import FeaturedJobsPreview from "@/components/FeaturedJobsPreview";
import ImageMarquee from "@/components/ImageMarquee";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1A1D20] text-[#F4F5F7] overflow-x-hidden">
      <NavHeader />

      <main>
        {/* Hero Section: Problem & Solution Focused */}
        <section className="relative overflow-hidden ladderstar-surface border-b border-white/5">
          <div className="absolute inset-x-0 top-0 h-px ladderstar-emerald-line" />
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#5DC99B]/30 bg-[#5DC99B]/10 px-4 py-1.5 text-sm font-bold text-[#5DC99B] mb-8">
                <Sparkles className="w-4 h-4" />
                The professional career workspace
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black tracking-tight text-balance leading-[0.9]">
                Stop guessing. 
                <span className="block bg-gradient-to-r from-[#E5B536] to-[#5DC99B] bg-clip-text text-transparent">
                  Start landing.
                </span>
              </h1>

              <p className="mt-8 text-xl md:text-2xl leading-relaxed text-[#F4F5F7]/70 font-medium">
                Standard job boards are noisy, interview anxiety is real, and feedback is non-existent. CoStar solves this with curated high-signal roles and real-time AI interview practice that actually prepares you.
              </p>

              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/jobs"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl ladderstar-action px-8 py-4 text-lg font-bold text-[#1A1D20] transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  Explore Curated Roles
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/audition"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#262A2E] px-8 py-4 text-lg font-bold text-[#F4F5F7] transition hover:bg-[#32373C] hover:border-white/20"
                >
                  <Mic className="w-5 h-5 text-[#5DC99B]" />
                  Practice Interview
                </Link>
              </div>

              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t border-white/5 pt-12">
                <div>
                  <h3 className="text-[#E5B536] font-bold text-lg mb-2">The Noise Problem</h3>
                  <p className="text-sm text-[#F4F5F7]/60 leading-relaxed">Most job boards are flooded with low-quality listings. We curate only high-signal executive and technical roles.</p>
                </div>
                <div>
                  <h3 className="text-[#E5B536] font-bold text-lg mb-2">The Anxiety Problem</h3>
                  <p className="text-sm text-[#F4F5F7]/60 leading-relaxed">Interviews are high-stakes. Our Gemini-powered voice sessions let you fail safely and improve fast.</p>
                </div>
                <div>
                  <h3 className="text-[#E5B536] font-bold text-lg mb-2">The Feedback Problem</h3>
                  <p className="text-sm text-[#F4F5F7]/60 leading-relaxed">&quot;We went with another candidate&quot; is useless. Get granular, actionable feedback reports after every practice.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Showcase: Image Marquee */}
        <section className="px-6 py-20 bg-[#1A1D20]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black mb-4">Platform Overview</h2>
              <p className="text-[#F4F5F7]/60">Everything you need to navigate your next career move.</p>
            </div>
            <ImageMarquee />
          </div>
        </section>

        {/* Featured Jobs Section */}
        <section className="px-6 py-24 bg-[#262A2E]/30 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-16 items-start">
              <div>
                <div className="inline-flex items-center gap-2 text-[#E5B536] font-bold mb-4">
                  <TrendingUp className="w-5 h-5" />
                  Live Market Data
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6">
                  High-signal roles, refreshed daily.
                </h2>
                <p className="text-lg text-[#F4F5F7]/70 leading-relaxed mb-8">
                  We filter for seniority, compensation transparency, and impact. No ghost jobs, no multi-level marketing, just real opportunities for top talent.
                </p>
                <Link
                  href="/jobs"
                  className="group inline-flex items-center gap-2 text-[#5DC99B] font-bold text-lg hover:underline"
                >
                  Browse all active roles
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <div className="relative">
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
