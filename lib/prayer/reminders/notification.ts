import type { ReminderEvent } from './types';

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
  const prayerName = {
    fajr: 'Subuh',
    dhuhr: 'Dzuhur',
    asr: 'Ashar',
    maghrib: 'Maghrib',
    isha: 'Isya',
    imsak: 'Imsak',
  }[event.prayer];
  const time = event.prayerAt.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const title = event.offsetMinutes > 0 ? `${prayerName} sebentar lagi` : `Waktu ${prayerName}`;
  const body =
    event.offsetMinutes > 0
      ? `${event.offsetMinutes} menit menuju waktu ${prayerName} · ${time}`
      : `Telah masuk waktu ${prayerName} · ${time}`;
  return displayNotification(title, body, `sholatku-${event.id}`);
}
