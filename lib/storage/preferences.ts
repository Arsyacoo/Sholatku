import { UserLocation, UserSettings, DailyPrayerSchedule } from '@/types';
import { DEFAULT_LOCATION, DEFAULT_SETTINGS } from '../prayer/constants';

const KEYS = {
  LOCATION: 'sholatku_user_location_v1',
  SETTINGS: 'sholatku_user_settings_v1',
  CACHE_SCHEDULE: 'sholatku_cached_schedule_v1',
};

export function getSavedLocation(): UserLocation {
  if (typeof window === 'undefined') return DEFAULT_LOCATION;
  try {
    const raw = localStorage.getItem(KEYS.LOCATION);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to read location from localStorage:', e);
  }
  return DEFAULT_LOCATION;
}

export function saveLocation(loc: UserLocation): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEYS.LOCATION, JSON.stringify(loc));
  } catch (e) {
    console.warn('Failed to save location:', e);
  }
}

export function getSavedSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to read settings from localStorage:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

export function getCachedSchedule(): DailyPrayerSchedule | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEYS.CACHE_SCHEDULE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to read cached schedule:', e);
  }
  return null;
}

export function saveCachedSchedule(schedule: DailyPrayerSchedule): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEYS.CACHE_SCHEDULE, JSON.stringify(schedule));
  } catch (e) {
    console.warn('Failed to save cached schedule:', e);
  }
}
