import { describe, expect, it } from 'vitest';
import { searchQuran } from '@/lib/quran/search/search';
import { SURAH_LIST } from '@/lib/quran/surah-list';
import { normalizeSearchText } from '@/lib/quran/search/normalize';
import type { QuranSearchRecord } from '@/lib/quran/search/types';

function record(surahNumber: number, ayahNumber: number): QuranSearchRecord {
  const translation = 'Orang-orang yang sabar.';
  return {
    id: `${surahNumber}:${ayahNumber}`,
    surahNumber,
    surahName: SURAH_LIST[surahNumber - 1].name,
    ayahNumber,
    arabic: 'صَبْر',
    arabicNormalized: 'صبر',
    translation,
    translationNormalized: normalizeSearchText(translation),
    indexedAt: 1,
    schemaVersion: 1,
  };
}

describe('Quran search coverage states', () => {
  it('models zero offline Ayah records as metadata-only', () => {
    const response = searchQuran([], 'sabar', { surahs: SURAH_LIST });
    expect(response.coverage).toMatchObject({
      mode: 'metadata-only',
      completeness: 'surah-only',
      indexedSurahs: 0,
      isComplete: false,
    });
    expect(response.ayahs).toEqual([]);
  });

  it('models a local index covering some Surahs as partial', () => {
    const response = searchQuran([record(2, 153)], 'sabar', {
      surahs: SURAH_LIST,
      coverage: {
        mode: 'offline',
        completeness: 'partial',
        indexedSurahs: 1,
        totalSurahs: 114,
        isComplete: false,
      },
    });
    expect(response.coverage.completeness).toBe('partial');
    expect(response.coverage.isComplete).toBe(false);
    expect(response.ayahs).toHaveLength(1);
  });

  it('keeps online complete coverage independent from local records', () => {
    const response = searchQuran([record(2, 153)], 'sabar', {
      surahs: SURAH_LIST,
      coverage: {
        mode: 'online',
        completeness: 'complete',
        indexedSurahs: 114,
        totalSurahs: 114,
        isComplete: true,
      },
    });
    expect(response.coverage).toMatchObject({ mode: 'online', completeness: 'complete' });
  });
});
