'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "AI Interview Practice",
    description: "Rehearse with Gemini Live API and get real-time voice feedback on your performance.",
    color: "from-[#5DC99B]/20 to-[#E5B536]/20",
    icon: "🎙️"
  },
  {
    id: 2,
    title: "Curated Job Board",
    description: "Skip the noise with hand-picked roles from top companies across the globe.",
    color: "from-[#E5B536]/20 to-[#5DC99B]/20",
    icon: "💼"
  },
  {
    id: 3,
    title: "Professional Profiles",
    description: "Control your narrative with a public-facing profile that showcases your real skills.",
    color: "from-[#262A2E] to-[#1A1D20]",
    icon: "👤"
  }
];

export default function ImageMarquee() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setIndex((prev) => (prev + 1) % slides.length);
  const prev = () => setIndex((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-2xl border border-white/10 bg-[#262A2E]/50 h-[450px] md:h-[400px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br ${slides[index].color}`}
        >
          <div className="text-6xl mb-6">{slides[index].icon}</div>
          <h3 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
            {slides[index].title}
          </h3>
          <p className="max-w-md text-lg text-[#F4F5F7]/80 leading-relaxed">
            {slides[index].description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button 
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition z-10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button 
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition z-10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === index ? 'bg-[#5DC99B] w-8' : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
