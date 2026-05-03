import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy - LadderStar',
  description: 'Rules for using LadderStar responsibly across profiles, jobs, messaging, AI audition practice, and platform access.',
};

export default function AcceptableUsePage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Acceptable Use Policy"
      description="These rules apply to all LadderStar users and protect candidates, employers, agencies, visitors, and the platform."
      sections={[
        { title: '1. Professional use', body: <p>Use LadderStar for lawful professional networking, job discovery, hiring, agency representation, interview practice, and related career activities. Content and communications must be accurate, respectful, and appropriate for a professional platform.</p> },
        { title: '2. Prohibited conduct', body: <p>You may not harass, threaten, discriminate, impersonate, defraud, spam, scrape, phish, upload malware, bypass access controls, interfere with service operation, reverse engineer protected systems, misrepresent jobs or compensation, collect sensitive information unlawfully, or use LadderStar for illegal activity.</p> },
        { title: '3. Jobs and recruiting', body: <p>Job listings must describe legitimate opportunities and comply with applicable employment, wage, anti-discrimination, privacy, and recruiting laws. Do not post deceptive roles, pyramid schemes, unpaid work presented as paid work, or jobs requiring unlawful fees from candidates.</p> },
        { title: '4. AI and audition misuse', body: <p>Do not use AI audition tools to generate unlawful, discriminatory, deceptive, infringing, or harmful content. Do not submit confidential third-party information, trade secrets, health information, government identifiers, or content you lack authority to share.</p> },
        { title: '5. Enforcement', body: <p>We may remove content, restrict features, hide public profiles, suspend accounts, disable accounts, preserve evidence, or report activity to appropriate parties when we believe this policy has been violated.</p> },
      ]}
    />
  );
}
