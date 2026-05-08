import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactBlock, LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service - LadderStar',
  description: 'Read the LadderStar Terms of Service for accounts, profiles, jobs, messaging, AI interview practice, billing, wallets, and acceptable use.',
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      description="These Terms govern access to and use of LadderStar, including accounts, public profiles, job tools, messaging, AI interview practice, billing, and premium wallet features."
      sections={[
        {
          title: '1. Agreement and operator',
          body: (
            <>
              <p>By accessing or using LadderStar, you agree to these Terms. If you use LadderStar for a company, agency, client, or other organization, you represent that you have authority to bind that organization.</p>
              <ContactBlock />
            </>
          ),
        },
        {
          title: '2. Eligibility and accounts',
          body: (
            <>
              <p>You must provide accurate account information, keep credentials secure, and promptly update material information. You are responsible for activity under your account.</p>
              <p>LadderStar account type is an identity path. Public account types include talent, business, and agency. Privileged admin and owner roles are not public sign-up paths. Account type may be locked or immutable for operational, trust, and billing reasons.</p>
            </>
          ),
        },
        {
          title: '3. Profiles, jobs, and user content',
          body: (
            <>
              <p>You retain ownership of content you submit, but you grant LadderStar a worldwide, non-exclusive, royalty-free license to host, store, reproduce, display, process, transmit, and use that content to operate, improve, secure, and promote the service.</p>
              <p>You are responsible for profile content, job listings, messages, interview inputs, uploaded materials, and any information you publish. Do not submit content that is false, misleading, discriminatory, infringing, confidential without authorization, unlawful, or harmful.</p>
              <p>Employers and agencies are responsible for complying with employment, labor, anti-discrimination, privacy, wage transparency, and recruiting laws that apply to their listings, communications, and hiring practices.</p>
            </>
          ),
        },
        {
          title: '4. AI interview practice',
          body: (
            <>
              <p>AI interview features provide practice interviews, transcription, scoring, feedback, and coaching-style suggestions. AI output may be inaccurate, incomplete, biased, or unsuitable for your circumstances. You are responsible for reviewing output before relying on it.</p>
              <p>LadderStar does not guarantee interviews, employment, compensation, candidate quality, hiring outcomes, immigration outcomes, or professional results. AI tools do not replace human judgment, legal advice, career advice, or employer-specific evaluation.</p>
            </>
          ),
        },
        {
          title: '5. Messaging and platform conduct',
          body: (
            <>
              <p>Messaging is intended for legitimate professional communication. You may not harass others, send spam, scrape users, impersonate people or organizations, request unlawful information, or use LadderStar to discriminate, defraud, or abuse candidates, employers, agencies, or visitors.</p>
              <p>Additional rules are in the <Link className="text-[#5DC99B] hover:text-[#E5B536]" href="/acceptable-use">Acceptable Use Policy</Link>, which is incorporated into these Terms.</p>
            </>
          ),
        },
        {
          title: '6. Billing, subscriptions, and wallet balances',
          body: (
            <>
              <p>Paid plans may be processed through Stripe. Prices, plan limits, features, discounts, sales, and billing cycles are shown at checkout or in the pricing experience. You authorize recurring charges for subscriptions until canceled.</p>
              <p>LadderStar may change published prices, plan packaging, discounts, or promotional sales from time to time. Unless we state otherwise or a separate migration is applied, published price changes apply to new checkout sessions and do not automatically reprice an existing active Stripe subscription.</p>
              <p>Premium wallet balances such as minutes or screenings are service credits, not cash, stored value, gift cards, or legal tender. They may be limited by account type, plan, feature availability, expiration, and anti-abuse rules. Unused credits may not roll over unless the plan expressly states otherwise.</p>
              <p>Refund and cancellation terms are described in the <Link className="text-[#5DC99B] hover:text-[#E5B536]" href="/refund-policy">Refund Policy</Link>.</p>
            </>
          ),
        },
        {
          title: '7. Moderation, suspension, and termination',
          body: (
            <>
              <p>We may remove content, hide public profiles, limit features, suspend accounts, disable accounts, or terminate access when we believe there is a violation of these Terms, risk to users, legal exposure, security concern, nonpayment, fraud, or platform abuse.</p>
              <p>We may preserve records when needed for auditability, billing, security, legal compliance, dispute resolution, or enforcement.</p>
            </>
          ),
        },
        {
          title: '8. Intellectual property',
          body: (
            <>
              <p>LadderStar, the LadderStar name, branding, interface, software, content, and related materials are owned by Ladder Star LLC or its licensors. These Terms do not grant you ownership of LadderStar intellectual property.</p>
              <p>You may not copy, reverse engineer, interfere with, or build derivative services from LadderStar except as allowed by law or written permission.</p>
            </>
          ),
        },
        {
          title: '9. Disclaimers and limitation of liability',
          body: (
            <>
              <p>LadderStar is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We disclaim warranties to the fullest extent permitted by law, including implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement.</p>
              <p>To the fullest extent permitted by law, Ladder Star LLC will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, lost profits, lost opportunities, lost data, employment outcomes, or business interruption. Our aggregate liability for claims relating to the service will not exceed the greater of amounts you paid to LadderStar in the three months before the claim or 100 U.S. dollars.</p>
            </>
          ),
        },
        {
          title: '10. Disputes, governing law, and international use',
          body: (
            <>
              <p>These Terms are governed by the laws of the United States and, where a state law must be selected, Wyoming, without regard to conflict-of-law principles, except where mandatory consumer protection laws provide otherwise.</p>
              <p>Before filing a claim, you agree to contact legal@ladderstar.com and attempt to resolve the dispute informally for at least 30 days. Users outside the United States are responsible for complying with local laws and acknowledge that LadderStar is operated from the United States.</p>
              <p>Nothing in these Terms limits rights that cannot be waived under applicable law.</p>
            </>
          ),
        },
      ]}
    />
  );
}
