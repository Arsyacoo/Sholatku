import type {
  PrayerReminderOffset,
  PrayerReminderPrayer,
  PrayerReminderPreference,
  PrayerReminderSettings,
} from '@/types';

export type NotificationPermissionState = NotificationPermission | 'unsupported';

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
  id: string;
  date: string;
  prayer: PrayerReminderPrayer;
  prayerAt: Date;
  reminderAt: Date;
  offsetMinutes: PrayerReminderOffset;
}

export interface RamadanReminderEvent {
  id: string;
  date: string;
  prayer: 'imsak' | 'maghrib';
  prayerAt: Date;
  reminderAt: Date;
  offsetMinutes: PrayerReminderOffset;
}

export type ReminderEvent = PrayerReminderEvent | RamadanReminderEvent;

export type { PrayerReminderOffset, PrayerReminderPrayer, PrayerReminderPreference, PrayerReminderSettings };
