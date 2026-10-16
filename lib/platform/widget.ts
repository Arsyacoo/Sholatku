import { registerPlugin } from '@capacitor/core';

import type { MonthlyPrayerItem, RamadanPreferences, UserLocation, UserSettings } from '@/types';
import { getMonthlyPrayerTimes } from '@/lib/prayer/api';
import { addDaysToCanonicalDate } from '@/lib/prayer/date';
import { parsePrayerDateTime } from '@/lib/prayer/reminders/schedule';
import { formatHijriDate } from '@/lib/ramadan/calendar';
import { formatDateInTimeZone, normalizeTimeZone, zonedTimeToUtc } from '@/lib/time/timezone';

import { isNativeRuntime } from './runtime';

/** Days pushed to the Android widget; it shows a "open the app" message once they run out. */
export const PRAYER_WIDGET_DAYS = 7;

const WIDGET_PRAYERS = [
  ['fajr', 'Subuh'],
  ['dhuhr', 'Dzuhur'],
  ['asr', 'Ashar'],
  ['maghrib', 'Maghrib'],
  ['isha', 'Isya'],
] as const;

export interface PrayerWidgetPayload {
  version: 1;
  city: string;
  days: Array<{
    date: string;
    hijri: string;
    prayers: Array<{ name: string; time: string; at: number }>;
  }>;
}

interface PrayerWidgetPlugin {
  updateSchedule(payload: PrayerWidgetPayload): Promise<void>;
}

const widgetPlugin = registerPlugin<PrayerWidgetPlugin>('SholatkuWidget');

/** Resolves every prayer to an absolute instant so the native widget never recalculates times. */
export function buildPrayerWidgetPayload(
  location: UserLocation,
  items: MonthlyPrayerItem[],
  hijriAdjustment: number,
  now: Date
): PrayerWidgetPayload {
  const timeZone = normalizeTimeZone(location.timezone);
  const today = formatDateInTimeZone(now, timeZone);
  const wanted = new Set(
    Array.from({ length: PRAYER_WIDGET_DAYS }, (_, index) => addDaysToCanonicalDate(today, index))
  );

  const days = items
    .filter((item) => wanted.has(item.date))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      date: item.date,
      hijri: formatHijriDate(zonedTimeToUtc(item.date, '12:00', timeZone), timeZone, hijriAdjustment),
      prayers: WIDGET_PRAYERS.map(([key, name]) => ({
        name,
        time: item.timings[key],
        at: parsePrayerDateTime(item.date, item.timings[key], timeZone).getTime(),
      })),
    }));

  return { version: 1, city: location.city, days };
}

let lastSyncKey: string | null = null;

/** Pushes the next week of prayer times to the Android home-screen widgets. */
export async function syncPrayerWidget(
  snapshot: { location: UserLocation; settings: UserSettings; ramadanPreferences: RamadanPreferences },
  now = new Date()
): Promise<void> {
  if (!isNativeRuntime()) return;

  const { location, settings, ramadanPreferences } = snapshot;
  const hijriAdjustment = ramadanPreferences.hijriAdjustment ?? 0;
  const timeZone = normalizeTimeZone(location.timezone);
  const today = formatDateInTimeZone(now, timeZone);

  // The bridge syncs on every focus; only refetch when the day or a schedule input changed.
  const syncKey = JSON.stringify([
    today, location.city, location.latitude, location.longitude, timeZone,
    settings.method, settings.madhab, settings.adjustments, hijriAdjustment,
  ]);
  if (syncKey === lastSyncKey) return;

  const lastDay = addDaysToCanonicalDate(today, PRAYER_WIDGET_DAYS - 1);
  const months = [...new Set([today.slice(0, 7), lastDay.slice(0, 7)])];
  const monthItems = await Promise.all(
    months.map((month) => getMonthlyPrayerTimes(location, settings, Number(month.slice(0, 4)), Number(month.slice(5, 7))))
  );

  await widgetPlugin.updateSchedule(buildPrayerWidgetPayload(location, monthItems.flat(), hijriAdjustment, now));
  lastSyncKey = syncKey;
}
