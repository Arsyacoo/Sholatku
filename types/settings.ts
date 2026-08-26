export type CalculationMethodId = 
  | '20' // Kemenag - Kementerian Agama Republik Indonesia (SIHAT)
  | '3'  // Muslim World League (MWL)
  | '2'  // ISNA (Islamic Society of North America)
  | '4'  // Umm Al-Qura University, Makkah
  | '5'  // Egyptian General Authority of Survey
  | '1'  // University of Islamic Sciences, Karachi
  | '11' // Majlis Ugama Islam Singapura (MUIS)
  | '13'; // Diyanet İşleri Başkanlığı, Turkey

export interface CalculationMethod {
  id: CalculationMethodId;
  name: string;
  description: string;
  region: string;
}

export type Madhab = 'shafii' | 'hanafi';

export interface PrayerAdjustment {
  fajr: number;    // minute offset e.g. 0, +1, -1
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface UserSettings {
  method: CalculationMethodId;
  madhab: Madhab;
  adjustments: PrayerAdjustment;
  timeFormat24h: boolean;
  theme: 'system' | 'light' | 'dark';
  enableNotifications: boolean;
  notifyBeforeMinutes: number; // e.g. 0, 5, 10
  adhanSound: 'none' | 'beep' | 'adhan_short';
}
