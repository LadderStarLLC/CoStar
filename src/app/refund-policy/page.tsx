import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Refund Policy - LadderStar',
  description: 'LadderStar subscription, cancellation, premium wallet, duplicate charge, and refund request policy.',
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Refund Policy"
      description="This policy explains how LadderStar handles subscriptions, cancellations, premium wallet balances, and refund requests."
      sections={[
        { title: '1. Subscriptions', body: <p>Paid plans renew on the billing cycle selected at checkout unless canceled. Stripe may process checkout, payment methods, invoices, and subscription management. Plan features, prices, and limits are presented in the pricing and checkout experience.</p> },
        { title: '2. Cancellations', body: <p>You may cancel a subscription through supported account or billing flows. Cancellation generally stops future renewal charges but does not automatically refund the current billing period unless required by law or approved by LadderStar.</p> },
        { title: '3. Refund requests', body: <p>Send refund requests to support@ladderstar.com with the account email, charge date, amount, and reason. We review duplicate charges, accidental purchases, technical issues, and legally required refunds. Approval is not guaranteed unless required by applicable law.</p> },
        { title: '4. Premium wallet balances', body: <p>Premium balances such as minutes or screenings are service credits tied to account type and plan. They are not cash, legal tender, bank balances, or stored value. Unused monthly allowances do not roll over unless a plan expressly states otherwise.</p> },
        { title: '5. Legal rights', body: <p>Nothing in this policy limits refund, cancellation, cooling-off, or consumer rights that cannot be waived under applicable law.</p> },
      ]}
    />
  );
}
