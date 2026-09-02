import { Ayah } from '@/types';

export {
  clearCachedSurahs,
  deleteCachedSurah,
  estimateSurahSize,
  getAllCachedSurahInfo,
  getCachedSurahCount,
  getCachedSurahInfo,
  getCachedSurah,
  getCachedSurahNumbers,
  getCompleteCachedSurahNumbers,
  getEstimatedQuranCacheSize,
  isValidSurahData,
  isCompleteSurahData,
  isSurahCached,
  migrateLegacySurahCache,
  saveCachedSurah,
  getAllQuranSearchRecords,
  getGlobalQuranSearchCorpus,
  saveGlobalQuranSearchCorpus,
  clearGlobalQuranSearchCorpus,
  ensureQuranSearchIndex,
  getQuranSearchCoverage,
  rebuildQuranSearchIndex,
} from './quran-db';

export interface SavedAyah {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  arabText: string;
  translation: string;
  timestamp: number;
}

const KEYS = {
  BOOKMARKED_AYAHS: 'sholatku_bookmarked_ayahs_v1',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isValidSavedAyah(value: unknown): value is SavedAyah {
  return isRecord(value) &&
    typeof value.surahNumber === 'number' && Number.isInteger(value.surahNumber) && value.surahNumber >= 1 && value.surahNumber <= 114 &&
    typeof value.ayahNumber === 'number' && Number.isInteger(value.ayahNumber) && value.ayahNumber >= 1 &&
    typeof value.surahName === 'string' && typeof value.arabText === 'string' && typeof value.translation === 'string' &&
    typeof value.timestamp === 'number' && Number.isFinite(value.timestamp);
}

/**
 * Gets list of all bookmarked individual ayahs
 */
export function getBookmarkedAyahs(): SavedAyah[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.BOOKMARKED_AYAHS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isValidSavedAyah) : [];
  } catch (e) {
    console.warn('Failed to read bookmarked ayahs:', e);
  }
  return [];
}

/**
 * Toggles bookmark for an ayah (add if not exists, remove if exists)
 */
export function toggleBookmarkAyah(ayah: SavedAyah): { isBookmarked: boolean; list: SavedAyah[] } {
  if (typeof window === 'undefined') return { isBookmarked: false, list: [] };
  try {
    const list = getBookmarkedAyahs();
    if (!isValidSavedAyah(ayah)) return { isBookmarked: false, list };
    const existsIndex = list.findIndex(
      (item) =>
        item.surahNumber === ayah.surahNumber &&
        item.ayahNumber === ayah.ayahNumber
    );

    let updated: SavedAyah[];
    let isBookmarked: boolean;

    if (existsIndex >= 0) {
      updated = list.filter((_, i) => i !== existsIndex);
      isBookmarked = false;
    } else {
      updated = [ayah, ...list];
      isBookmarked = true;
    }

    localStorage.setItem(KEYS.BOOKMARKED_AYAHS, JSON.stringify(updated));
    return { isBookmarked, list: updated };
  } catch (e) {
    console.warn('Failed to toggle ayah bookmark:', e);
    return { isBookmarked: false, list: [] };
  }
}
