import type { Metadata } from 'next';
import { ContactBlock, LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy - LadderStar',
  description: 'Read the LadderStar Privacy Policy for account, profile, interview, messaging, billing, analytics, and international privacy practices.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="This Privacy Policy explains how Ladder Star LLC collects, uses, discloses, protects, and retains information when you use LadderStar."
      sections={[
        {
          title: '1. Who we are',
          body: (
            <>
              <p>LadderStar is operated by Ladder Star LLC. The service includes job discovery, public professional profiles, account management, messaging, premium wallet features, employer and agency tools, and AI-powered interview practice.</p>
              <ContactBlock />
            </>
          ),
        },
        {
          title: '2. Information we collect',
          body: (
            <>
              <p>We collect account information such as name, email address, authentication provider, profile photo, account type, role, status, and settings. Firebase Authentication may process sign-in data for Google, GitHub, email, and related authentication paths.</p>
              <p>We collect profile information you provide, including talent, business, and agency profile fields. Private profile data is stored separately from published public profile projections. Public profile documents are intended to contain only fields you choose to publish or that are appropriate for public display.</p>
              <p>We collect job-board and business workflow data, including job postings, applications or apply links where available, search and filter activity, employer or agency context, and operational metadata needed to provide the service.</p>
              <p>We collect interview data when you use AI interview practice, including settings, microphone audio sent during a session, transcripts, generated feedback, scores, strengths, improvements, session timestamps, and session status. If you choose to continue with a recorded business screening session, we also collect the consent record and audio/video recording for that screening.</p>
              <p>We collect messaging data for the global chat widget, including conversation metadata, participant IDs, message content, TipTap rich-text JSON, timestamps, and related delivery state.</p>
              <p>We collect billing, pricing, and wallet data, including Stripe checkout and subscription references, pricing catalog versions, checkout amounts, discount or sale metadata, entitlements, wallet balances, wallet transaction history, billing contact details where provided, and admin adjustment or publishing reasons.</p>
              <p>We collect device, log, analytics, and security data such as IP address, browser type, device identifiers, pages viewed, performance information, crash or error context, approximate location inferred from network data, and anti-abuse signals.</p>
            </>
          ),
        },
        {
          title: '3. How we use information',
          body: (
            <>
              <p>We use information to operate accounts, authenticate users, provide job search and profile features, publish selected public profile data, enable messaging, run AI interview practice, process billing, apply published pricing or sales to checkout, manage premium wallet balances, provide support, prevent abuse, and secure the service.</p>
              <p>We use profile and job data to make LadderStar useful for discovery, matching, search, professional presentation, and employer or agency workflows. We use interview content to generate practice feedback, maintain session history, and provide business screening reports or recordings to the authorized hiring team when a recorded screening is explicitly enabled and consented to.</p>
              <p>We use analytics and performance data to understand reliability, improve product flows, diagnose errors, and protect the service. We may use aggregated or de-identified information for product analytics and reporting.</p>
            </>
          ),
        },
        {
          title: '4. Public profiles and visibility',
          body: (
            <>
              <p>Private profile data lives in user account records. Published public profile projections are separate documents designed for public discovery. Do not add confidential, private, support, wallet, audit, or administrative data to public profile fields.</p>
              <p>Your public profile may be visible to other users, visitors, search features, and external search engines depending on your visibility settings and product configuration. You are responsible for choosing what information you publish.</p>
            </>
          ),
        },
        {
          title: '5. AI interview data',
          body: (
            <>
              <p>AI interview practice may send audio, transcripts, prompts, and session context to Google Gemini or related AI infrastructure so the service can conduct a live practice interview and generate feedback. Generated feedback can be inaccurate, incomplete, or inappropriate for your exact situation.</p>
              <p>Recorded business screenings require clear notice and candidate consent before camera or microphone access. LadderStar does not use recorded screening video for facial-expression scoring, emotion detection, biometric identification, personality claims, or AI judgments based on appearance.</p>
              <p>Do not submit sensitive personal information, confidential employer information, trade secrets, government identifiers, health information, or information you do not have the right to share during interview practice.</p>
            </>
          ),
        },
        {
          title: '6. Cookies, analytics, and similar technologies',
          body: (
            <>
              <p>We use cookies, local storage, SDK storage, and similar technologies for authentication, security, preferences, performance, analytics, checkout, and service reliability. Vercel Analytics and Speed Insights may help us measure traffic and performance.</p>
              <p>You can control many cookies through your browser settings, but disabling required authentication or security storage may prevent parts of LadderStar from working.</p>
            </>
          ),
        },
        {
          title: '7. How we disclose information',
          body: (
            <>
              <p>We disclose information to service providers that help operate LadderStar, including Firebase and Firestore, Google AI services, Stripe, Vercel, hosting and analytics providers, email or support tools, and infrastructure vendors.</p>
              <p>We may disclose public profile and job information according to product settings, to other users where needed for messaging or collaboration, to administrators and owners for moderation and support, to comply with law, to protect rights and safety, and in connection with a merger, acquisition, financing, or sale of assets.</p>
              <p>We do not sell personal information in the ordinary meaning of selling names or account records for money. If a law treats some analytics or advertising technology as a sale or sharing, we will provide required notices and choices where applicable.</p>
            </>
          ),
        },
        {
          title: '8. Security and retention',
          body: (
            <>
              <p>We use technical and organizational safeguards appropriate to the nature of the service, including Firebase Authentication, Firestore rules, server-side checks for privileged routes, server-owned pricing, wallet, and audit records, and environment-based secret handling.</p>
              <p>No online service is completely secure. We retain information while needed to provide the service, comply with legal obligations, resolve disputes, enforce agreements, maintain auditability, prevent abuse, and support business operations. Some records may remain in backups or logs for a limited period.</p>
            </>
          ),
        },
        {
          title: '9. Your choices and rights',
          body: (
            <>
              <p>You may access and update many account and profile settings in LadderStar. You may delete your account through supported account controls, subject to records we retain for legal, security, billing, audit, fraud prevention, or dispute purposes.</p>
              <p>Depending on where you live, you may have rights to know, access, correct, delete, restrict, object, opt out of certain processing, receive data portability, withdraw consent, or appeal a privacy decision. California residents may have rights under the CCPA/CPRA, including rights to know, delete, correct, limit certain sensitive information use, opt out of sale or sharing, and be free from discrimination for exercising rights. EEA, UK, and similar international users may have GDPR-style rights over personal data.</p>
              <p>Submit privacy requests to privacy@ladderstar.com. We may verify your identity before completing a request. Authorized agents should provide proof of authority and enough information for verification.</p>
            </>
          ),
        },
        {
          title: '10. International users, children, and changes',
          body: (
            <>
              <p>LadderStar is operated from the United States. If you use the service from outside the United States, your information may be processed in the United States and other jurisdictions that may not provide the same data-protection rules as your home jurisdiction.</p>
              <p>LadderStar is not intended for children under 13 and is not designed to knowingly collect personal information from children. Users should be old enough to form a binding agreement or have appropriate authorization.</p>
              <p>We may update this Privacy Policy as the service changes. Material changes will be reflected by updating the effective date and, where appropriate, by providing additional notice.</p>
            </>
          ),
        },
      ]}
    />
  );
}
