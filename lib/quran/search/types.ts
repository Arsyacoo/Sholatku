export const QURAN_SEARCH_INDEX_SCHEMA_VERSION = 1;

export interface QuranSearchRecord {
  id: string;
  surahNumber: number;
  surahName: string;
  surahNameArabic?: string;
  ayahNumber: number;
  arabic: string;
  arabicNormalized: string;
  translation: string;
  translationNormalized: string;
  indexedAt: number;
  schemaVersion: number;
}

export interface QuranSearchCoverage {
  indexedSurahs: number;
  totalSurahs: number;
  isComplete: boolean;
}
