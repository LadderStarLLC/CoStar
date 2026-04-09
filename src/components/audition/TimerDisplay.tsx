'use client';

interface TimerDisplayProps {
  secondsRemaining: number;
  percentRemaining: number;
}

export function TimerDisplay({ secondsRemaining, percentRemaining }: TimerDisplayProps) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isWarning = secondsRemaining <= 60;
  const isDanger = secondsRemaining <= 30;

  const circumference = 2 * Math.PI * 20;
  const dashOffset = circumference * (1 - percentRemaining);

  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
        {/* Track */}
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgb(51 65 85)" strokeWidth="3" />
        {/* Progress ring */}
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke={isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#f59e0b'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <span
        className={`text-sm font-mono font-bold tabular-nums ${
          isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-200'
        }`}
      >
        {timeStr}
      </span>
    </div>
  );
}
