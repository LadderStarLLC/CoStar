'use client';

import Link from 'next/link';
import { ArrowUpRight, Star } from 'lucide-react';

const navLinks = [
  { href: '/jobs', label: 'Job Board' },
  { href: '#coaching', label: 'Coaching' },
  { href: '#outcomes', label: 'Outcomes' },
  { href: '/sign-in', label: 'Sign In' },
];

export default function HomeHeader() {
  return (
    <header className="border-b border-white/10 bg-[#1A1D20]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 ladderstar-gold-gradient rounded-lg flex items-center justify-center shadow-[0_10px_26px_rgba(229,181,54,0.2)]">
            <Star className="w-5 h-5 fill-[#1A1D20] text-[#1A1D20]" />
          </div>
          <span className="text-[#F4F5F7] text-xl font-bold tracking-tight">LadderStar</span>
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
