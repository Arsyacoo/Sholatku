import {
  UserLocation,
  UserSettings,
  DailyPrayerSchedule,
  PrayerReminderPrayer,
  PrayerReminderPreference,
  PrayerReminderSettings,
  PrayerReminderOffset,
  PRAYER_REMINDER_PRAYERS,
  RamadanPreferences,
  RamadanMode,
  PrayerScheduleCacheContext,
} from '@/types';
import { DEFAULT_LOCATION, DEFAULT_SETTINGS } from '../prayer/constants';
import { DEFAULT_IMSAK_OFFSET_MINUTES, IMSAK_OFFSET_OPTIONS } from '../ramadan/timing';
import { isValidTimeZone, normalizeTimeZone } from '../time/timezone';
import { parseProviderGregorianDate } from '../prayer/date';

const KEYS = {
  LOCATION: 'sholatku_user_location_v1',
  SETTINGS: 'sholatku_user_settings_v1',
  CACHE_SCHEDULE_LEGACY: 'sholatku_cached_schedule_v1',
  CACHE_SCHEDULE: 'sholatku_cached_schedule_v2',
  PRAYER_REMINDERS: 'sholatku_prayer_reminders_v1',
  RAMADAN_PREFERENCES: 'sholatku_ramadan_preferences_v1',
};

const CACHE_VERSION = 2 as const;
const CACHE_COORDINATE_PRECISION = 4;

interface CachedPrayerScheduleRecord {
  version: typeof CACHE_VERSION;
  context: PrayerScheduleCacheContext;
  schedule: DailyPrayerSchedule;
  cachedAt: number;
}

function normalizeCoordinate(value: number): number {
  return Number(value.toFixed(CACHE_COORDINATE_PRECISION));
}

export function buildPrayerScheduleCacheContext(
  date: string,
  location: UserLocation,
  settings: UserSettings
): PrayerScheduleCacheContext {
  const canonicalDate = parseProviderGregorianDate(date);
  if (!canonicalDate) throw new Error('Invalid prayer cache date');
  return {
    date: canonicalDate,
    latitude: normalizeCoordinate(location.latitude),
    longitude: normalizeCoordinate(location.longitude),
    timezone: normalizeTimeZone(location.timezone),
    method: settings.method,
    madhab: settings.madhab,
    adjustments: {
      fajr: settings.adjustments.fajr,
      sunrise: settings.adjustments.sunrise,
      dhuhr: settings.adjustments.dhuhr,
      asr: settings.adjustments.asr,
      maghrib: settings.adjustments.maghrib,
      isha: settings.adjustments.isha,
    },
  };
}

function isValidPrayerSchedule(value: unknown): value is DailyPrayerSchedule {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as DailyPrayerSchedule;
  const timings = candidate.timings;
  return (
    typeof candidate.date === 'string' && !!parseProviderGregorianDate(candidate.date) &&
    typeof candidate.readableDate === 'string' && isValidTimeZone(candidate.timezone) &&
    Number.isFinite(candidate.offset) && !!timings && typeof timings === 'object' &&
    ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].every((key) => {
      const time = timings[key as keyof typeof timings];
      return typeof time === 'string' && /^\d{2}:\d{2}$/.test(time);
    }) && ['api', 'cache', 'offline', 'calculated'].includes(candidate.source)
  );
}

function isValidCacheContext(value: unknown): value is PrayerScheduleCacheContext {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const context = value as PrayerScheduleCacheContext;
  const adjustments = context.adjustments;
  return (
    typeof context.date === 'string' && !!parseProviderGregorianDate(context.date) &&
    typeof context.latitude === 'number' && Number.isFinite(context.latitude) && context.latitude >= -90 && context.latitude <= 90 &&
    typeof context.longitude === 'number' && Number.isFinite(context.longitude) && context.longitude >= -180 && context.longitude <= 180 &&
    isValidTimeZone(context.timezone) && typeof context.method === 'string' && typeof context.madhab === 'string' &&
    !!adjustments && typeof adjustments === 'object' &&
    ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].every((key) => {
      const value = adjustments[key as keyof typeof adjustments];
      return typeof value === 'number' && Number.isFinite(value);
    })
  );
}

function matchesCacheContext(a: PrayerScheduleCacheContext, b: PrayerScheduleCacheContext): boolean {
  return a.date === b.date &&
    normalizeCoordinate(a.latitude) === normalizeCoordinate(b.latitude) &&
    normalizeCoordinate(a.longitude) === normalizeCoordinate(b.longitude) &&
    a.timezone === b.timezone && a.method === b.method && a.madhab === b.madhab &&
    JSON.stringify(a.adjustments) === JSON.stringify(b.adjustments);
}

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

export function getCachedSchedule(context?: PrayerScheduleCacheContext): DailyPrayerSchedule | null {
  if (typeof window === 'undefined') return null;
  if (!context) return null;
  try {
    const raw = localStorage.getItem(KEYS.CACHE_SCHEDULE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedPrayerScheduleRecord>;
    if (
      parsed.version !== CACHE_VERSION ||
      !isValidCacheContext(parsed.context) ||
      !isValidPrayerSchedule(parsed.schedule) ||
      !matchesCacheContext(parsed.context, context) ||
      parsed.schedule.date !== context.date
    ) return null;
    return { ...parsed.schedule, source: 'cache' };
  } catch (e) {
    console.warn('Failed to read cached schedule:', e);
  }
  return null;
}

export function saveCachedSchedule(schedule: DailyPrayerSchedule, context: PrayerScheduleCacheContext): void {
  if (typeof window === 'undefined') return;
  try {
    const record: CachedPrayerScheduleRecord = {
      version: CACHE_VERSION,
      context,
      schedule,
      cachedAt: Date.now(),
    };
    localStorage.setItem(KEYS.CACHE_SCHEDULE, JSON.stringify(record));
    localStorage.removeItem(KEYS.CACHE_SCHEDULE_LEGACY);
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

export function getDefaultRamadanPreferences(): RamadanPreferences {
  return {
    mode: 'automatic',
    imsakOffsetMinutes: DEFAULT_IMSAK_OFFSET_MINUTES,
    showHomeCard: true,
    reminders: {
      imsak: { enabled: false, offsetMinutes: 0 },
      maghrib: { enabled: false, offsetMinutes: 0 },
    },
  };
}

function isRamadanMode(value: unknown): value is RamadanMode {
  return value === 'automatic' || value === 'enabled' || value === 'disabled';
}

function isImsakOffset(value: unknown): value is RamadanPreferences['imsakOffsetMinutes'] {
  return IMSAK_OFFSET_OPTIONS.includes(value as RamadanPreferences['imsakOffsetMinutes']);
}

function normalizeRamadanPreferences(value: unknown): RamadanPreferences {
  const defaults = getDefaultRamadanPreferences();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
  const input = value as Record<string, unknown>;
  const reminders = input.reminders as Record<string, unknown> | undefined;
  const normalizeReminder = (candidate: unknown) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return { ...defaults.reminders.imsak };
    const item = candidate as Record<string, unknown>;
    return {
      enabled: typeof item.enabled === 'boolean' ? item.enabled : false,
      offsetMinutes: isReminderOffset(item.offsetMinutes) ? item.offsetMinutes : 0,
    };
  };
  return {
    mode: isRamadanMode(input.mode) ? input.mode : defaults.mode,
    imsakOffsetMinutes: isImsakOffset(input.imsakOffsetMinutes)
      ? input.imsakOffsetMinutes
      : defaults.imsakOffsetMinutes,
    showHomeCard: typeof input.showHomeCard === 'boolean' ? input.showHomeCard : defaults.showHomeCard,
    reminders: {
      imsak: normalizeReminder(reminders?.imsak),
      maghrib: normalizeReminder(reminders?.maghrib),
    },
  };
}

export function getRamadanPreferences(): RamadanPreferences {
  const defaults = getDefaultRamadanPreferences();
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(KEYS.RAMADAN_PREFERENCES);
    return raw ? normalizeRamadanPreferences(JSON.parse(raw)) : defaults;
  } catch (e) {
    console.warn('Failed to read Ramadan preferences from localStorage:', e);
    return defaults;
  }
}

export function saveRamadanPreferences(preferences: RamadanPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEYS.RAMADAN_PREFERENCES, JSON.stringify(normalizeRamadanPreferences(preferences)));
  } catch (e) {
    console.warn('Failed to save Ramadan preferences:', e);
  }
}
