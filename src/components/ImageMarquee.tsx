'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "AI Interview Practice",
    description: "Rehearse with Gemini Live API and get real-time voice feedback on your performance.",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2000&auto=format&fit=crop",
    accent: "#5DC99B",
  },
  {
    id: 2,
    title: "Curated Job Board",
    description: "Skip the noise with hand-picked roles from top companies across the globe.",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2000&auto=format&fit=crop",
    accent: "#E5B536",
  },
  {
    id: 3,
    title: "Professional Profiles",
    description: "Control your narrative with a public-facing profile that showcases your real skills.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop",
    accent: "#60A5FA",
  },
];

export default function ImageMarquee() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goTo = useCallback((i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  }, [index]);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[index];

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -80 : 80 }),
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#0D0F11] min-h-[480px] md:min-h-[540px]">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            sizes="100vw"
            priority={index === 0}
            className="object-cover"
          />

          {/* Layered overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0F11]/95 via-[#0D0F11]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F11] via-[#0D0F11]/30 to-transparent" />
          <div
            className="absolute inset-0 mix-blend-soft-light opacity-20"
            style={{ background: `radial-gradient(ellipse at 30% 50%, ${slide.accent}40, transparent 70%)` }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center h-full max-w-7xl mx-auto px-6 md:px-12 py-16">
            <div className="max-w-2xl">
              <div
                className="inline-block h-1 w-12 rounded-full mb-8"
                style={{ backgroundColor: slide.accent }}
              />
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-5 text-[#F4F5F7] drop-shadow-lg leading-[1.1]">
                {slide.title}
              </h2>
              <p className="text-lg md:text-xl text-[#F4F5F7]/75 leading-relaxed max-w-lg font-medium">
                {slide.description}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
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

      {/* Dot Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
        {slides.map((s, i) => (
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

      {/* Bottom fade into page */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1A1D20] to-transparent z-10 pointer-events-none" />
    </div>
  );
}
