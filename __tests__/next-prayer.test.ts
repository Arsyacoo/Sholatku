import { describe, it, expect } from 'vitest';
import { calculateNextPrayer, formatCountdown, parseTimeToDate } from '@/lib/prayer/next-prayer';
import { DailyPrayerSchedule } from '@/types';

const mockSchedule: DailyPrayerSchedule = {
  date: '2026-08-26',
  readableDate: 'Rabu, 26 Agustus 2026',
  hijriDate: {
    day: '12',
    month: { en: 'Safar', ar: 'صفر' },
    year: '1448',
    formatted: '12 Safar 1448 H',
  },
  timezone: 'Asia/Jakarta',
  offset: 7,
  timings: {
    fajr: '04:45',
    sunrise: '05:58',
    dhuhr: '12:02',
    asr: '15:22',
    maghrib: '18:01',
    isha: '19:11',
  },
  source: 'api',
};

describe('Prayer State and Countdown Calculation', () => {
  it('correctly calculates status before Fajr (e.g. 03:30 AM)', () => {
    const testDate = new Date(2026, 7, 26, 3, 30, 0); // 03:30
    const result = calculateNextPrayer(mockSchedule, testDate);

    expect(result.nextPrayer.id).toBe('fajr');
    expect(result.nextPrayer.time).toBe('04:45');
    expect(result.isTomorrowFajr).toBe(false);
    expect(result.remainingSeconds).toBe(75 * 60); // 1h 15m = 4500s
    expect(result.formattedCountdown).toBe('01:15:00');
  });

  it('correctly calculates status between Fajr and Sunrise (e.g. 05:15 AM)', () => {
    const testDate = new Date(2026, 7, 26, 5, 15, 0);
    const result = calculateNextPrayer(mockSchedule, testDate);

    expect(result.currentPrayer?.id).toBe('fajr');
    expect(result.nextPrayer.id).toBe('dhuhr');
    expect(result.isTomorrowFajr).toBe(false);
  });

  it('correctly calculates status between Sunrise and Dhuhr (e.g. 09:00 AM)', () => {
    const testDate = new Date(2026, 7, 26, 9, 0, 0);
    const result = calculateNextPrayer(mockSchedule, testDate);

    expect(result.currentPrayer).toBeNull();
    expect(result.nextPrayer.id).toBe('dhuhr');
    expect(result.nextPrayer.time).toBe('12:02');
  });

  it('correctly calculates status between Dhuhr and Asr (e.g. 13:30 PM)', () => {
    const testDate = new Date(2026, 7, 26, 13, 30, 0);
    const result = calculateNextPrayer(mockSchedule, testDate);

    expect(result.currentPrayer?.id).toBe('dhuhr');
    expect(result.nextPrayer.id).toBe('asr');
    expect(result.nextPrayer.time).toBe('15:22');
  });

  it('correctly calculates status between Asr and Maghrib (e.g. 16:30 PM)', () => {
    const testDate = new Date(2026, 7, 26, 16, 30, 0);
    const result = calculateNextPrayer(mockSchedule, testDate);

    expect(result.currentPrayer?.id).toBe('asr');
    expect(result.nextPrayer.id).toBe('maghrib');
    expect(result.nextPrayer.time).toBe('18:01');
  });

  it('correctly calculates status between Maghrib and Isha (e.g. 18:30 PM)', () => {
    const testDate = new Date(2026, 7, 26, 18, 30, 0);
    const result = calculateNextPrayer(mockSchedule, testDate);

    expect(result.currentPrayer?.id).toBe('maghrib');
    expect(result.nextPrayer.id).toBe('isha');
    expect(result.nextPrayer.time).toBe('19:11');
  });

  it('correctly handles midnight rollover after Isha (e.g. 21:30 PM)', () => {
    const testDate = new Date(2026, 7, 26, 21, 30, 0);
    const result = calculateNextPrayer(mockSchedule, testDate, '04:45');

    expect(result.currentPrayer?.id).toBe('isha');
    expect(result.nextPrayer.id).toBe('fajr');
    expect(result.isTomorrowFajr).toBe(true);
    expect(result.nextPrayer.time).toBe('04:45');
    // 21:30 to next day 04:45 = 2.5h + 4.75h = 7h 15m = 26100s
    expect(result.remainingSeconds).toBe(26100);
    expect(result.formattedCountdown).toBe('07:15:00');
  });

  it('formats countdown string correctly', () => {
    expect(formatCountdown(0)).toBe('00:00:00');
    expect(formatCountdown(45)).toBe('00:00:45');
    expect(formatCountdown(125)).toBe('00:02:05');
    expect(formatCountdown(3665)).toBe('01:01:05');
  });
});
