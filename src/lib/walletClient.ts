import type { WalletSummary } from './wallet';

const CACHE_PREFIX = 'ladderstar:walletSummary:';

export function getCachedWalletSummary(uid?: string | null): WalletSummary | null {
  if (!uid || typeof window === 'undefined') return null;

  try {
    const value = window.localStorage.getItem(`${CACHE_PREFIX}${uid}`);
    return value ? JSON.parse(value) as WalletSummary : null;
  } catch {
    return null;
  }
}

export function cacheWalletSummary(uid: string | undefined | null, summary: WalletSummary) {
  if (!uid || typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(`${CACHE_PREFIX}${uid}`, JSON.stringify(summary));
  } catch {
    // Cache is only a paint-speed optimization.
  }
}

export async function fetchWalletSummary(user: { uid?: string; getIdToken: () => Promise<string> }): Promise<WalletSummary> {
  const token = await user.getIdToken();
  const response = await fetch('/api/account/wallet', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const summary = await response.json() as WalletSummary;
  cacheWalletSummary(user.uid, summary);
  return summary;
}
