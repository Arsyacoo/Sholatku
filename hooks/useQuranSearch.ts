'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAllQuranSearchRecords,
  ensureQuranSearchIndex,
  getQuranSearchCoverage,
  getCachedSurahNumbers,
} from '@/lib/storage/quran-db';
import { searchQuran } from '@/lib/quran/search/search';
import type { QuranSearchCoverage, QuranSearchResponse, QuranSearchRecord } from '@/lib/quran/search/types';
import { SURAH_LIST } from '@/lib/quran/surah-list';

const PAGE_SIZE = 20;

export function useQuranSearch(query: string) {
  const [records, setRecords] = useState<QuranSearchRecord[]>([]);
  const [cachedSurahNumbers, setCachedSurahNumbers] = useState<number[]>([]);
  const [coverage, setCoverage] = useState<QuranSearchCoverage>({
    indexedSurahs: 0,
    totalSurahs: 114,
    isComplete: false,
  });
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [resultLimit, setResultLimit] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      // Existing caches and derived indexes can be recovered without a
      // re-download when records are missing, corrupt, or from an older schema.
      await ensureQuranSearchIndex();
      const nextRecords = await getAllQuranSearchRecords();
      const nextCoverage = await getQuranSearchCoverage();
      const nextCachedSurahNumbers = await getCachedSurahNumbers();

      setRecords(nextRecords);
      setCoverage(nextCoverage);
      setCachedSurahNumbers(nextCachedSurahNumbers);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setResultLimit(PAGE_SIZE);
  }, [debouncedQuery]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const response: QuranSearchResponse = useMemo(
    () =>
      searchQuran(records, debouncedQuery, {
        limit: resultLimit,
        coverage,
        surahs: SURAH_LIST,
        cachedSurahNumbers,
      }),
    [cachedSurahNumbers, coverage, debouncedQuery, records, resultLimit]
  );

  const loadMore = useCallback(() => {
    if (response.hasMore) setResultLimit((current) => current + PAGE_SIZE);
  }, [response.hasMore]);

  return {
    ...response,
    isLoading,
    isSearching: isLoading || debouncedQuery !== query,
    refresh,
    loadMore,
  };
}
