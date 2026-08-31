'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAllQuranSearchRecords,
  ensureQuranSearchIndex,
  getQuranSearchCoverage,
  getCompleteCachedSurahNumbers,
  getGlobalQuranSearchCorpus,
} from '@/lib/storage/quran-db';
import { searchQuran } from '@/lib/quran/search/search';
import type { QuranSearchCoverage, QuranSearchResponse, QuranSearchRecord } from '@/lib/quran/search/types';
import { SURAH_LIST } from '@/lib/quran/surah-list';
import { initializeGlobalQuranSearchCorpus } from '@/lib/quran/search/corpus';
import { searchSurahMetadata } from '@/lib/quran/search/surah-search';
import { looksLikeAyahReference } from '@/lib/quran/search/parser';
import { useOnlineStatus } from './useOnlineStatus';

const PAGE_SIZE = 20;
type CorpusStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useQuranSearch(query: string) {
  const [records, setRecords] = useState<QuranSearchRecord[]>([]);
  const [cachedSurahNumbers, setCachedSurahNumbers] = useState<number[]>([]);
  const [globalRecords, setGlobalRecords] = useState<QuranSearchRecord[]>([]);
  const [globalMetadata, setGlobalMetadata] = useState<Awaited<ReturnType<typeof getGlobalQuranSearchCorpus>>['metadata']>(null);
  const [corpusStatus, setCorpusStatus] = useState<CorpusStatus>('idle');
  const [corpusError, setCorpusError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<QuranSearchCoverage>({
    indexedSurahs: 0,
    totalSurahs: 114,
    isComplete: false,
  });
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [resultLimit, setResultLimit] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const isOnline = useOnlineStatus();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      // Existing caches and derived indexes can be recovered without a
      // re-download when records are missing, corrupt, or from an older schema.
      await ensureQuranSearchIndex();
      const nextRecords = await getAllQuranSearchRecords();
      const nextCoverage = await getQuranSearchCoverage();
      const nextCachedSurahNumbers = await getCompleteCachedSurahNumbers();
      const cachedCorpus = await getGlobalQuranSearchCorpus();

      setRecords(nextRecords);
      setCoverage(nextCoverage);
      setCachedSurahNumbers(nextCachedSurahNumbers);
      setGlobalRecords(cachedCorpus.records);
      setGlobalMetadata(cachedCorpus.metadata);
      setCorpusStatus(cachedCorpus.metadata?.isComplete ? 'ready' : 'idle');
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

  const shouldPrepareCorpus = useMemo(() => {
    if (normalizeQueryForCorpus(debouncedQuery).length < 2) return false;
    return looksLikeAyahReference(debouncedQuery) || searchSurahMetadata(SURAH_LIST, debouncedQuery).length === 0;
  }, [debouncedQuery]);

  const prepareCorpus = useCallback(async () => {
    setCorpusStatus('loading');
    setCorpusError(null);
    const result = await initializeGlobalQuranSearchCorpus();
    setGlobalRecords(result.records);
    setGlobalMetadata(result.metadata);
    setCorpusError(result.error ?? null);
    setCorpusStatus(result.error && !result.metadata?.isComplete ? 'error' : result.metadata ? 'ready' : 'error');
    return result;
  }, []);

  useEffect(() => {
    if (!isOnline || !shouldPrepareCorpus || corpusStatus !== 'idle') return;
    void prepareCorpus();
  }, [corpusStatus, isOnline, prepareCorpus, shouldPrepareCorpus]);

  const allRecords = useMemo(() => {
    const byId = new Map<string, QuranSearchRecord>();
    for (const record of globalRecords) byId.set(record.id, record);
    for (const record of records) if (!byId.has(record.id)) byId.set(record.id, record);
    return [...byId.values()];
  }, [globalRecords, records]);

  const effectiveCoverage = globalMetadata ?? coverage;

  const response: QuranSearchResponse = useMemo(
    () =>
      searchQuran(allRecords, debouncedQuery, {
        limit: resultLimit,
        coverage: effectiveCoverage,
        surahs: SURAH_LIST,
        cachedSurahNumbers,
      }),
    [allRecords, cachedSurahNumbers, debouncedQuery, effectiveCoverage, resultLimit]
  );

  const loadMore = useCallback(() => {
    if (response.hasMore) setResultLimit((current) => current + PAGE_SIZE);
  }, [response.hasMore]);

  return {
    ...response,
    isLoading,
    isSearching: isLoading || corpusStatus === 'loading' || debouncedQuery !== query,
    corpusStatus,
    corpusError,
    hasGlobalCorpus: Boolean(globalMetadata),
    isGlobalCorpusComplete: Boolean(globalMetadata?.isComplete),
    retryCorpus: () => {
      setCorpusStatus('idle');
      setCorpusError(null);
    },
    refresh,
    loadMore,
  };
}

function normalizeQueryForCorpus(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}
