import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCachedSurah, clearCachedSurahs } from '@/lib/storage/quran-db';
import type { SurahDetail } from '@/types';
import { downloadSurahText } from '@/lib/quran/offline-download';

const surah: SurahDetail = {
  number: 1,
  name: 'Al-Fatihah',
  arabicName: 'الفاتحة',
  translation: 'Pembukaan',
  numberOfAyahs: 1,
  revelation: 'Makkiyah',
  ayahs: [
    {
      numberInSurah: 1,
      numberInQuran: 1,
      arabText: 'بِسْمِ اللَّهِ',
      latinText: 'Bismillah',
      translation: 'Dengan nama Allah',
      juz: 1,
      audio: {},
    },
  ],
};

describe('Quran offline Surah downloader', () => {
  beforeEach(async () => {
    await clearCachedSurahs();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('validates, saves, and reuses a cached Surah without refetching it', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: surah }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(downloadSurahText(1)).resolves.toEqual(surah);
    await expect(downloadSurahText(1)).resolves.toEqual(surah);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await getCachedSurah(1)).not.toBeNull();
  });

  it('returns user-safe errors for network and invalid API responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('socket details')));
    await expect(downloadSurahText(2)).rejects.toMatchObject({
      code: 'network',
      message: 'Koneksi internet tidak tersedia.',
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { number: 2 } }),
    }));
    await expect(downloadSurahText(2)).rejects.toMatchObject({
      code: 'invalid-data',
      message: 'Data Surah tidak lengkap.',
    });
  });

  it('handles IndexedDB write failure without exposing storage internals', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: surah }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const originalIndexedDb = (globalThis as { indexedDB?: IDBFactory }).indexedDB;
    (globalThis as { indexedDB?: IDBFactory }).indexedDB = undefined;
    try {
      await expect(downloadSurahText(1)).rejects.toMatchObject({
        code: 'storage',
        message: 'Surah tidak dapat disimpan di perangkat.',
      });
    } finally {
      (globalThis as { indexedDB?: IDBFactory }).indexedDB = originalIndexedDb;
    }
  });
});
