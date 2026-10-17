import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UserLocation, UserSettings } from '@/types';
import { getDailyPrayerTimes, getMonthlyPrayerTimes } from '@/lib/prayer/api';
import { applyTimeOffset } from '@/lib/prayer/normalize';
import { DEFAULT_SETTINGS } from '@/lib/prayer/constants';

const location: UserLocation = {
  city: 'Jakarta',
  country: 'Indonesia',
  latitude: -6.1754,
  longitude: 106.8272,
  timezone: 'Asia/Jakarta',
  isAutoDetected: false,
  displayName: 'Jakarta',
};

const adjusted: UserSettings = {
  ...DEFAULT_SETTINGS,
  adjustments: { fajr: 2, sunrise: 0, dhuhr: -1, asr: 0, maghrib: 3, isha: 0 },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('offline prayer schedules', () => {
  it('apply the user minute corrections like the API path does', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const date = new Date('2026-03-10T05:00:00Z');

    const plainDay = await getDailyPrayerTimes(location, DEFAULT_SETTINGS, date);
    const adjustedDay = await getDailyPrayerTimes(location, adjusted, date);
    expect(adjustedDay.source).toBe('offline');
    expect(adjustedDay.timings.fajr).toBe(applyTimeOffset(plainDay.timings.fajr, 2));
    expect(adjustedDay.timings.dhuhr).toBe(applyTimeOffset(plainDay.timings.dhuhr, -1));
    expect(adjustedDay.timings.maghrib).toBe(applyTimeOffset(plainDay.timings.maghrib, 3));

    const [plainMonthDay] = await getMonthlyPrayerTimes(location, DEFAULT_SETTINGS, 2026, 3);
    const [adjustedMonthDay] = await getMonthlyPrayerTimes(location, adjusted, 2026, 3);
    expect(adjustedMonthDay.timings.fajr).toBe(applyTimeOffset(plainMonthDay.timings.fajr, 2));
    expect(adjustedMonthDay.timings.maghrib).toBe(applyTimeOffset(plainMonthDay.timings.maghrib, 3));
  });
});
