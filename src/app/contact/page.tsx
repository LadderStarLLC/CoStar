import type { Metadata } from 'next';
import { CreditCard, LockKeyhole, Mail, MapPin, MessageSquare, Scale } from 'lucide-react';
import NavHeader from '@/components/NavHeader';

export const metadata: Metadata = {
  title: 'Contact - LadderStar',
  description: 'Contact LadderStar for support, privacy, legal, billing, security, and business inquiries.',
};

const contacts = [
  ['General support', 'Questions about accounts, profiles, job tools, messaging, or interview practice.', 'support@ladderstar.com', MessageSquare],
  ['Privacy requests', 'Access, deletion, correction, opt-out, international privacy, or data rights requests.', 'privacy@ladderstar.com', LockKeyhole],
  ['Legal notices', 'Terms, subpoenas, intellectual property concerns, or formal legal correspondence.', 'legal@ladderstar.com', Scale],
  ['Billing support', 'Subscription, checkout, cancellation, duplicate charge, and wallet balance questions.', 'support@ladderstar.com', CreditCard],
  ['Security reports', 'Report suspected vulnerabilities, unauthorized access, or platform abuse.', 'legal@ladderstar.com', LockKeyhole],
] as const;

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#1A1D20] text-[#F4F5F7]">
      <NavHeader />
      <main>
        <section className="ladderstar-surface border-b border-white/10 px-4 py-14 sm:px-6 md:py-20">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#E5B536]">Contact</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Reach the right LadderStar team.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[#F4F5F7]/72">
              Use the channels below for support, privacy rights, billing, legal notices, and security reports. Include your account email and relevant URLs when possible.
            </p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
            {contacts.map(([title, copy, email, Icon]) => (
              <article key={title} className="rounded-lg border border-white/10 bg-[#262A2E]/72 p-6">
                <Icon className="h-6 w-6 text-[#5DC99B]" />
                <h2 className="mt-5 text-2xl font-black">{title}</h2>
                <p className="mt-3 leading-7 text-[#F4F5F7]/68">{copy}</p>
                <a className="mt-5 inline-flex items-center gap-2 font-bold text-[#E5B536] hover:text-[#5DC99B]" href={`mailto:${email}`}>
                  <Mail className="h-4 w-4" />
                  {email}
                </a>
              </article>
            ))}
            <article className="rounded-lg border border-[#5DC99B]/25 bg-[#262A2E]/72 p-6 md:col-span-2">
              <MapPin className="h-6 w-6 text-[#5DC99B]" />
              <h2 className="mt-5 text-2xl font-black">Mailing address</h2>
              <p className="mt-3 leading-7 text-[#F4F5F7]/68">
                Ladder Star LLC, 30 N Gould St, STE R, Sheridan, WY 82801, USA.
              </p>
              <p className="mt-3 text-sm leading-6 text-[#F4F5F7]/52">
                Email is the fastest channel for support and rights requests. Formal mail should include a return address and a clear description of the request.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
