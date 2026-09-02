import type { HijriDateParts, RamadanDateRange, RamadanModePreference, RamadanStatus } from '@/types';

const RAMADAN_MONTH = 9;
const DEFAULT_HIJRI_YEAR = 1448;

function parseNumericPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = parts.find((part) => part.type === type)?.value;
  const parsed = value ? Number.parseInt(value.replace(/[^0-9]/g, ''), 10) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTabularHijriDate(date: Date): HijriDateParts {
  // Civil Islamic calendar fallback for runtimes without the ICU Umm al-Qura calendar.
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const julianDay =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  const lunarDay = julianDay - 1948440 + 10632;
  const cycle = Math.floor((lunarDay - 1) / 10631);
  const remainder = lunarDay - 10631 * cycle + 354;
  const monthIndex =
    Math.floor((10985 - remainder) / 5316) * Math.floor((50 * remainder) / 17719) +
    Math.floor(remainder / 5670) * Math.floor((43 * remainder) / 15238);
  const dayOfMonth =
    remainder -
    Math.floor((30 - monthIndex) / 15) * Math.floor((17719 * monthIndex) / 50) -
    Math.floor(monthIndex / 16) * Math.floor((15238 * monthIndex) / 43) +
    29;
  const islamicMonth = Math.floor((24 * dayOfMonth + 6) / 709);
  const islamicDay = dayOfMonth - Math.floor((709 * islamicMonth) / 24);
  const islamicYear = 30 * cycle + monthIndex - 30;
  return { day: islamicDay, month: islamicMonth, year: islamicYear };
}

/**
 * Reads the device/runtime Hijri calendar without claiming an official local announcement.
 * The timezone is important: Ramadan day follows the user's local civil date.
 */
export function getHijriDate(date: Date, timeZone = 'UTC'): HijriDateParts {
  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      timeZone,
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const result = {
      day: parseNumericPart(parts, 'day'),
      month: parseNumericPart(parts, 'month'),
      year: parseNumericPart(parts, 'year'),
    };
    if (result.day > 0 && result.month > 0 && result.year > 0) return result;
  } catch {
    // Fall through to a deterministic civil Islamic calendar approximation.
  }
  return getTabularHijriDate(date);
}

function formatIsoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate()
  ).padStart(2, '0')}`;
}

function estimateGregorianYear(hijriYear: number): number {
  return Math.floor((hijriYear - 1) * 0.970224 + 622);
}

/** Finds all Gregorian dates belonging to a calculated Hijri Ramadan month. */
export function getRamadanDateRange(hijriYear: number, timeZone = 'UTC'): RamadanDateRange {
  const estimatedYear = estimateGregorianYear(hijriYear);
  // A Hijri year overlaps two Gregorian years. A deliberately wide window
  // keeps the lookup correct around Ramadan even when the year estimate lands
  // near the beginning of the Gregorian year.
  const start = new Date(Date.UTC(estimatedYear - 2, 0, 1, 12));
  const end = new Date(Date.UTC(estimatedYear + 3, 0, 1, 12));
  const dates: string[] = [];

  for (const cursor = new Date(start); cursor < end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const hijri = getHijriDate(cursor, timeZone);
    if (hijri.year === hijriYear && hijri.month === RAMADAN_MONTH) dates.push(formatIsoDate(cursor));
  }

  return {
    hijriYear,
    startDate: dates[0] ?? '',
    endDate: dates[dates.length - 1] ?? '',
    days: dates.length,
    dates,
  };
}

export function getRamadanStatus(
  date: Date,
  preference: RamadanModePreference,
  timeZone = 'UTC'
): RamadanStatus {
  const hijri = getHijriDate(date, timeZone);
  const calculatedRamadan = hijri.month === RAMADAN_MONTH;

  if (preference.mode === 'disabled') {
    return {
      isRamadan: false,
      ramadanDay: null,
      hijriYear: hijri.year || DEFAULT_HIJRI_YEAR,
      hijriMonth: hijri.month,
      source: 'manual',
    };
  }

  if (preference.mode === 'enabled') {
    return {
      isRamadan: true,
      ramadanDay: calculatedRamadan ? hijri.day : null,
      hijriYear: hijri.year || DEFAULT_HIJRI_YEAR,
      hijriMonth: hijri.month,
      source: 'manual',
    };
  }

  return {
    isRamadan: calculatedRamadan,
    ramadanDay: calculatedRamadan ? hijri.day : null,
    hijriYear: hijri.year || DEFAULT_HIJRI_YEAR,
    hijriMonth: hijri.month,
    source: 'automatic',
  };
}

/** Returns the calculated Ramadan year currently relevant to a date (current or next). */
export function getRelevantRamadanYear(date: Date, timeZone = 'UTC'): number {
  const hijri = getHijriDate(date, timeZone);
  return hijri.month >= 10 ? hijri.year + 1 : hijri.year;
}

export const RAMADAN_HIJRI_MONTH = RAMADAN_MONTH;
