import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  clearCachedSurahs,
  deleteCachedSurah,
  getCachedSurahNumbers,
  saveCachedSurah,
  getCachedSurah,
  migrateLegacySurahCache,
  getBookmarkedAyahs,
  toggleBookmarkAyah,
  SavedAyah,
} from '@/lib/storage/quran-offline';
import { SurahDetail } from '@/types';

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
  });

  it('clears all IndexedDB records', async () => {
    expect(await saveCachedSurah(mockSurah)).toBe(true);
    expect(await saveCachedSurah({ ...mockSurah, number: 2, name: 'Al-Baqarah' })).toBe(true);
    expect(await clearCachedSurahs()).toBe(true);
    expect(await getCachedSurahNumbers()).toEqual([]);
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
      expect(localStorage.getItem('sholatku_cached_surah_1')).not.toBeNull();
      expect((await getCachedSurah(1))?.name).toBe('Al-Fatihah');
    } finally {
      (globalThis as any).indexedDB = originalIndexedDb;
    }
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
});
