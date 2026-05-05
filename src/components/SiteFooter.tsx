'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Mail, MapPin, ShieldCheck } from 'lucide-react';
import BrandLogo from './BrandLogo';

const hiddenPrefixes = [
  '/account',
  '/admin',
  '/dashboard',
  '/onboarding',
  '/profile',
];

const hiddenExact = ['/audition'];

const footerGroups = [
  {
    title: 'Platform',
    links: [
      { href: '/jobs', label: 'Jobs' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/audition', label: 'Audition practice' },
      { href: '/blog', label: 'Blog' },
      { href: '/search', label: 'Search' },
      { href: '/sign-up', label: 'Create account' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/contact', label: 'Contact' },
      { href: '/security', label: 'Security' },
      { href: '/accessibility', label: 'Accessibility' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/cookies', label: 'Cookie Policy' },
      { href: '/acceptable-use', label: 'Acceptable Use' },
      { href: '/refund-policy', label: 'Refund Policy' },
      { href: '/ai-policy', label: 'AI & Data Policy' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/sign-in', label: 'Sign in' },
      { href: '/dashboard/settings', label: 'Settings' },
      { href: '/profile', label: 'Public profile controls' },
      { href: '/contact', label: 'Support' },
    ],
  },
];

function shouldHideFooter(pathname: string) {
  if (hiddenExact.includes(pathname)) return true;
  if (pathname.startsWith('/audition/')) return true;
  return hiddenPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function SiteFooter() {
  const pathname = usePathname();

  if (shouldHideFooter(pathname)) return null;

  return (
    <footer className="border-t border-[var(--border-default)] bg-[rgb(var(--surface-base))] text-[rgb(var(--foreground)_/_0.60)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1.85fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <BrandLogo size="md" />
              <span className="text-xl font-black tracking-tight text-[rgb(var(--foreground)_/_0.78)]">LadderStar</span>
            </Link>
            <p className="mt-5 max-w-md leading-7 text-[rgb(var(--foreground)_/_0.60)]">
              Premium job discovery, public professional profiles, AI interview practice, and career operating tools for talent, businesses, and agencies.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-[rgb(var(--foreground)_/_0.58)]">
              <a href="mailto:support@ladderstar.com" className="inline-flex items-center gap-2 transition hover:text-[rgb(var(--brand-secondary))]">
                <Mail className="h-4 w-4 text-[rgb(var(--brand-secondary)_/_0.72)]" />
                support@ladderstar.com
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--brand-secondary)_/_0.72)]" />
                <span>Ladder Star LLC, 30 N Gould St, STE R, Sheridan, WY 82801, USA</span>
              </div>
              <div className="inline-flex items-center gap-2 text-[rgb(var(--foreground)_/_0.52)]">
                <ShieldCheck className="h-4 w-4" />
                <span>Security, privacy, and responsible AI guidance for every account path.</span>
              </div>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-8 md:grid-cols-4" aria-label="Footer">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[rgb(var(--foreground)_/_0.58)]">{group.title}</h2>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--foreground)_/_0.58)] transition hover:text-[rgb(var(--brand-secondary))]"
                      >
                        {link.label}
                        {link.href === '/sign-up' && <ArrowUpRight className="h-3.5 w-3.5" />}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[var(--border-default)] pt-6 text-xs leading-6 text-[rgb(var(--foreground)_/_0.44)] md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} Ladder Star LLC. All rights reserved.</p>
          <p>Policies are informational and do not replace legal advice from qualified counsel.</p>
        </div>
      </div>
    </footer>
  );
}
