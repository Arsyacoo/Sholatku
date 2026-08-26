import { describe, it, expect } from 'vitest';
import { SURAH_LIST, searchSurahs } from '@/lib/quran/surah-list';
import { JUZ_LIST } from '@/lib/quran/juz-list';

describe('Quran Catalog & Data Module', () => {
  it('contains exactly 114 surahs in the catalog', () => {
    expect(SURAH_LIST.length).toBe(114);
    expect(SURAH_LIST[0].name).toBe('Al-Fatihah');
    expect(SURAH_LIST[0].numberOfAyahs).toBe(7);
    expect(SURAH_LIST[113].name).toBe('An-Nas');
  });

  it('searches surahs by Latin name accurately', () => {
    const kahf = searchSurahs('kahf');
    expect(kahf.length).toBe(1);
    expect(kahf[0].number).toBe(18);
    expect(kahf[0].name).toBe('Al-Kahf');

    const yasin = searchSurahs('yasin');
    expect(yasin.length).toBe(1);
    expect(yasin[0].number).toBe(36);
  });

  it('searches surahs by number accurately', () => {
    const s112 = searchSurahs('112');
    expect(s112.length).toBe(1);
    expect(s112[0].name).toBe('Al-Ikhlas');
  });

  it('searches surahs by Indonesian translation/meaning', () => {
    const sapi = searchSurahs('sapi');
    expect(sapi.some((s) => s.name === 'Al-Baqarah')).toBe(true);

    const fajar = searchSurahs('fajar');
    expect(fajar.some((s) => s.name === 'Al-Fajr')).toBe(true);
  });

  it('contains valid 30 Juz mapping', () => {
    expect(JUZ_LIST.length).toBe(30);
    expect(JUZ_LIST[0].juzNumber).toBe(1);
    expect(JUZ_LIST[0].startSurahName).toBe('Al-Fatihah');
    expect(JUZ_LIST[29].juzNumber).toBe(30);
    expect(JUZ_LIST[29].startSurahName).toBe('An-Naba\'');
  });
});
