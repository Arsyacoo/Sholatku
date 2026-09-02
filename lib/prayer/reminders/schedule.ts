import type { DailyPrayerSchedule, PrayerReminderSettings } from '@/types';
import { PRAYER_REMINDER_PRAYERS } from '@/types';
import type { PrayerReminderEvent, PrayerReminderPrayer, RamadanReminderEvent, ReminderEvent } from './types';
import type { RamadanReminderSettings, RamadanTiming } from '@/types';

function parseDateOnly(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0, 0);
}

export function formatDateOnly(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export function parsePrayerDateTime(date: string, time: string): Date {
  const base = parseDateOnly(date);
  const [hours, minutes] = time.split(':').map(Number);
  base.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return base;
}

function tomorrowDate(date: string): string {
  const next = parseDateOnly(date);
  next.setDate(next.getDate() + 1);
  return formatDateOnly(next);
}

function createEvent(
  date: string,
  prayer: PrayerReminderPrayer,
  time: string,
  offsetMinutes: 0 | 5 | 10 | 15 | 30
): PrayerReminderEvent {
  const prayerAt = parsePrayerDateTime(date, time);
  const reminderAt = new Date(prayerAt.getTime() - offsetMinutes * 60 * 1000);
  return {
    id: `${date}-${prayer}-${offsetMinutes}`,
    date,
    prayer,
    prayerAt,
    reminderAt,
    offsetMinutes,
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
    events.push(createEvent(schedule.date, prayer, time, preference.offsetMinutes));
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

  const isAfterIsha = now.getTime() >= parsePrayerDateTime(schedule.date, schedule.timings.isha).getTime();
  if (isAfterIsha) {
    const nextSchedule = tomorrowSchedule ?? {
      ...schedule,
      date: tomorrowDate(schedule.date),
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

function createRamadanEvent(
  date: string,
  prayer: RamadanReminderEvent['prayer'],
  prayerAt: Date,
  offsetMinutes: 0 | 5 | 10 | 15 | 30
): RamadanReminderEvent {
  return {
    id: `${date}-ramadan-${prayer}-${offsetMinutes}`,
    date,
    prayer,
    prayerAt,
    reminderAt: new Date(prayerAt.getTime() - offsetMinutes * 60 * 1000),
    offsetMinutes,
  };
}

export function buildRamadanReminderEvents(
  timing: RamadanTiming,
  settings: RamadanReminderSettings
): RamadanReminderEvent[] {
  const events: RamadanReminderEvent[] = [];
  if (settings.imsak.enabled) events.push(createRamadanEvent(timing.date, 'imsak', timing.imsakAt, settings.imsak.offsetMinutes));
  if (settings.maghrib.enabled) events.push(createRamadanEvent(timing.date, 'maghrib', timing.maghribAt, settings.maghrib.offsetMinutes));
  return events.sort((a, b) => a.reminderAt.getTime() - b.reminderAt.getTime());
}
