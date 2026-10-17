import type { PermissionState } from '@capacitor/core';
import type {
  ActionPerformed,
  Channel,
  PendingLocalNotificationSchema,
  ScheduleResult,
} from '@capacitor/local-notifications';

import type { UserSettings } from '@/types';
import { isNativeRuntime } from './runtime';

export type ReminderSound = UserSettings['adhanSound'];

export type NormalizedNotificationPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface NativeNotificationRequest {
  id: number;
  title: string;
  body: string;
  at: Date;
  allowWhileIdle?: boolean;
  sound?: ReminderSound;
  extra?: Record<string, unknown>;
}

type NativePendingSchedule = NonNullable<PendingLocalNotificationSchema['schedule']>;

export interface NativeNotificationPending extends Omit<PendingLocalNotificationSchema, 'schedule'> {
  schedule?: Omit<NativePendingSchedule, 'at'> & {
    // Android serializes scheduled dates back through the bridge as strings.
    at?: Date | string | number;
  };
}

export interface NativeNotificationChannel extends Channel {
  id: string;
  name: string;
  description: string;
  importance: 2 | 3;
}

export const NATIVE_REMINDER_CHANNEL_ID = 'prayer-reminders';
export const NATIVE_REMINDER_CHANNEL_NAME = 'Pengingat Waktu Sholat';
export const NATIVE_REMINDER_CHANNEL_DESCRIPTION = 'Notifikasi pengingat waktu sholat dan Ramadan';

const REMINDER_CHANNEL: NativeNotificationChannel = {
  id: NATIVE_REMINDER_CHANNEL_ID,
  name: NATIVE_REMINDER_CHANNEL_NAME,
  description: NATIVE_REMINDER_CHANNEL_DESCRIPTION,
  importance: 3,
};

// Android channel sound is immutable after creation, so each sound choice gets its own channel.
const REMINDER_CHANNELS: Record<ReminderSound, NativeNotificationChannel> = {
  beep: REMINDER_CHANNEL,
  adhan_short: {
    id: 'prayer-reminders-adhan',
    name: 'Adzan Waktu Sholat',
    description: 'Suara adzan saat masuk waktu sholat',
    importance: 3,
    sound: 'adhan.ogg',
  },
  none: {
    id: 'prayer-reminders-silent',
    name: 'Pengingat Tanpa Suara',
    description: 'Pengingat waktu sholat tanpa suara',
    importance: 2,
  },
};

let pluginPromise: Promise<typeof import('@capacitor/local-notifications')> | null = null;
let reminderChannelPromise: Promise<void> | null = null;

async function getPlugin() {
  if (!pluginPromise) {
    pluginPromise = import('@capacitor/local-notifications');
  }

  return pluginPromise;
}

function normalizePermissionState(value: PermissionState | NotificationPermission | undefined): NormalizedNotificationPermissionState {
  if (value === 'granted' || value === 'denied') return value;
  if (value === 'prompt' || value === 'prompt-with-rationale' || value === 'default') return 'prompt';
  return 'unsupported';
}

function getWebNotificationApi(): typeof Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  return window.Notification;
}

export async function getNotificationPermissionState(): Promise<NormalizedNotificationPermissionState> {
  if (!isNativeRuntime()) {
    const notificationApi = getWebNotificationApi();
    return normalizePermissionState(notificationApi?.permission);
  }

  const { LocalNotifications } = await getPlugin();
  const status = await LocalNotifications.checkPermissions();
  return normalizePermissionState(status.display);
}

export async function requestNotificationPermission(): Promise<NormalizedNotificationPermissionState> {
  if (!isNativeRuntime()) {
    const notificationApi = getWebNotificationApi();
    if (!notificationApi) return 'unsupported';

    try {
      return normalizePermissionState(await notificationApi.requestPermission());
    } catch {
      return normalizePermissionState(notificationApi.permission);
    }
  }

  const { LocalNotifications } = await getPlugin();
  const status = await LocalNotifications.requestPermissions();
  return normalizePermissionState(status.display);
}

export type ExactAlarmPermissionState = 'granted' | 'denied' | 'unsupported';

/** Exact alarms ("Alarms & reminders") keep Doze from delaying reminders by minutes. Always granted below Android 12. */
export async function getExactAlarmPermissionState(): Promise<ExactAlarmPermissionState> {
  if (!isNativeRuntime()) return 'unsupported';
  const { LocalNotifications } = await getPlugin();
  const status = await LocalNotifications.checkExactNotificationSetting();
  return status.exact_alarm === 'granted' ? 'granted' : 'denied';
}

/** Opens the system "Alarms & reminders" screen; resolves with the state after the user returns. */
export async function requestExactAlarmPermission(): Promise<ExactAlarmPermissionState> {
  if (!isNativeRuntime()) return 'unsupported';
  const { LocalNotifications } = await getPlugin();
  const status = await LocalNotifications.changeExactNotificationSetting();
  return status.exact_alarm === 'granted' ? 'granted' : 'denied';
}

export async function ensureReminderNotificationChannel(): Promise<void> {
  if (!isNativeRuntime()) return;
  if (!reminderChannelPromise) {
    reminderChannelPromise = (async () => {
      const { LocalNotifications } = await getPlugin();
      const existing = new Set((await LocalNotifications.listChannels()).channels.map((channel) => channel.id));
      for (const channel of Object.values(REMINDER_CHANNELS)) {
        if (!existing.has(channel.id)) await LocalNotifications.createChannel(channel);
      }
    })().catch((error) => {
      reminderChannelPromise = null;
      throw error;
    });
  }

  return reminderChannelPromise;
}

export async function scheduleNativeNotifications(
  notifications: NativeNotificationRequest[]
): Promise<ScheduleResult | null> {
  if (!isNativeRuntime() || notifications.length === 0) return null;

  const { LocalNotifications } = await getPlugin();
  await ensureReminderNotificationChannel();
  // Ask for exact delivery only when already allowed: with isExactNotification true and no permission,
  // the plugin opens the system settings screen, which must never happen during a background sync.
  const exact = (await getExactAlarmPermissionState()) === 'granted';

  return LocalNotifications.schedule({
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      channelId: getNativeReminderChannelId(notification.sound),
      autoCancel: true,
      foreground: true,
      isExactNotification: exact,
      schedule: { at: notification.at, allowWhileIdle: notification.allowWhileIdle },
      extra: notification.extra,
    })),
  });
}

export async function cancelNativeNotifications(ids: number[]): Promise<void> {
  if (!isNativeRuntime() || ids.length === 0) return;

  const { LocalNotifications } = await getPlugin();
  await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
}

export async function getNativePendingNotifications(): Promise<NativeNotificationPending[]> {
  if (!isNativeRuntime()) return [];

  const { LocalNotifications } = await getPlugin();
  const result = await LocalNotifications.getPending();
  return result.notifications;
}

export async function addNativeNotificationActionListener(
  listener: (action: ActionPerformed) => void
): Promise<() => Promise<void>> {
  if (!isNativeRuntime()) return async () => undefined;

  const { LocalNotifications } = await getPlugin();
  const handle = await LocalNotifications.addListener('localNotificationActionPerformed', listener);
  return async () => {
    await handle.remove();
  };
}

export function isSupportedNotificationPermissionState(
  value: NormalizedNotificationPermissionState
): value is Exclude<NormalizedNotificationPermissionState, 'unsupported'> {
  return value === 'prompt' || value === 'granted' || value === 'denied';
}

export function isNativeReminderNotification(notification: NativeNotificationPending): boolean {
  return notification.extra?.source === 'sholatku-native-reminder';
}

export function getNativeReminderChannelId(sound: ReminderSound = 'beep'): string {
  return (REMINDER_CHANNELS[sound] ?? REMINDER_CHANNEL).id;
}
