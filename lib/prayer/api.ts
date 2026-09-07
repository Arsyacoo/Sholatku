import { DailyPrayerSchedule, MonthlyPrayerItem, UserLocation, UserSettings } from '@/types';
import { normalizeAlAdhanDay, normalizeAlAdhanMonth } from './normalize';
import { calculateOfflinePrayers } from './calculation';
import { formatDateInTimeZone, formatIndonesianDateInTimeZone, getApproximateHijriDate, getTimeZoneOffsetMinutes, normalizeTimeZone, zonedTimeToUtc } from '../time/timezone';
import {
  fetchJsonWithTimeout,
  isNetworkRequestError,
  NETWORK_TIMEOUTS,
  NetworkRequestError,
} from '../network/fetch';
import { resolveApiUrl } from '../platform/api';

interface PrayerRequestOptions {
  signal?: AbortSignal;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new NetworkRequestError('aborted', 'Network request was cancelled.', {
      cause: signal.reason,
    });
  }
}

/**
 * Fetches daily prayer schedule from server API route or AlAdhan with fallback
 */
export async function getDailyPrayerTimes(
  location: UserLocation,
  settings: UserSettings,
  date: Date = new Date(),
  options: PrayerRequestOptions = {}
): Promise<DailyPrayerSchedule> {
  const timezone = normalizeTimeZone(location.timezone);
  const scheduleDate = formatDateInTimeZone(date, timezone);
  const timestamp = Math.floor(zonedTimeToUtc(scheduleDate, '12:00', timezone).getTime() / 1000);
  const method = settings.method || '20';
  const school = settings.madhab === 'hanafi' ? '1' : '0';

  const params = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
    method,
    school,
    timestamp: String(timestamp),
  });

  // Try fetching from local API route first
  try {
    const data = await fetchJsonWithTimeout<any>(resolveApiUrl(`/api/prayer-times?${params.toString()}`), {
      timeoutMs: NETWORK_TIMEOUTS.prayerRoute,
      signal: options.signal,
      headers: { Accept: 'application/json' },
    });
    if (data.code === 200 && data.data) {
      return normalizeAlAdhanDay(data.data, settings.adjustments, 'api', timezone);
    }
  } catch (e) {
    if (isNetworkRequestError(e, 'aborted')) throw e;
    console.warn('Local API route error, trying direct provider or offline fallback:', e);
  }

  // Direct AlAdhan API fallback
  try {
    const data = await fetchJsonWithTimeout<any>(
      `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${location.latitude}&longitude=${location.longitude}&method=${method}&school=${school}`,
      {
        timeoutMs: NETWORK_TIMEOUTS.prayerProvider,
        signal: options.signal,
        headers: { Accept: 'application/json' },
      }
    );
    if (data.code === 200 && data.data) {
      return normalizeAlAdhanDay(data.data, settings.adjustments, 'api', timezone);
    }
  } catch (err) {
    if (isNetworkRequestError(err, 'aborted')) throw err;
    console.warn('Direct AlAdhan API failed, using offline calculation:', err);
  }

  // Standalone offline calculation fallback
  throwIfAborted(options.signal);
  const scheduleInstant = zonedTimeToUtc(scheduleDate, '12:00', timezone);
  const timezoneOffset = getTimeZoneOffsetMinutes(scheduleInstant, timezone) / 60;
  const calculated = calculateOfflinePrayers(scheduleInstant, location.latitude, location.longitude, timezoneOffset);
  const hijri = getApproximateHijriDate(scheduleInstant);

  return {
    date: scheduleDate,
    readableDate: formatIndonesianDateInTimeZone(scheduleInstant, timezone),
    hijriDate: hijri,
    timezone,
    offset: timezoneOffset,
    timings: {
      fajr: calculated.fajr,
      sunrise: calculated.sunrise,
      dhuhr: calculated.dhuhr,
      asr: calculated.asr,
      maghrib: calculated.maghrib,
      isha: calculated.isha,
      imsak: calculated.fajr,
    },
    source: 'offline',
    meta: {
      latitude: location.latitude,
      longitude: location.longitude,
      method: 'Offline Solar Math',
    },
  };
}

/**
 * Fetches monthly prayer calendar
 */
export async function getMonthlyPrayerTimes(
  location: UserLocation,
  settings: UserSettings,
  year: number,
  month: number, // 1-12
  options: PrayerRequestOptions = {}
): Promise<MonthlyPrayerItem[]> {
  const timezone = normalizeTimeZone(location.timezone);
  const method = settings.method || '20';
  const school = settings.madhab === 'hanafi' ? '1' : '0';

  const params = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
    year: String(year),
    month: String(month),
    method,
    school,
  });

  try {
    const data = await fetchJsonWithTimeout<any>(resolveApiUrl(`/api/prayer-times/monthly?${params.toString()}`), {
      timeoutMs: NETWORK_TIMEOUTS.prayerRoute,
      signal: options.signal,
      headers: { Accept: 'application/json' },
    });
    if (data.code === 200 && Array.isArray(data.data)) {
      return normalizeAlAdhanMonth(data.data, settings.adjustments, timezone);
    }
  } catch (e) {
    if (isNetworkRequestError(e, 'aborted')) throw e;
    console.warn('Monthly API route failed, trying direct provider:', e);
  }

  // Direct AlAdhan Calendar API
  try {
    const data = await fetchJsonWithTimeout<any>(
      `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${location.latitude}&longitude=${location.longitude}&method=${method}&school=${school}`,
      {
        timeoutMs: NETWORK_TIMEOUTS.prayerProvider,
        signal: options.signal,
        headers: { Accept: 'application/json' },
      }
    );
    if (data.code === 200 && Array.isArray(data.data)) {
      return normalizeAlAdhanMonth(data.data, settings.adjustments, timezone);
    }
  } catch (err) {
    if (isNetworkRequestError(err, 'aborted')) throw err;
    console.warn('Direct AlAdhan calendar failed, generating synthetic offline month:', err);
  }

  // Generate offline month calculation
  throwIfAborted(options.signal);
  const daysInMonth = new Date(year, month, 0).getDate();
  const list: MonthlyPrayerItem[] = [];
  const offset = getTimeZoneOffsetMinutes(zonedTimeToUtc(`${year}-${String(month).padStart(2, '0')}-15`, '12:00', timezone), timezone) / 60;

  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(Date.UTC(year, month - 1, d, 12));
    const timings = calculateOfflinePrayers(currentDate, location.latitude, location.longitude, offset);
    const hijri = getApproximateHijriDate(currentDate);

    list.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      timezone,
      dayNumber: d,
      dayName: formatIndonesianDateInTimeZone(currentDate, timezone).split(',')[0],
      hijriFormatted: hijri.formatted,
      isToday: formatDateInTimeZone(currentDate, timezone) === formatDateInTimeZone(new Date(), timezone),
      timings,
    });
  }

  return list;
}
