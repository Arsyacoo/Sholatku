import type { SurahInfo } from '@/types';
import { normalizeArabicText, normalizeSearchText } from './normalize';
import type { SurahSearchResult } from './types';

export interface SurahSearchOptions {
  cachedSurahNumbers?: Iterable<number>;
  limit?: number;
}

const DEFAULT_LIMIT = 20;

export function createSurahSearchResult(
  surah: SurahInfo,
  score: number,
  cachedSurahNumbers?: Iterable<number>
): SurahSearchResult {
  const cached = cachedSurahNumbers ? new Set(cachedSurahNumbers) : undefined;
  return {
    kind: 'surah',
    id: `surah:${surah.number}`,
    surahNumber: surah.number,
    surahName: surah.name,
    surahNameArabic: surah.arabicName,
    translation: surah.translation,
    numberOfAyahs: surah.numberOfAyahs,
    revelation: surah.revelation,
    matchType: 'surah',
    score,
    readerAvailableOffline: cached?.has(surah.number) ?? false,
  };
}

function scoreSurah(surah: SurahInfo, query: string, arabicQuery: string): number {
  const name = normalizeSearchText(surah.name);
  const arabicName = normalizeArabicText(surah.arabicName);
  const translation = normalizeSearchText(surah.translation);

  if (/^\d+$/.test(query) && String(surah.number) === query) return 850;
  if (name === query) return 900;
  if (name.startsWith(query)) return 820;
  if (name.includes(query)) return 720;
  if (arabicName === arabicQuery) return 700;
  if (arabicName.startsWith(arabicQuery)) return 680;
  if (arabicName.includes(arabicQuery)) return 650;
  if (translation === query) return 620;
  if (translation.startsWith(query)) return 600;
  if (translation.includes(query)) return 560;
  return 0;
}

/** Searches the bundled 114-Surah metadata, independent of IndexedDB. */
export function searchSurahMetadata(
  surahs: readonly SurahInfo[],
  query: string,
  options: SurahSearchOptions = {}
): SurahSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedArabicQuery = normalizeArabicText(query);
  if (!normalizedQuery && !normalizedArabicQuery) return [];

  const limit = Math.max(1, Math.floor(options.limit ?? DEFAULT_LIMIT));
  const matches = surahs
    .map((surah) => {
      const score = scoreSurah(surah, normalizedQuery, normalizedArabicQuery);
      return score > 0 ? createSurahSearchResult(surah, score, options.cachedSurahNumbers) : null;
    })
    .filter((result): result is SurahSearchResult => result !== null)
    .sort((left, right) => right.score - left.score || left.surahNumber - right.surahNumber);

  return matches.slice(0, limit);
}
