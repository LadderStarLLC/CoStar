import {
  Briefcase,
  Building2,
  Home,
  LayoutDashboard,
  Newspaper,
  Search,
  Settings,
  Shield,
  Sparkles,
  Tag,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { isPrivilegedAccountType, type AccountType } from '@/lib/profile';

export type NavigationUser = {
  accountType?: AccountType | null;
} | null;

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  kind?: 'primary' | 'admin';
};

export function getProfileHref(user: NavigationUser) {
  const accountType = user?.accountType ?? null;

  if (!user) return '/sign-in';
  if (isPrivilegedAccountType(accountType)) return '/account';
  if (accountType) return '/profile';
  return '/onboarding';
}

export function getNavigationItems(user: NavigationUser): NavigationItem[] {
  const accountType = user?.accountType ?? null;
  const items: NavigationItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/pricing', label: 'Pricing', icon: Tag },
    { href: '/blog', label: 'Blog', icon: Newspaper },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/audition', label: 'Start Interview Prep', icon: Sparkles, kind: 'primary' },
  ];

  if (user) {
    items.push(
      { href: getProfileHref(user), label: isPrivilegedAccountType(accountType) ? 'Account' : 'Profile', icon: User },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
      { href: '/audition/history', label: 'Interview History', icon: LayoutDashboard },
    );
  }

  if (accountType === 'business') {
    items.push(
      { href: '/dashboard/jobs', label: 'Post a Job', icon: Briefcase },
      { href: '/profile', label: 'Company Profile', icon: Building2 },
    );
  }

  if (accountType === 'agency') {
    items.push({ href: '/profile', label: 'Agency Profile', icon: Building2 });
  }

  if (accountType === 'admin' || accountType === 'owner') {
    items.push({ href: '/admin', label: 'Admin', icon: Shield, kind: 'admin' });
  }

  return items;
}
