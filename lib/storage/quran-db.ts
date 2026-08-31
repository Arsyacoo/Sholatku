import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { SurahDetail } from '@/types';

export const QURAN_DB_NAME = 'sholatku';
export const QURAN_DB_VERSION = 2;
export const QURAN_DATA_SCHEMA_VERSION = 1;
export const QURAN_STORE_NAME = 'surahs';
export const QURAN_METADATA_STORE_NAME = 'surahMetadata';
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
      typeof ayah.arabText === 'string' &&
      typeof ayah.latinText === 'string' &&
      typeof ayah.translation === 'string' &&
      isObject(ayah.audio)
    );
  });
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
    return isValidRecord(saved, surah.number) && isValidInfo(savedInfo, surah.number);
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
    return true;
  } catch {
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
