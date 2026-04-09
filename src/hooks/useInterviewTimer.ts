'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useInterviewTimer(durationSeconds: number, onExpire: () => void) {
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!running) return;
    if (secondsRemaining <= 0) {
      onExpireRef.current();
      return;
    }
    const id = setInterval(() => {
      setSecondsRemaining((s) => s - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running, secondsRemaining]);

  const start = useCallback(() => {
    setSecondsRemaining(durationSeconds);
    setRunning(true);
  }, [durationSeconds]);

  const pause = useCallback(() => setRunning(false), []);

  const reset = useCallback(() => {
    setRunning(false);
    setSecondsRemaining(durationSeconds);
  }, [durationSeconds]);

  const percentRemaining = Math.max(0, secondsRemaining / durationSeconds);
  const isExpired = secondsRemaining <= 0;

  return { secondsRemaining, percentRemaining, isExpired, running, start, pause, reset };
}
