import { describe, expect, it } from 'vitest';
import type { RamadanModePreference } from '@/types';
import {
  getHijriDate,
  getRamadanDateRange,
  getRamadanStatus,
} from '@/lib/ramadan/calendar';
import {
  buildRamadanTimingFromTimes,
} from '@/lib/ramadan/timing';
import { getRamadanContext } from '@/lib/ramadan/context';

const automatic: RamadanModePreference = {
  mode: 'automatic',
  imsakOffsetMinutes: 10,
  showHomeCard: true,
};

function localDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

describe('Ramadan calendar domain', () => {
  it('detects calculated Ramadan and supports a 29- or 30-day month', () => {
    const range = getRamadanDateRange(1448, 'Asia/Jakarta');
    expect(range.days === 29 || range.days === 30).toBe(true);
    expect(range.dates).toHaveLength(range.days);

    const [year, month, day] = range.startDate.split('-').map(Number);
    const status = getRamadanStatus(new Date(Date.UTC(year, month - 1, day, 12)), automatic, 'Asia/Jakarta');
    expect(status.isRamadan).toBe(true);
    expect(status.ramadanDay).toBe(1);
    expect(status.hijriMonth).toBe(9);
  });

  it('detects a non-Ramadan month and honors manual overrides', () => {
    const date = new Date('2026-01-01T12:00:00Z');
    const automaticStatus = getRamadanStatus(date, automatic, 'Asia/Jakarta');
    expect(automaticStatus.isRamadan).toBe(false);

    expect(getRamadanStatus(date, { ...automatic, mode: 'enabled' }, 'Asia/Jakarta')).toMatchObject({
      isRamadan: true,
      source: 'manual',
    });
    expect(getRamadanStatus(date, { ...automatic, mode: 'disabled' }, 'Asia/Jakarta')).toMatchObject({
      isRamadan: false,
      source: 'manual',
    });
  });

  it('returns a numeric Hijri date from the runtime calendar', () => {
    const result = getHijriDate(new Date('2026-03-01T12:00:00Z'), 'Asia/Jakarta');
    expect(result.year).toBeGreaterThan(1400);
    expect(result.month).toBeGreaterThanOrEqual(1);
    expect(result.month).toBeLessThanOrEqual(12);
  });
});

describe('Ramadan timing and context', () => {
  const timing = buildRamadanTimingFromTimes('2026-03-01', '04:31', '17:54', 10);
  const nextTiming = buildRamadanTimingFromTimes('2026-03-02', '04:30', '17:55', 10);

  it('derives Imsak from Fajr and safely crosses a date boundary', () => {
    expect(timing.imsakAt.getHours()).toBe(4);
    expect(timing.imsakAt.getMinutes()).toBe(21);
    const early = buildRamadanTimingFromTimes('2026-03-01', '00:05', '17:50', 10);
    expect(early.imsakAt.getDate()).toBe(28);
    expect(early.imsakAt.getHours()).toBe(23);
    expect(early.imsakAt.getMinutes()).toBe(55);
  });

  it('selects positive countdown targets through the day', () => {
    expect(getRamadanContext({ now: localDate('2026-03-01', '03:30'), timing }).target).toBe('imsak');
    expect(getRamadanContext({ now: localDate('2026-03-01', '04:25'), timing }).target).toBe('fajr');
    expect(getRamadanContext({ now: localDate('2026-03-01', '12:00'), timing }).target).toBe('maghrib');
    expect(getRamadanContext({ now: localDate('2026-03-01', '17:55'), timing, nextDayTiming: nextTiming })).toMatchObject({
      state: 'POST_MAGHRIB',
      target: 'next-imsak',
      remainingSeconds: expect.any(Number),
    });
    expect(getRamadanContext({ now: localDate('2026-03-01', '23:59'), timing, nextDayTiming: nextTiming }).remainingSeconds).toBeGreaterThan(0);
  });
});
