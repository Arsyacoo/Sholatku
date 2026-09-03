'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ensureQuranSearchIndex,
  getAllQuranSearchRecords,
  getCompleteCachedSurahNumbers,
  getQuranSearchCoverage,
} from '@/lib/storage/quran-db';
import { searchQuran } from '@/lib/quran/search/search';
import type { QuranSearchCoverage, QuranSearchResponse, QuranSearchRecord } from '@/lib/quran/search/types';
import { SURAH_LIST } from '@/lib/quran/surah-list';
import { searchSurahMetadata } from '@/lib/quran/search/surah-search';
import { looksLikeAyahReference } from '@/lib/quran/search/parser';
import { useOnlineStatus } from './useOnlineStatus';

const PAGE_SIZE = 20;
export type QuranSearchStatus = 'idle' | 'loading' | 'ready' | 'error';

const ONLINE_COVERAGE: QuranSearchCoverage = {
  mode: 'online',
  completeness: 'complete',
  indexedSurahs: 114,
  totalSurahs: 114,
  isComplete: true,
};

const EMPTY_OFFLINE_COVERAGE: QuranSearchCoverage = {
  mode: 'metadata-only',
  completeness: 'surah-only',
  indexedSurahs: 0,
  totalSurahs: 114,
  isComplete: false,
};

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

function isAbortError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError');
}

function readOnlineRecords(payload: unknown): { records: QuranSearchRecord[]; totalMatches: number; hasMore: boolean } {
  if (!payload || typeof payload !== 'object' || !('data' in payload)) throw new Error('Hasil pencarian tidak valid.');
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== 'object' || !('records' in data) || !Array.isArray(data.records)) {
    throw new Error('Hasil pencarian tidak valid.');
  }
  const value = data as { records: unknown[]; totalMatches?: unknown; hasMore?: unknown };
  const records = value.records.filter((record): record is QuranSearchRecord => {
    if (!record || typeof record !== 'object') return false;
    const item = record as Partial<QuranSearchRecord>;
    return typeof item.id === 'string' && Number.isInteger(item.surahNumber) && Number.isInteger(item.ayahNumber) &&
      typeof item.translation === 'string';
  });
  return {
    records,
    totalMatches: typeof value.totalMatches === 'number' && Number.isInteger(value.totalMatches)
      ? value.totalMatches
      : records.length,
    hasMore: value.hasMore === true,
  };
}

export function useQuranSearch(query: string) {
  const [records, setRecords] = useState<QuranSearchRecord[]>([]);
  const [cachedSurahNumbers, setCachedSurahNumbers] = useState<number[]>([]);
  const [coverage, setCoverage] = useState<QuranSearchCoverage>(EMPTY_OFFLINE_COVERAGE);
  const [onlineRecords, setOnlineRecords] = useState<QuranSearchRecord[]>([]);
  const [onlineTotalMatches, setOnlineTotalMatches] = useState(0);
  const [onlineHasMore, setOnlineHasMore] = useState(false);
  const [searchStatus, setSearchStatus] = useState<QuranSearchStatus>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [resultLimit, setResultLimit] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [retryNonce, setRetryNonce] = useState(0);
  const requestId = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const isOnline = useOnlineStatus();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await ensureQuranSearchIndex();
      const [nextRecords, nextCoverage, nextCachedSurahNumbers] = await Promise.all([
        getAllQuranSearchRecords(),
        getQuranSearchCoverage(),
        getCompleteCachedSurahNumbers(),
      ]);
      setRecords(nextRecords);
      setCoverage(nextCoverage);
      setCachedSurahNumbers(nextCachedSurahNumbers);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(normalizeQuery(query)), 200);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setResultLimit(PAGE_SIZE);
  }, [debouncedQuery]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasMetadataMatch = useMemo(
    () => searchSurahMetadata(SURAH_LIST, debouncedQuery).length > 0,
    [debouncedQuery]
  );
  const shouldSearchOnline = isOnline && normalizeQuery(debouncedQuery).length >= 2 &&
    !looksLikeAyahReference(debouncedQuery) && !hasMetadataMatch;

  useEffect(() => {
    controllerRef.current?.abort();
    const currentId = ++requestId.current;
    setOnlineRecords([]);
    setOnlineTotalMatches(0);
    setOnlineHasMore(false);
    setSearchError(null);

    if (!shouldSearchOnline) {
      setSearchStatus('idle');
      return () => undefined;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setSearchStatus('loading');

    const search = async () => {
      try {
        const params = new URLSearchParams({ q: debouncedQuery, limit: String(resultLimit) });
        const response = await fetch(`/api/quran/search?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('Pencarian ayat online belum tersedia.');
        const payload: unknown = await response.json();
        const result = readOnlineRecords(payload);
        if (currentId !== requestId.current || controller.signal.aborted) return;
        setOnlineRecords(result.records);
        setOnlineTotalMatches(result.totalMatches);
        setOnlineHasMore(result.hasMore);
        setSearchStatus('ready');
      } catch (error) {
        if (isAbortError(error) || controller.signal.aborted || currentId !== requestId.current) return;
        setSearchStatus('error');
        setSearchError(error instanceof Error ? error.message : 'Pencarian ayat online belum tersedia.');
      }
    };
    void search();

    return () => {
      controller.abort();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [debouncedQuery, isOnline, resultLimit, retryNonce, shouldSearchOnline]);

  const response: QuranSearchResponse = useMemo(() => {
    const effectiveRecords = searchStatus === 'ready' ? [...onlineRecords, ...records] : records;
    const effectiveCoverage = searchStatus === 'ready' ? ONLINE_COVERAGE : coverage;
    const localResponse = searchQuran(effectiveRecords, debouncedQuery, {
      limit: resultLimit,
      coverage: effectiveCoverage,
      surahs: SURAH_LIST,
      cachedSurahNumbers,
    });
    if (searchStatus !== 'ready') return localResponse;
    return {
      ...localResponse,
      hasMore: onlineHasMore || localResponse.hasMore,
      totalMatches: Math.max(onlineTotalMatches, localResponse.totalMatches),
    };
  }, [cachedSurahNumbers, coverage, debouncedQuery, onlineHasMore, onlineRecords, onlineTotalMatches, records, resultLimit, searchStatus]);

  const loadMore = useCallback(() => {
    if (response.hasMore) setResultLimit((current) => current + PAGE_SIZE);
  }, [response.hasMore]);

  return {
    ...response,
    isLoading,
    isSearching: isLoading || searchStatus === 'loading' || debouncedQuery !== normalizeQuery(query),
    searchStatus,
    searchError,
    // Kept as aliases for callers that consumed Sprint B's corpus fields.
    corpusStatus: searchStatus,
    corpusError: searchError,
    retrySearch: () => {
      setSearchStatus('idle');
      setRetryNonce((value) => value + 1);
    },
    retryCorpus: () => {
      setSearchStatus('idle');
      setRetryNonce((value) => value + 1);
    },
    refresh,
    loadMore,
  };
}
