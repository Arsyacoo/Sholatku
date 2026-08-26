export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimeItem {
  id: PrayerKey;
  name: string;
  arabicName: string;
  time: string; // "HH:mm" formatted 24h
  timestamp: number; // epoch ms for today
  isPassed: boolean;
  isCurrent: boolean;
  isNext: boolean;
  isPrayer: boolean; // true for 5 daily prayers, false for sunrise
}

export interface DailyPrayerSchedule {
  date: string; // YYYY-MM-DD
  readableDate: string; // e.g. "Rabu, 26 Agustus 2026"
  hijriDate: {
    day: string;
    month: {
      en: string;
      ar: string;
    };
    year: string;
    formatted: string;
  };
  timezone: string;
  offset: number; // UTC offset in hours
  timings: {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    imsak?: string;
    midnight?: string;
  };
  source: 'api' | 'cache' | 'offline' | 'calculated';
  meta?: {
    latitude: number;
    longitude: number;
    method: string;
  };
}

export interface NextPrayerInfo {
  currentPrayer: PrayerTimeItem | null;
  nextPrayer: PrayerTimeItem;
  remainingSeconds: number;
  formattedCountdown: string; // "02:14:35"
  isTomorrowFajr: boolean;
  progressPercent: number; // 0 to 100 between previous prayer and next prayer
}

export interface MonthlyPrayerItem {
  date: string;
  dayNumber: number;
  dayName: string;
  hijriFormatted: string;
  isToday: boolean;
  timings: {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
}
