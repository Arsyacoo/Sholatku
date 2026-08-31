import { describe, expect, it } from 'vitest';
import {
  getMissingQuranSurahNumbers,
  runQuranDownloadQueue,
} from '@/lib/quran/offline-queue';

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

describe('Quran offline download queue', () => {
  it('downloads only missing, valid, unique Surah numbers', () => {
    expect(getMissingQuranSurahNumbers([1, 1, 2, 0, 115, 3], [2])).toEqual([1, 3]);
  });

  it('never exceeds the configured concurrency limit', async () => {
    let active = 0;
    let maximumActive = 0;
    const result = await runQuranDownloadQueue([1, 2, 3, 4, 5, 6], {
      concurrency: 3,
      retryDelayMs: 0,
      isOnline: () => true,
      download: async () => {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await delay(3);
        active -= 1;
      },
    });

    expect(maximumActive).toBeLessThanOrEqual(3);
    expect(result.completedIds).toHaveLength(6);
    expect(result.failedIds).toEqual([]);
    expect(result.remainingIds).toEqual([]);
  });

  it('cancels without losing completed work and can resume remaining work', async () => {
    const controller = new AbortController();
    const download = async (_surahNumber: number, signal?: AbortSignal) => {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 10);
        signal?.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          },
          { once: true }
        );
      });
    };
    const queuePromise = runQuranDownloadQueue([1, 2, 3, 4, 5, 6, 7, 8], {
      concurrency: 2,
      retryDelayMs: 0,
      signal: controller.signal,
      isOnline: () => true,
      download,
    });
    setTimeout(() => controller.abort(), 25);
    const cancelled = await queuePromise;

    expect(cancelled.cancelled).toBe(true);
    expect(cancelled.completedIds.length).toBeGreaterThan(0);
    expect(cancelled.remainingIds.length).toBeGreaterThan(0);

    const resumed = await runQuranDownloadQueue(cancelled.remainingIds, {
      concurrency: 2,
      retryDelayMs: 0,
      isOnline: () => true,
      download: async () => undefined,
    });
    expect(resumed.failedIds).toEqual([]);
    expect(resumed.remainingIds).toEqual([]);
    expect(new Set([...cancelled.completedIds, ...resumed.completedIds]).size).toBe(8);
  });

  it('retries an individual failure while allowing other Surah downloads to finish', async () => {
    const attempts = new Map<number, number>();
    const result = await runQuranDownloadQueue([7, 8], {
      concurrency: 1,
      maxRetries: 2,
      retryDelayMs: 0,
      isOnline: () => true,
      download: async (surahNumber) => {
        const count = (attempts.get(surahNumber) ?? 0) + 1;
        attempts.set(surahNumber, count);
        if (surahNumber === 7) throw new Error('temporary failure');
      },
    });

    expect(attempts.get(7)).toBe(3);
    expect(attempts.get(8)).toBe(1);
    expect(result.failedIds).toEqual([7]);
    expect(result.completedIds).toEqual([8]);
  });

  it('pauses when the network goes offline and leaves the queue resumable', async () => {
    let online = true;
    const result = await runQuranDownloadQueue([1, 2, 3], {
      concurrency: 1,
      retryDelayMs: 0,
      isOnline: () => online,
      download: async () => {
        online = false;
      },
    });

    expect(result.paused).toBe(true);
    expect(result.completedIds).toEqual([1]);
    expect(result.remainingIds).toEqual([2, 3]);
    online = true;
    const resumed = await runQuranDownloadQueue(result.remainingIds, {
      concurrency: 1,
      retryDelayMs: 0,
      isOnline: () => online,
      download: async () => undefined,
    });
    expect(resumed.completedIds).toEqual([2, 3]);
  });
});
