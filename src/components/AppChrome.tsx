'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import AppSidebar from './AppSidebar';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { fetchWalletSummary, getCachedWalletSummary } from '@/lib/walletClient';
import type { AccountWallet, WalletSummary } from '@/lib/wallet';

type AppChromeContextValue = {
  openMobileNav: () => void;
  sidebarVisible: boolean;
};

const AppChromeContext = createContext<AppChromeContextValue>({
  openMobileNav: () => {},
  sidebarVisible: false,
});

export function useAppChrome() {
  return useContext(AppChromeContext);
}

function shouldStartCollapsed(pathname: string) {
  if (pathname === '/audition' || pathname.startsWith('/audition/')) return true;
  if (pathname.startsWith('/screening/')) return true;
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) return true;
  if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) return true;
  if (/^\/jobs\/[^/]+\/audition(?:\/|$)/.test(pathname)) return true;
  return false;
}

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(() => shouldStartCollapsed(pathname));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const compactByDefault = shouldStartCollapsed(pathname);
  const sidebarVisible = true;

  useEffect(() => {
    if (!user) {
      setWalletSummary(null);
      return;
    }

    let cancelled = false;
    const cached = getCachedWalletSummary(user.uid);
    if (cached) setWalletSummary(cached);

    fetchWalletSummary(user)
      .then((summary) => {
        if (!cancelled) setWalletSummary(summary);
      })
      .catch(console.error);

    let unsubscribe = () => {};
    if (db) {
      const walletRef = doc(db, 'accountWallets', user.uid);
      unsubscribe = onSnapshot(
        walletRef,
        (snap) => {
          if (snap.exists() && !cancelled) {
            const data = snap.data() as AccountWallet;
            setWalletSummary((prev) => ({
              wallet: data,
              transactions: prev?.transactions ?? [],
            }));
          }
        },
        (err) => {
          console.error('Failed to subscribe to wallet changes:', err);
        },
      );
    }

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (compactByDefault) setCollapsed(true);
  }, [compactByDefault, pathname]);

  const openMobileNav = useCallback(() => {
    setMobileOpen(true);
  }, []);

  const contextValue = useMemo(
    () => ({
      openMobileNav,
      sidebarVisible,
    }),
    [openMobileNav, sidebarVisible],
  );

  return (
    <AppChromeContext.Provider value={contextValue}>
      <div className="min-h-screen">
        <AppSidebar
          user={user}
          walletSummary={walletSummary}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapsed={() => setCollapsed((current) => !current)}
        />
        <div
          className={cn(
            'min-h-screen transition-[padding-left] duration-300',
            sidebarVisible && (collapsed ? 'lg:pl-[76px]' : 'lg:pl-72'),
          )}
        >
          {children}
        </div>
      </div>
    </AppChromeContext.Provider>
  );
}
