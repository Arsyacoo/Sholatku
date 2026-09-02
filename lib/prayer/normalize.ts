import { DailyPrayerSchedule, MonthlyPrayerItem, PrayerAdjustment } from '@/types';
import { formatDateInTimeZone, formatIndonesianDateInTimeZone, getApproximateHijriDate, getTimeZoneOffsetMinutes, normalizeTimeZone } from '../time/timezone';
import { canonicalDateToUtcDate, parseProviderGregorianDate } from './date';

/**
 * Strips timezone annotations like "(WIB)" or "(EST)" from raw time strings like "04:45 (WIB)" -> "04:45"
 */
export function cleanTimeString(rawTime: string): string {
  if (!rawTime) return '00:00';
  const match = rawTime.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = match[2];
    return `${h}:${m}`;
  }
  return rawTime.trim();
}

/**
 * Applies minute adjustment offset to a "HH:mm" time string.
 */
export function applyTimeOffset(timeStr: string, offsetMinutes: number): string {
  if (!offsetMinutes) return timeStr;
  const [h, m] = timeStr.split(':').map(Number);
  let totalMins = h * 60 + m + offsetMinutes;
  totalMins = (totalMins + 1440) % 1440; // wrap 24h
  const newH = Math.floor(totalMins / 60);
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/**
 * Normalizes AlAdhan API single-day response into `DailyPrayerSchedule`
 */
export function normalizeAlAdhanDay(
  raw: any,
  adjustments?: PrayerAdjustment,
  source: 'api' | 'cache' | 'offline' | 'calculated' = 'api',
  fallbackTimezone?: string
): DailyPrayerSchedule {
  const timings = raw.timings || {};
  const dateMeta = raw.date || {};
  const meta = raw.meta || {};

  const cleanTimings = {
    fajr: cleanTimeString(timings.Fajr || timings.fajr),
    sunrise: cleanTimeString(timings.Sunrise || timings.sunrise),
    dhuhr: cleanTimeString(timings.Dhuhr || timings.dhuhr),
    asr: cleanTimeString(timings.Asr || timings.asr),
    maghrib: cleanTimeString(timings.Maghrib || timings.maghrib),
    isha: cleanTimeString(timings.Isha || timings.isha),
    imsak: cleanTimeString(timings.Imsak || timings.imsak),
    midnight: cleanTimeString(timings.Midnight || timings.midnight),
  };

  // Apply user-defined minute adjustments if provided
  if (adjustments) {
    cleanTimings.fajr = applyTimeOffset(cleanTimings.fajr, adjustments.fajr || 0);
    cleanTimings.sunrise = applyTimeOffset(cleanTimings.sunrise, adjustments.sunrise || 0);
    cleanTimings.dhuhr = applyTimeOffset(cleanTimings.dhuhr, adjustments.dhuhr || 0);
    cleanTimings.asr = applyTimeOffset(cleanTimings.asr, adjustments.asr || 0);
    cleanTimings.maghrib = applyTimeOffset(cleanTimings.maghrib, adjustments.maghrib || 0);
    cleanTimings.isha = applyTimeOffset(cleanTimings.isha, adjustments.isha || 0);
  }

  const gregorian = dateMeta.gregorian || {};
  const hijri = dateMeta.hijri || {};

  const rawProviderDate = gregorian.date ||
    (gregorian.year && gregorian.month?.number && gregorian.day
      ? `${String(gregorian.day).padStart(2, '0')}-${String(gregorian.month.number).padStart(2, '0')}-${gregorian.year}`
      : null);
  const dateStr = parseProviderGregorianDate(rawProviderDate);
  if (!dateStr) {
    throw new Error('Provider returned an invalid Gregorian prayer date');
  }

  const timezone = normalizeTimeZone(meta.timezone, fallbackTimezone);
  const readableDate = formatIndonesianDateInTimeZone(canonicalDateToUtcDate(dateStr), timezone);

  const hijriMonthEn = hijri.month?.en || 'Safar';
  const hijriMonthAr = hijri.month?.ar || 'صفر';
  const hijriDay = hijri.day || '1';
  const hijriYear = hijri.year || '1448';

  return {
    date: dateStr,
    readableDate,
    hijriDate: {
      day: hijriDay,
      month: { en: hijriMonthEn, ar: hijriMonthAr },
      year: hijriYear,
      formatted: `${hijriDay} ${hijriMonthEn} ${hijriYear} H`,
    },
    timezone,
    offset: typeof meta.offset === 'number'
      ? meta.offset
      : getTimeZoneOffsetMinutes(canonicalDateToUtcDate(dateStr), timezone) / 60,
    timings: cleanTimings,
    source,
    meta: {
      latitude: meta.latitude,
      longitude: meta.longitude,
      method: meta.method?.name || 'Kemenag RI',
    },
  };
}

/**
 * Normalizes AlAdhan monthly calendar response into `MonthlyPrayerItem[]`
 */
export function normalizeAlAdhanMonth(rawArray: any[], adjustments?: PrayerAdjustment, fallbackTimezone?: string): MonthlyPrayerItem[] {
  const timezone = normalizeTimeZone(fallbackTimezone);
  const todayStr = formatDateInTimeZone(new Date(), timezone);

  return rawArray.map((dayData: any) => {
    const norm = normalizeAlAdhanDay(dayData, adjustments, 'api', timezone);
    const dateParts = norm.date.split('-');
    const dayNum = parseInt(dateParts[2] || '1', 10);
    const dayName = norm.readableDate.split(',')[0];

    return {
      date: norm.date,
      timezone: norm.timezone,
      dayNumber: isNaN(dayNum) ? 1 : dayNum,
      dayName: dayName || 'Hari',
      hijriFormatted: norm.hijriDate.formatted,
      isToday: norm.date === todayStr,
      timings: {
        fajr: norm.timings.fajr,
        sunrise: norm.timings.sunrise,
        dhuhr: norm.timings.dhuhr,
        asr: norm.timings.asr,
        maghrib: norm.timings.maghrib,
        isha: norm.timings.isha,
      },
    };
  });
}
