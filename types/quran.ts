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
  tafsir?: string;
  juz: number;
  page?: number;
  audio: {
    [qariId: string]: string;
  };
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

export interface QuranDisplaySettings {
  arabicFontSize: number; // 20 - 44
  showTranslation: boolean;
  showLatin: boolean;
  selectedQari: string; // e.g. 'mishary'
  autoScrollAudio: boolean;
}
