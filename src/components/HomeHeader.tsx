'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import BrandLogo from './BrandLogo';

const navLinks = [
  { href: '/jobs', label: 'Job Board' },
  { href: '/sign-in', label: 'Sign In' },
];

export default function HomeHeader() {
  return (
    <header className="border-b border-white/10 bg-[#1A1D20]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo size="md" priority />
          <span className="text-[#F4F5F7] text-xl font-bold tracking-tight">Ladder Star</span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-8 flex-wrap">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-[#F4F5F7]/72 hover:text-[#5DC99B] transition-colors text-sm sm:text-base">
              {link.label}
            </Link>
          ))}
          <Link href="/sign-up" className="inline-flex items-center gap-2 px-4 py-2 ladderstar-action text-[#1A1D20] rounded-lg font-semibold hover:brightness-110 transition text-sm sm:text-base">
            Get Started
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
