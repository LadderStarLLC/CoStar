import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Accessibility - LadderStar',
  description: 'LadderStar accessibility commitment and feedback contact information.',
};

export default function AccessibilityPage() {
  return (
    <LegalPage
      eyebrow="Company"
      title="Accessibility"
      description="LadderStar aims to provide a professional, usable experience for people with diverse access needs."
      sections={[
        { title: '1. Commitment', body: <p>We work to make LadderStar understandable, navigable, keyboard-friendly, readable, and compatible with modern assistive technologies where practical. Accessibility is an ongoing product responsibility, not a one-time release task.</p> },
        { title: '2. Feedback', body: <p>If you have trouble using LadderStar, contact support@ladderstar.com with the page URL, browser or device, assistive technology if applicable, and a description of the issue. We will review accessibility feedback and prioritize fixes based on severity and user impact.</p> },
        { title: '3. Alternative support', body: <p>If a workflow is blocked by an accessibility issue, contact support and we will try to provide a reasonable alternative way to complete the task while the issue is reviewed.</p> },
      ]}
    />
  );
}
