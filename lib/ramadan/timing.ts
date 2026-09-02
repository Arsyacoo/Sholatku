import type { RamadanTiming } from '@/types';

export type RamadanTimingSource = {
  date: string;
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
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return value;
  if (parts[0] > 1900) {
    return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
  }
  return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
}

export function parseLocalDateTime(date: string, time: string): Date {
  const normalizedDate = normalizeScheduleDate(date);
  const [year, month, day] = normalizedDate.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(
    Number.isFinite(year) ? year : new Date().getFullYear(),
    Number.isFinite(month) ? month - 1 : 0,
    Number.isFinite(day) ? day : 1,
    Number.isFinite(hours) ? hours : 0,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0
  );
}

export function buildRamadanTiming(
  schedule: RamadanTimingSource,
  imsakOffsetMinutes: number = DEFAULT_IMSAK_OFFSET_MINUTES
): RamadanTiming {
  const offset = normalizeImsakOffset(imsakOffsetMinutes);
  const normalizedDate = normalizeScheduleDate(schedule.date);
  const fajrAt = parseLocalDateTime(normalizedDate, schedule.timings.fajr);
  const maghribAt = parseLocalDateTime(normalizedDate, schedule.timings.maghrib);
  const imsakAt = new Date(fajrAt.getTime() - offset * 60 * 1000);

  return {
    date: normalizedDate,
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
  imsakOffsetMinutes: number = DEFAULT_IMSAK_OFFSET_MINUTES
): RamadanTiming {
  return buildRamadanTiming({ date, timings: { fajr, maghrib } }, imsakOffsetMinutes);
}
