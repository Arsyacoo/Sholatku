import {
  LastReadInfo,
  QuranDisplaySettings,
  QuranPlaybackRate,
  QURAN_PLAYBACK_RATES,
} from '@/types';

const KEYS = {
  LAST_READ: 'sholatku_quran_last_read_v1',
  FAVORITES: 'sholatku_quran_favorites_v1',
  SETTINGS: 'sholatku_quran_settings_v1',
  BOOKMARKS: 'sholatku_quran_ayah_bookmarks_v1',
};

export const DEFAULT_QURAN_SETTINGS: QuranDisplaySettings = {
  arabicFontSize: 28,
  showTranslation: true,
  showLatin: true,
  selectedQari: '05', // Misyari Rasyid Al-Afasy default
  autoScrollAudio: true,
  audioVolume: 100,
  audioMuted: false,
  playbackRate: 1,
};

function isPlaybackRate(value: unknown): value is QuranPlaybackRate {
  return QURAN_PLAYBACK_RATES.includes(value as QuranPlaybackRate);
}

export function normalizeQuranSettings(value: unknown): QuranDisplaySettings {
  const saved = value && typeof value === 'object'
    ? (value as Partial<QuranDisplaySettings>)
    : {};
  const parsedVolume = Number(saved.audioVolume);
  const audioVolume = Number.isFinite(parsedVolume)
    ? Math.min(100, Math.max(0, Math.round(parsedVolume)))
    : DEFAULT_QURAN_SETTINGS.audioVolume;

  return {
    ...DEFAULT_QURAN_SETTINGS,
    ...saved,
    audioVolume,
    audioMuted:
      typeof saved.audioMuted === 'boolean'
        ? saved.audioMuted
        : DEFAULT_QURAN_SETTINGS.audioMuted,
    playbackRate: isPlaybackRate(saved.playbackRate)
      ? saved.playbackRate
      : DEFAULT_QURAN_SETTINGS.playbackRate,
  };
}

export function getLastRead(): LastReadInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEYS.LAST_READ);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read last read quran:', e);
  }
  return null;
}

export function saveLastRead(info: LastReadInfo): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEYS.LAST_READ, JSON.stringify(info));
  } catch (e) {
    console.warn('Failed to save last read:', e);
  }
}

export function getFavoriteSurahs(): number[] {
  if (typeof window === 'undefined') return [1, 18, 36, 55, 56, 67]; // Popular defaults: Al-Fatihah, Al-Kahf, Yasin, Ar-Rahman, Al-Waqi'ah, Al-Mulk
  try {
    const raw = localStorage.getItem(KEYS.FAVORITES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read favorite surahs:', e);
  }
  return [1, 18, 36, 55, 56, 67];
}

export function toggleFavoriteSurah(surahNumber: number): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const favorites = getFavoriteSurahs();
    let updated: number[];
    if (favorites.includes(surahNumber)) {
      updated = favorites.filter((n) => n !== surahNumber);
    } else {
      updated = [...favorites, surahNumber];
    }
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to toggle favorite:', e);
    return [];
  }
}

export function getQuranSettings(): QuranDisplaySettings {
  if (typeof window === 'undefined') return DEFAULT_QURAN_SETTINGS;
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (raw) return normalizeQuranSettings(JSON.parse(raw));
  } catch (e) {
    console.warn('Failed to read quran settings:', e);
  }
  return DEFAULT_QURAN_SETTINGS;
}

export function saveQuranSettings(settings: QuranDisplaySettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(normalizeQuranSettings(settings)));
  } catch (e) {
    console.warn('Failed to save quran settings:', e);
  }
}
