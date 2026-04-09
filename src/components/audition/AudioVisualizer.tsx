'use client';

import { useEffect, useRef } from 'react';
import type { AIStatus } from '@/lib/audition/types';

interface AudioVisualizerProps {
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  aiStatus: AIStatus;
}

const BAR_COUNT = 32;

export function AudioVisualizer({ analyserRef, aiStatus }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const analyser = analyserRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (!analyser || aiStatus !== 'speaking') {
        // Idle pulse: gentle breathing circle
        const now = Date.now() / 1000;
        const pulse = 0.5 + 0.5 * Math.sin(now * 1.5);
        const radius = 28 + pulse * 8;
        const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, radius + 20);
        gradient.addColorStop(0, `rgba(139, 92, 246, ${0.3 + pulse * 0.2})`);
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        return;
      }

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      const barWidth = w / BAR_COUNT;
      const step = Math.floor(dataArray.length / BAR_COUNT);

      for (let i = 0; i < BAR_COUNT; i++) {
        const value = dataArray[i * step] / 255;
        const barH = Math.max(4, value * h * 0.85);
        const x = i * barWidth;
        const y = (h - barH) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
        gradient.addColorStop(0, 'rgba(167, 139, 250, 0.9)');
        gradient.addColorStop(1, 'rgba(109, 40, 217, 0.6)');

        ctx.beginPath();
        ctx.roundRect(x + 1, y, barWidth - 2, barH, 3);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyserRef, aiStatus]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={100}
      className="w-60 h-25"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
