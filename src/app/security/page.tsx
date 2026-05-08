import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Security - LadderStar',
  description: 'LadderStar security practices for authentication, Firestore access, admin operations, billing, secrets, and vulnerability reports.',
};

export default function SecurityPage() {
  return (
    <LegalPage
      eyebrow="Company"
      title="Security"
      description="Security practices for LadderStar accounts, public profiles, admin operations, billing, messaging, and AI interview features."
      sections={[
        { title: '1. Account protection', body: <p>LadderStar uses Firebase Authentication for supported sign-in paths. Users are responsible for protecting their email, identity provider accounts, devices, and active sessions.</p> },
        { title: '2. Data access controls', body: <p>Firestore rules and server routes separate client-owned data from server-owned operational records. Admin and owner authorization must be verified server-side. Pricing configuration, wallet balances, wallet transactions, role changes, status changes, and audit logs are designed to be server-owned.</p> },
        { title: '2A. Screening recordings', body: <p>Recorded business screening media is stored outside the public web root in private Firebase Storage paths. Playback and deletion require authenticated server routes, business ownership or platform admin access, and recording audit events.</p> },
        { title: '3. Secrets and infrastructure', body: <p>Production secrets belong in deployment environment settings and must not be committed. Firebase private keys require runtime newline handling. Vercel hosts the application and may provide analytics and performance tooling.</p> },
        { title: '4. Vulnerability reports', body: <p>Report suspected vulnerabilities, unauthorized access, exposed secrets, account takeover risk, or platform abuse to legal@ladderstar.com. Include steps to reproduce, affected URLs, screenshots or logs where safe, and your contact information.</p> },
        { title: '5. No overclaiming', body: <p>This page describes current practices at a high level. It does not claim a particular certification, audit, compliance framework, uptime guarantee, or complete immunity from security incidents.</p> },
      ]}
    />
  );
}
