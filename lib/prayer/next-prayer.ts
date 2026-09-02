import { DailyPrayerSchedule, NextPrayerInfo, PrayerKey, PrayerTimeItem } from '@/types';
import { PRAYER_NAMES } from './constants';
import { addDaysToCanonicalDate } from './date';
import { formatDateInTimeZone, normalizeTimeZone, zonedTimeToUtc } from '../time/timezone';

const PRAYER_ORDER: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

/**
 * Parses "HH:mm" time string against a given date in the target timezone or local.
 */
export function parseTimeToDate(timeStr: string, baseDate: Date, timeZone?: string): Date {
  if (timeZone) return zonedTimeToUtc(formatDateInTimeZone(baseDate, timeZone), timeStr, normalizeTimeZone(timeZone));
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Formats seconds into HH:MM:SS string.
 */
export function formatCountdown(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Calculates current and next prayer info given a prayer schedule and current reference time.
 * Handles:
 * - Before Fajr
 * - Between Fajr and Sunrise
 * - Between Sunrise and Dhuhr
 * - Between Dhuhr and Asr
 * - Between Asr and Maghrib
 * - Between Maghrib and Isha
 * - After Isha -> Rollover to Tomorrow's Fajr
 */
export function calculateNextPrayer(
  schedule: DailyPrayerSchedule,
  now: Date = new Date(),
  tomorrowFajrTime?: string
): NextPrayerInfo {
  const { timings } = schedule;
  const timezone = normalizeTimeZone(schedule.timezone);

  // Build timestamps for today
  const prayerItems: PrayerTimeItem[] = PRAYER_ORDER.map((key) => {
    const timeStr = timings[key] || '00:00';
    const dateObj = zonedTimeToUtc(schedule.date, timeStr, timezone);
    const names = PRAYER_NAMES[key] || { id: key, ar: key };

    return {
      id: key,
      name: names.id,
      arabicName: names.ar,
      time: timeStr,
      timestamp: dateObj.getTime(),
      isPassed: dateObj.getTime() <= now.getTime(),
      isCurrent: false,
      isNext: false,
      isPrayer: key !== 'sunrise',
    };
  });

  const nowMs = now.getTime();

  const fajr = prayerItems.find((p) => p.id === 'fajr')!;
  const sunrise = prayerItems.find((p) => p.id === 'sunrise')!;
  const dhuhr = prayerItems.find((p) => p.id === 'dhuhr')!;
  const asr = prayerItems.find((p) => p.id === 'asr')!;
  const maghrib = prayerItems.find((p) => p.id === 'maghrib')!;
  const isha = prayerItems.find((p) => p.id === 'isha')!;

  let currentPrayer: PrayerTimeItem | null = null;
  let nextPrayer: PrayerTimeItem = fajr;
  let isTomorrowFajr = false;
  let targetTimestamp = fajr.timestamp;
  let previousTimestamp = fajr.timestamp - 6 * 3600 * 1000;

  if (nowMs < fajr.timestamp) {
    // Before Fajr (early morning / night)
    currentPrayer = isha; // From last night
    nextPrayer = fajr;
    targetTimestamp = fajr.timestamp;
    // previous timestamp was yesterday's Isha ~ 8 hours ago
    previousTimestamp = fajr.timestamp - 8 * 3600 * 1000;
  } else if (nowMs >= fajr.timestamp && nowMs < sunrise.timestamp) {
    // Between Fajr and Sunrise (Subuh time)
    currentPrayer = fajr;
    nextPrayer = dhuhr; // Next prayer obligation is Dhuhr (sunrise is marker)
    targetTimestamp = dhuhr.timestamp;
    previousTimestamp = fajr.timestamp;
  } else if (nowMs >= sunrise.timestamp && nowMs < dhuhr.timestamp) {
    // Between Sunrise and Dhuhr (Dhuha time)
    currentPrayer = null; // No active mandatory fardh prayer
    nextPrayer = dhuhr;
    targetTimestamp = dhuhr.timestamp;
    previousTimestamp = sunrise.timestamp;
  } else if (nowMs >= dhuhr.timestamp && nowMs < asr.timestamp) {
    // Between Dhuhr and Asr
    currentPrayer = dhuhr;
    nextPrayer = asr;
    targetTimestamp = asr.timestamp;
    previousTimestamp = dhuhr.timestamp;
  } else if (nowMs >= asr.timestamp && nowMs < maghrib.timestamp) {
    // Between Asr and Maghrib
    currentPrayer = asr;
    nextPrayer = maghrib;
    targetTimestamp = maghrib.timestamp;
    previousTimestamp = asr.timestamp;
  } else if (nowMs >= maghrib.timestamp && nowMs < isha.timestamp) {
    // Between Maghrib and Isha
    currentPrayer = maghrib;
    nextPrayer = isha;
    targetTimestamp = isha.timestamp;
    previousTimestamp = maghrib.timestamp;
  } else {
    // After Isha (Midnight Rollover)
    currentPrayer = isha;
    isTomorrowFajr = true;

    // Tomorrow's Fajr timestamp
    const tomorrowFajrDate = zonedTimeToUtc(
      addDaysToCanonicalDate(schedule.date, 1),
      tomorrowFajrTime || timings.fajr,
      timezone
    );

    targetTimestamp = tomorrowFajrDate.getTime();
    previousTimestamp = isha.timestamp;

    nextPrayer = {
      ...fajr,
      time: tomorrowFajrTime || timings.fajr,
      timestamp: targetTimestamp,
      isPassed: false,
      isNext: true,
    };
  }

  // Update item flags
  prayerItems.forEach((item) => {
    item.isCurrent = currentPrayer?.id === item.id;
    item.isNext = !isTomorrowFajr && nextPrayer.id === item.id;
  });

  const remainingSeconds = Math.max(0, Math.floor((targetTimestamp - nowMs) / 1000));
  const totalWindow = Math.max(1, targetTimestamp - previousTimestamp);
  const elapsedWindow = Math.max(0, nowMs - previousTimestamp);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedWindow / totalWindow) * 100)));

  return {
    currentPrayer,
    nextPrayer,
    remainingSeconds,
    formattedCountdown: formatCountdown(remainingSeconds),
    isTomorrowFajr,
    progressPercent,
  };
}
