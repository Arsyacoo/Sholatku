import type { DailyPrayerSchedule, PrayerReminderSettings } from '@/types';
import { PRAYER_REMINDER_PRAYERS } from '@/types';
import type { PrayerReminderEvent, PrayerReminderPrayer, RamadanReminderEvent, ReminderEvent } from './types';
import type { RamadanReminderSettings, RamadanTiming } from '@/types';
import { addDaysToCanonicalDate } from '@/lib/prayer/date';
import { formatDateInTimeZone, normalizeTimeZone, zonedTimeToUtc } from '@/lib/time/timezone';

export function formatDateOnly(date: Date, timeZone?: string): string {
  if (timeZone) return formatDateInTimeZone(date, normalizeTimeZone(timeZone));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parsePrayerDateTime(date: string, time: string, timeZone = 'Asia/Jakarta'): Date {
  return zonedTimeToUtc(date, time, normalizeTimeZone(timeZone));
}

function createEvent(
  date: string,
  prayer: PrayerReminderPrayer,
  time: string,
  offsetMinutes: 0 | 5 | 10 | 15 | 30,
  timeZone: string
): PrayerReminderEvent {
  const prayerAt = parsePrayerDateTime(date, time, timeZone);
  const reminderAt = new Date(prayerAt.getTime() - offsetMinutes * 60 * 1000);
  return {
    kind: 'prayer',
    route: '/',
    id: `${date}-${prayer}-${offsetMinutes}`,
    date,
    prayer,
    prayerAt,
    reminderAt,
    offsetMinutes,
    timezone: timeZone,
  };
}

function appendScheduleEvents(
  events: PrayerReminderEvent[],
  schedule: DailyPrayerSchedule,
  settings: PrayerReminderSettings,
  prayers: readonly PrayerReminderPrayer[] = PRAYER_REMINDER_PRAYERS
) {
  for (const prayer of prayers) {
    const preference = settings[prayer];
    const time = schedule.timings[prayer];
    if (!preference?.enabled || !time) continue;
    events.push(createEvent(schedule.date, prayer, time, preference.offsetMinutes, schedule.timezone));
  }
}

/**
 * Creates deterministic reminder events in the browser's local date context.
 * A tomorrow Fajr event is added after today's Isha, using tomorrow's schedule
 * when supplied and today's Fajr as a safe fallback while it is unavailable.
 */
export function buildPrayerReminderEvents(
  schedule: DailyPrayerSchedule,
  settings: PrayerReminderSettings,
  now: Date = new Date(),
  tomorrowSchedule?: DailyPrayerSchedule
): PrayerReminderEvent[] {
  const events: PrayerReminderEvent[] = [];
  appendScheduleEvents(events, schedule, settings);

  const isAfterIsha = now.getTime() >= parsePrayerDateTime(schedule.date, schedule.timings.isha, schedule.timezone).getTime();
  if (isAfterIsha) {
    const nextSchedule = tomorrowSchedule ?? {
      ...schedule,
      date: addDaysToCanonicalDate(schedule.date, 1),
    };
    appendScheduleEvents(events, nextSchedule, settings, ['fajr']);
  }

  return events.sort((a, b) => a.reminderAt.getTime() - b.reminderAt.getTime());
}

export function getNextReminderEvent(
  events: readonly ReminderEvent[],
  now: Date = new Date()
): ReminderEvent | null {
  return (
    events
      .filter((event) => event.reminderAt.getTime() > now.getTime())
      .sort((a, b) => a.reminderAt.getTime() - b.reminderAt.getTime())[0] ?? null
  );
}

export function getDueReminderEvents(
  events: readonly ReminderEvent[],
  now: Date = new Date(),
  lateToleranceMs = 3 * 60 * 1000
): ReminderEvent[] {
  const nowMs = now.getTime();
  return events
    .filter((event) => {
      const lateness = nowMs - event.reminderAt.getTime();
      return lateness >= 0 && lateness <= lateToleranceMs;
    })
    .sort((a, b) => a.reminderAt.getTime() - b.reminderAt.getTime());
}

export function filterFutureReminderEvents(
  events: readonly ReminderEvent[],
  now: Date = new Date(),
  horizonMs = 48 * 60 * 60 * 1000
): ReminderEvent[] {
  const nowMs = now.getTime();
  const horizonEnd = nowMs + horizonMs;
  return events
    .filter((event) => {
      const reminderAt = event.reminderAt.getTime();
      return reminderAt > nowMs && reminderAt <= horizonEnd;
    })
    .sort((a, b) => a.reminderAt.getTime() - b.reminderAt.getTime());
}

function createRamadanEvent(
  date: string,
  prayer: RamadanReminderEvent['prayer'],
  prayerAt: Date,
  offsetMinutes: 0 | 5 | 10 | 15 | 30,
  timeZone: string
): RamadanReminderEvent {
  return {
    kind: 'ramadan',
    route: '/ramadan',
    id: `${date}-ramadan-${prayer}-${offsetMinutes}`,
    date,
    prayer,
    prayerAt,
    reminderAt: new Date(prayerAt.getTime() - offsetMinutes * 60 * 1000),
    offsetMinutes,
    timezone: timeZone,
  };
}

export function buildRamadanReminderEvents(
  timing: RamadanTiming,
  settings: RamadanReminderSettings
): RamadanReminderEvent[] {
  const events: RamadanReminderEvent[] = [];
  if (settings.imsak.enabled) events.push(createRamadanEvent(timing.date, 'imsak', timing.imsakAt, settings.imsak.offsetMinutes, timing.timezone));
  if (settings.maghrib.enabled) events.push(createRamadanEvent(timing.date, 'maghrib', timing.maghribAt, settings.maghrib.offsetMinutes, timing.timezone));
  return events.sort((a, b) => a.reminderAt.getTime() - b.reminderAt.getTime());
}
