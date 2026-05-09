import Link from "next/link";
import Image from "next/image";
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
          {/* Ambient Photographic Background */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <Image
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2500&auto=format&fit=crop" 
              alt="" 
              aria-hidden="true"
              fill
              sizes="100vw"
              className="w-full h-full object-cover opacity-15"
            />
            {/* Fade out to the bottom and smooth edges */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1A1D20]/30 via-[#1A1D20]/80 to-[#1A1D20]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#5DC99B]/10 via-transparent to-transparent mix-blend-screen" />
          </div>
          
          <div className="absolute inset-x-0 top-0 h-px ladderstar-emerald-line z-10" />
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-balance drop-shadow-lg">
                Get Seen. Get Ready. <span className="text-[#5DC99B] drop-shadow-[0_0_15px_rgba(93,201,155,0.3)]">Get Hired.</span>
              </h1>
              <p className="text-xl md:text-2xl text-[#F4F5F7]/90 font-medium max-w-3xl mx-auto mb-4 text-balance drop-shadow-md">
                Hire With Better Signals. Represent Talent With More Clarity.
              </p>
              <p className="text-lg text-[#F4F5F7]/60 max-w-2xl mx-auto text-balance">
                Everything you need to navigate your next career move, find top candidates, or manage your roster.
              </p>
            </div>
            
            <ImageMarquee />
          </div>
        </section>

        {/* Three Big Cards Section */}
        <section className="px-6 py-20 bg-[#262A2E]/30 border-y border-white/5 relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Talent Card */}
              <div className="flex flex-col p-8 rounded-2xl border border-white/10 bg-[#1A1D20] relative overflow-hidden group hover:border-[#5DC99B]/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(93,201,155,0.15)] hover:-translate-y-1">
                {/* Ambient Image Layer */}
                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none">
                  <Image
                    src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800&auto=format&fit=crop" 
                    alt="" 
                    aria-hidden="true"
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="w-full h-full object-cover grayscale mix-blend-luminosity scale-105 group-hover:scale-100 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D20] via-[#1A1D20]/90 to-transparent" />
                  <div className="absolute inset-0 bg-[#5DC99B]/10 mix-blend-color" />
                </div>
                
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 translate-x-4 group-hover:translate-x-0 group-hover:-translate-y-2">
                  <Mic className="w-12 h-12 text-[#5DC99B] drop-shadow-[0_0_10px_rgba(93,201,155,0.5)]" />
                </div>

                <div className="relative z-10 flex-grow">
                  <h2 className="text-3xl font-black mb-2 drop-shadow-md">Talent</h2>
                  <h3 className="text-xl text-[#5DC99B] font-bold mb-4">Build Your Profile</h3>
                  <p className="text-[#F4F5F7]/80 mb-8 leading-relaxed font-medium">
                    Be seen, practice interviews, and find jobs that fit. Get discovered, sharpen your pitch, find aligned jobs, and walk in prepared.
                  </p>
                </div>
                <div className="relative z-10 flex flex-col gap-3 mt-auto">
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center justify-center gap-2 rounded-xl ladderstar-action px-6 py-3.5 text-base font-bold text-[#1A1D20] transition hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#5DC99B]/20"
                  >
                    Build Your LadderStar Profile
                  </Link>
                  <Link
                    href="/audition"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#262A2E]/80 backdrop-blur-sm px-6 py-3.5 text-base font-bold text-[#F4F5F7] transition hover:bg-[#32373C] hover:border-white/20 hover:shadow-lg"
                  >
                    <Mic className="w-4 h-4 text-[#5DC99B]" />
                    Practice Your Next Interview
                  </Link>
                </div>
              </div>

              {/* Business Card */}
              <div className="flex flex-col p-8 rounded-2xl border border-white/10 bg-[#1A1D20] relative overflow-hidden group hover:border-[#E5B536]/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(229,181,54,0.1)] hover:-translate-y-1">
                {/* Ambient Image Layer */}
                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none">
                  <Image
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop" 
                    alt="" 
                    aria-hidden="true"
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="w-full h-full object-cover grayscale mix-blend-luminosity scale-105 group-hover:scale-100 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D20] via-[#1A1D20]/90 to-transparent" />
                  <div className="absolute inset-0 bg-[#E5B536]/10 mix-blend-color" />
                </div>

                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 translate-x-4 group-hover:translate-x-0 group-hover:-translate-y-2">
                  <Briefcase className="w-12 h-12 text-[#E5B536] drop-shadow-[0_0_10px_rgba(229,181,54,0.5)]" />
                </div>

                <div className="relative z-10 flex-grow">
                  <h2 className="text-3xl font-black mb-2 drop-shadow-md">Business</h2>
                  <h3 className="text-xl text-[#E5B536] font-bold mb-4">Find Talent Faster</h3>
                  <p className="text-[#F4F5F7]/80 mb-8 leading-relaxed font-medium">
                    Create a company profile, post roles, screen stronger candidates, and manage hiring in one place.
                  </p>
                </div>
                <div className="relative z-10 flex flex-col gap-3 mt-auto">
                  <Link
                    href="/sign-up?type=business"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E5B536] px-6 py-3.5 text-base font-bold text-[#1A1D20] transition hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] shadow-lg shadow-[#E5B536]/20"
                  >
                    Find Talent Faster
                  </Link>
                  <Link
                    href="/dashboard/jobs"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#262A2E]/80 backdrop-blur-sm px-6 py-3.5 text-base font-bold text-[#F4F5F7] transition hover:bg-[#32373C] hover:border-white/20 hover:shadow-lg"
                  >
                    Post a Job
                  </Link>
                </div>
              </div>

              {/* Agency Card */}
              <div className="flex flex-col p-8 rounded-2xl border border-white/10 bg-[#1A1D20] relative overflow-hidden group hover:border-blue-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:-translate-y-1">
                {/* Ambient Image Layer */}
                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none">
                  <Image
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop" 
                    alt="" 
                    aria-hidden="true"
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="w-full h-full object-cover grayscale mix-blend-luminosity scale-105 group-hover:scale-100 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D20] via-[#1A1D20]/90 to-transparent" />
                  <div className="absolute inset-0 bg-blue-500/10 mix-blend-color" />
                </div>

                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 translate-x-4 group-hover:translate-x-0 group-hover:-translate-y-2">
                  <Users className="w-12 h-12 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                </div>

                <div className="relative z-10 flex-grow">
                  <h2 className="text-3xl font-black mb-2 drop-shadow-md">Agency</h2>
                  <h3 className="text-xl text-blue-400 font-bold mb-4">Grow Your Talent Network</h3>
                  <p className="text-[#F4F5F7]/80 mb-8 leading-relaxed font-medium">
                    Discover, evaluate, and organize talent in one place. Connect the right people with the right opportunities.
                  </p>
                </div>
                <div className="relative z-10 flex flex-col gap-3 mt-auto">
                  <Link
                    href="/sign-up?type=agency"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 text-base font-bold text-white transition hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] shadow-lg shadow-blue-500/20"
                  >
                    Manage Your Talent Roster
                  </Link>
                  <Link
                    href="/search"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#262A2E]/80 backdrop-blur-sm px-6 py-3.5 text-base font-bold text-[#F4F5F7] transition hover:bg-[#32373C] hover:border-white/20 hover:shadow-lg"
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
        <section className="px-6 py-24 bg-[#1A1D20] border-t border-white/5 relative overflow-hidden">
          {/* Ambient Digital Background */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
            <Image
              src="https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=2000&auto=format&fit=crop" 
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
                  Live Market Data
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6 text-balance break-words drop-shadow-md">
                  High-signal roles, refreshed daily.
                </h2>
                <p className="text-lg text-[#F4F5F7]/80 leading-relaxed mb-8 text-balance break-words font-medium">
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
              <div className="relative min-w-0 max-w-full group">
                <div className="absolute -inset-8 bg-[#5DC99B]/5 blur-3xl rounded-full transition-colors duration-700 group-hover:bg-[#E5B536]/5" />
                <FeaturedJobsPreview />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
