import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Briefcase, Mic, ShieldCheck, Star, Users2 } from 'lucide-react';
import NavHeader from '@/components/NavHeader';

export const metadata: Metadata = {
  title: 'About Us - LadderStar',
  description: 'Learn about LadderStar, a professional platform for job discovery, public profiles, AI interview practice, and career momentum.',
};

const audiences = [
  ['Talent', 'Build a professional presence, discover roles, practice interviews, and keep career progress organized.', Star],
  ['Businesses', 'Publish opportunities, review candidate signals, and support structured hiring workflows.', Briefcase],
  ['Agencies', 'Represent talent, manage public positioning, and support candidate readiness at scale.', Users2],
] as const;

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#1A1D20] text-[#F4F5F7]">
      <NavHeader />
      <main>
        <section className="ladderstar-surface border-b border-white/10 px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#E5B536]">About LadderStar</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
              Professional infrastructure for the climb from opportunity to offer.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#F4F5F7]/72">
              LadderStar combines job discovery, public profiles, AI interview practice, messaging, account management, and premium career tools in one focused platform for modern hiring and career growth.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/jobs" className="inline-flex items-center justify-center gap-2 rounded-lg ladderstar-action px-5 py-3 font-bold text-[#1A1D20]">
                Explore jobs
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-lg border border-[#5DC99B]/35 bg-[#262A2E] px-5 py-3 font-bold hover:border-[#5DC99B] hover:text-[#5DC99B]">
                Contact us
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {audiences.map(([title, copy, Icon]) => (
              <article key={title} className="rounded-lg border border-white/10 bg-[#262A2E]/72 p-6">
                <Icon className="h-7 w-7 text-[#5DC99B]" />
                <h2 className="mt-5 text-2xl font-black">{title}</h2>
                <p className="mt-3 leading-7 text-[#F4F5F7]/68">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#262A2E] px-4 py-12 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <ShieldCheck className="h-8 w-8 text-[#E5B536]" />
              <h2 className="mt-5 text-3xl font-black tracking-tight">Built around responsibility.</h2>
            </div>
            <div className="space-y-5 leading-8 text-[#F4F5F7]/70">
              <p>
                Public profile projections are designed to contain opted-in public fields, while private account, wallet, audit, support, and administrative data remain outside public profiles.
              </p>
              <p>
                AI interview tools are designed for practice and coaching. They can help users prepare, but they do not guarantee hiring outcomes, replace professional judgment, or make employment decisions for employers.
              </p>
              <p>
                LadderStar is operated by Ladder Star LLC, 30 N Gould St, STE R, Sheridan, WY 82801, USA.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto max-w-7xl rounded-lg border border-[#5DC99B]/25 ladderstar-ascent-gradient p-7 md:p-9">
            <Mic className="h-8 w-8 text-[#5DC99B]" />
            <h2 className="mt-5 text-3xl font-black">What we are building</h2>
            <p className="mt-4 max-w-4xl leading-8 text-[#F4F5F7]/72">
              A professional network and job operating system where candidates, businesses, and agencies can move from discovery to preparation to action with clearer context and stronger accountability.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
