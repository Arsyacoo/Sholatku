import {
  UserLocation,
  UserSettings,
  DailyPrayerSchedule,
  PrayerReminderPrayer,
  PrayerReminderPreference,
  PrayerReminderSettings,
  PrayerReminderOffset,
  PRAYER_REMINDER_PRAYERS,
} from '@/types';
import { DEFAULT_LOCATION, DEFAULT_SETTINGS } from '../prayer/constants';

const KEYS = {
  LOCATION: 'sholatku_user_location_v1',
  SETTINGS: 'sholatku_user_settings_v1',
  CACHE_SCHEDULE: 'sholatku_cached_schedule_v1',
  PRAYER_REMINDERS: 'sholatku_prayer_reminders_v1',
};

const REMINDER_OFFSETS: readonly PrayerReminderOffset[] = [0, 5, 10, 15, 30];

export function getDefaultPrayerReminderSettings(): PrayerReminderSettings {
  return PRAYER_REMINDER_PRAYERS.reduce((settings, prayer) => {
    settings[prayer] = { enabled: false, offsetMinutes: 0 };
    return settings;
  }, {} as PrayerReminderSettings);
}

function isReminderOffset(value: unknown): value is PrayerReminderOffset {
  return typeof value === 'number' && REMINDER_OFFSETS.includes(value as PrayerReminderOffset);
}

function normalizePrayerReminderSettings(value: unknown): PrayerReminderSettings {
  const defaults = getDefaultPrayerReminderSettings();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;

  const input = value as Record<string, unknown>;
  for (const prayer of PRAYER_REMINDER_PRAYERS) {
    const raw = input[prayer];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const candidate = raw as Record<string, unknown>;
    defaults[prayer] = {
      enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : false,
      offsetMinutes: isReminderOffset(candidate.offsetMinutes) ? candidate.offsetMinutes : 0,
    };
  }
  return defaults;
}

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

export function getPrayerReminderSettings(): PrayerReminderSettings {
  const defaults = getDefaultPrayerReminderSettings();
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(KEYS.PRAYER_REMINDERS);
    return raw ? normalizePrayerReminderSettings(JSON.parse(raw)) : defaults;
  } catch (e) {
    console.warn('Failed to read prayer reminder settings from localStorage:', e);
    return defaults;
  }
}

export function savePrayerReminderSettings(settings: PrayerReminderSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEYS.PRAYER_REMINDERS, JSON.stringify(normalizePrayerReminderSettings(settings)));
  } catch (e) {
    console.warn('Failed to save prayer reminder settings:', e);
  }
}

export function updatePrayerReminder(
  prayer: PrayerReminderPrayer,
  update: Partial<PrayerReminderPreference>
): PrayerReminderSettings {
  const current = getPrayerReminderSettings();
  const next: PrayerReminderSettings = {
    ...current,
    [prayer]: {
      ...current[prayer],
      ...(typeof update.enabled === 'boolean' ? { enabled: update.enabled } : {}),
      ...(isReminderOffset(update.offsetMinutes) ? { offsetMinutes: update.offsetMinutes } : {}),
    },
  };
  savePrayerReminderSettings(next);
  return next;
}

export function resetPrayerReminderSettings(): PrayerReminderSettings {
  const defaults = getDefaultPrayerReminderSettings();
  savePrayerReminderSettings(defaults);
  return defaults;
}
