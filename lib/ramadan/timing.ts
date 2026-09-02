import type { RamadanTiming } from '@/types';
import { parseProviderGregorianDate } from '@/lib/prayer/date';
import { normalizeTimeZone, zonedTimeToUtc } from '@/lib/time/timezone';

export type RamadanTimingSource = {
  date: string;
  timezone?: string;
  timings: {
    fajr: string;
    maghrib: string;
  };
};

export const DEFAULT_IMSAK_OFFSET_MINUTES = 10 as const;
export const IMSAK_OFFSET_OPTIONS = [5, 10, 15, 20] as const;

export function normalizeImsakOffset(value: unknown): 5 | 10 | 15 | 20 {
  return IMSAK_OFFSET_OPTIONS.includes(value as 5 | 10 | 15 | 20)
    ? (value as 5 | 10 | 15 | 20)
    : DEFAULT_IMSAK_OFFSET_MINUTES;
}

export function normalizeScheduleDate(value: string): string {
  return parseProviderGregorianDate(value) ?? value;
}

export function parseLocalDateTime(date: string, time: string, timeZone = 'Asia/Jakarta'): Date {
  const normalizedDate = normalizeScheduleDate(date);
  return zonedTimeToUtc(normalizedDate, time, normalizeTimeZone(timeZone));
}

export function buildRamadanTiming(
  schedule: RamadanTimingSource,
  imsakOffsetMinutes: number = DEFAULT_IMSAK_OFFSET_MINUTES
): RamadanTiming {
  const offset = normalizeImsakOffset(imsakOffsetMinutes);
  const normalizedDate = normalizeScheduleDate(schedule.date);
  const timezone = normalizeTimeZone(schedule.timezone);
  const fajrAt = parseLocalDateTime(normalizedDate, schedule.timings.fajr, timezone);
  const maghribAt = parseLocalDateTime(normalizedDate, schedule.timings.maghrib, timezone);
  const imsakAt = new Date(fajrAt.getTime() - offset * 60 * 1000);

  return {
    date: normalizedDate,
    timezone,
    imsakAt,
    fajrAt,
    maghribAt,
    imsakOffsetMinutes: offset,
  };
}

export function buildRamadanTimingFromTimes(
  date: string,
  fajr: string,
  maghrib: string,
  imsakOffsetMinutes: number = DEFAULT_IMSAK_OFFSET_MINUTES,
  timezone = 'Asia/Jakarta'
): RamadanTiming {
  return buildRamadanTiming({ date, timezone, timings: { fajr, maghrib } }, imsakOffsetMinutes);
}
