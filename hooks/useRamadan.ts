'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DailyPrayerSchedule, RamadanContext, RamadanPreferences, RamadanStatus, RamadanTiming, UserLocation, UserSettings } from '@/types';
import { getDailyPrayerTimes } from '@/lib/prayer/api';
import { getRamadanContext } from '@/lib/ramadan/context';
import { getRamadanStatus } from '@/lib/ramadan/calendar';
import { buildRamadanTiming, normalizeScheduleDate } from '@/lib/ramadan/timing';

function addDays(date: string, amount: number): Date {
  const [year, month, day] = normalizeScheduleDate(date).split('-').map(Number);
  return new Date(year, month - 1, day + amount, 12, 0, 0, 0);
}

function preferenceKey(preferences: RamadanPreferences): string {
  return JSON.stringify(preferences);
}

export interface RamadanExperience {
  status: RamadanStatus | null;
  timing: RamadanTiming | null;
  nextDayTiming: RamadanTiming | null;
  context: RamadanContext | null;
  isLoadingNextDay: boolean;
}

/** Provides one live Ramadan context for the home card and reuses prayer API/offline fallback. */
export function useRamadan(
  schedule: DailyPrayerSchedule | null,
  location: UserLocation,
  settings: UserSettings,
  preferences: RamadanPreferences
): RamadanExperience {
  const [now, setNow] = useState(() => new Date());
  const [nextDaySchedule, setNextDaySchedule] = useState<DailyPrayerSchedule | null>(null);
  const [isLoadingNextDay, setIsLoadingNextDay] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 15000);
    const refresh = () => {
      if (document.visibilityState === 'visible') setNow(new Date());
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const status = useMemo(
    () => getRamadanStatus(now, preferences, location.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone),
    [now, location.timezone, preferenceKey(preferences)]
  );

  const timing = useMemo(
    () => (schedule ? buildRamadanTiming(schedule, preferences.imsakOffsetMinutes) : null),
    [schedule, preferences.imsakOffsetMinutes]
  );

  useEffect(() => {
    if (!timing || !status.isRamadan || !preferences.showHomeCard) {
      setNextDaySchedule(null);
      setIsLoadingNextDay(false);
      return;
    }

    let active = true;
    setIsLoadingNextDay(true);
    getDailyPrayerTimes(location, settings, addDays(timing.date, 1))
      .then((next) => {
        if (active) setNextDaySchedule(next);
      })
      .catch(() => {
        if (active) setNextDaySchedule(null);
      })
      .finally(() => {
        if (active) setIsLoadingNextDay(false);
      });
    return () => {
      active = false;
    };
  }, [timing?.date, status.isRamadan, preferences.showHomeCard, location.latitude, location.longitude, location.timezone, settings.method, settings.madhab, JSON.stringify(settings.adjustments)]);

  const nextDayTiming = useMemo(
    () => (nextDaySchedule ? buildRamadanTiming(nextDaySchedule, preferences.imsakOffsetMinutes) : null),
    [nextDaySchedule, preferences.imsakOffsetMinutes]
  );

  const context = useMemo(
    () => (timing && status.isRamadan ? getRamadanContext({ now, timing, nextDayTiming }) : null),
    [now, timing, nextDayTiming, status.isRamadan]
  );

  return {
    status: status.isRamadan && preferences.showHomeCard ? status : null,
    timing: status.isRamadan && preferences.showHomeCard ? timing : null,
    nextDayTiming: status.isRamadan && preferences.showHomeCard ? nextDayTiming : null,
    context,
    isLoadingNextDay,
  };
}
