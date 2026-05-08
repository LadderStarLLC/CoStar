'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Coins, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import BrandLogo from './BrandLogo';
import { getNavigationItems, type NavigationUser } from './navigation';
import { cn } from '@/lib/utils';
import { currencyForAccountType, walletLabel, type WalletSummary } from '@/lib/wallet';

type AppSidebarProps = {
  user: NavigationUser;
  walletSummary: WalletSummary | null;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
};

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppSidebar({
  user,
  walletSummary,
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: AppSidebarProps) {
  const pathname = usePathname();
  const accountType = user?.accountType ?? null;
  const items = useMemo(() => {
    const seen = new Set<string>();
    return getNavigationItems(user).filter((item) => {
      const key = `${item.href}:${item.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [user]);
  const menuCurrency = walletSummary?.wallet?.currency ?? currencyForAccountType(accountType);
  const menuBalance = walletSummary?.wallet?.balance;

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseMobile();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const sidebarContent = (compact: boolean) => (
    <div className="flex h-full flex-col">
      <div className="flex min-h-[72px] items-center justify-between gap-3 border-b border-white/10 px-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <BrandLogo size="sm" priority />
          {!compact && (
            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-tight text-[#F4F5F7]">LadderStar</p>
              <p className="truncate text-[11px] font-medium text-[#F4F5F7]/45">Career workspace</p>
            </div>
          )}
        </Link>
        {!compact && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-2 text-[#F4F5F7]/55 transition hover:bg-white/5 hover:text-[#F4F5F7] lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4" aria-label="Sidebar navigation">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          const primary = item.kind === 'primary';
          const admin = item.kind === 'admin';

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              onClick={onCloseMobile}
              title={compact ? item.label : undefined}
              className={cn(
                'group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition',
                compact && 'justify-center px-2',
                active && !primary && !admin && 'bg-white/10 text-[#F4F5F7]',
                !active && !primary && !admin && 'text-[#F4F5F7]/68 hover:bg-white/5 hover:text-[#F4F5F7]',
                primary && 'ladderstar-action text-[#1A1D20] shadow-[0_16px_32px_rgba(229,181,54,0.18)] hover:brightness-110',
                admin && 'border border-[#E5B536]/25 bg-[#E5B536]/10 text-[#E5B536] hover:border-[#E5B536]/45',
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', primary && 'text-[#1A1D20]')} />
              {!compact && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-3">
        {menuCurrency && (
          <div
            className={cn(
              'rounded-lg border border-[#E5B536]/20 bg-[#1A1D20]/55 p-3',
              compact && 'flex items-center justify-center p-2',
            )}
            title={compact ? `${walletLabel(menuCurrency)}: ${typeof menuBalance === 'number' ? menuBalance : '...'}` : undefined}
          >
            {compact ? (
              <Coins className="h-5 w-5 text-[#E5B536]" />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-[#F4F5F7]/48">
                    {walletLabel(menuCurrency)}
                  </p>
                  <p className="text-lg font-black text-[#E5B536]">
                    {typeof menuBalance === 'number' ? menuBalance : '...'}
                  </p>
                </div>
                <Coins className="h-5 w-5 shrink-0 text-[#E5B536]" />
              </div>
            )}
          </div>
        )}

        {!compact && (
          <Link
            href="/audition"
            className="block rounded-lg border border-[#5DC99B]/25 bg-[#5DC99B]/10 p-3 transition hover:border-[#5DC99B]/45"
          >
            <p className="text-sm font-bold text-[#F4F5F7]">Get interview-ready</p>
            <p className="mt-1 text-xs leading-5 text-[#F4F5F7]/58">Practice live, pressure-test your story, and leave with sharper answers.</p>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          'fixed bottom-0 left-0 top-0 z-[60] hidden border-r border-white/10 bg-[#262A2E]/95 shadow-2xl shadow-black/25 backdrop-blur-xl transition-[width] duration-300 lg:block',
          collapsed ? 'w-[76px]' : 'w-72',
        )}
      >
        {sidebarContent(collapsed)}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="absolute -right-3 top-24 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#262A2E] text-[#F4F5F7]/68 shadow-lg transition hover:border-[#5DC99B]/35 hover:text-[#5DC99B]"
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-label="Close navigation overlay"
          />
          <aside className="relative h-full w-[min(22rem,calc(100vw-2rem))] border-r border-white/10 bg-[#262A2E] shadow-2xl">
            {sidebarContent(false)}
          </aside>
        </div>
      )}
    </>
  );
}
