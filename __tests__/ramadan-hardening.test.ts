import { beforeEach, describe, expect, it } from 'vitest';
import type { MonthlyPrayerItem, PrayerReminderSettings, RamadanDateRange, RamadanPreferences, UserLocation, UserSettings } from '@/types';
import { buildRamadanImsakiyah } from '@/lib/ramadan/imsakiyah';
import { buildRamadanReminderEvents } from '@/lib/prayer/reminders/schedule';
import { generateRamadanCalendarIcs, getRamadanCalendarFilename } from '@/lib/prayer/reminders/ics';
import { calculateNextPrayer } from '@/lib/prayer/next-prayer';
import { calculateOfflinePrayers } from '@/lib/prayer/calculation';
import {
  getDefaultRamadanPreferences,
  getRamadanPreferences,
  saveRamadanPreferences,
} from '@/lib/storage/preferences';
import { buildRamadanTimingFromTimes } from '@/lib/ramadan/timing';

const location: UserLocation = {
  city: 'Jakarta',
  country: 'Indonesia',
  latitude: -6.1754,
  longitude: 106.8272,
  timezone: 'Asia/Jakarta',
  isAutoDetected: false,
  displayName: 'Jakarta, Indonesia',
};

const settings: UserSettings = {
  method: '20',
  madhab: 'shafii',
  adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  timeFormat24h: true,
  theme: 'system',
  enableNotifications: false,
  notifyBeforeMinutes: 0,
  adhanSound: 'beep',
};

const reminders: PrayerReminderSettings = {
  fajr: { enabled: true, offsetMinutes: 0 },
  dhuhr: { enabled: false, offsetMinutes: 0 },
  asr: { enabled: false, offsetMinutes: 0 },
  maghrib: { enabled: true, offsetMinutes: 5 },
  isha: { enabled: false, offsetMinutes: 0 },
};

const item = (date: string, fajr: string, maghrib: string): MonthlyPrayerItem => ({
  date,
  timezone: 'Asia/Jakarta',
  dayNumber: 1,
  dayName: 'Hari',
  hijriFormatted: '1 Ramadan 1448 H',
  isToday: false,
  timings: { fajr, sunrise: '05:40', dhuhr: '12:00', asr: '15:20', maghrib, isha: '19:00' },
});

beforeEach(() => {
  const storage: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => { storage[key] = value; },
  };
  (globalThis as any).window = {};
});

describe('Ramadan preferences and schedule hardening', () => {
  it('persists preferences and recovers invalid values', () => {
    const preferences: RamadanPreferences = {
      mode: 'enabled',
      imsakOffsetMinutes: 15,
      showHomeCard: false,
      reminders: { imsak: { enabled: true, offsetMinutes: 0 }, maghrib: { enabled: true, offsetMinutes: 5 } },
    };
    saveRamadanPreferences(preferences);
    expect(getRamadanPreferences()).toEqual(preferences);

    localStorage.setItem('sholatku_ramadan_preferences_v1', '{broken');
    expect(getRamadanPreferences()).toEqual(getDefaultRamadanPreferences());
  });

  it('merges Ramadan dates across Gregorian months and marks today', async () => {
    const range: RamadanDateRange = {
      hijriYear: 1448,
      startDate: '2026-01-31',
      endDate: '2026-02-01',
      days: 2,
      dates: ['2026-01-31', '2026-02-01'],
    };
    const calls: string[] = [];
    const rows = await buildRamadanImsakiyah(
      range,
      location,
      settings,
      10,
      new Date('2026-02-01T12:00:00'),
      async (_location, _settings, year, month) => {
        calls.push(`${year}-${month}`);
        return month === 1 ? [item('31-01-2026', '04:31', '17:55')] : [item('2026-02-01', '04:30', '17:56')];
      }
    );
    expect(calls.sort()).toEqual(['2026-1', '2026-2']);
    expect(rows).toHaveLength(2);
    expect(rows[0].ramadanDay).toBe(1);
    expect(rows[1].isToday).toBe(true);
    expect(rows[0].timing.imsakAt.getMinutes()).toBe(21);
  });

  it('supports both 29-day and 30-day range shapes without a phantom day', () => {
    const twentyNine: RamadanDateRange = { hijriYear: 1447, startDate: '2026-02-18', endDate: '2026-03-18', days: 29, dates: Array.from({ length: 29 }, (_, i) => `2026-02-${String(18 + i).padStart(2, '0')}`) };
    const thirty: RamadanDateRange = { hijriYear: 1448, startDate: '2027-02-08', endDate: '2027-03-09', days: 30, dates: Array.from({ length: 30 }, (_, i) => `2027-02-${String(8 + i).padStart(2, '0')}`) };
    expect(twentyNine.dates).toHaveLength(29);
    expect(thirty.dates).toHaveLength(30);
    expect(twentyNine.dates).not.toContain('2026-03-19');
    expect(thirty.dates).not.toContain('2027-03-10');
  });
});

describe('Ramadan reminders and calendar export', () => {
  it('creates optional Imsak and Maghrib events without changing canonical prayers', () => {
    const timing = buildRamadanTimingFromTimes('2026-03-01', '04:31', '17:54', 10);
    const events = buildRamadanReminderEvents(timing, {
      imsak: { enabled: true, offsetMinutes: 0 },
      maghrib: { enabled: true, offsetMinutes: 5 },
    });
    expect(events.map((event) => event.prayer)).toEqual(['imsak', 'maghrib']);
    expect(events[1].reminderAt.getTime()).toBe(timing.maghribAt.getTime() - 5 * 60000);

    const schedule = {
      date: '2026-03-01',
      readableDate: 'Minggu, 1 Maret 2026',
      hijriDate: { day: '12', month: { en: 'Syaban', ar: 'شعبان' }, year: '1447', formatted: '12 Syaban 1447 H' },
      timezone: 'Asia/Jakarta',
      offset: 7,
      timings: { fajr: '04:31', sunrise: '05:45', dhuhr: '12:00', asr: '15:20', maghrib: '17:54', isha: '19:00' },
      source: 'offline' as const,
    };
    const next = calculateNextPrayer(schedule, new Date('2026-03-01T17:00:00'));
    expect(next.nextPrayer.id).toBe('maghrib');
  });

  it('exports full Ramadan times with matching Imsak/Subuh/Maghrib and timezone', () => {
    const rows = [
      { ramadanDay: 1, date: '2026-03-01', isToday: false, timing: buildRamadanTimingFromTimes('2026-03-01', '04:31', '17:54', 10) },
      { ramadanDay: 2, date: '2026-03-02', isToday: true, timing: buildRamadanTimingFromTimes('2026-03-02', '04:30', '17:55', 10) },
    ];
    const ics = generateRamadanCalendarIcs(rows, location, reminders, { imsak: { enabled: true, offsetMinutes: 0 }, maghrib: { enabled: true, offsetMinutes: 5 } }, 1447);
    expect(getRamadanCalendarFilename(1447)).toBe('sholatku-ramadan-1447.ics');
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(6);
    expect(ics).toContain('X-WR-TIMEZONE:Asia/Jakarta');
    expect(ics).toContain('SUMMARY:Sholatku - Imsak');
    expect(ics).toContain('DTSTART;TZID=Asia/Jakarta:20260301T042100');
    expect(ics).toContain('DTSTART;TZID=Asia/Jakarta:20260301T043100');
    expect(ics).toContain('DTSTART;TZID=Asia/Jakarta:20260301T175400');
    expect(ics).toContain('TRIGGER:-PT5M');
  });

  it('keeps offline Fajr and Maghrib available for Ramadan timing', () => {
    const calculated = calculateOfflinePrayers(new Date('2026-03-01T12:00:00'), location.latitude, location.longitude, 7);
    expect(calculated.fajr).toMatch(/^\d{2}:\d{2}$/);
    expect(calculated.maghrib).toMatch(/^\d{2}:\d{2}$/);
    expect(buildRamadanTimingFromTimes('2026-03-01', calculated.fajr, calculated.maghrib, 10).imsakAt.getTime()).toBeLessThan(
      buildRamadanTimingFromTimes('2026-03-01', calculated.fajr, calculated.maghrib, 10).fajrAt.getTime()
    );
  });
});
