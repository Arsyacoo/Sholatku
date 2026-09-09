import type { PermissionState } from '@capacitor/core';
import type {
  ActionPerformed,
  Channel,
  PendingLocalNotificationSchema,
  ScheduleResult,
} from '@capacitor/local-notifications';

import { isNativeRuntime } from './runtime';

export type NormalizedNotificationPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface NativeNotificationRequest {
  id: number;
  title: string;
  body: string;
  at: Date;
  allowWhileIdle?: boolean;
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
  importance: 3;
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

export async function ensureReminderNotificationChannel(): Promise<void> {
  if (!isNativeRuntime()) return;
  if (!reminderChannelPromise) {
    reminderChannelPromise = (async () => {
      const { LocalNotifications } = await getPlugin();
      const channels = await LocalNotifications.listChannels();
      if (channels.channels.some((channel) => channel.id === REMINDER_CHANNEL.id)) return;
      await LocalNotifications.createChannel(REMINDER_CHANNEL);
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

  return LocalNotifications.schedule({
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      channelId: REMINDER_CHANNEL.id,
      autoCancel: true,
      foreground: true,
      isExactNotification: false,
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

export function getNativeReminderChannelId(): string {
  return REMINDER_CHANNEL.id;
}
