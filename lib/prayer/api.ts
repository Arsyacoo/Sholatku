import { DailyPrayerSchedule, MonthlyPrayerItem, UserLocation, UserSettings } from '@/types';
import { normalizeAlAdhanDay, normalizeAlAdhanMonth } from './normalize';
import { calculateOfflinePrayers } from './calculation';
import { formatIndonesianDate, getApproximateHijriDate } from '../time/timezone';

/**
 * Fetches daily prayer schedule from server API route or AlAdhan with fallback
 */
export async function getDailyPrayerTimes(
  location: UserLocation,
  settings: UserSettings,
  date: Date = new Date()
): Promise<DailyPrayerSchedule> {
  const timestamp = Math.floor(date.getTime() / 1000);
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
        return normalizeAlAdhanDay(data.data, settings.adjustments, 'api');
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
        return normalizeAlAdhanDay(data.data, settings.adjustments, 'api');
      }
    }
  } catch (err) {
    console.warn('Direct AlAdhan API failed, using offline calculation:', err);
  }

  // Standalone offline calculation fallback
  const timezoneOffset = -(date.getTimezoneOffset() / 60);
  const calculated = calculateOfflinePrayers(date, location.latitude, location.longitude, timezoneOffset);
  const hijri = getApproximateHijriDate(date);

  return {
    date: date.toISOString().split('T')[0],
    readableDate: formatIndonesianDate(date),
    hijriDate: hijri,
    timezone: location.timezone || 'Asia/Jakarta',
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
        return normalizeAlAdhanMonth(data.data, settings.adjustments);
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
        return normalizeAlAdhanMonth(data.data, settings.adjustments);
      }
    }
  } catch (err) {
    console.warn('Direct AlAdhan calendar failed, generating synthetic offline month:', err);
  }

  // Generate offline month calculation
  const daysInMonth = new Date(year, month, 0).getDate();
  const list: MonthlyPrayerItem[] = [];
  const offset = -(new Date().getTimezoneOffset() / 60);

  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(year, month - 1, d);
    const timings = calculateOfflinePrayers(currentDate, location.latitude, location.longitude, offset);
    const hijri = getApproximateHijriDate(currentDate);

    list.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      dayNumber: d,
      dayName: formatIndonesianDate(currentDate).split(',')[0],
      hijriFormatted: hijri.formatted,
      isToday: formatIndonesianDate(currentDate) === formatIndonesianDate(new Date()),
      timings,
    });
  }

  return list;
}
