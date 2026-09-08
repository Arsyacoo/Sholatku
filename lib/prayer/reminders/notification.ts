import type { ReminderEvent } from './types';
import { buildReminderNotificationCopy } from './copy';

export const TEST_NOTIFICATION_TAG = 'sholatku-notification-test';

function getNotificationApi(): typeof Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  return window.Notification;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  return getNotificationApi()?.permission ?? 'unsupported';
}

export async function requestPrayerNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  const notificationApi = getNotificationApi();
  if (!notificationApi) return 'unsupported';
  try {
    return await notificationApi.requestPermission();
  } catch {
    return notificationApi.permission;
  }
}

async function displayNotification(title: string, body: string, tag: string): Promise<boolean> {
  const notificationApi = getNotificationApi();
  if (!notificationApi || notificationApi.permission !== 'granted') return false;

  try {
    if (
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      typeof navigator.serviceWorker.getRegistration === 'function'
    ) {
      // In development Serwist is disabled, so `ready` may never resolve.
      // A registration lookup lets us fall back to the page Notification API.
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag,
          silent: false,
          data: { url: '/' },
        });
        return true;
      }
    }
  } catch {
    // Fall through to the page Notification API when the worker is unavailable.
  }

  try {
    new notificationApi(title, {
      body,
      icon: '/icon-192.png',
      tag,
      silent: false,
      data: { url: '/' },
    });
    return true;
  } catch {
    return false;
  }
}

export function sendTestNotification(): Promise<boolean> {
  return displayNotification(
    'Sholatku',
    'Notifikasi pengingat berhasil diaktifkan.',
    TEST_NOTIFICATION_TAG
  );
}

export function sendPrayerReminderNotification(event: ReminderEvent): Promise<boolean> {
  const copy = buildReminderNotificationCopy(event);
  return displayNotification(copy.title, copy.body, `sholatku-${event.id}`);
}
