import type { AccountType } from './profile';

export type PremiumCurrency = 'minutes' | 'screenings';

export interface AccountWallet {
  uid: string;
  accountType: AccountType;
  currency: PremiumCurrency;
  balance: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface WalletTransaction {
  id: string;
  uid: string;
  accountType: AccountType;
  currency: PremiumCurrency;
  delta: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  actorUid: string;
  actorEmail?: string | null;
  type:
    | 'admin_adjustment'
    | 'subscription_allowance'
    | 'usage_debit'
    | 'usage_reserve'
    | 'usage_settle_refund'
    | 'gift_sent'
    | 'gift_received';
  createdAt?: unknown;
}

export interface WalletSummary {
  wallet: AccountWallet | null;
  transactions: WalletTransaction[];
}

export function currencyForAccountType(accountType?: AccountType | null): PremiumCurrency | null {
  if (accountType === 'talent' || accountType === 'agency') return 'minutes';
  if (accountType === 'business') return 'screenings';
  return null;
}

export function walletLabel(currency?: PremiumCurrency | null): string {
  if (currency === 'screenings') return 'Screenings';
  return 'Minutes';
}
