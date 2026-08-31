'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAllCachedSurahInfo,
  getEstimatedQuranCacheSize,
  type CachedSurahInfo,
} from '@/lib/storage/quran-db';
import { getStorageEstimate, type StorageEstimate } from '@/lib/storage/storage-estimate';

export function useQuranOfflineManager() {
  const [cachedInfo, setCachedInfo] = useState<CachedSurahInfo[]>([]);
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [info, size, estimate] = await Promise.all([
        getAllCachedSurahInfo(),
        getEstimatedQuranCacheSize(),
        getStorageEstimate(),
      ]);
      setCachedInfo(info);
      setEstimatedSize(size);
      setStorageEstimate(estimate);
    } catch {
      // Storage is best-effort; an unavailable database must not break the page.
      setCachedInfo([]);
      setEstimatedSize(0);
      setStorageEstimate(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const cachedIds = useMemo(
    () => new Set(cachedInfo.map((info) => info.surahNumber)),
    [cachedInfo]
  );

  const infoById = useMemo(
    () => new Map(cachedInfo.map((info) => [info.surahNumber, info])),
    [cachedInfo]
  );

  return {
    cachedInfo,
    cachedIds,
    infoById,
    cachedCount: cachedInfo.length,
    estimatedSize,
    storageEstimate,
    isLoading,
    refresh,
  };
}

