'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAllQuranSearchRecords,
  getCachedSurahNumbers,
  getQuranSearchCoverage,
  rebuildQuranSearchIndex,
} from '@/lib/storage/quran-db';
import { searchQuran } from '@/lib/quran/search/search';
import type { QuranSearchCoverage, QuranSearchResponse, QuranSearchRecord } from '@/lib/quran/search/types';

const PAGE_SIZE = 20;

export function useQuranSearch(query: string) {
  const [records, setRecords] = useState<QuranSearchRecord[]>([]);
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
      let nextRecords = await getAllQuranSearchRecords();
      let nextCoverage = await getQuranSearchCoverage();

      // Existing Surah cache from before the search index is populated once,
      // so old offline content becomes searchable without a re-download.
      if (nextRecords.length === 0 && nextCoverage.indexedSurahs === 0) {
        const cachedNumbers = await getCachedSurahNumbers();
        if (cachedNumbers.length > 0) {
          await rebuildQuranSearchIndex();
          nextRecords = await getAllQuranSearchRecords();
          nextCoverage = await getQuranSearchCoverage();
        }
      }

      setRecords(nextRecords);
      setCoverage(nextCoverage);
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
    () => searchQuran(records, debouncedQuery, { limit: resultLimit, coverage }),
    [coverage, debouncedQuery, records, resultLimit]
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
