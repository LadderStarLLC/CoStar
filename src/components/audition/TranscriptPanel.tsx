'use client';

import { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '@/lib/audition/types';

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
}

export function TranscriptPanel({ entries }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic">
        Transcript will appear here...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <span
            className={`shrink-0 mt-1 px-1.5 py-0.5 rounded text-xs font-semibold h-fit ${
              entry.role === 'ai'
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/20'
                : 'bg-slate-700/50 text-slate-400 border border-slate-600/20'
            }`}
          >
            {entry.role === 'ai' ? 'AI' : 'You'}
          </span>
          <p
            className={`text-sm leading-relaxed rounded-xl px-3 py-2 max-w-[80%] ${
              entry.role === 'ai'
                ? 'bg-slate-700/60 text-slate-200'
                : 'bg-slate-800/80 text-slate-300'
            } ${!entry.isFinal ? 'opacity-70 italic' : ''}`}
          >
            {entry.text}
          </p>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
