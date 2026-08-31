'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  deleteCachedSurah,
  getAllCachedSurahInfo,
  getEstimatedQuranCacheSize,
  type CachedSurahInfo,
} from '@/lib/storage/quran-db';
import { getStorageEstimate, type StorageEstimate } from '@/lib/storage/storage-estimate';
import { downloadSurahText } from '@/lib/quran/offline-download';

export type OfflineSurahAction = 'idle' | 'downloading' | 'available' | 'failed' | 'deleting';

export function useQuranOfflineManager() {
  const [cachedInfo, setCachedInfo] = useState<CachedSurahInfo[]>([]);
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionById, setActionById] = useState<Record<number, OfflineSurahAction>>({});
  const [errorById, setErrorById] = useState<Record<number, string>>({});
  const activeDownloads = useRef(new Set<number>());

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

  const downloadSurah = useCallback(
    async (surahNumber: number) => {
      if (activeDownloads.current.has(surahNumber)) return false;
      if (cachedInfo.some((info) => info.surahNumber === surahNumber)) {
        setActionById((current) => ({ ...current, [surahNumber]: 'available' }));
        return true;
      }

      activeDownloads.current.add(surahNumber);
      setErrorById((current) => {
        const next = { ...current };
        delete next[surahNumber];
        return next;
      });
      setActionById((current) => ({ ...current, [surahNumber]: 'downloading' }));

      try {
        await downloadSurahText(surahNumber);
        setActionById((current) => ({ ...current, [surahNumber]: 'available' }));
        await refresh();
        return true;
      } catch (error) {
        if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
          return false;
        }
        const message = error instanceof Error ? error.message : 'Gagal mengunduh Surah.';
        setErrorById((current) => ({ ...current, [surahNumber]: message }));
        setActionById((current) => ({ ...current, [surahNumber]: 'failed' }));
        return false;
      } finally {
        activeDownloads.current.delete(surahNumber);
      }
    },
    [cachedInfo, refresh]
  );

  const removeSurah = useCallback(
    async (surahNumber: number) => {
      if (activeDownloads.current.has(surahNumber)) return false;
      activeDownloads.current.add(surahNumber);
      setErrorById((current) => {
        const next = { ...current };
        delete next[surahNumber];
        return next;
      });
      setActionById((current) => ({ ...current, [surahNumber]: 'deleting' }));
      try {
        const removed = await deleteCachedSurah(surahNumber);
        if (!removed) throw new Error('Surah tidak dapat dihapus dari perangkat.');
        setActionById((current) => {
          const next = { ...current };
          delete next[surahNumber];
          return next;
        });
        await refresh();
        return true;
      } catch (error) {
        setErrorById((current) => ({
          ...current,
          [surahNumber]: error instanceof Error ? error.message : 'Gagal menghapus Surah.',
        }));
        setActionById((current) => ({ ...current, [surahNumber]: 'failed' }));
        return false;
      } finally {
        activeDownloads.current.delete(surahNumber);
      }
    },
    [refresh]
  );

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
    actionById,
    errorById,
    downloadSurah,
    removeSurah,
  };
}
