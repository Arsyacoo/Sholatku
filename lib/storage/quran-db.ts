import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { SurahDetail } from '@/types';
import { createQuranSearchRecords } from '@/lib/quran/search/index-record';
import {
  QURAN_SEARCH_CORPUS_SCHEMA_VERSION,
  QURAN_SEARCH_INDEX_SCHEMA_VERSION,
  type QuranSearchCoverage,
  type QuranSearchCorpusMetadata,
  type QuranSearchRecord,
} from '@/lib/quran/search/types';

export const QURAN_DB_NAME = 'sholatku';
export const QURAN_DB_VERSION = 4;
export const QURAN_DATA_SCHEMA_VERSION = 1;
export const QURAN_STORE_NAME = 'surahs';
export const QURAN_METADATA_STORE_NAME = 'surahMetadata';
export const QURAN_SEARCH_STORE_NAME = 'searchIndex';
export const QURAN_GLOBAL_CORPUS_STORE_NAME = 'globalSearchCorpus';
export const QURAN_GLOBAL_CORPUS_METADATA_STORE_NAME = 'globalSearchCorpusMetadata';
export const LEGACY_SURAH_CACHE_PREFIX = 'sholatku_cached_surah_';

export interface CachedSurahRecord {
  surahNumber: number;
  data: SurahDetail;
  cachedAt: number;
  schemaVersion: number;
  estimatedSize?: number;
}

export interface CachedSurahInfo {
  surahNumber: number;
  cachedAt: number;
  estimatedSize: number;
}

interface QuranDatabaseSchema extends DBSchema {
  surahs: {
    key: number;
    value: CachedSurahRecord;
  };
  surahMetadata: {
    key: number;
    value: CachedSurahInfo;
  };
  searchIndex: {
    key: string;
    value: QuranSearchRecord;
  };
  globalSearchCorpus: {
    key: string;
    value: QuranSearchRecord;
  };
  globalSearchCorpusMetadata: {
    key: string;
    value: QuranSearchCorpusMetadata;
  };
}

export interface MigrationResult {
  migrated: number;
  skipped: number;
  failed: number;
}

let databasePromise: Promise<IDBPDatabase<QuranDatabaseSchema> | null> | undefined;

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  try {
    return localStorage;
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function estimateSurahSize(surah: SurahDetail): number {
  try {
    const serialized = JSON.stringify(surah);
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(serialized).byteLength;
    }
    return serialized.length * 2;
  } catch {
    return 0;
  }
}

/** A deliberately conservative guard so corrupted cache data never reaches the reader. */
export function isValidSurahData(value: unknown): value is SurahDetail {
  if (!isObject(value)) return false;
  if (!Number.isInteger(value.number) || (value.number as number) < 1 || (value.number as number) > 114) return false;
  if (typeof value.name !== 'string' || typeof value.arabicName !== 'string') return false;
  if (typeof value.translation !== 'string') return false;
  if (!Number.isInteger(value.numberOfAyahs) || (value.numberOfAyahs as number) < 1) return false;
  if (value.revelation !== 'Makkiyah' && value.revelation !== 'Madaniyah') return false;
  if (!Array.isArray(value.ayahs) || value.ayahs.length === 0) return false;

  return value.ayahs.every((ayah) => {
    if (!isObject(ayah)) return false;
    return (
      Number.isInteger(ayah.numberInSurah) &&
      Number.isInteger(ayah.numberInQuran) &&
      (ayah.numberInQuran as number) >= 1 &&
      typeof ayah.arabText === 'string' &&
      typeof ayah.latinText === 'string' &&
      typeof ayah.translation === 'string' &&
      (ayah.tafsir === null || ayah.tafsir === undefined || (
        isObject(ayah.tafsir) &&
        typeof ayah.tafsir.text === 'string' &&
        typeof ayah.tafsir.source === 'string' &&
        ayah.tafsir.text.trim().length > 0 &&
        ayah.tafsir.source.trim().length > 0
      )) &&
      (ayah.juz === null || (
        Number.isInteger(ayah.juz) &&
        (ayah.juz as number) >= 1 &&
        (ayah.juz as number) <= 30
      )) &&
      isObject(ayah.audio)
    );
  });
}

export function isCompleteSurahData(value: unknown): value is SurahDetail {
  return isValidSurahData(value) && value.ayahs.length === value.numberOfAyahs;
}

function isValidRecord(value: unknown, surahNumber?: number): value is CachedSurahRecord {
  if (!isObject(value)) return false;
  return (
    Number.isInteger(value.surahNumber) &&
    (surahNumber === undefined || value.surahNumber === surahNumber) &&
    Number.isFinite(value.cachedAt) &&
    value.schemaVersion === QURAN_DATA_SCHEMA_VERSION &&
    isValidSurahData(value.data)
  );
}

function isValidInfo(value: unknown, surahNumber?: number): value is CachedSurahInfo {
  if (!isObject(value)) return false;
  return (
    Number.isInteger(value.surahNumber) &&
    (surahNumber === undefined || value.surahNumber === surahNumber) &&
    Number.isFinite(value.cachedAt) &&
    Number.isFinite(value.estimatedSize) &&
    (value.estimatedSize as number) >= 0
  );
}

function isValidSearchRecord(value: unknown): value is QuranSearchRecord {
  if (!isObject(value)) return false;
  const surahNumber = value.surahNumber;
  const ayahNumber = value.ayahNumber;
  return (
    typeof value.id === 'string' &&
    Number.isInteger(surahNumber) &&
    (surahNumber as number) >= 1 &&
    (surahNumber as number) <= 114 &&
    typeof value.surahName === 'string' &&
    (value.surahNameArabic === undefined || typeof value.surahNameArabic === 'string') &&
    Number.isInteger(ayahNumber) &&
    (ayahNumber as number) >= 1 &&
    typeof value.arabic === 'string' &&
    typeof value.arabicNormalized === 'string' &&
    typeof value.translation === 'string' &&
    typeof value.translationNormalized === 'string' &&
    Number.isFinite(value.indexedAt) &&
    value.schemaVersion === QURAN_SEARCH_INDEX_SCHEMA_VERSION
  );
}

function isValidCorpusMetadata(value: unknown): value is QuranSearchCorpusMetadata {
  if (!isObject(value)) return false;
  const indexedSurahs = value.indexedSurahs;
  const totalSurahs = value.totalSurahs;
  const totalRecords = value.totalRecords;
  return (
    value.schemaVersion === QURAN_SEARCH_CORPUS_SCHEMA_VERSION &&
    Number.isFinite(value.cachedAt) &&
    Number.isInteger(indexedSurahs) &&
    (indexedSurahs as number) >= 0 &&
    (indexedSurahs as number) <= 114 &&
    Number.isInteger(totalSurahs) &&
    totalSurahs === 114 &&
    Number.isInteger(totalRecords) &&
    (totalRecords as number) >= 0 &&
    value.isComplete === ((indexedSurahs as number) === totalSurahs)
  );
}

async function getDatabase(): Promise<IDBPDatabase<QuranDatabaseSchema> | null> {
  // Checking this before the memoized promise also lets callers gracefully
  // degrade if IndexedDB becomes unavailable during a private browsing session.
  if (typeof indexedDB === 'undefined') return null;
  if (databasePromise) return databasePromise;

  databasePromise = openDB<QuranDatabaseSchema>(QURAN_DB_NAME, QURAN_DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(QURAN_STORE_NAME)) {
        db.createObjectStore(QURAN_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(QURAN_METADATA_STORE_NAME)) {
        db.createObjectStore(QURAN_METADATA_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(QURAN_SEARCH_STORE_NAME)) {
        db.createObjectStore(QURAN_SEARCH_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(QURAN_GLOBAL_CORPUS_STORE_NAME)) {
        db.createObjectStore(QURAN_GLOBAL_CORPUS_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(QURAN_GLOBAL_CORPUS_METADATA_STORE_NAME)) {
        db.createObjectStore(QURAN_GLOBAL_CORPUS_METADATA_STORE_NAME);
      }
    },
  }).catch(() => {
    databasePromise = undefined;
    return null;
  });

  return databasePromise;
}

async function readIndexedSurah(surahNumber: number): Promise<SurahDetail | null> {
  const db = await getDatabase();
  if (!db) return null;

  try {
    const record = await db.get(QURAN_STORE_NAME, surahNumber);
    return isValidRecord(record, surahNumber) ? record.data : null;
  } catch {
    return null;
  }
}

async function saveToIndexedDb(surah: SurahDetail): Promise<boolean> {
  const db = await getDatabase();
  if (!db || !isValidSurahData(surah)) return false;

  const estimatedSize = estimateSurahSize(surah);
  const record: CachedSurahRecord = {
    surahNumber: surah.number,
    data: surah,
    cachedAt: Date.now(),
    schemaVersion: QURAN_DATA_SCHEMA_VERSION,
    estimatedSize,
  };
  const info: CachedSurahInfo = {
    surahNumber: surah.number,
    cachedAt: record.cachedAt,
    estimatedSize,
  };

  try {
    const transaction = db.transaction(
      [QURAN_STORE_NAME, QURAN_METADATA_STORE_NAME],
      'readwrite'
    );
    await transaction.objectStore(QURAN_STORE_NAME).put(record, surah.number);
    await transaction.objectStore(QURAN_METADATA_STORE_NAME).put(info, surah.number);
    await transaction.done;

    const saved = await db.get(QURAN_STORE_NAME, surah.number);
    const savedInfo = await db.get(QURAN_METADATA_STORE_NAME, surah.number);
    const primarySaved = isValidRecord(saved, surah.number) && isValidInfo(savedInfo, surah.number);
    if (!primarySaved) return false;

    // Search data is derived and intentionally isolated from the primary
    // transaction. An index failure must never make a healthy Surah disappear.
    await replaceSearchRecordsForSurah(surah);
    return true;
  } catch {
    return false;
  }
}

async function replaceSearchRecordsForSurah(surah: SurahDetail): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;
  try {
    const transaction = db.transaction(QURAN_SEARCH_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(QURAN_SEARCH_STORE_NAME);
    const keys = await store.getAllKeys();
    const prefix = `${surah.number}:`;
    for (const key of keys) {
      if (typeof key === 'string' && key.startsWith(prefix)) await store.delete(key);
    }
    for (const record of createQuranSearchRecords(surah)) await store.put(record, record.id);
    await transaction.done;
    return true;
  } catch {
    return false;
  }
}

async function removeSearchRecordsForSurah(surahNumber: number): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;
  try {
    const transaction = db.transaction(QURAN_SEARCH_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(QURAN_SEARCH_STORE_NAME);
    const keys = await store.getAllKeys();
    const prefix = `${surahNumber}:`;
    for (const key of keys) {
      if (typeof key === 'string' && key.startsWith(prefix)) await store.delete(key);
    }
    await transaction.done;
    return true;
  } catch {
    return false;
  }
}

async function clearSearchIndex(): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;
  try {
    const transaction = db.transaction(QURAN_SEARCH_STORE_NAME, 'readwrite');
    await transaction.objectStore(QURAN_SEARCH_STORE_NAME).clear();
    await transaction.done;
    return true;
  } catch {
    return false;
  }
}

function readLegacySurah(surahNumber: number): SurahDetail | null {
  const storage = getBrowserStorage();
  if (!storage || !Number.isInteger(surahNumber)) return null;

  try {
    const raw = storage.getItem(`${LEGACY_SURAH_CACHE_PREFIX}${surahNumber}`);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidSurahData(parsed) && parsed.number === surahNumber ? parsed : null;
  } catch {
    return null;
  }
}

function getLegacyEntries(surahNumber?: number): Array<{ key: string; number: number }> {
  const storage = getBrowserStorage();
  if (!storage) return [];

  if (surahNumber !== undefined) {
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) return [];
    const key = `${LEGACY_SURAH_CACHE_PREFIX}${surahNumber}`;
    try {
      return storage.getItem(key) === null ? [] : [{ key, number: surahNumber }];
    } catch {
      return [];
    }
  }

  const entries: Array<{ key: string; number: number }> = [];
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key?.startsWith(LEGACY_SURAH_CACHE_PREFIX)) continue;
      const number = Number(key.slice(LEGACY_SURAH_CACHE_PREFIX.length));
      if (Number.isInteger(number) && number > 0 && number <= 114) entries.push({ key, number });
    }
  } catch {
    return [];
  }
  return entries;
}

/**
 * Reads a cached surah from IndexedDB. Legacy localStorage is used as a
 * read-only fallback so an interrupted migration never blocks offline reading.
 */
export async function getCachedSurah(surahNumber: number): Promise<SurahDetail | null> {
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) return null;
  const indexed = await readIndexedSurah(surahNumber);
  return indexed ?? readLegacySurah(surahNumber);
}

/** Saves and read-verifies a surah record. Failures are intentionally non-fatal. */
export async function saveCachedSurah(surah: SurahDetail): Promise<boolean> {
  return saveToIndexedDb(surah);
}

export async function deleteCachedSurah(surahNumber: number): Promise<boolean> {
  const db = await getDatabase();
  if (!db || !Number.isInteger(surahNumber)) return false;
  try {
    const transaction = db.transaction(
      [QURAN_STORE_NAME, QURAN_METADATA_STORE_NAME],
      'readwrite'
    );
    await transaction.objectStore(QURAN_STORE_NAME).delete(surahNumber);
    await transaction.objectStore(QURAN_METADATA_STORE_NAME).delete(surahNumber);
    await transaction.done;
    await removeSearchRecordsForSurah(surahNumber);
    return true;
  } catch {
    return false;
  }
}

export async function getCachedSurahNumbers(): Promise<number[]> {
  const db = await getDatabase();
  if (!db) return [];
  try {
    const keys = await db.getAllKeys(QURAN_STORE_NAME);
    return keys
      .filter((key): key is number => typeof key === 'number' && Number.isInteger(key))
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/** Returns only complete Reader payloads; compact search data is independent. */
export async function getCompleteCachedSurahNumbers(): Promise<number[]> {
  const db = await getDatabase();
  if (!db) return [];
  try {
    const records = await db.getAll(QURAN_STORE_NAME);
    return records
      .filter((record) => isValidRecord(record) && record.data.ayahs.length === record.data.numberOfAyahs)
      .map((record) => record.surahNumber)
      .sort((left, right) => left - right);
  } catch {
    return [];
  }
}

export async function getCachedSurahInfo(surahNumber: number): Promise<CachedSurahInfo | null> {
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) return null;
  const db = await getDatabase();
  if (!db) return null;

  try {
    const metadata = await db.get(QURAN_METADATA_STORE_NAME, surahNumber);
    if (isValidInfo(metadata, surahNumber)) return metadata;

    // Records written by schema v1 predate the metadata store. Backfill one
    // record lazily, without requiring a destructive data migration.
    const record = await db.get(QURAN_STORE_NAME, surahNumber);
    if (!isValidRecord(record, surahNumber)) return null;

    const info: CachedSurahInfo = {
      surahNumber,
      cachedAt: record.cachedAt,
      estimatedSize:
        typeof record.estimatedSize === 'number'
          ? record.estimatedSize
          : estimateSurahSize(record.data),
    };
    if (!isValidInfo(info, surahNumber)) return null;

    try {
      await db.put(QURAN_METADATA_STORE_NAME, info, surahNumber);
    } catch {
      // Metadata is an optimization; the underlying Surah remains usable.
    }
    return info;
  } catch {
    return null;
  }
}

export async function getAllCachedSurahInfo(): Promise<CachedSurahInfo[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const metadata = (await db.getAll(QURAN_METADATA_STORE_NAME)).filter((item) =>
      isValidInfo(item)
    );
    const byNumber = new Map(metadata.map((item) => [item.surahNumber, item]));
    const keys = await db.getAllKeys(QURAN_STORE_NAME);

    // Lazily hydrate metadata for records created before schema v2.
    for (const key of keys) {
      if (typeof key !== 'number' || !Number.isInteger(key) || byNumber.has(key)) continue;
      const info = await getCachedSurahInfo(key);
      if (info) byNumber.set(key, info);
    }

    return [...byNumber.values()].sort((a, b) => a.surahNumber - b.surahNumber);
  } catch {
    return [];
  }
}

export async function isSurahCached(surahNumber: number): Promise<boolean> {
  return (await getCachedSurahInfo(surahNumber)) !== null;
}

export async function getCachedSurahCount(): Promise<number> {
  return (await getAllCachedSurahInfo()).length;
}

export async function getEstimatedQuranCacheSize(): Promise<number> {
  const infos = await getAllCachedSurahInfo();
  return infos.reduce((total, info) => total + info.estimatedSize, 0);
}

export async function clearCachedSurahs(): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;
  try {
    const transaction = db.transaction(
      [QURAN_STORE_NAME, QURAN_METADATA_STORE_NAME],
      'readwrite'
    );
    await transaction.objectStore(QURAN_STORE_NAME).clear();
    await transaction.objectStore(QURAN_METADATA_STORE_NAME).clear();
    await transaction.done;
    await clearSearchIndex();
    return true;
  } catch {
    return false;
  }
}

export async function getAllQuranSearchRecords(): Promise<QuranSearchRecord[]> {
  const db = await getDatabase();
  if (!db) return [];
  try {
    const records = await db.getAll(QURAN_SEARCH_STORE_NAME);
    return records.filter(isValidSearchRecord);
  } catch {
    return [];
  }
}

export interface CachedGlobalQuranSearchCorpus {
  records: QuranSearchRecord[];
  metadata: QuranSearchCorpusMetadata | null;
}

export async function getGlobalQuranSearchCorpus(): Promise<CachedGlobalQuranSearchCorpus> {
  const db = await getDatabase();
  if (!db) return { records: [], metadata: null };
  try {
    const [rawRecords, rawMetadata] = await Promise.all([
      db.getAll(QURAN_GLOBAL_CORPUS_STORE_NAME),
      db.get(QURAN_GLOBAL_CORPUS_METADATA_STORE_NAME, 'metadata'),
    ]);
    const records = rawRecords.filter(isValidSearchRecord);
    const metadata = isValidCorpusMetadata(rawMetadata) ? rawMetadata : null;
    if (!metadata || metadata.totalRecords !== records.length) {
      return { records, metadata: null };
    }
    return { records, metadata };
  } catch {
    return { records: [], metadata: null };
  }
}

export async function saveGlobalQuranSearchCorpus(
  records: QuranSearchRecord[],
  metadata: QuranSearchCorpusMetadata
): Promise<boolean> {
  const db = await getDatabase();
  if (!db || !isValidCorpusMetadata(metadata)) return false;
  const validRecords = records.filter(isValidSearchRecord);
  if (validRecords.length !== records.length || metadata.totalRecords !== validRecords.length) return false;

  try {
    const transaction = db.transaction(
      [QURAN_GLOBAL_CORPUS_STORE_NAME, QURAN_GLOBAL_CORPUS_METADATA_STORE_NAME],
      'readwrite'
    );
    const store = transaction.objectStore(QURAN_GLOBAL_CORPUS_STORE_NAME);
    await store.clear();
    for (const record of validRecords) await store.put(record, record.id);
    await transaction.objectStore(QURAN_GLOBAL_CORPUS_METADATA_STORE_NAME).put(metadata, 'metadata');
    await transaction.done;

    const saved = await getGlobalQuranSearchCorpus();
    return saved.metadata?.cachedAt === metadata.cachedAt && saved.records.length === validRecords.length;
  } catch {
    return false;
  }
}

export async function clearGlobalQuranSearchCorpus(): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;
  try {
    const transaction = db.transaction(
      [QURAN_GLOBAL_CORPUS_STORE_NAME, QURAN_GLOBAL_CORPUS_METADATA_STORE_NAME],
      'readwrite'
    );
    await transaction.objectStore(QURAN_GLOBAL_CORPUS_STORE_NAME).clear();
    await transaction.objectStore(QURAN_GLOBAL_CORPUS_METADATA_STORE_NAME).clear();
    await transaction.done;
    return true;
  } catch {
    return false;
  }
}

export async function ensureQuranSearchIndex(): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;
  try {
    const [rawRecords, cachedKeys] = await Promise.all([
      db.getAll(QURAN_SEARCH_STORE_NAME),
      db.getAllKeys(QURAN_STORE_NAME),
    ]);
    const validRecords = rawRecords.filter(isValidSearchRecord);
    const hasInvalidRecords = validRecords.length !== rawRecords.length;
    const indexedSurahs = new Set(validRecords.map((record) => record.surahNumber));
    const cachedSurahs = new Set(
      cachedKeys.filter((key): key is number => typeof key === 'number' && Number.isInteger(key))
    );
    const coverageMatches =
      indexedSurahs.size === cachedSurahs.size &&
      [...indexedSurahs].every((surahNumber) => cachedSurahs.has(surahNumber));

    if (hasInvalidRecords || !coverageMatches) return rebuildQuranSearchIndex();
    return true;
  } catch {
    // Search recovery is best-effort; never touch healthy primary Quran data.
    return false;
  }
}

export async function getQuranSearchCoverage(): Promise<QuranSearchCoverage> {
  const db = await getDatabase();
  if (!db) return {
    mode: 'metadata-only',
    completeness: 'surah-only',
    indexedSurahs: 0,
    totalSurahs: 114,
    isComplete: false,
  };
  try {
    const keys = await db.getAllKeys(QURAN_SEARCH_STORE_NAME);
    const indexedSurahs = new Set<number>();
    for (const key of keys) {
      if (typeof key !== 'string') continue;
      const [surahNumber] = key.split(':');
      const parsed = Number(surahNumber);
      if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 114) indexedSurahs.add(parsed);
    }
    const isComplete = indexedSurahs.size === 114;
    return {
      mode: indexedSurahs.size === 0 ? 'metadata-only' : 'offline',
      completeness: isComplete ? 'complete' : indexedSurahs.size > 0 ? 'partial' : 'surah-only',
      indexedSurahs: indexedSurahs.size,
      totalSurahs: 114,
      isComplete,
    };
  } catch {
    return {
      mode: 'metadata-only',
      completeness: 'surah-only',
      indexedSurahs: 0,
      totalSurahs: 114,
      isComplete: false,
    };
  }
}

export async function rebuildQuranSearchIndex(): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;
  try {
    const cachedRecords = (await db.getAll(QURAN_STORE_NAME)).filter((record) =>
      isValidRecord(record)
    );
    const searchRecords = cachedRecords.flatMap((record) => createQuranSearchRecords(record.data));
    const transaction = db.transaction(QURAN_SEARCH_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(QURAN_SEARCH_STORE_NAME);
    await store.clear();
    for (const record of searchRecords) await store.put(record, record.id);
    await transaction.done;
    return true;
  } catch {
    // Rebuild is derived-data maintenance; primary Quran records remain intact.
    return false;
  }
}

/**
 * Lazily migrates legacy localStorage entries. A key is removed only after an
 * IndexedDB write and read-back both succeed; unrelated keys are untouched.
 */
export async function migrateLegacySurahCache(surahNumber?: number): Promise<MigrationResult> {
  const storage = getBrowserStorage();
  const result: MigrationResult = { migrated: 0, skipped: 0, failed: 0 };
  if (!storage) return result;

  for (const entry of getLegacyEntries(surahNumber)) {
    let parsed: unknown;
    try {
      const raw = storage.getItem(entry.key);
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      result.failed += 1;
      continue;
    }

    if (!isValidSurahData(parsed) || parsed.number !== entry.number) {
      result.failed += 1;
      continue;
    }

    const existing = await readIndexedSurah(entry.number);
    const available = existing ?? (await saveToIndexedDb(parsed) ? await readIndexedSurah(entry.number) : null);
    if (!available) {
      result.failed += 1;
      continue;
    }

    try {
      storage.removeItem(entry.key);
      result[existing ? 'skipped' : 'migrated'] += 1;
    } catch {
      result.failed += 1;
    }
  }

  return result;
}
