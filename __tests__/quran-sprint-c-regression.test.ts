import { describe, expect, it } from 'vitest';
import { searchQuran } from '@/lib/quran/search/search';
import { SURAH_LIST } from '@/lib/quran/surah-list';
import type { QuranSearchRecord } from '@/lib/quran/search/types';

function ayahRecord(surahNumber: number, ayahNumber: number, translation: string): QuranSearchRecord {
  return {
    id: `${surahNumber}:${ayahNumber}`,
    surahNumber,
    surahName: SURAH_LIST[surahNumber - 1].name,
    surahNameArabic: SURAH_LIST[surahNumber - 1].arabicName,
    ayahNumber,
    arabic: 'اللَّهُ',
    arabicNormalized: 'الله',
    translation,
    translationNormalized: translation.toLowerCase(),
    indexedAt: 1,
    schemaVersion: 1,
  };
}

describe('Hardening Sprint C Quran regressions', () => {
  it('finds Ali Imran from bundled metadata with no downloaded Ayahs', () => {
    const result = searchQuran([], 'imran', { surahs: SURAH_LIST });
    expect(result.surahs).toHaveLength(1);
    expect(result.surahs[0]).toMatchObject({ surahNumber: 3, surahName: "Ali 'Imran" });
  });

  it('finds a bounded local Ayah result without requiring a corpus download', () => {
    const records = Array.from({ length: 35 }, (_, index) => ayahRecord(2, index + 1, 'Ayat sabar'));
    const result = searchQuran(records, 'sabar', {
      limit: 20,
      surahs: SURAH_LIST,
      coverage: { mode: 'offline', completeness: 'partial', indexedSurahs: 1, totalSurahs: 114, isComplete: false },
    });
    expect(result.ayahs).toHaveLength(20);
    expect(result.hasMore).toBe(true);
  });

  it('keeps direct 2:255 references safe before Reader data is downloaded', () => {
    const result = searchQuran([], '2:255', { surahs: SURAH_LIST });
    expect(result.directReference).toMatchObject({
      surahNumber: 2,
      ayahNumber: 255,
      readerAvailableOffline: false,
    });
  });

  it('never labels a translation-only search record as Tafsir', () => {
    const result = searchQuran([ayahRecord(2, 153, 'Sesungguhnya Allah bersama orang-orang yang sabar.')], 'sabar', {
      surahs: SURAH_LIST,
    });
    expect(result.ayahs[0]).not.toHaveProperty('tafsir');
    expect(result.ayahs[0].matchType).toBe('translation');
  });
});
