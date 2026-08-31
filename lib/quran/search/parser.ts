import { SURAH_LIST } from '@/lib/quran/surah-list';

export interface QuranAyahReference {
  surahNumber: number;
  ayahNumber: number;
}

const REFERENCE_PATTERN = /^(\d+)\s*:\s*(\d+)$/;

export function parseAyahReference(query: string): QuranAyahReference | null {
  const match = query.trim().match(REFERENCE_PATTERN);
  if (!match) return null;

  const surahNumber = Number(match[1]);
  const ayahNumber = Number(match[2]);
  const surah = SURAH_LIST.find((item) => item.number === surahNumber);
  if (!surah || !Number.isInteger(ayahNumber) || ayahNumber < 1 || ayahNumber > surah.numberOfAyahs) {
    return null;
  }
  return { surahNumber, ayahNumber };
}

export function looksLikeAyahReference(query: string): boolean {
  return /^\d+\s*:\s*\d+$/.test(query.trim());
}
