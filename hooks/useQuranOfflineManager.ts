'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearCachedSurahs,
  deleteCachedSurah,
  getAllCachedSurahInfo,
  getCachedSurahNumbers,
  getEstimatedQuranCacheSize,
  type CachedSurahInfo,
} from '@/lib/storage/quran-db';
import { getStorageEstimate, type StorageEstimate } from '@/lib/storage/storage-estimate';
import { downloadSurahText } from '@/lib/quran/offline-download';
import {
  DEFAULT_QURAN_DOWNLOAD_CONCURRENCY,
  getMissingQuranSurahNumbers,
  runQuranDownloadQueue,
} from '@/lib/quran/offline-queue';
import { SURAH_LIST } from '@/lib/quran/surah-list';

export type OfflineSurahAction =
  | 'idle'
  | 'downloading'
  | 'available'
  | 'failed'
  | 'delete-failed'
  | 'deleting';

export type BulkDownloadStatus = 'idle' | 'downloading' | 'paused' | 'completed' | 'error';

export interface BulkDownloadProgress {
  completed: number;
  total: number;
}

export function useQuranOfflineManager() {
  const [cachedInfo, setCachedInfo] = useState<CachedSurahInfo[]>([]);
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionById, setActionById] = useState<Record<number, OfflineSurahAction>>({});
  const [errorById, setErrorById] = useState<Record<number, string>>({});
  const activeDownloads = useRef(new Set<number>());
  const bulkController = useRef<AbortController | null>(null);
  const [bulkStatus, setBulkStatus] = useState<BulkDownloadStatus>('idle');
  const [bulkProgress, setBulkProgress] = useState<BulkDownloadProgress>({
    completed: 0,
    total: SURAH_LIST.length,
  });
  const [failedBulkIds, setFailedBulkIds] = useState<number[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

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
      if (bulkController.current) return false;
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
        setActionById((current) => ({ ...current, [surahNumber]: 'delete-failed' }));
        return false;
      } finally {
        activeDownloads.current.delete(surahNumber);
      }
    },
    [refresh]
  );

  const runBulkDownload = useCallback(
    async (requestedIds: number[]) => {
      if (bulkController.current || activeDownloads.current.size > 0) return false;

      const cachedNumbers = await getCachedSurahNumbers();
      const missingIds = getMissingQuranSurahNumbers(requestedIds, cachedNumbers);
      const alreadyCompleted = SURAH_LIST.length - missingIds.length;
      setBulkProgress({ completed: alreadyCompleted, total: SURAH_LIST.length });
      setBulkError(null);
      setFailedBulkIds([]);
      setStorageWarning(
        storageEstimate?.percentage !== null && storageEstimate?.percentage !== undefined && storageEstimate.percentage >= 90
          ? 'Penyimpanan hampir penuh. Download dapat berhenti jika kuota perangkat tidak mencukupi.'
          : null
      );

      if (missingIds.length === 0) {
        setBulkStatus('completed');
        await refresh();
        return true;
      }

      const controller = new AbortController();
      bulkController.current = controller;
      setBulkStatus('downloading');

      try {
        const result = await runQuranDownloadQueue(missingIds, {
          concurrency: DEFAULT_QURAN_DOWNLOAD_CONCURRENCY,
          signal: controller.signal,
          download: async (surahNumber, signal) => {
            setActionById((current) => ({ ...current, [surahNumber]: 'downloading' }));
            try {
              await downloadSurahText(surahNumber, { signal });
              setActionById((current) => ({ ...current, [surahNumber]: 'available' }));
            } catch (error) {
              if (!(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')) {
                const message = error instanceof Error ? error.message : 'Gagal mengunduh Surah.';
                setErrorById((current) => ({ ...current, [surahNumber]: message }));
                setActionById((current) => ({ ...current, [surahNumber]: 'failed' }));
              }
              throw error;
            }
          },
          onProgress: (completed) => {
            setBulkProgress({ completed: alreadyCompleted + completed, total: SURAH_LIST.length });
          },
        });

        setFailedBulkIds(result.failedIds);
        if (result.failedIds.length > 0) {
          setBulkError(`${result.failedIds.length} Surah gagal diunduh. Silakan coba lagi.`);
        }
        if (result.cancelled || result.paused || result.remainingIds.length > 0) {
          setBulkStatus('paused');
        } else {
          setBulkStatus('completed');
          setBulkProgress({ completed: SURAH_LIST.length, total: SURAH_LIST.length });
        }
        await refresh();
        return result.failedIds.length === 0 && result.remainingIds.length === 0;
      } catch (error) {
        setBulkStatus('error');
        setBulkError(error instanceof Error ? error.message : 'Download Quran gagal.');
        return false;
      } finally {
        bulkController.current = null;
      }
    },
    [refresh, storageEstimate]
  );

  const startBulkDownload = useCallback(
    () => runBulkDownload(SURAH_LIST.map((surah) => surah.number)),
    [runBulkDownload]
  );

  const resumeBulkDownload = useCallback(
    () => runBulkDownload(SURAH_LIST.map((surah) => surah.number)),
    [runBulkDownload]
  );

  const retryFailedDownloads = useCallback(
    () => runBulkDownload(failedBulkIds),
    [failedBulkIds, runBulkDownload]
  );

  const cancelBulkDownload = useCallback(() => {
    bulkController.current?.abort();
  }, []);

  const clearAllOffline = useCallback(async () => {
    if (bulkController.current) bulkController.current.abort();
    const cleared = await clearCachedSurahs();
    if (!cleared) return false;
    setActionById({});
    setErrorById({});
    setBulkStatus('idle');
    setBulkProgress({ completed: 0, total: SURAH_LIST.length });
    setFailedBulkIds([]);
    setBulkError(null);
    setStorageWarning(null);
    await refresh();
    return true;
  }, [refresh]);

  useEffect(() => {
    return () => {
      bulkController.current?.abort();
    };
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
    actionById,
    errorById,
    downloadSurah,
    removeSurah,
    bulkStatus,
    bulkProgress,
    failedBulkIds,
    bulkError,
    storageWarning,
    startBulkDownload,
    resumeBulkDownload,
    retryFailedDownloads,
    cancelBulkDownload,
    clearAllOffline,
  };
}
