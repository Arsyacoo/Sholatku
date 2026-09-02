import {
  getGlobalQuranSearchCorpus,
  saveGlobalQuranSearchCorpus,
} from '@/lib/storage/quran-db';
import {
  QURAN_SEARCH_CORPUS_SCHEMA_VERSION,
  type QuranSearchCorpusMetadata,
  type QuranSearchRecord,
} from './types';
import { fetchWithTimeout, NETWORK_TIMEOUTS, readJsonResponse } from '@/lib/network/fetch';

export interface GlobalQuranSearchCorpusState {
  records: QuranSearchRecord[];
  metadata: QuranSearchCorpusMetadata | null;
  source: 'cache' | 'network' | 'none';
  error?: string;
}

let inFlightInitialization: Promise<GlobalQuranSearchCorpusState> | null = null;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Pencarian seluruh ayat belum dapat dimuat.';
}

function toMetadata(data: Record<string, unknown>, totalRecords: number): QuranSearchCorpusMetadata | null {
  const indexedSurahs = data.indexedSurahs;
  const totalSurahs = data.totalSurahs;
  const isComplete = data.isComplete;
  if (
    !Number.isInteger(indexedSurahs) ||
    !Number.isInteger(totalSurahs) ||
    typeof isComplete !== 'boolean' ||
    totalSurahs !== 114
  ) {
    return null;
  }
  const validIndexedSurahs = indexedSurahs as number;
  const validTotalSurahs = totalSurahs as number;
  return {
    schemaVersion: QURAN_SEARCH_CORPUS_SCHEMA_VERSION,
    cachedAt: Date.now(),
    indexedSurahs: validIndexedSurahs,
    totalSurahs: validTotalSurahs,
    isComplete,
    totalRecords,
  };
}

async function initialize(): Promise<GlobalQuranSearchCorpusState> {
  const cached = await getGlobalQuranSearchCorpus();
  if (cached.metadata?.isComplete) return { ...cached, source: 'cache' };

  try {
    const response = await fetchWithTimeout('/api/quran/search-corpus', {
      timeoutMs: NETWORK_TIMEOUTS.quranCorpusRoute,
      rejectHttpErrors: false,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Pencarian seluruh ayat belum dapat dimuat.');
    const payload: unknown = await readJsonResponse(response);
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('data' in payload) ||
      typeof payload.data !== 'object' ||
      payload.data === null ||
      !('records' in payload.data) ||
      !Array.isArray(payload.data.records)
    ) {
      throw new Error('Data pencarian Al-Quran tidak valid.');
    }

    const data = payload.data as Record<string, unknown>;
    const records = data.records as QuranSearchRecord[];
    const metadata = toMetadata(data, records.length);
    if (!metadata || records.length === 0) throw new Error('Pencarian seluruh ayat belum dapat dimuat.');
    if (!(await saveGlobalQuranSearchCorpus(records, metadata))) {
      throw new Error('Pencarian seluruh ayat belum dapat disimpan.');
    }
    return { records, metadata, source: 'network' };
  } catch (error) {
    return {
      records: cached.records,
      metadata: cached.metadata,
      source: cached.records.length > 0 ? 'cache' : 'none',
      error: errorMessage(error),
    };
  }
}

/** Builds the global corpus at most once at a time and reuses the IndexedDB copy. */
export function initializeGlobalQuranSearchCorpus(): Promise<GlobalQuranSearchCorpusState> {
  if (!inFlightInitialization) {
    inFlightInitialization = initialize().finally(() => {
      inFlightInitialization = null;
    });
  }
  return inFlightInitialization;
}
