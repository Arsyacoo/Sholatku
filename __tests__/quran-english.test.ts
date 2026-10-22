import { describe, expect, it } from 'vitest';
import { searchSurahMetadata } from '@/lib/quran/search/surah-search';
import { SURAH_LIST, searchSurahs } from '@/lib/quran/surah-list';

describe('English surah meanings', () => {
  it('has an English meaning for every surah', () => {
    expect(SURAH_LIST.every((surah) => surah.translationEn)).toBe(true);
    expect(SURAH_LIST[0].translationEn).toBe('The Opening');
  });

  it('finds surahs by their English meaning', () => {
    expect(searchSurahMetadata(SURAH_LIST, 'cow')[0]?.surahNumber).toBe(2);
    expect(searchSurahs('the cow').map((surah) => surah.number)).toContain(2);
  });
});
