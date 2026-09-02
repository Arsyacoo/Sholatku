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

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isValidSurahNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 114;
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function normalizeQuranSettings(value: unknown): QuranDisplaySettings {
  const saved = isRecord(value) ? value : {};
  const audioVolume = typeof saved.audioVolume === 'number' && Number.isFinite(saved.audioVolume)
    ? Math.min(100, Math.max(0, Math.round(saved.audioVolume)))
    : DEFAULT_QURAN_SETTINGS.audioVolume;
  const fontSize = typeof saved.arabicFontSize === 'number' && Number.isFinite(saved.arabicFontSize)
    ? Math.min(44, Math.max(20, Math.round(saved.arabicFontSize)))
    : DEFAULT_QURAN_SETTINGS.arabicFontSize;

  return {
    arabicFontSize: fontSize,
    showTranslation: typeof saved.showTranslation === 'boolean' ? saved.showTranslation : DEFAULT_QURAN_SETTINGS.showTranslation,
    showLatin: typeof saved.showLatin === 'boolean' ? saved.showLatin : DEFAULT_QURAN_SETTINGS.showLatin,
    selectedQari: typeof saved.selectedQari === 'string' && saved.selectedQari.trim().length > 0 ? saved.selectedQari.trim().slice(0, 64) : DEFAULT_QURAN_SETTINGS.selectedQari,
    autoScrollAudio: typeof saved.autoScrollAudio === 'boolean' ? saved.autoScrollAudio : DEFAULT_QURAN_SETTINGS.autoScrollAudio,
    audioVolume,
    audioMuted: typeof saved.audioMuted === 'boolean' ? saved.audioMuted : DEFAULT_QURAN_SETTINGS.audioMuted,
    playbackRate: isPlaybackRate(saved.playbackRate)
      ? saved.playbackRate
      : DEFAULT_QURAN_SETTINGS.playbackRate,
  };
}

function normalizeLastRead(value: unknown): LastReadInfo | null {
  if (!isRecord(value)) return null;
  const surahNumber = value.surahNumber;
  const ayahNumber = value.ayahNumber;
  if (!isValidSurahNumber(surahNumber) || typeof ayahNumber !== 'number' || !Number.isInteger(ayahNumber) || ayahNumber < 1) return null;
  return {
    surahNumber,
    surahName: typeof value.surahName === 'string' ? value.surahName.slice(0, 160) : '',
    ayahNumber,
    timestamp: typeof value.timestamp === 'number' && Number.isFinite(value.timestamp) ? value.timestamp : Date.now(),
  };
}

export function getLastRead(): LastReadInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeLastRead(safeParse(localStorage.getItem(KEYS.LAST_READ)));
  } catch (e) {
    console.warn('Failed to read last read quran:', e);
  }
  return null;
}

export function saveLastRead(info: LastReadInfo): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized = normalizeLastRead(info);
    if (normalized) localStorage.setItem(KEYS.LAST_READ, JSON.stringify(normalized));
  } catch (e) {
    console.warn('Failed to save last read:', e);
  }
}

export function getFavoriteSurahs(): number[] {
  if (typeof window === 'undefined') return [1, 18, 36, 55, 56, 67]; // Popular defaults: Al-Fatihah, Al-Kahf, Yasin, Ar-Rahman, Al-Waqi'ah, Al-Mulk
  try {
    const parsed = safeParse(localStorage.getItem(KEYS.FAVORITES));
    if (Array.isArray(parsed)) return [...new Set(parsed.filter(isValidSurahNumber))];
  } catch (e) {
    console.warn('Failed to read favorite surahs:', e);
  }
  return [1, 18, 36, 55, 56, 67];
}

export function toggleFavoriteSurah(surahNumber: number): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const favorites = getFavoriteSurahs();
    if (!isValidSurahNumber(surahNumber)) return favorites;
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
    if (raw) return normalizeQuranSettings(safeParse(raw));
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
