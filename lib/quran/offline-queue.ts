export const DEFAULT_QURAN_DOWNLOAD_CONCURRENCY = 3;
export const MAX_QURAN_DOWNLOAD_CONCURRENCY = 4;
export const DEFAULT_QURAN_DOWNLOAD_RETRIES = 2;

export interface QuranDownloadQueueOptions {
  download: (surahNumber: number, signal?: AbortSignal) => Promise<void>;
  concurrency?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
  isOnline?: () => boolean;
  onProgress?: (completed: number, total: number) => void;
}

export interface QuranDownloadQueueResult {
  completedIds: number[];
  failedIds: number[];
  remainingIds: number[];
  cancelled: boolean;
  paused: boolean;
}

function isAbortError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError');
}

function wait(delayMs: number): Promise<void> {
  if (delayMs <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function defaultIsOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine;
}

export function getMissingQuranSurahNumbers(
  surahNumbers: number[],
  cachedNumbers: Iterable<number>
): number[] {
  const cached = new Set(cachedNumbers);
  return [...new Set(surahNumbers)].filter(
    (number) => Number.isInteger(number) && number >= 1 && number <= 114 && !cached.has(number)
  );
}

/** Processes a unique Surah list with a bounded worker pool. */
export async function runQuranDownloadQueue(
  surahNumbers: number[],
  options: QuranDownloadQueueOptions
): Promise<QuranDownloadQueueResult> {
  const queue = [...new Set(surahNumbers)].filter(
    (number) => Number.isInteger(number) && number >= 1 && number <= 114
  );
  const total = queue.length;
  const completedIds: number[] = [];
  const failedIds: number[] = [];
  const isOnline = options.isOnline ?? defaultIsOnline;
  const concurrency = Math.min(
    MAX_QURAN_DOWNLOAD_CONCURRENCY,
    Math.max(1, Math.floor(options.concurrency ?? DEFAULT_QURAN_DOWNLOAD_CONCURRENCY))
  );
  const maxRetries = Math.min(2, Math.max(0, Math.floor(options.maxRetries ?? DEFAULT_QURAN_DOWNLOAD_RETRIES)));
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? 350);
  let paused = false;

  const worker = async () => {
    while (queue.length > 0) {
      if (options.signal?.aborted) return;
      if (!isOnline()) {
        paused = true;
        return;
      }

      const surahNumber = queue.shift();
      if (surahNumber === undefined) return;

      let completed = false;
      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        if (options.signal?.aborted) {
          queue.unshift(surahNumber);
          return;
        }
        if (!isOnline()) {
          queue.unshift(surahNumber);
          paused = true;
          return;
        }

        try {
          await options.download(surahNumber, options.signal);
          if (options.signal?.aborted) {
            queue.unshift(surahNumber);
            return;
          }
          completed = true;
          completedIds.push(surahNumber);
          options.onProgress?.(completedIds.length, total);
          break;
        } catch (error) {
          if (options.signal?.aborted || isAbortError(error)) {
            queue.unshift(surahNumber);
            return;
          }
          if (!isOnline()) {
            queue.unshift(surahNumber);
            paused = true;
            return;
          }
          if (attempt < maxRetries) await wait(retryDelayMs * (attempt + 1));
        }
      }

      if (!completed) failedIds.push(surahNumber);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, total)) }, worker));

  return {
    completedIds,
    failedIds,
    remainingIds: [...queue],
    cancelled: Boolean(options.signal?.aborted),
    paused,
  };
}
