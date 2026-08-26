import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  saveCachedSurah,
  getCachedSurah,
  getBookmarkedAyahs,
  toggleBookmarkAyah,
  SavedAyah,
} from '@/lib/storage/quran-offline';
import { SurahDetail } from '@/types';

// Mock localStorage in Node environment
const mockStorage: Record<string, string> = {};
beforeAll(() => {
  global.localStorage = {
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
    length: 0,
    key: (i: number) => null,
  } as any;
  (global as any).window = {};
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

  it('saves and retrieves cached surah for offline mode', () => {
    expect(getCachedSurah(1)).toBeNull();
    saveCachedSurah(mockSurah);
    const cached = getCachedSurah(1);
    expect(cached).not.toBeNull();
    expect(cached?.name).toBe('Al-Fatihah');
    expect(cached?.ayahs.length).toBe(1);
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
