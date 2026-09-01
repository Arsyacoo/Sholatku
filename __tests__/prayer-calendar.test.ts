import { describe, expect, it } from 'vitest';
import type { MonthlyPrayerItem, PrayerReminderSettings, UserLocation } from '@/types';
import {
  generatePrayerCalendarIcs,
  getPrayerCalendarFilename,
} from '@/lib/prayer/reminders/ics';

const location: UserLocation = {
  city: 'Jakarta Utara',
  country: 'Indonesia',
  latitude: -6.1,
  longitude: 106.8,
  timezone: 'Asia/Jakarta',
  isAutoDetected: false,
  displayName: 'Jakarta; Utara, Test\\Name',
};

const reminders: PrayerReminderSettings = {
  fajr: { enabled: true, offsetMinutes: 10 },
  dhuhr: { enabled: true, offsetMinutes: 0 },
  asr: { enabled: true, offsetMinutes: 5 },
  maghrib: { enabled: true, offsetMinutes: 15 },
  isha: { enabled: false, offsetMinutes: 0 },
};

const month: MonthlyPrayerItem[] = [
  {
    date: '2026-09-01',
    dayNumber: 1,
    dayName: 'Selasa',
    hijriFormatted: '18 Rabiul Awwal 1448 H',
    isToday: true,
    timings: {
      fajr: '04:35',
      sunrise: '05:50',
      dhuhr: '12:00',
      asr: '15:20',
      maghrib: '17:55',
      isha: '19:05',
    },
  },
  {
    date: '2026-09-02',
    dayNumber: 2,
    dayName: 'Rabu',
    hijriFormatted: '19 Rabiul Awwal 1448 H',
    isToday: false,
    timings: {
      fajr: '04:34',
      sunrise: '05:49',
      dhuhr: '12:00',
      asr: '15:19',
      maghrib: '17:54',
      isha: '19:04',
    },
  },
];

describe('prayer calendar export', () => {
  it('generates CRLF iCalendar with five events per date and stable UIDs', () => {
    const ics = generatePrayerCalendarIcs(month, location, reminders, new Date('2026-08-31T00:00:00Z'));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(10);
    expect(ics).toContain('UID:2026-09-01-maghrib@sholatku');
    expect(ics).not.toContain('UID:2026-09-01-sunrise@sholatku');
    expect(ics).toContain('DTSTART;TZID=Asia/Jakarta:20260901T043500');
    expect(ics).toContain('DTEND;TZID=Asia/Jakarta:20260901T044500');
  });

  it('maps enabled reminder offsets to VALARM and omits disabled alarms', () => {
    const ics = generatePrayerCalendarIcs(month.slice(0, 1), location, reminders);
    expect(ics).toContain('TRIGGER:-PT10M');
    expect(ics).toContain('TRIGGER:PT0M');
    expect(ics).toContain('TRIGGER:-PT5M');
    expect(ics).toContain('TRIGGER:-PT15M');
    expect(ics).not.toContain('Pengingat Isya');
  });

  it('escapes special characters and keeps local floating times without invented timezone', () => {
    const floating = generatePrayerCalendarIcs(
      month.slice(0, 1),
      { ...location, timezone: undefined },
      reminders
    );
    expect(floating).toContain('LOCATION:Jakarta\\; Utara\\, Test\\\\Name');
    expect(floating).toContain('DTSTART:20260901T043500');
    expect(floating).not.toContain('TZID=');
  });

  it('uses a safe predictable filename', () => {
    expect(getPrayerCalendarFilename(2026, 9)).toBe('sholatku-jadwal-sholat-2026-09.ics');
  });
});
