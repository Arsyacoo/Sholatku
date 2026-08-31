import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { openDB } from 'idb';
import {
  clearCachedSurahs,
  deleteCachedSurah,
  getAllCachedSurahInfo,
  getCachedSurahCount,
  getCachedSurahInfo,
  getCachedSurahNumbers,
  getCompleteCachedSurahNumbers,
  getEstimatedQuranCacheSize,
  saveCachedSurah,
  getCachedSurah,
  isSurahCached,
  migrateLegacySurahCache,
  getBookmarkedAyahs,
  toggleBookmarkAyah,
  SavedAyah,
  getAllQuranSearchRecords,
  getGlobalQuranSearchCorpus,
  saveGlobalQuranSearchCorpus,
  clearGlobalQuranSearchCorpus,
  ensureQuranSearchIndex,
  getQuranSearchCoverage,
  rebuildQuranSearchIndex,
} from '@/lib/storage/quran-offline';
import { QURAN_DB_NAME, QURAN_DB_VERSION, QURAN_SEARCH_STORE_NAME } from '@/lib/storage/quran-db';
import {
  getFavoriteSurahs,
  getLastRead,
  getQuranSettings,
  saveLastRead,
  saveQuranSettings,
  toggleFavoriteSurah,
} from '@/lib/storage/quran-preferences';
import { SurahDetail } from '@/types';
import { createQuranSearchRecords } from '@/lib/quran/search/index-record';

// Mock localStorage in Node environment
const mockStorage: Record<string, string> = {};
beforeAll(() => {
  const storage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = val;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    },
    get length() {
      return Object.keys(mockStorage).length;
    },
    key: (i: number) => Object.keys(mockStorage)[i] ?? null,
  } as Storage;
  (globalThis as any).localStorage = storage;
  (globalThis as any).window = {};
});

const mockSurah: SurahDetail = {
  number: 1,
  name: 'Al-Fatihah',
  arabicName: 'الفاتحة',
  translation: 'Pembukaan',
  numberOfAyahs: 7,
  revelation: 'Makkiyah',
  ayahs: [
    {
      numberInSurah: 1,
      numberInQuran: 1,
      arabText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      latinText: 'Bismillāhir-raḥmānir-raḥīm',
      translation: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.',
      juz: 1,
      audio: {},
    },
  ],
};

describe('Quran Offline Storage & Bookmark Manager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  beforeEach(async () => {
    await clearCachedSurahs();
    await clearGlobalQuranSearchCorpus();
  });

  it('saves and retrieves cached surah for offline mode', async () => {
    expect(await getCachedSurah(1)).toBeNull();
    expect(await saveCachedSurah(mockSurah)).toBe(true);
    const cached = await getCachedSurah(1);
    expect(cached).not.toBeNull();
    expect(cached?.name).toBe('Al-Fatihah');
    expect(cached?.ayahs.length).toBe(1);
  });

  it('updates an existing record and enumerates and deletes it', async () => {
    expect(await saveCachedSurah(mockSurah)).toBe(true);
    const updated = { ...mockSurah, name: 'Al-Fatihah Updated' };
    expect(await saveCachedSurah(updated)).toBe(true);
    expect((await getCachedSurah(1))?.name).toBe('Al-Fatihah Updated');
    expect(await getCachedSurahNumbers()).toEqual([1]);
    expect(await deleteCachedSurah(1)).toBe(true);
    expect(await getCachedSurah(1)).toBeNull();
    expect(await getCachedSurahNumbers()).toEqual([]);
    expect(await isSurahCached(1)).toBe(false);
  });

  it('exposes lightweight metadata, count, and estimated size', async () => {
    expect(await saveCachedSurah(mockSurah)).toBe(true);
    const info = await getCachedSurahInfo(1);
    expect(info?.surahNumber).toBe(1);
    expect(info?.estimatedSize).toBeGreaterThan(0);
    expect(await isSurahCached(1)).toBe(true);
    expect(await getCachedSurahCount()).toBe(1);
    expect(await getAllCachedSurahInfo()).toHaveLength(1);
    expect(await getEstimatedQuranCacheSize()).toBe(info?.estimatedSize);
    expect(await getCompleteCachedSurahNumbers()).toEqual([]);
  });

  it('creates compact derived search records and replaces them on update', async () => {
    expect(await saveCachedSurah(mockSurah)).toBe(true);
    const firstRecords = await getAllQuranSearchRecords();
    expect(firstRecords).toHaveLength(1);
    expect(firstRecords[0]).toMatchObject({
      id: '1:1',
      surahNumber: 1,
      ayahNumber: 1,
      surahName: 'Al-Fatihah',
      translation: mockSurah.ayahs[0].translation,
      schemaVersion: 1,
    });
    expect(firstRecords[0]).not.toHaveProperty('audio');

    await saveCachedSurah({
      ...mockSurah,
      ayahs: [{ ...mockSurah.ayahs[0], translation: 'Terjemahan diperbarui.' }],
    });
    const updatedRecords = await getAllQuranSearchRecords();
    expect(updatedRecords).toHaveLength(1);
    expect(updatedRecords[0].translation).toBe('Terjemahan diperbarui.');
  });

  it('keeps the independent global corpus when Reader downloads are cleared', async () => {
    const records = createQuranSearchRecords(mockSurah, 1);
    expect(
      await saveGlobalQuranSearchCorpus(records, {
        schemaVersion: 1,
        cachedAt: 1,
        indexedSurahs: 1,
        totalSurahs: 114,
        isComplete: false,
        totalRecords: records.length,
      })
    ).toBe(true);

    expect(await clearCachedSurahs()).toBe(true);
    const corpus = await getGlobalQuranSearchCorpus();
    expect(corpus.records).toHaveLength(records.length);
    expect(corpus.metadata?.indexedSurahs).toBe(1);
  });

  it('removes search records with a Surah and clears the derived index with Quran data', async () => {
    expect(await saveCachedSurah(mockSurah)).toBe(true);
    expect((await getQuranSearchCoverage()).indexedSurahs).toBe(1);
    expect(await deleteCachedSurah(1)).toBe(true);
    expect(await getAllQuranSearchRecords()).toEqual([]);

    expect(await saveCachedSurah(mockSurah)).toBe(true);
    expect(await clearCachedSurahs()).toBe(true);
    expect(await getAllQuranSearchRecords()).toEqual([]);
    expect((await getQuranSearchCoverage()).indexedSurahs).toBe(0);
  });

  it('rebuilds the derived index from cached Surah data without re-downloading', async () => {
    expect(await saveCachedSurah(mockSurah)).toBe(true);
    const db = await openDB(QURAN_DB_NAME, QURAN_DB_VERSION);
    await db.clear(QURAN_SEARCH_STORE_NAME);
    db.close();

    expect(await getAllQuranSearchRecords()).toEqual([]);
    expect(await rebuildQuranSearchIndex()).toBe(true);
    expect(await getAllQuranSearchRecords()).toHaveLength(1);
    expect(await getCachedSurah(1)).not.toBeNull();
  });

  it('recovers a corrupt or old-version search record without deleting Quran data', async () => {
    expect(await saveCachedSurah(mockSurah)).toBe(true);
    const db = await openDB(QURAN_DB_NAME, QURAN_DB_VERSION);
    await db.put(
      QURAN_SEARCH_STORE_NAME,
      { id: '1:1', surahNumber: 1, ayahNumber: 1, schemaVersion: 99 },
      '1:1'
    );
    db.close();

    expect(await ensureQuranSearchIndex()).toBe(true);
    expect(await getAllQuranSearchRecords()).toHaveLength(1);
    expect((await getCachedSurah(1))?.name).toBe('Al-Fatihah');
  });

  it('clears all IndexedDB records', async () => {
    expect(await saveCachedSurah(mockSurah)).toBe(true);
    expect(await saveCachedSurah({ ...mockSurah, number: 2, name: 'Al-Baqarah' })).toBe(true);
    localStorage.setItem('sholatku_theme_mode', 'dark');
    expect(await clearCachedSurahs()).toBe(true);
    expect(await getCachedSurahNumbers()).toEqual([]);
    expect(localStorage.getItem('sholatku_theme_mode')).toBe('dark');
  });

  it('migrates all valid legacy entries when no surah number is supplied', async () => {
    localStorage.setItem('sholatku_cached_surah_1', JSON.stringify(mockSurah));
    localStorage.setItem(
      'sholatku_cached_surah_2',
      JSON.stringify({ ...mockSurah, number: 2, name: 'Al-Baqarah' })
    );

    expect(await migrateLegacySurahCache()).toEqual({ migrated: 2, skipped: 0, failed: 0 });
    expect(await getCachedSurahNumbers()).toEqual([1, 2]);
    expect(localStorage.getItem('sholatku_cached_surah_1')).toBeNull();
    expect(localStorage.getItem('sholatku_cached_surah_2')).toBeNull();
  });

  it('migrates a legacy entry and preserves unrelated localStorage keys', async () => {
    localStorage.setItem('sholatku_cached_surah_1', JSON.stringify(mockSurah));
    localStorage.setItem('sholatku_theme_mode', 'dark');

    const result = await migrateLegacySurahCache(1);
    expect(result).toEqual({ migrated: 1, skipped: 0, failed: 0 });
    expect(localStorage.getItem('sholatku_cached_surah_1')).toBeNull();
    expect(localStorage.getItem('sholatku_theme_mode')).toBe('dark');
    expect((await getCachedSurah(1))?.name).toBe('Al-Fatihah');
  });

  it('is idempotent when migration is run more than once', async () => {
    localStorage.setItem('sholatku_cached_surah_1', JSON.stringify(mockSurah));
    expect(await migrateLegacySurahCache(1)).toEqual({ migrated: 1, skipped: 0, failed: 0 });
    expect(await migrateLegacySurahCache(1)).toEqual({ migrated: 0, skipped: 0, failed: 0 });
    expect((await getCachedSurah(1))?.number).toBe(1);
  });

  it('does not remove corrupt legacy data', async () => {
    localStorage.setItem('sholatku_cached_surah_1', '{not-json');
    const result = await migrateLegacySurahCache(1);
    expect(result.failed).toBe(1);
    expect(localStorage.getItem('sholatku_cached_surah_1')).toBe('{not-json');
  });

  it('keeps legacy data when IndexedDB is unavailable', async () => {
    localStorage.setItem('sholatku_cached_surah_1', JSON.stringify(mockSurah));
    const originalIndexedDb = (globalThis as any).indexedDB;
    (globalThis as any).indexedDB = undefined;
    try {
      expect(await migrateLegacySurahCache(1)).toEqual({ migrated: 0, skipped: 0, failed: 1 });
      expect(await saveCachedSurah(mockSurah)).toBe(false);
      expect(await getCachedSurahNumbers()).toEqual([]);
      expect(localStorage.getItem('sholatku_cached_surah_1')).not.toBeNull();
      expect((await getCachedSurah(1))?.name).toBe('Al-Fatihah');
    } finally {
      (globalThis as any).indexedDB = originalIndexedDb;
    }
  });

  it('rejects malformed Surah records without throwing', async () => {
    const malformed = { ...mockSurah, ayahs: [{ numberInSurah: 1 }] } as unknown as SurahDetail;
    expect(await saveCachedSurah(malformed)).toBe(false);
    expect(await getCachedSurah(1)).toBeNull();
  });

  it('toggles individual ayah bookmark correctly', () => {
    const ayahToBookmark: SavedAyah = {
      surahNumber: 1,
      surahName: 'Al-Fatihah',
      ayahNumber: 1,
      arabText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      translation: 'Dengan nama Allah...',
      timestamp: Date.now(),
    };

    // Add bookmark
    const result1 = toggleBookmarkAyah(ayahToBookmark);
    expect(result1.isBookmarked).toBe(true);
    expect(result1.list.length).toBe(1);

    // Remove bookmark
    const result2 = toggleBookmarkAyah(ayahToBookmark);
    expect(result2.isBookmarked).toBe(false);
    expect(result2.list.length).toBe(0);
  });

  it('deletes Quran cache without touching bookmarks, favorites, last read, or settings', async () => {
    const ayahToBookmark: SavedAyah = {
      surahNumber: 1,
      surahName: 'Al-Fatihah',
      ayahNumber: 1,
      arabText: mockSurah.ayahs[0].arabText,
      translation: mockSurah.ayahs[0].translation,
      timestamp: Date.now(),
    };
    toggleBookmarkAyah(ayahToBookmark);
    saveLastRead({ surahNumber: 1, surahName: 'Al-Fatihah', ayahNumber: 1, timestamp: Date.now() });
    toggleFavoriteSurah(114);
    saveQuranSettings({ ...getQuranSettings(), audioVolume: 42, audioMuted: true, playbackRate: 0.5 });

    await saveCachedSurah(mockSurah);
    expect(await deleteCachedSurah(1)).toBe(true);
    await saveCachedSurah(mockSurah);
    expect(await clearCachedSurahs()).toBe(true);

    expect(getBookmarkedAyahs()).toHaveLength(1);
    expect(getFavoriteSurahs()).toContain(114);
    expect(getLastRead()?.surahNumber).toBe(1);
    expect(getQuranSettings().audioVolume).toBe(42);
    expect(getQuranSettings().audioMuted).toBe(true);
    expect(getQuranSettings().playbackRate).toBe(0.5);
  });
});
