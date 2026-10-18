import { CalculationMethod, CalculationMethodId, UserSettings, UserLocation } from '@/types';

export const CALCULATION_METHODS: CalculationMethod[] = [
  {
    id: '20',
    name: 'Kemenag RI (Kementerian Agama)',
    description: 'Standar resmi Indonesia (Fajr 20°, Isha 18°)',
    region: 'Indonesia',
  },
  {
    id: 'muhammadiyah',
    name: 'Muhammadiyah (Majelis Tarjih)',
    description: 'Keputusan Munas Tarjih 2020 (Fajr 18°, Isha 18°); Subuh sekitar 8 menit lebih lambat dari Kemenag',
    region: 'Indonesia',
  },
  {
    id: '3',
    name: 'Muslim World League (MWL)',
    description: 'Liga Muslim Dunia (Fajr 18°, Isha 17°)',
    region: 'Eropa, Timur Tengah',
  },
  {
    id: '4',
    name: 'Umm Al-Qura University, Makkah',
    description: 'Standar Arab Saudi (Fajr 18.5°, Isha 90 min after Maghrib)',
    region: 'Semenanjung Arab',
  },
  {
    id: '5',
    name: 'Egyptian General Authority',
    description: 'Otoritas Survei Mesir (Fajr 19.5°, Isha 17.5°)',
    region: 'Afrika & Timur Tengah',
  },
  {
    id: '2',
    name: 'ISNA (Islamic Society of North America)',
    description: 'Standar Amerika Utara (Fajr 15°, Isha 15°)',
    region: 'Amerika Utara',
  },
  {
    id: '11',
    name: 'MUIS (Majlis Ugama Islam Singapura)',
    description: 'Standar Singapura (Fajr 20°, Isha 18°)',
    region: 'Singapura & Asia Tenggara',
  },
  {
    id: '13',
    name: 'Diyanet İşleri Başkanlığı',
    description: 'Standar Resmi Turki (Fajr 18°, Isha 17°)',
    region: 'Turki',
  },
];

/** AlAdhan has no Muhammadiyah preset, so it uses the custom method 99 with "Fajr,Maghrib,Isha" settings. */
const ALADHAN_CUSTOM_METHODS: Partial<Record<CalculationMethodId, string>> = {
  muhammadiyah: '18,null,18',
};

/** Query string selecting `method` on the AlAdhan timings/calendar endpoints. */
export function aladhanMethodQuery(method: string): string {
  const custom = ALADHAN_CUSTOM_METHODS[method as CalculationMethodId];
  return custom ? `method=99&methodSettings=${encodeURIComponent(custom)}` : `method=${method}`;
}

/** Fajr depression angle for the offline fallback, which otherwise follows Kemenag (-20°). */
export function offlineFajrAngle(method: string): number {
  return method === 'muhammadiyah' ? -18 : -20;
}

export const PRAYER_NAMES = {
  fajr: { en: 'Fajr', id: 'Subuh', ar: 'الفجر' },
  sunrise: { en: 'Sunrise', id: 'Terbit', ar: 'الشروق' },
  dhuhr: { en: 'Dhuhr', id: 'Dzuhur', ar: 'الظهر' },
  asr: { en: 'Asr', id: 'Ashar', ar: 'العصر' },
  maghrib: { en: 'Maghrib', id: 'Maghrib', ar: 'المغرب' },
  isha: { en: 'Isha', id: 'Isya', ar: 'العشاء' },
  imsak: { en: 'Imsak', id: 'Imsak', ar: 'الإمساك' },
};

export const DEFAULT_LOCATION: UserLocation = {
  city: 'Jakarta Pusat',
  district: 'Gambir',
  province: 'DKI Jakarta',
  country: 'Indonesia',
  latitude: -6.1754,
  longitude: 106.8272,
  timezone: 'Asia/Jakarta',
  isAutoDetected: false,
  displayName: 'Jakarta, DKI Jakarta',
};

export const DEFAULT_SETTINGS: UserSettings = {
  method: '20', // Kemenag RI
  // Bimas Islam schedules run 2-4 minutes after the raw AlAdhan times; Depag RI uses a 2-minute ihtiyat.
  ihtiyat: 2,
  madhab: 'shafii',
  adjustments: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
  timeFormat24h: true,
  theme: 'system',
  enableNotifications: false,
  notifyBeforeMinutes: 0,
  adhanSound: 'beep',
};

// Kaaba Coordinates for Qibla calculation
export const KAABA_COORDINATES = {
  latitude: 21.422487,
  longitude: 39.826206,
};
