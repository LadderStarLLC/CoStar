'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isPrivilegedAccountType } from '@/lib/profile';
import { LogOut, User, Mic, Shield, Star } from 'lucide-react';
import SiteSearch from './SiteSearch';

export default function NavHeader() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const accountType = user?.accountType ?? null;
  const profileHref = user
    ? isPrivilegedAccountType(accountType)
      ? '/account'
      : accountType
      ? '/dashboard/settings'
      : '/onboarding'
    : '/sign-in';

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading) {
    return (
      <header className="border-b border-white/10 bg-[#262A2E]/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="h-8 bg-[#1A1D20]/70 animate-pulse rounded"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-white/10 bg-[#262A2E]/75 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 ladderstar-gold-gradient rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 fill-[#1A1D20] text-[#1A1D20]" />
            </div>
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
            <Link href="/dashboard/settings" className="text-[#F4F5F7]/72 hover:text-[#5DC99B] transition-colors text-sm sm:text-base">
              Agency Profile
            </Link>
          )}
          {accountType === 'business' && (
            <Link href="/dashboard/settings" className="text-[#F4F5F7]/72 hover:text-[#5DC99B] transition-colors text-sm sm:text-base">Company Profile</Link>
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
            <>
              <Link
                href={profileHref}
                className="flex items-center gap-2 text-[#F4F5F7]/72 hover:text-[#5DC99B] transition-colors"
              >
                <User size={18} />
                <span className="inline text-sm sm:text-base">{user.displayName || user.email}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-[#F4F5F7]/55 hover:text-[#5DC99B] transition-colors"
                title="Sign out"
              >
                <LogOut size={20} />
              </button>
            </>
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
