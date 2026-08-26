'use client';

import { useMemo, useState, useEffect } from 'react';
import { DailyPrayerSchedule, NextPrayerInfo } from '@/types';
import { calculateNextPrayer } from '@/lib/prayer/next-prayer';
import { useCountdown } from './useCountdown';

export function useNextPrayer(schedule: DailyPrayerSchedule | null): NextPrayerInfo | null {
  const [tick, setTick] = useState<number>(Date.now());

  // Force re-evaluating prayer state every 15 seconds or when schedule changes
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(Date.now());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const nextPrayerInfo = useMemo(() => {
    if (!schedule) return null;
    return calculateNextPrayer(schedule, new Date(tick));
  }, [schedule, tick]);

  // Live 1-second countdown using target timestamp
  const countdown = useCountdown(nextPrayerInfo?.nextPrayer.timestamp || null);

  if (!nextPrayerInfo) {
    return null;
  }

  return {
    ...nextPrayerInfo,
    remainingSeconds: countdown.remainingSeconds,
    formattedCountdown: countdown.formattedCountdown,
  };
}
