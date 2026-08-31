import { normalizeArabicText, normalizeSearchText } from './normalize';
import { looksLikeAyahReference, parseAyahReference } from './parser';
import type {
  AyahSearchResult,
  QuranSearchCoverage,
  QuranSearchRecord,
  QuranSearchResponse,
  QuranSearchResult,
  SurahSearchResult,
} from './types';

export interface QuranSearchOptions {
  limit?: number;
  offset?: number;
  coverage?: QuranSearchCoverage;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function getCoverage(records: QuranSearchRecord[], coverage?: QuranSearchCoverage): QuranSearchCoverage {
  if (coverage) return coverage;
  const indexedSurahs = new Set(records.map((record) => record.surahNumber)).size;
  return { indexedSurahs, totalSurahs: 114, isComplete: indexedSurahs === 114 };
}

function createAyahResult(record: QuranSearchRecord, matchType: AyahSearchResult['matchType'], score: number): AyahSearchResult {
  return {
    kind: 'ayah',
    id: record.id,
    surahNumber: record.surahNumber,
    surahName: record.surahName,
    surahNameArabic: record.surahNameArabic,
    ayahNumber: record.ayahNumber,
    arabic: record.arabic,
    translation: record.translation,
    matchType,
    score,
  };
}

function createSurahResult(record: QuranSearchRecord, score: number): SurahSearchResult {
  return {
    kind: 'surah',
    id: `surah:${record.surahNumber}`,
    surahNumber: record.surahNumber,
    surahName: record.surahName,
    surahNameArabic: record.surahNameArabic,
    matchType: 'surah',
    score,
  };
}

function compareResults(left: QuranSearchResult, right: QuranSearchResult): number {
  return right.score - left.score || left.surahNumber - right.surahNumber || left.id.localeCompare(right.id);
}

/** Searches only the compact local index; no network request is made here. */
export function searchQuran(
  records: QuranSearchRecord[],
  query: string,
  options: QuranSearchOptions = {}
): QuranSearchResponse {
  const coverage = getCoverage(records, options.coverage);
  const trimmedQuery = query.trim();
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(options.limit ?? DEFAULT_LIMIT)));
  const offset = Math.max(0, Math.floor(options.offset ?? 0));

  if (!trimmedQuery) {
    return { results: [], hasMore: false, totalMatches: 0, coverage, emptyReason: 'empty' };
  }
  if (!looksLikeAyahReference(trimmedQuery) && normalizeSearchText(trimmedQuery).length < 2) {
    return { results: [], hasMore: false, totalMatches: 0, coverage, emptyReason: 'too-short' };
  }

  if (looksLikeAyahReference(trimmedQuery)) {
    const reference = parseAyahReference(trimmedQuery);
    if (!reference) {
      return { results: [], hasMore: false, totalMatches: 0, coverage, emptyReason: 'invalid-reference' };
    }
    const record = records.find(
      (item) => item.surahNumber === reference.surahNumber && item.ayahNumber === reference.ayahNumber
    );
    const results = record ? [createAyahResult(record, 'reference', 1000)] : [];
    return { results, hasMore: false, totalMatches: results.length, coverage };
  }

  const normalizedQuery = normalizeSearchText(trimmedQuery);
  const normalizedArabicQuery = normalizeArabicText(trimmedQuery);
  const candidates = new Map<string, QuranSearchResult>();

  for (const record of records) {
    const surahName = normalizeSearchText(record.surahName);
    const surahNameArabic = normalizeArabicText(record.surahNameArabic ?? '');
    if (surahName === normalizedQuery) {
      candidates.set(`surah:${record.surahNumber}`, createSurahResult(record, 900));
    } else if (surahName.startsWith(normalizedQuery)) {
      const key = `surah:${record.surahNumber}`;
      if (!candidates.has(key)) candidates.set(key, createSurahResult(record, 800));
    } else if (surahName.includes(normalizedQuery) || (surahNameArabic && surahNameArabic.includes(normalizedArabicQuery))) {
      const key = `surah:${record.surahNumber}`;
      if (!candidates.has(key)) candidates.set(key, createSurahResult(record, 700));
    }

    if (record.translationNormalized === normalizedQuery) {
      candidates.set(record.id, createAyahResult(record, 'translation', 650));
    } else if (record.translationNormalized.includes(normalizedQuery)) {
      candidates.set(record.id, createAyahResult(record, 'translation', 500));
    }

    if (record.arabicNormalized === normalizedArabicQuery) {
      candidates.set(record.id, createAyahResult(record, 'arabic', 640));
    } else if (normalizedArabicQuery && record.arabicNormalized.includes(normalizedArabicQuery)) {
      candidates.set(record.id, createAyahResult(record, 'arabic', 540));
    }
  }

  const ranked = [...candidates.values()].sort(compareResults);
  return {
    results: ranked.slice(offset, offset + limit),
    hasMore: offset + limit < ranked.length,
    totalMatches: ranked.length,
    coverage,
  };
}
