import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearGlobalQuranSearchCorpus } from '@/lib/storage/quran-offline';
import { initializeGlobalQuranSearchCorpus } from '@/lib/quran/search/corpus';
import { SURAH_LIST } from '@/lib/quran/surah-list';
import { normalizeArabicText, normalizeSearchText } from '@/lib/quran/search/normalize';
import type { QuranSearchRecord } from '@/lib/quran/search/types';

function createCompleteCorpus(): QuranSearchRecord[] {
  return SURAH_LIST.map((surah) => ({
    id: `${surah.number}:1`,
    surahNumber: surah.number,
    surahName: surah.name,
    surahNameArabic: surah.arabicName,
    ayahNumber: 1,
    arabic: 'الله',
    arabicNormalized: normalizeArabicText('الله'),
    translation: 'Allah bersama orang-orang yang sabar.',
    translationNormalized: normalizeSearchText('Allah bersama orang-orang yang sabar.'),
    indexedAt: 1,
    schemaVersion: 1,
  }));
}

describe('global Quran search corpus', () => {
  beforeEach(async () => {
    await clearGlobalQuranSearchCorpus();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('builds a complete corpus once and reuses the cached copy', async () => {
    const records = createCompleteCorpus();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          records,
          indexedSurahs: 114,
          totalSurahs: 114,
          isComplete: true,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const [first, concurrent] = await Promise.all([
      initializeGlobalQuranSearchCorpus(),
      initializeGlobalQuranSearchCorpus(),
    ]);
    expect(first.metadata?.isComplete).toBe(true);
    expect(concurrent.records).toHaveLength(114);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const cached = await initializeGlobalQuranSearchCorpus();
    expect(cached.source).toBe('cache');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
