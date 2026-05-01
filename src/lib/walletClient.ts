import type { WalletSummary } from './wallet';

export async function fetchWalletSummary(user: { getIdToken: () => Promise<string> }): Promise<WalletSummary> {
  const token = await user.getIdToken();
  const response = await fetch('/api/account/wallet', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}
