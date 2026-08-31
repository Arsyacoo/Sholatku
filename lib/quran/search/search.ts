import { normalizeArabicText, normalizeSearchText } from './normalize';
import { looksLikeAyahReference, parseAyahReference } from './parser';
import { searchSurahMetadata } from './surah-search';
import type {
  AyahSearchResult,
  QuranSearchCoverage,
  QuranSearchRecord,
  QuranSearchResponse,
  QuranSearchResult,
  SurahSearchResult,
} from './types';
import type { SurahInfo } from '@/types';

export interface QuranSearchOptions {
  limit?: number;
  offset?: number;
  coverage?: QuranSearchCoverage;
  surahs?: readonly SurahInfo[];
  cachedSurahNumbers?: Iterable<number>;
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
    readerAvailableOffline: false,
  };
}

function compareResults(left: QuranSearchResult, right: QuranSearchResult): number {
  return right.score - left.score || left.surahNumber - right.surahNumber || left.id.localeCompare(right.id);
}

function setBestCandidate(
  candidates: Map<string, QuranSearchResult>,
  key: string,
  result: QuranSearchResult
): void {
  const current = candidates.get(key);
  if (!current || result.score > current.score) candidates.set(key, result);
}

function withReaderAvailability(
  result: AyahSearchResult,
  cachedSurahNumbers?: Iterable<number>
): AyahSearchResult {
  return {
    ...result,
    readerAvailableOffline: cachedSurahNumbers
      ? new Set(cachedSurahNumbers).has(result.surahNumber)
      : false,
  };
}

function getMetadataSurahs(records: QuranSearchRecord[], surahs?: readonly SurahInfo[]): readonly SurahInfo[] {
  if (surahs?.length) return surahs;
  const byNumber = new Map<number, SurahInfo>();
  for (const record of records) {
    if (byNumber.has(record.surahNumber)) continue;
    byNumber.set(record.surahNumber, {
      number: record.surahNumber,
      name: record.surahName,
      arabicName: record.surahNameArabic ?? '',
      translation: '',
      numberOfAyahs: record.ayahNumber,
      revelation: 'Makkiyah',
    });
  }
  return [...byNumber.values()];
}

function emptyResponse(coverage: QuranSearchCoverage, emptyReason: QuranSearchResponse['emptyReason']): QuranSearchResponse {
  return {
    results: [],
    surahs: [],
    ayahs: [],
    hasMore: false,
    totalMatches: 0,
    coverage,
    emptyReason,
  };
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
    return emptyResponse(coverage, 'empty');
  }
  if (!looksLikeAyahReference(trimmedQuery) && normalizeSearchText(trimmedQuery).length < 2) {
    return emptyResponse(coverage, 'too-short');
  }

  const cachedSurahNumbers = options.cachedSurahNumbers ? new Set(options.cachedSurahNumbers) : undefined;
  const metadata = getMetadataSurahs(records, options.surahs);
  const surahResults = searchSurahMetadata(metadata, trimmedQuery, { cachedSurahNumbers });

  if (looksLikeAyahReference(trimmedQuery)) {
    const reference = parseAyahReference(trimmedQuery);
    if (!reference) {
      return emptyResponse(coverage, 'invalid-reference');
    }
    const record = records.find(
      (item) => item.surahNumber === reference.surahNumber && item.ayahNumber === reference.ayahNumber
    );
    const metadataSurah = metadata.find((surah) => surah.number === reference.surahNumber);
    const result = record
      ? withReaderAvailability(createAyahResult(record, 'reference', 1000), cachedSurahNumbers)
      : metadataSurah
        ? {
            kind: 'ayah' as const,
            id: `${reference.surahNumber}:${reference.ayahNumber}`,
            surahNumber: metadataSurah.number,
            surahName: metadataSurah.name,
            surahNameArabic: metadataSurah.arabicName,
            ayahNumber: reference.ayahNumber,
            arabic: '',
            translation: '',
            matchType: 'reference' as const,
            score: 1000,
            readerAvailableOffline: cachedSurahNumbers?.has(metadataSurah.number) ?? false,
          }
        : null;
    const ayahs = result ? [result] : [];
    return {
      results: ayahs,
      surahs: [],
      ayahs,
      directReference: result ?? undefined,
      hasMore: false,
      totalMatches: ayahs.length,
      coverage,
    };
  }

  const normalizedQuery = normalizeSearchText(trimmedQuery);
  const normalizedArabicQuery = normalizeArabicText(trimmedQuery);
  const candidates = new Map<string, QuranSearchResult>();

  for (const result of surahResults) candidates.set(result.id, result);

  for (const record of records) {
    if (record.translationNormalized === normalizedQuery) {
      setBestCandidate(candidates, record.id, withReaderAvailability(createAyahResult(record, 'translation', 650), cachedSurahNumbers));
    } else if (record.translationNormalized.includes(normalizedQuery)) {
      setBestCandidate(candidates, record.id, withReaderAvailability(createAyahResult(record, 'translation', 500), cachedSurahNumbers));
    }

    if (record.arabicNormalized === normalizedArabicQuery) {
      setBestCandidate(candidates, record.id, withReaderAvailability(createAyahResult(record, 'arabic', 640), cachedSurahNumbers));
    } else if (normalizedArabicQuery && record.arabicNormalized.includes(normalizedArabicQuery)) {
      setBestCandidate(candidates, record.id, withReaderAvailability(createAyahResult(record, 'arabic', 540), cachedSurahNumbers));
    }
  }

  const ranked = [...candidates.values()].sort(compareResults);
  const results = ranked.slice(offset, offset + limit);
  const surahs = results.filter((result): result is SurahSearchResult => result.kind === 'surah');
  const ayahs = results.filter((result): result is AyahSearchResult => result.kind === 'ayah');
  return {
    results,
    surahs,
    ayahs,
    hasMore: offset + limit < ranked.length,
    totalMatches: ranked.length,
    coverage,
  };
}
