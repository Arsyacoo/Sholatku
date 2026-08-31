import { describe, expect, it } from 'vitest';
import { normalizeArabicText, normalizeSearchText } from '@/lib/quran/search/normalize';
import { parseAyahReference } from '@/lib/quran/search/parser';
import { searchQuran } from '@/lib/quran/search/search';
import type { QuranSearchRecord } from '@/lib/quran/search/types';

const records: QuranSearchRecord[] = [
  {
    id: '2:153',
    surahNumber: 2,
    surahName: 'Al-Baqarah',
    surahNameArabic: 'البقرة',
    ayahNumber: 153,
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا',
    arabicNormalized: normalizeArabicText('يَا أَيُّهَا الَّذِينَ آمَنُوا'),
    translation: 'Sesungguhnya Allah bersama orang-orang yang sabar.',
    translationNormalized: normalizeSearchText('Sesungguhnya Allah bersama orang-orang yang sabar.'),
    indexedAt: 1,
    schemaVersion: 1,
  },
  {
    id: '2:255',
    surahNumber: 2,
    surahName: 'Al-Baqarah',
    surahNameArabic: 'البقرة',
    ayahNumber: 255,
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ',
    arabicNormalized: normalizeArabicText('اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ'),
    translation: 'Allah, tidak ada tuhan selain Dia.',
    translationNormalized: normalizeSearchText('Allah, tidak ada tuhan selain Dia.'),
    indexedAt: 1,
    schemaVersion: 1,
  },
  {
    id: '18:1',
    surahNumber: 18,
    surahName: 'Al-Kahf',
    surahNameArabic: 'الكهف',
    ayahNumber: 1,
    arabic: 'الْحَمْدُ لِلَّهِ',
    arabicNormalized: normalizeArabicText('الْحَمْدُ لِلَّهِ'),
    translation: 'Segala puji bagi Allah.',
    translationNormalized: normalizeSearchText('Segala puji bagi Allah.'),
    indexedAt: 1,
    schemaVersion: 1,
  },
];

describe('Quran search engine', () => {
  it('normalizes Latin whitespace/case and Arabic harakat without changing source text', () => {
    expect(normalizeSearchText('  Al-Kahf  ')).toBe('al kahf');
    expect(normalizeArabicText('اللَّهُ')).toBe('الله');
    expect(records[1].arabic).toBe('اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ');
  });

  it('parses valid references and rejects invalid Surah or Ayah values', () => {
    expect(parseAyahReference(' 2:255 ')).toEqual({ surahNumber: 2, ayahNumber: 255 });
    expect(parseAyahReference('0:1')).toBeNull();
    expect(parseAyahReference('115:1')).toBeNull();
    expect(parseAyahReference('2:9999')).toBeNull();
  });

  it('prioritizes exact Surah matches over Ayah text matches', () => {
    const result = searchQuran(records, 'al kahf');
    expect(result.results[0]).toMatchObject({ kind: 'surah', surahNumber: 18, matchType: 'surah' });
  });

  it('searches Indonesian translation and Arabic text without harakat', () => {
    expect(searchQuran(records, 'sabar').results).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: '2:153', matchType: 'translation' })])
    );
    expect(searchQuran(records, 'الله').results).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: '2:255', matchType: 'arabic' })])
    );
  });

  it('returns direct references, bounded pages, and honest empty-query states', () => {
    expect(searchQuran(records, '2:255').results[0]).toMatchObject({ id: '2:255', matchType: 'reference' });
    expect(searchQuran(records, '2:9999').emptyReason).toBe('invalid-reference');
    expect(searchQuran(records, 'a').emptyReason).toBe('too-short');
    expect(searchQuran(records, '').emptyReason).toBe('empty');

    const page = searchQuran(records, 'allah', { limit: 1, offset: 0 });
    expect(page.results).toHaveLength(1);
    expect(page.hasMore).toBe(true);
    expect(page.coverage).toMatchObject({ indexedSurahs: 2, totalSurahs: 114, isComplete: false });
  });
});
