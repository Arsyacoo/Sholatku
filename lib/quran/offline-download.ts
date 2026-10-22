import type { Language, SurahDetail } from '@/types';
import {
  getCachedSurah,
  isCompleteSurahData,
  saveCachedSurah,
} from '@/lib/storage/quran-db';
import {
  fetchWithTimeout,
  isNetworkRequestError,
  NETWORK_TIMEOUTS,
  readJsonResponse,
} from '@/lib/network/fetch';
import { resolveApiUrl } from '@/lib/platform/api';
import { tr } from '../language';
import { getSavedSettings } from '../storage/preferences';

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
  options: { signal?: AbortSignal; language?: Language } = {}
): Promise<SurahDetail> {
  // Offline copies hold one translation language; switching language re-downloads in the new one.
  const language = options.language ?? getSavedSettings().language;
  const say = (indonesian: string, english: string) => tr(language, indonesian, english);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    throw new QuranDownloadError('invalid-number', say('Nomor Surah tidak valid.', 'Invalid surah number.'));
  }

  const existing = await getCachedSurah(surahNumber);
  if (existing && isCompleteSurahData(existing) && (existing.translationLanguage ?? 'id') === language) return existing;

  let response: Response;
  try {
    response = await fetchWithTimeout(resolveApiUrl(`/api/quran/surah/${surahNumber}?lang=${language}`), {
      timeoutMs: NETWORK_TIMEOUTS.quranRoute,
      rejectHttpErrors: false,
      signal: options.signal,
    });
  } catch (error) {
    if (isAbortError(error) || isNetworkRequestError(error, 'aborted')) throw error;
    throw new QuranDownloadError('network', say('Koneksi internet tidak tersedia.', 'No internet connection.'));
  }

  if (!response.ok) {
    throw new QuranDownloadError('http', say('Data Surah gagal dimuat.', 'Could not load the surah.'));
  }

  let payload: unknown;
  try {
    payload = await readJsonResponse(response);
  } catch {
    throw new QuranDownloadError('invalid-data', say('Data Surah tidak dapat dibaca.', 'Could not read the surah data.'));
  }

  const data =
    payload && typeof payload === 'object' && 'data' in payload
      ? (payload as { data?: unknown }).data
      : undefined;
  if (!isCompleteSurahData(data) || data.number !== surahNumber) {
    throw new QuranDownloadError('invalid-data', say('Data Surah tidak lengkap.', 'The surah data is incomplete.'));
  }

  if (!(await saveCachedSurah(data))) {
    throw new QuranDownloadError('storage', say('Surah tidak dapat disimpan di perangkat.', 'Could not save the surah on this device.'));
  }

  return data;
}
