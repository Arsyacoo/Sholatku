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

export type QuranSearchMatchType = 'reference' | 'surah' | 'translation' | 'arabic';

export interface QuranSearchResultBase {
  id: string;
  surahNumber: number;
  surahName: string;
  surahNameArabic?: string;
  matchType: QuranSearchMatchType;
  score: number;
}

export interface SurahSearchResult extends QuranSearchResultBase {
  kind: 'surah';
}

export interface AyahSearchResult extends QuranSearchResultBase {
  kind: 'ayah';
  ayahNumber: number;
  arabic: string;
  translation: string;
}

export type QuranSearchResult = SurahSearchResult | AyahSearchResult;

export type QuranSearchEmptyReason = 'empty' | 'too-short' | 'invalid-reference';

export interface QuranSearchResponse {
  results: QuranSearchResult[];
  hasMore: boolean;
  totalMatches: number;
  coverage: QuranSearchCoverage;
  emptyReason?: QuranSearchEmptyReason;
}
