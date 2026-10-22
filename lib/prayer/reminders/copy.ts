import type { ReminderEvent, ReminderRoute } from './types';
import type { Language } from '@/types';
import { formatTimeInTimeZone } from '@/lib/time/timezone';
import { prayerName } from '@/lib/prayer/constants';
import { getSavedSettings } from '@/lib/storage/preferences';

const RAMADAN_LABELS = {
  imsak: { id: 'Imsak', en: 'Imsak' },
  maghrib: { id: 'berbuka', en: 'Iftar' },
} as const;

export const REMINDER_NOTIFICATION_SOURCE = 'sholatku-native-reminder' as const;
export const NATIVE_REMINDER_OWNER = 'sholatku-prayer-reminders' as const;
export const NATIVE_REMINDER_SCHEMA_VERSION = 1 as const;

export function isApprovedReminderRoute(route: string): route is ReminderRoute {
  return route === '/' || route === '/ramadan';
}

export function buildReminderNotificationCopy(
  event: ReminderEvent,
  language: Language = getSavedSettings().language
): {
  title: string;
  body: string;
  route: ReminderRoute;
} {
  const time = formatTimeInTimeZone(event.prayerAt, event.timezone);
  const en = language === 'en';

  if (event.kind === 'ramadan') {
    const label = RAMADAN_LABELS[event.prayer][language];
    if (en) {
      return event.offsetMinutes > 0
        ? { title: `${label} is coming up`, body: `${event.offsetMinutes} minutes until ${label} - ${time}`, route: event.route }
        : {
            title: `It's ${label} time`,
            body: event.prayer === 'imsak' ? `Get ready to begin your fast - ${time}` : `Time to break your fast - ${time}`,
            route: event.route,
          };
    }
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

  const label = prayerName(event.prayer, language);
  if (en) {
    return event.offsetMinutes > 0
      ? { title: `${label} is coming up`, body: `${event.offsetMinutes} minutes until ${label} - ${time}`, route: event.route }
      : { title: `It's time for ${label}`, body: `${label} time has begun - ${time}`, route: event.route };
  }
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
    owner: NATIVE_REMINDER_OWNER,
    schemaVersion: NATIVE_REMINDER_SCHEMA_VERSION,
    kind: event.kind,
    eventType: event.kind,
    logicalId: event.id,
    date: event.date,
    prayer: event.prayer,
    route: event.route,
    timezone: event.timezone,
    offsetMinutes: event.offsetMinutes,
    scheduledAt: event.reminderAt.toISOString(),
  };
}
