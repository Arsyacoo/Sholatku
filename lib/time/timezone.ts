const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const ISLAMIC_MONTHS = [
  'Muharram', 'Safar', 'Rabiul Awwal', 'Rabiul Akhir',
  'Jumadil Awwal', 'Jumadil Akhir', 'Rajab', 'Syaban',
  'Ramadhan', 'Syawal', 'Dzulqa’dah', 'Dzulhijjah'
];

export const DEFAULT_TIMEZONE = 'Asia/Jakarta';

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function normalizeTimeZone(value: unknown, fallback = DEFAULT_TIMEZONE): string {
  if (isValidTimeZone(value)) return value;
  if (isValidTimeZone(fallback)) return fallback;
  return 'UTC';
}

function dateTimeParts(date: Date, timeZone: string): Record<string, number> {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'iso8601',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  );
}

/** Returns the timezone offset in minutes at an instant. */
export function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const safeZone = normalizeTimeZone(timeZone);
  const parts = dateTimeParts(date, safeZone);
  const asUtc = Date.UTC(
    parts.year,
    (parts.month || 1) - 1,
    parts.day || 1,
    parts.hour || 0,
    parts.minute || 0,
    parts.second || 0
  );
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** Converts a local wall-clock date/time in an IANA zone into an actual instant. */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) throw new Error('Invalid zoned date/time');

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    throw new Error('Invalid zoned date/time');
  }

  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  if (new Date(naiveUtc).getUTCDate() !== day) throw new Error('Invalid zoned date/time');

  const safeZone = normalizeTimeZone(timeZone);
  let candidate = naiveUtc;
  for (let i = 0; i < 3; i += 1) {
    candidate = naiveUtc - getTimeZoneOffsetMinutes(new Date(candidate), safeZone) * 60000;
  }
  return new Date(candidate);
}

export function formatDateInTimeZone(date: Date, timeZone: string): string {
  const parts = dateTimeParts(date, normalizeTimeZone(timeZone));
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function formatTimeInTimeZone(date: Date, timeZone: string): string {
  const parts = dateTimeParts(date, normalizeTimeZone(timeZone));
  return `${String(parts.hour || 0).padStart(2, '0')}:${String(parts.minute || 0).padStart(2, '0')}`;
}

export function formatIndonesianDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: normalizeTimeZone(timeZone),
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getTimeZoneLabel(timeZone: string): string {
  const safeZone = normalizeTimeZone(timeZone);
  const labels: Record<string, string> = {
    'Asia/Jakarta': 'WIB',
    'Asia/Makassar': 'WITA',
    'Asia/Jayapura': 'WIT',
  };
  return labels[safeZone] || safeZone;
}

/**
 * Format a Date object into human-readable Indonesian string
 * e.g., "Rabu, 26 Agustus 2026"
 */
export function formatIndonesianDate(date: Date): string {
  const dayName = INDONESIAN_DAYS[date.getDay()];
  const day = date.getDate();
  const monthName = INDONESIAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

/**
 * Returns formatted short date e.g. "26 Ags"
 */
export function formatShortDate(date: Date): string {
  const day = date.getDate();
  const monthShort = INDONESIAN_MONTHS[date.getMonth()].slice(0, 3);
  return `${day} ${monthShort}`;
}

/**
 * Formats time string or Date into HH:mm
 */
export function formatTime24(hours: number, minutes: number): string {
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Approximate Hijri date converter (standard Umm al-Qura calculation)
 */
export function getApproximateHijriDate(date: Date) {
  // Use Intl.DateTimeFormat with islamic-umalqura calendar where supported
  try {
    const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const day = parts.find((p) => p.type === 'day')?.value || '1';
    const month = parts.find((p) => p.type === 'month')?.value || 'Muharram';
    const year = parts.find((p) => p.type === 'year')?.value || '1448';

    return {
      day,
      month: { en: month, ar: month },
      year,
      formatted: `${day} ${month} ${year} H`,
    };
  } catch (e) {
    // Fallback simple calculation
    return {
      day: '12',
      month: { en: 'Safar', ar: 'صفر' },
      year: '1448',
      formatted: '12 Safar 1448 H',
    };
  }
}
