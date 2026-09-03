export interface SurahInfo {
  number: number;
  name: string; // Latin name e.g. "Al-Fatihah"
  arabicName: string; // e.g. "الفاتحة"
  translation: string; // Indonesian meaning e.g. "Pembukaan"
  numberOfAyahs: number;
  revelation: 'Makkiyah' | 'Madaniyah';
  description?: string;
  audioFull?: string;
}

export interface Ayah {
  numberInSurah: number;
  numberInQuran: number;
  arabText: string;
  latinText: string;
  translation: string; // Indonesian Kemenag
  tafsir?: QuranTafsir | null;
  juz: number | null;
  page?: number;
  audio: {
    [qariId: string]: string;
  };
}

export interface QuranTafsir {
  text: string;
  source: string;
}

export interface SurahDetail extends SurahInfo {
  bismillah?: {
    arab: string;
    translation: string;
    audio?: string;
  };
  ayahs: Ayah[];
}

export interface JuzInfo {
  juzNumber: number;
  name: string;
  startSurahNumber: number;
  startSurahName: string;
  startAyah: number;
  endSurahNumber: number;
  endSurahName: string;
  endAyah: number;
}

export interface LastReadInfo {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  timestamp: number;
}

export const QURAN_PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export type QuranPlaybackRate = (typeof QURAN_PLAYBACK_RATES)[number];

export interface QuranDisplaySettings {
  arabicFontSize: number; // 20 - 44
  showTranslation: boolean;
  showLatin: boolean;
  selectedQari: string; // e.g. 'mishary'
  autoScrollAudio: boolean;
  audioVolume: number; // 0 - 100
  audioMuted: boolean;
  playbackRate: QuranPlaybackRate;
}
