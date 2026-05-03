import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Cookie Policy - LadderStar',
  description: 'Learn how LadderStar uses cookies, local storage, analytics, security, and checkout technologies.',
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      description="This policy explains how LadderStar uses cookies, local storage, SDK storage, and similar technologies."
      sections={[
        { title: '1. Why we use these technologies', body: <p>We use cookies and similar technologies to keep users signed in, secure accounts, remember preferences, measure performance, understand product usage, support checkout, prevent fraud, and keep LadderStar reliable.</p> },
        { title: '2. Categories', body: <p>Required technologies support authentication, security, account state, and checkout. Preference technologies remember settings. Analytics and performance technologies, including Vercel Analytics and Speed Insights, help us understand traffic, speed, and errors. Third-party SDKs such as Firebase and Stripe may set or read storage needed for their services.</p> },
        { title: '3. Your choices', body: <p>You can control many cookies through browser settings. Blocking required authentication, Firebase, or Stripe storage may prevent sign-in, billing, profile, messaging, or audition features from working. Some jurisdictions may provide additional opt-out rights for analytics or advertising technologies where applicable.</p> },
        { title: '4. Contact', body: <p>Questions about this Cookie Policy can be sent to privacy@ladderstar.com.</p> },
      ]}
    />
  );
}
