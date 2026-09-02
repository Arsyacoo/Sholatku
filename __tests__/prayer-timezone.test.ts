import { describe, expect, it } from 'vitest';
import type { DailyPrayerSchedule, PrayerReminderSettings, UserLocation } from '@/types';
import { calculateNextPrayer } from '@/lib/prayer/next-prayer';
import { buildPrayerReminderEvents } from '@/lib/prayer/reminders/schedule';
import { buildRamadanTimingFromTimes } from '@/lib/ramadan/timing';
import { generatePrayerCalendarIcs } from '@/lib/prayer/reminders/ics';
import { formatDateInTimeZone, formatTimeInTimeZone, getTimeZoneLabel, zonedTimeToUtc } from '@/lib/time/timezone';

const reminders: PrayerReminderSettings = {
  fajr: { enabled: true, offsetMinutes: 0 },
  dhuhr: { enabled: false, offsetMinutes: 0 },
  asr: { enabled: false, offsetMinutes: 0 },
  maghrib: { enabled: false, offsetMinutes: 0 },
  isha: { enabled: false, offsetMinutes: 0 },
};

function schedule(timezone: string): DailyPrayerSchedule {
  return {
    date: '2026-09-02',
    readableDate: 'Rabu, 2 September 2026',
    hijriDate: { day: '20', month: { en: 'Safar', ar: 'صفر' }, year: '1448', formatted: '20 Safar 1448 H' },
    timezone,
    offset: 0,
    timings: { fajr: '04:30', sunrise: '05:45', dhuhr: '12:00', asr: '15:20', maghrib: '18:00', isha: '19:15' },
    source: 'api',
  };
}

describe('timezone-aware prayer instants', () => {
  it.each([
    ['Asia/Jakarta', 'WIB', '05:00'],
    ['Asia/Makassar', 'WITA', '04:00'],
    ['Asia/Jayapura', 'WIT', '03:00'],
    ['Asia/Tokyo', 'Asia/Tokyo', '03:00'],
  ])('converts %s wall clock through its own timezone', (timezone, label, expectedUtcHour) => {
    const instant = zonedTimeToUtc('2026-09-02', '12:00', timezone);
    expect(instant.toISOString()).toBe(`2026-09-02T${expectedUtcHour}:00.000Z`);
    expect(formatDateInTimeZone(instant, timezone)).toBe('2026-09-02');
    expect(formatTimeInTimeZone(instant, timezone)).toBe('12:00');
    expect(getTimeZoneLabel(timezone)).toBe(label);
  });

  it('keeps Makassar schedule correct when device/browser is Jakarta', () => {
    const result = calculateNextPrayer(schedule('Asia/Makassar'), new Date('2026-09-01T20:00:00.000Z'));
    expect(result.nextPrayer.id).toBe('fajr');
    expect(result.remainingSeconds).toBe(30 * 60);
  });

  it('rolls after Isha to tomorrow Fajr in the schedule timezone', () => {
    const result = calculateNextPrayer(schedule('Asia/Makassar'), new Date('2026-09-02T12:00:00.000Z'));
    expect(result.isTomorrowFajr).toBe(true);
    expect(result.nextPrayer.timestamp).toBe(zonedTimeToUtc('2026-09-03', '04:30', 'Asia/Makassar').getTime());
  });

  it('uses schedule timezone for reminders, Ramadan, and ICS', () => {
    const makassar = schedule('Asia/Makassar');
    const events = buildPrayerReminderEvents(makassar, reminders, new Date('2026-09-01T18:00:00.000Z'));
    expect(events[0]?.prayerAt).toEqual(zonedTimeToUtc('2026-09-02', '04:30', 'Asia/Makassar'));

    const timing = buildRamadanTimingFromTimes('2026-09-02', '04:30', '18:00', 10, 'Asia/Makassar');
    expect(formatTimeInTimeZone(timing.imsakAt, timing.timezone)).toBe('04:20');

    const location: UserLocation = {
      city: 'Denpasar', country: 'Indonesia', latitude: -8.65, longitude: 115.22,
      timezone: 'Asia/Makassar', isAutoDetected: false, displayName: 'Denpasar, Bali',
    };
    const monthly = [{ date: makassar.date, timezone: makassar.timezone, dayNumber: 2, dayName: 'Rabu', hijriFormatted: '', isToday: true, timings: makassar.timings }];
    const ics = generatePrayerCalendarIcs(monthly, location, reminders);
    expect(ics).toContain('DTSTART;TZID=Asia/Makassar:20260902T043000');
  });
});
