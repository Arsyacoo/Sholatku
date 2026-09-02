import { DailyPrayerSchedule, MonthlyPrayerItem, UserLocation, UserSettings } from '@/types';
import { normalizeAlAdhanDay, normalizeAlAdhanMonth } from './normalize';
import { calculateOfflinePrayers } from './calculation';
import { formatDateInTimeZone, formatIndonesianDateInTimeZone, getApproximateHijriDate, getTimeZoneOffsetMinutes, normalizeTimeZone, zonedTimeToUtc } from '../time/timezone';

/**
 * Fetches daily prayer schedule from server API route or AlAdhan with fallback
 */
export async function getDailyPrayerTimes(
  location: UserLocation,
  settings: UserSettings,
  date: Date = new Date()
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
    const res = await fetch(`/api/prayer-times?${params.toString()}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.code === 200 && data.data) {
        return normalizeAlAdhanDay(data.data, settings.adjustments, 'api', timezone);
      }
    }
  } catch (e) {
    console.warn('Local API route error, trying direct provider or offline fallback:', e);
  }

  // Direct AlAdhan API fallback
  try {
    const directRes = await fetch(
      `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${location.latitude}&longitude=${location.longitude}&method=${method}&school=${school}`
    );
    if (directRes.ok) {
      const data = await directRes.json();
      if (data.code === 200 && data.data) {
        return normalizeAlAdhanDay(data.data, settings.adjustments, 'api', timezone);
      }
    }
  } catch (err) {
    console.warn('Direct AlAdhan API failed, using offline calculation:', err);
  }

  // Standalone offline calculation fallback
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
  month: number // 1-12
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
    const res = await fetch(`/api/prayer-times/monthly?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.code === 200 && Array.isArray(data.data)) {
        return normalizeAlAdhanMonth(data.data, settings.adjustments, timezone);
      }
    }
  } catch (e) {
    console.warn('Monthly API route failed, trying direct provider:', e);
  }

  // Direct AlAdhan Calendar API
  try {
    const directRes = await fetch(
      `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${location.latitude}&longitude=${location.longitude}&method=${method}&school=${school}`
    );
    if (directRes.ok) {
      const data = await directRes.json();
      if (data.code === 200 && Array.isArray(data.data)) {
        return normalizeAlAdhanMonth(data.data, settings.adjustments, timezone);
      }
    }
  } catch (err) {
    console.warn('Direct AlAdhan calendar failed, generating synthetic offline month:', err);
  }

  // Generate offline month calculation
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
