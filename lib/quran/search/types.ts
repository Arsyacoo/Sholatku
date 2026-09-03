import type { SurahInfo } from '@/types';

export const QURAN_SEARCH_INDEX_SCHEMA_VERSION = 1;
export const QURAN_SEARCH_CORPUS_SCHEMA_VERSION = 1;

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

export type QuranSearchMode = 'online' | 'offline' | 'metadata-only';
export type QuranSearchCompleteness = 'complete' | 'partial' | 'surah-only';

export interface QuranSearchCoverage {
  mode: QuranSearchMode;
  completeness: QuranSearchCompleteness;
  indexedSurahs: number;
  totalSurahs: number;
  isComplete: boolean;
}

export interface QuranSearchCorpusMetadata extends QuranSearchCoverage {
  schemaVersion: number;
  cachedAt: number;
  totalRecords: number;
}

export type QuranSearchMatchType = 'reference' | 'surah' | 'translation' | 'arabic';

export interface QuranSearchResultBase {
  id: string;
  surahNumber: number;
  surahName: string;
  surahNameArabic?: string;
  matchType: QuranSearchMatchType;
  score: number;
  readerAvailableOffline: boolean;
}

export interface SurahSearchResult extends QuranSearchResultBase {
  kind: 'surah';
  translation: string;
  numberOfAyahs: number;
  revelation: SurahInfo['revelation'];
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
  surahs: SurahSearchResult[];
  ayahs: AyahSearchResult[];
  directReference?: AyahSearchResult;
  hasMore: boolean;
  totalMatches: number;
  coverage: QuranSearchCoverage;
  emptyReason?: QuranSearchEmptyReason;
}
