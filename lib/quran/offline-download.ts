import type { SurahDetail } from '@/types';
import {
  getCachedSurah,
  isValidSurahData,
  saveCachedSurah,
} from '@/lib/storage/quran-db';

export type QuranDownloadErrorCode = 'invalid-number' | 'network' | 'http' | 'invalid-data' | 'storage';

export class QuranDownloadError extends Error {
  readonly code: QuranDownloadErrorCode;

  constructor(code: QuranDownloadErrorCode, message: string) {
    super(message);
    this.name = 'QuranDownloadError';
    this.code = code;
  }
}

function isAbortError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError');
}

/** Fetches one complete Surah and stores only validated text data in IndexedDB. */
export async function downloadSurahText(
  surahNumber: number,
  options: { signal?: AbortSignal } = {}
): Promise<SurahDetail> {
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    throw new QuranDownloadError('invalid-number', 'Nomor Surah tidak valid.');
  }

  const existing = await getCachedSurah(surahNumber);
  if (existing) return existing;

  let response: Response;
  try {
    response = await fetch(`/api/quran/surah/${surahNumber}`, { signal: options.signal });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new QuranDownloadError('network', 'Koneksi internet tidak tersedia.');
  }

  if (!response.ok) {
    throw new QuranDownloadError('http', 'Data Surah gagal dimuat.');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new QuranDownloadError('invalid-data', 'Data Surah tidak dapat dibaca.');
  }

  const data =
    payload && typeof payload === 'object' && 'data' in payload
      ? (payload as { data?: unknown }).data
      : undefined;
  if (!isValidSurahData(data) || data.number !== surahNumber) {
    throw new QuranDownloadError('invalid-data', 'Data Surah tidak lengkap.');
  }

  if (!(await saveCachedSurah(data))) {
    throw new QuranDownloadError('storage', 'Surah tidak dapat disimpan di perangkat.');
  }

  return data;
}

