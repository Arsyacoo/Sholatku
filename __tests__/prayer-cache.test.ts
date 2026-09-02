import { beforeEach, describe, expect, it } from 'vitest';
import type { DailyPrayerSchedule, UserLocation, UserSettings } from '@/types';
import {
  buildPrayerScheduleCacheContext,
  getCachedSchedule,
  saveCachedSchedule,
} from '@/lib/storage/preferences';

const location: UserLocation = {
  city: 'Jakarta', country: 'Indonesia', latitude: -6.1754, longitude: 106.8272,
  timezone: 'Asia/Jakarta', isAutoDetected: false, displayName: 'Jakarta',
};
const settings: UserSettings = {
  method: '20', madhab: 'shafii',
  adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  timeFormat24h: true, theme: 'system', enableNotifications: false, notifyBeforeMinutes: 0, adhanSound: 'beep',
};
const schedule: DailyPrayerSchedule = {
  date: '2026-09-02', readableDate: 'Rabu, 2 September 2026', timezone: 'Asia/Jakarta', offset: 7,
  hijriDate: { day: '20', month: { en: 'Safar', ar: 'صفر' }, year: '1448', formatted: '20 Safar 1448 H' },
  timings: { fajr: '04:30', sunrise: '05:45', dhuhr: '12:00', asr: '15:20', maghrib: '18:00', isha: '19:15' },
  source: 'api',
};

const storage: Record<string, string> = {};
beforeEach(() => {
  for (const key of Object.keys(storage)) delete storage[key];
  (globalThis as any).window = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
  };
});

describe('scoped prayer cache', () => {
  it('hits only for the same date, location, timezone, and settings', () => {
    const context = buildPrayerScheduleCacheContext(schedule.date, location, settings);
    saveCachedSchedule(schedule, context);
    expect(getCachedSchedule(context)?.date).toBe('2026-09-02');
    expect(getCachedSchedule(buildPrayerScheduleCacheContext('2026-09-03', location, settings))).toBeNull();
    expect(getCachedSchedule(buildPrayerScheduleCacheContext(schedule.date, { ...location, longitude: 115.22 }, settings))).toBeNull();
    expect(getCachedSchedule(buildPrayerScheduleCacheContext(schedule.date, { ...location, timezone: 'Asia/Makassar' }, settings))).toBeNull();
    expect(getCachedSchedule(buildPrayerScheduleCacheContext(schedule.date, location, { ...settings, method: '3' }))).toBeNull();
    expect(getCachedSchedule(buildPrayerScheduleCacheContext(schedule.date, location, { ...settings, madhab: 'hanafi' }))).toBeNull();
    expect(getCachedSchedule(buildPrayerScheduleCacheContext(schedule.date, location, { ...settings, adjustments: { ...settings.adjustments, fajr: 1 } }))).toBeNull();
  });

  it('ignores corrupt and legacy unscoped records safely', () => {
    const context = buildPrayerScheduleCacheContext(schedule.date, location, settings);
    storage.sholatku_cached_schedule_v2 = '{broken';
    expect(getCachedSchedule(context)).toBeNull();
    storage.sholatku_cached_schedule_v1 = JSON.stringify(schedule);
    delete storage.sholatku_cached_schedule_v2;
    expect(getCachedSchedule(context)).toBeNull();
  });
});
