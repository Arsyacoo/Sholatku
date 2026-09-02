import type { PrayerReminderOffset, PrayerReminderPreference } from './settings';

export type RamadanMode = 'automatic' | 'enabled' | 'disabled';

export interface RamadanModePreference {
  mode: RamadanMode;
  imsakOffsetMinutes: 5 | 10 | 15 | 20;
  showHomeCard: boolean;
}

export interface RamadanReminderSettings {
  imsak: PrayerReminderPreference;
  maghrib: PrayerReminderPreference;
}

export interface RamadanPreferences extends RamadanModePreference {
  reminders: RamadanReminderSettings;
}

export interface HijriDateParts {
  day: number;
  month: number;
  year: number;
}

export interface RamadanStatus {
  isRamadan: boolean;
  ramadanDay: number | null;
  hijriYear: number;
  hijriMonth: number;
  source: 'automatic' | 'manual';
}

export interface RamadanDateRange {
  hijriYear: number;
  startDate: string;
  endDate: string;
  days: number;
  dates: string[];
}

export interface RamadanTiming {
  date: string;
  timezone: string;
  imsakAt: Date;
  fajrAt: Date;
  maghribAt: Date;
  imsakOffsetMinutes: number;
}

export type RamadanContextState =
  | 'PRE_FAJR'
  | 'DAYTIME_FASTING'
  | 'PRE_IFTAR'
  | 'POST_MAGHRIB'
  | 'NIGHT';

export type RamadanContextTarget = 'imsak' | 'fajr' | 'maghrib' | 'next-imsak' | 'next-fajr';

export interface RamadanContext {
  state: RamadanContextState;
  target: RamadanContextTarget | null;
  targetAt: Date | null;
  targetLabel: string;
  remainingSeconds: number;
  formattedCountdown: string;
}

export type RamadanReminderOffset = PrayerReminderOffset;
