import type {
  PrayerReminderOffset,
  PrayerReminderPrayer,
  PrayerReminderPreference,
  PrayerReminderSettings,
} from '@/types';

export type NotificationPermissionState = NotificationPermission | 'unsupported';

export type ReminderRoute = '/' | '/ramadan';
export type ReminderKind = 'prayer' | 'ramadan';

export interface PrayerReminderCapabilities {
  notificationsSupported: boolean;
  serviceWorkerSupported: boolean;
  permission: NotificationPermissionState;
  canShowPersistentNotification: boolean;
  isStandalone: boolean;
  secureContext: boolean;
  calendarExportSupported: boolean;
  exactBackgroundSchedulingGuaranteed: false;
}

export interface PrayerReminderEvent {
  kind: 'prayer';
  route: '/';
  id: string;
  date: string;
  prayer: PrayerReminderPrayer;
  prayerAt: Date;
  reminderAt: Date;
  offsetMinutes: PrayerReminderOffset;
  timezone: string;
}

export interface RamadanReminderEvent {
  kind: 'ramadan';
  route: '/ramadan';
  id: string;
  date: string;
  prayer: 'imsak' | 'maghrib';
  prayerAt: Date;
  reminderAt: Date;
  offsetMinutes: PrayerReminderOffset;
  timezone: string;
}

export type ReminderEvent = PrayerReminderEvent | RamadanReminderEvent;

export type { PrayerReminderOffset, PrayerReminderPrayer, PrayerReminderPreference, PrayerReminderSettings };
