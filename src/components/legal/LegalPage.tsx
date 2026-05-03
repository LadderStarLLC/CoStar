import type { ReactNode } from 'react';
import NavHeader from '@/components/NavHeader';

type Section = {
  title: string;
  body: ReactNode;
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  updated?: string;
  children?: ReactNode;
  sections: Section[];
};

export const LEGAL_UPDATED = 'May 3, 2026';

export function LegalPage({ eyebrow, title, description, updated = LEGAL_UPDATED, children, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[#1A1D20] text-[#F4F5F7]">
      <NavHeader />
      <main>
        <section className="ladderstar-surface border-b border-white/10 px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#E5B536]">{eyebrow}</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#F4F5F7]/70">{description}</p>
            <p className="mt-5 text-sm text-[#F4F5F7]/52">Effective date and last updated: {updated}</p>
            {children}
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 md:py-14">
          <div className="mx-auto grid max-w-5xl gap-5">
            {sections.map((section) => (
              <article key={section.title} className="rounded-lg border border-white/10 bg-[#262A2E]/72 p-6 md:p-7">
                <h2 className="text-2xl font-black tracking-tight">{section.title}</h2>
                <div className="mt-4 space-y-4 leading-7 text-[#F4F5F7]/70">{section.body}</div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export function ContactBlock() {
  return (
    <div className="rounded-lg border border-[#5DC99B]/25 bg-[#1A1D20]/65 p-5 text-sm leading-7 text-[#F4F5F7]/70">
      <p className="font-bold text-[#F4F5F7]">Ladder Star LLC</p>
      <p>30 N Gould St, STE R, Sheridan, WY 82801, USA</p>
      <p>
        Support:{' '}
        <a className="text-[#5DC99B] hover:text-[#E5B536]" href="mailto:support@ladderstar.com">
          support@ladderstar.com
        </a>
      </p>
      <p>
        Privacy:{' '}
        <a className="text-[#5DC99B] hover:text-[#E5B536]" href="mailto:privacy@ladderstar.com">
          privacy@ladderstar.com
        </a>
      </p>
      <p>
        Legal:{' '}
        <a className="text-[#5DC99B] hover:text-[#E5B536]" href="mailto:legal@ladderstar.com">
          legal@ladderstar.com
        </a>
      </p>
    </div>
  );
}
