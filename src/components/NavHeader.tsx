'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isPrivilegedAccountType } from '@/lib/profile';
import { LogOut, User, Mic, Shield, ChevronDown, Settings } from 'lucide-react';
import SiteSearch from './SiteSearch';
import BrandLogo from './BrandLogo';
import { useState, useRef, useEffect } from 'react';
import { fetchWalletSummary, getCachedWalletSummary } from "@/lib/walletClient";
import { currencyForAccountType, walletLabel, type WalletSummary } from "@/lib/wallet";

export default function NavHeader() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const accountType = user?.accountType ?? null;
  const profileHref = user
    ? isPrivilegedAccountType(accountType)
      ? '/account'
      : accountType
      ? '/profile'
      : '/onboarding'
    : '/sign-in';

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

    return () => {
      cancelled = true;
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
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size="sm" priority />
            <span className="text-[#F4F5F7] font-bold tracking-tight">LadderStar</span>
          </Link>
        </div>

        <nav className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <Link href="/jobs" className="text-[#F4F5F7]/72 hover:text-[#5DC99B] transition-colors text-sm sm:text-base">Jobs</Link>
          <Link href="/blog" className="text-[#F4F5F7]/72 hover:text-[#5DC99B] transition-colors text-sm sm:text-base">Blog</Link>
          <Link href="/audition" className="flex items-center gap-1.5 text-[#5DC99B] hover:text-[#F4F5F7] transition-colors font-medium text-sm sm:text-base">
            <Mic className="w-3.5 h-3.5" />
            Audition
          </Link>
          {accountType === 'business' && (
            <Link href="/dashboard/jobs" className="text-[#F4F5F7]/72 hover:text-[#5DC99B] transition-colors text-sm sm:text-base">
              Post a Job
            </Link>
          )}
          {accountType === 'agency' && (
            <Link href="/profile" className="text-[#F4F5F7]/72 hover:text-[#5DC99B] transition-colors text-sm sm:text-base">
              Agency Profile
            </Link>
          )}
          {accountType === 'business' && (
            <Link href="/profile" className="text-[#F4F5F7]/72 hover:text-[#5DC99B] transition-colors text-sm sm:text-base">Company Profile</Link>
          )}
          {(accountType === 'admin' || accountType === 'owner') && (
            <Link href="/admin" className="flex items-center gap-1.5 text-[#E5B536] hover:text-[#5DC99B] transition-colors font-medium text-sm sm:text-base">
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
                className="flex items-center gap-2 text-[#F4F5F7]/72 hover:text-[#5DC99B] transition-colors focus:outline-none"
              >
                {user.photoURL ? (
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
                    <div className="px-4 py-2 border-b border-white/10 mb-1">
                      <div className="text-xs text-[#F4F5F7]/50 uppercase tracking-wider">{walletLabel(menuCurrency)}</div>
                      <div className="text-sm font-bold text-[#E5B536]">{typeof menuBalance === 'number' ? menuBalance : '...'}</div>
                    </div>
                  )}
                  <Link
                    href={profileHref}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[#F4F5F7]/72 hover:text-[#5DC99B] hover:bg-white/5 w-full text-left transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={16} />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[#F4F5F7]/72 hover:text-[#5DC99B] hover:bg-white/5 w-full text-left transition-colors"
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
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[#F4F5F7]/72 hover:text-[#5DC99B] hover:bg-white/5 w-full text-left transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex px-4 py-2 ladderstar-action text-[#1A1D20] rounded-lg font-semibold hover:brightness-110 transition text-sm sm:text-base"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
