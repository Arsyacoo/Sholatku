import type { SurahDetail } from '@/types';
import { normalizeArabicText, normalizeSearchText } from './normalize';
import {
  QURAN_SEARCH_INDEX_SCHEMA_VERSION,
  type QuranSearchRecord,
} from './types';

export function createQuranSearchRecords(surah: SurahDetail, indexedAt = Date.now()): QuranSearchRecord[] {
  return surah.ayahs.map((ayah) => ({
    id: `${surah.number}:${ayah.numberInSurah}`,
    surahNumber: surah.number,
    surahName: surah.name,
    surahNameArabic: surah.arabicName,
    ayahNumber: ayah.numberInSurah,
    arabic: ayah.arabText,
    arabicNormalized: normalizeArabicText(ayah.arabText),
    translation: ayah.translation,
    translationNormalized: normalizeSearchText(ayah.translation),
    indexedAt,
    schemaVersion: QURAN_SEARCH_INDEX_SCHEMA_VERSION,
  }));
}
