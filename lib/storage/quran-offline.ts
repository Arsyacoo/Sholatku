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
  getEstimatedQuranCacheSize,
  isValidSurahData,
  isSurahCached,
  migrateLegacySurahCache,
  saveCachedSurah,
  getAllQuranSearchRecords,
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

/**
 * Gets list of all bookmarked individual ayahs
 */
export function getBookmarkedAyahs(): SavedAyah[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.BOOKMARKED_AYAHS);
    if (raw) return JSON.parse(raw);
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
