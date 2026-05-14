'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ChevronLeft, ChevronRight, Mic, Users } from 'lucide-react';
import type { HomepageMarqueeSlide } from '@/lib/homepageContent';

export default function ImageMarquee({ slides }: { slides: HomepageMarqueeSlide[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const safeSlides = slides.length > 0 ? slides : [];

  const next = useCallback(() => {
    if (safeSlides.length === 0) return;
    setDirection(1);
    setIndex((prev) => (prev + 1) % safeSlides.length);
  }, [safeSlides.length]);

  const prev = useCallback(() => {
    if (safeSlides.length === 0) return;
    setDirection(-1);
    setIndex((prev) => (prev - 1 + safeSlides.length) % safeSlides.length);
  }, [safeSlides.length]);

  const goTo = useCallback((i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  }, [index]);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  if (safeSlides.length === 0) return null;

  const slide = safeSlides[index] ?? safeSlides[0];
  const CtaIcon = getCtaIcon(slide.profileType);

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -80 : 80 }),
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#0D0F11] min-h-[480px] md:min-h-[540px]">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={slide.id || index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            sizes="100vw"
            priority={index === 0}
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0F11]/95 via-[#0D0F11]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F11] via-[#0D0F11]/30 to-transparent" />
          <div
            className="absolute inset-0 mix-blend-soft-light opacity-20"
            style={{ background: `radial-gradient(ellipse at 30% 50%, ${slide.accent}40, transparent 70%)` }}
          />

          <div className="relative z-10 flex flex-col justify-center h-full max-w-7xl mx-auto px-6 md:px-12 py-16">
            <div className="max-w-2xl">
              <div
                className="inline-block h-1 w-12 rounded-full mb-6"
                style={{ backgroundColor: slide.accent }}
              />
              <p
                className="mb-3 text-sm font-black uppercase tracking-[0.3em]"
                style={{ color: slide.accent }}
              >
                {slide.profileType}
              </p>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-5 text-[#F4F5F7] drop-shadow-lg leading-[1.1]">
                {slide.title}
              </h2>
              <p className="text-lg md:text-xl text-[#F4F5F7]/75 leading-relaxed max-w-lg font-medium">
                {slide.description}
              </p>
              <Link
                href={slide.cta.href}
                className="mt-9 inline-flex items-center gap-3 rounded-xl px-7 py-4 text-base md:text-lg font-black text-[#0D0F11] shadow-xl transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-[#0D0F11]"
                style={{
                  backgroundColor: slide.accent,
                  boxShadow: `0 20px 45px ${slide.accent}35`,
                }}
              >
                <CtaIcon className="h-5 w-5" aria-hidden="true" />
                {slide.cta.label}
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={prev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white/80 hover:text-white transition-all z-20 border border-white/10 hover:border-white/20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white/80 hover:text-white transition-all z-20 border border-white/10 hover:border-white/20"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
        {safeSlides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="relative h-2.5 rounded-full transition-all duration-500"
            style={{
              width: i === index ? 32 : 10,
              backgroundColor: i === index ? slide.accent : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1A1D20] to-transparent z-10 pointer-events-none" />
    </div>
  );
}

function getCtaIcon(profileType: string) {
  const normalized = profileType.trim().toLowerCase();
  if (normalized === 'business') return Briefcase;
  if (normalized === 'agency') return Users;
  return Mic;
}
