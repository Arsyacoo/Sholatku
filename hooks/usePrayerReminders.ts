'use client';

import { useEffect, useRef } from 'react';
import type { DailyPrayerSchedule, PrayerReminderSettings, RamadanPreferences, UserLocation, UserSettings } from '@/types';
import { getDailyPrayerTimes } from '@/lib/prayer/api';
import { parsePrayerDateTime, buildPrayerReminderEvents, buildRamadanReminderEvents } from '@/lib/prayer/reminders/schedule';
import { PrayerReminderScheduler } from '@/lib/prayer/reminders/scheduler';
import { getRamadanStatus } from '@/lib/ramadan/calendar';
import { buildRamadanTiming } from '@/lib/ramadan/timing';
import type { ReminderEvent } from '@/lib/prayer/reminders/types';

interface UsePrayerRemindersOptions {
  schedule: DailyPrayerSchedule | null;
  location: UserLocation;
  settings: UserSettings;
  reminderSettings: PrayerReminderSettings;
  ramadanPreferences?: RamadanPreferences;
}

export function usePrayerReminders({
  schedule,
  location,
  settings,
  reminderSettings,
  ramadanPreferences,
}: UsePrayerRemindersOptions): void {
  const schedulerRef = useRef<PrayerReminderScheduler | null>(null);
  const tomorrowCacheRef = useRef<{ key: string; schedule?: DailyPrayerSchedule } | null>(null);
  if (!schedulerRef.current) schedulerRef.current = new PrayerReminderScheduler();

  useEffect(() => {
    const scheduler = schedulerRef.current;
    if (!scheduler || !schedule) return;

    let cancelled = false;
    const now = new Date();
    const isAfterIsha = now.getTime() >= parsePrayerDateTime(schedule.date, schedule.timings.isha).getTime();
    const contextKey = [
      schedule.date,
      location.latitude,
      location.longitude,
      location.timezone,
      settings.method,
      settings.madhab,
      JSON.stringify(settings.adjustments),
    ].join('|');

    const start = async () => {
      let tomorrowSchedule: DailyPrayerSchedule | undefined;
      if (isAfterIsha) {
        if (tomorrowCacheRef.current?.key === contextKey) {
          tomorrowSchedule = tomorrowCacheRef.current.schedule;
        } else {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          try {
            tomorrowSchedule = await getDailyPrayerTimes(location, settings, tomorrow);
          } catch {
            tomorrowSchedule = undefined;
          } finally {
            tomorrowCacheRef.current = { key: contextKey, schedule: tomorrowSchedule };
          }
        }
      }
      if (cancelled) return;
      const events: ReminderEvent[] = buildPrayerReminderEvents(schedule, reminderSettings, new Date(), tomorrowSchedule);
      if (ramadanPreferences) {
        const ramadanStatus = getRamadanStatus(new Date(), ramadanPreferences, location.timezone);
        if (ramadanStatus.isRamadan) {
          events.push(
            ...buildRamadanReminderEvents(
              buildRamadanTiming(schedule, ramadanPreferences.imsakOffsetMinutes),
              ramadanPreferences.reminders
            )
          );
        }
      }
      scheduler.start(events);
    };

    start();

    const recalculate = () => scheduler.recalculate();
    document.addEventListener('visibilitychange', recalculate);
    window.addEventListener('focus', recalculate);

    return () => {
      cancelled = true;
      scheduler.stop();
      document.removeEventListener('visibilitychange', recalculate);
      window.removeEventListener('focus', recalculate);
    };
  }, [
    schedule,
    location.latitude,
    location.longitude,
    location.timezone,
    settings.method,
    settings.madhab,
    JSON.stringify(settings.adjustments),
    JSON.stringify(reminderSettings),
    JSON.stringify(ramadanPreferences),
  ]);
}
