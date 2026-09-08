import type { ReminderEvent, ReminderRoute } from './types';
import { formatTimeInTimeZone } from '@/lib/time/timezone';

const DAILY_PRAYER_LABELS = {
  fajr: 'Subuh',
  dhuhr: 'Dzuhur',
  asr: 'Ashar',
  maghrib: 'Maghrib',
  isha: 'Isya',
} as const;

const RAMADAN_LABELS = {
  imsak: 'Imsak',
  maghrib: 'berbuka',
} as const;

export const REMINDER_NOTIFICATION_SOURCE = 'sholatku-native-reminder' as const;

export function isApprovedReminderRoute(route: string): route is ReminderRoute {
  return route === '/' || route === '/ramadan';
}

export function buildReminderNotificationCopy(event: ReminderEvent): {
  title: string;
  body: string;
  route: ReminderRoute;
} {
  const time = formatTimeInTimeZone(event.prayerAt, event.timezone);

  if (event.kind === 'ramadan') {
    const label = RAMADAN_LABELS[event.prayer];
    if (event.offsetMinutes > 0) {
      return {
        title: `${label} akan tiba`,
        body: `${event.offsetMinutes} menit menuju waktu ${label} - ${time}`,
        route: event.route,
      };
    }

    return {
      title: `Waktu ${label} telah tiba`,
      body:
        event.prayer === 'imsak'
          ? `Bersiap menjalankan puasa - ${time}`
          : `Saatnya berbuka - ${time}`,
      route: event.route,
    };
  }

  const label = DAILY_PRAYER_LABELS[event.prayer];
  if (event.offsetMinutes > 0) {
    return {
      title: `${label} sebentar lagi`,
      body: `${event.offsetMinutes} menit menuju waktu ${label} - ${time}`,
      route: event.route,
    };
  }

  return {
    title: `Waktu ${label} telah masuk`,
    body: `Telah masuk waktu ${label} - ${time}`,
    route: event.route,
  };
}

export function buildReminderNotificationExtra(event: ReminderEvent): Record<string, unknown> {
  return {
    source: REMINDER_NOTIFICATION_SOURCE,
    kind: event.kind,
    logicalId: event.id,
    date: event.date,
    prayer: event.prayer,
    route: event.route,
    timezone: event.timezone,
    offsetMinutes: event.offsetMinutes,
  };
}
