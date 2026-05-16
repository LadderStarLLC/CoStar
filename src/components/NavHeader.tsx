'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, Mic, Shield, ChevronDown, Settings, Coins, Menu } from 'lucide-react';
import SiteSearch from './SiteSearch';
import BrandLogo from './BrandLogo';
import { useAppChrome } from './AppChrome';
import { getProfileHref } from './navigation';
import { useState, useRef, useEffect } from 'react';
import { fetchWalletSummary, getCachedWalletSummary } from "@/lib/walletClient";
import { currencyForAccountType, walletLabel, type WalletSummary, type AccountWallet } from "@/lib/wallet";
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { resolveProfileEntitlements } from '@/lib/entitlements';

export default function NavHeader() {
  const { user, logout, loading } = useAuth();
  const { openMobileNav, sidebarVisible } = useAppChrome();
  const router = useRouter();
  const accountType = user?.accountType ?? null;
  const profileHref = getProfileHref(user);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      unsubscribe = onSnapshot(walletRef, (snap) => {
        if (snap.exists() && !cancelled) {
          const data = snap.data() as AccountWallet;
          setWalletSummary((prev) => {
            return {
              wallet: data,
              transactions: prev?.transactions ?? []
            };
          });
        }
      }, (err) => {
        console.error('Failed to subscribe to wallet changes:', err);
      });
    }

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const menuCurrency = walletSummary?.wallet?.currency ?? currencyForAccountType(accountType);
  const menuBalance = walletSummary?.wallet?.balance;

  if (loading) {
    return (
      <header className="border-b border-white/10 bg-[#262A2E]/75 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto min-h-[73px] px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {sidebarVisible && (
              <button
                type="button"
                onClick={openMobileNav}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#1A1D20]/70 text-[#F4F5F7]/72 transition hover:border-[#5DC99B]/35 hover:text-[#5DC99B] lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <BrandLogo size="sm" priority />
            <span className="text-[#F4F5F7] font-bold tracking-tight">LadderStar</span>
          </div>
          <div className="hidden md:flex h-6 w-[280px] rounded bg-[#1A1D20]/70 animate-pulse" />
          <div className="h-10 w-[104px] rounded-lg bg-[#1A1D20]/70 animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-white/10 bg-[#262A2E]/75 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto min-h-[73px] px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {sidebarVisible && (
            <button
              type="button"
              onClick={openMobileNav}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#1A1D20]/70 text-[#F4F5F7]/72 transition hover:border-[#5DC99B]/35 hover:text-[#5DC99B] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size="sm" priority />
            <span className="text-[#F4F5F7] font-bold tracking-tight">LadderStar</span>
          </Link>
        </div>

        <nav className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <Link href="/audition" className="flex items-center gap-1.5 text-brand-secondary hover:text-[#F4F5F7] transition-colors font-medium text-sm sm:text-base">
            <Mic className="w-3.5 h-3.5" />
            Interview Practice
          </Link>
          <Link href="/blog" className="text-[#F4F5F7]/72 hover:text-brand-secondary transition-colors text-sm sm:text-base">Blog</Link>
          {(!user || resolveProfileEntitlements(user)?.status !== 'active') && (
            <Link href="/pricing" className="text-[#F4F5F7]/72 hover:text-brand-secondary transition-colors text-sm sm:text-base">Pricing</Link>
          )}
          <Link href="/jobs" className="text-[#F4F5F7]/72 hover:text-brand-secondary transition-colors text-sm sm:text-base">Jobs Board</Link>
          {accountType === 'business' && (
            <Link href="/dashboard/jobs" className="text-[#F4F5F7]/72 hover:text-brand-secondary transition-colors text-sm sm:text-base">
              Post a Job
            </Link>
          )}
          {accountType === 'agency' && (
            <Link href="/profile" className="text-[#F4F5F7]/72 hover:text-brand-secondary transition-colors text-sm sm:text-base">
              Agency Profile
            </Link>
          )}
          {accountType === 'business' && (
            <Link href="/profile" className="text-[#F4F5F7]/72 hover:text-brand-secondary transition-colors text-sm sm:text-base">Company Profile</Link>
          )}
          {(accountType === 'admin' || accountType === 'owner') && (
            <Link href="/admin" className="flex items-center gap-1.5 text-[#E5B536] hover:text-brand-secondary transition-colors font-medium text-sm sm:text-base">
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="hidden sm:block">
            <SiteSearch />
          </div>
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-[#F4F5F7]/72 hover:text-brand-secondary transition-colors focus:outline-none"
              >
                {user.photoURL ? (
                  // User avatars can come from arbitrary provider domains; a broad next/image allowlist would be riskier than this explicit fallback.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <User size={18} />
                )}
                <span className="inline text-sm sm:text-base hidden sm:inline-block max-w-[120px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <ChevronDown size={16} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#262A2E] border border-white/10 rounded-lg shadow-lg overflow-hidden py-1 z-50">
                  {menuCurrency && (
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#1A1D20]/50 border border-[#E5B536]/20 ladderstar-surface transition-all hover:border-[#E5B536]/40">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#F4F5F7]/50 uppercase tracking-wider font-semibold">{walletLabel(menuCurrency)}</span>
                          <span className="text-sm font-black text-[#E5B536] drop-shadow-sm">
                            {typeof menuBalance === 'number' ? menuBalance : '...'}
                          </span>
                        </div>
                        <Coins className="w-5 h-5 text-[#E5B536] drop-shadow-sm" />
                      </div>
                    </div>
                  )}
                  <Link
                    href={profileHref}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[#F4F5F7]/72 hover:text-brand-secondary hover:bg-white/5 w-full text-left transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={16} />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[#F4F5F7]/72 hover:text-brand-secondary hover:bg-white/5 w-full text-left transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[#F4F5F7]/72 hover:text-brand-secondary hover:bg-white/5 w-full text-left transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="hidden sm:inline-flex px-4 py-2 border border-white/10 bg-[#262A2E] text-[#F4F5F7] rounded-lg font-semibold hover:bg-[#32373C] transition text-sm sm:text-base"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex px-4 py-2 ladderstar-action text-[#1A1D20] rounded-lg font-semibold hover:brightness-110 transition text-sm sm:text-base whitespace-nowrap"
              >
                Create Free Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
