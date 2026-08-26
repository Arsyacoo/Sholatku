'use client';

import { useState, useEffect, useRef } from 'react';
import { formatCountdown } from '@/lib/prayer/next-prayer';

export function useCountdown(targetTimestamp: number | null) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [formattedCountdown, setFormattedCountdown] = useState<string>('00:00:00');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const calculate = () => {
    if (!targetTimestamp) {
      setRemainingSeconds(0);
      setFormattedCountdown('00:00:00');
      return;
    }

    const now = Date.now();
    const diff = Math.max(0, Math.floor((targetTimestamp - now) / 1000));
    setRemainingSeconds(diff);
    setFormattedCountdown(formatCountdown(diff));
  };

  useEffect(() => {
    calculate();

    if (!targetTimestamp) return;

    timerRef.current = setInterval(() => {
      calculate();
    }, 1000);

    // Sync on tab focus / visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        calculate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [targetTimestamp]);

  return {
    remainingSeconds,
    formattedCountdown,
  };
}
