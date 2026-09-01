import type { PrayerReminderEvent } from './types';
import { sendPrayerReminderNotification } from './notification';
import { getDueReminderEvents, getNextReminderEvent } from './schedule';

export const REMINDER_LATE_TOLERANCE_MS = 3 * 60 * 1000;
const MAX_TIMER_DELAY_MS = 60 * 1000;
const FIRED_REMINDERS_KEY = 'sholatku_fired_prayer_reminders_v1';
const FIRED_RETENTION_MS = 48 * 60 * 60 * 1000;

type FiredRecord = { id: string; firedAt: number };

function readFiredRecords(): FiredRecord[] {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(FIRED_REMINDERS_KEY);
    const records = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(records)) return [];
    const cutoff = Date.now() - FIRED_RETENTION_MS;
    return records.filter(
      (record): record is FiredRecord =>
        !!record &&
        typeof record === 'object' &&
        typeof (record as FiredRecord).id === 'string' &&
        typeof (record as FiredRecord).firedAt === 'number' &&
        (record as FiredRecord).firedAt >= cutoff
    );
  } catch {
    return [];
  }
}

function writeFiredRecords(records: FiredRecord[]): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(FIRED_REMINDERS_KEY, JSON.stringify(records));
  } catch {
    // A full or unavailable session store should not stop reminder delivery.
  }
}

export function hasFiredReminder(id: string): boolean {
  return readFiredRecords().some((record) => record.id === id);
}

export function markReminderFired(id: string, firedAt = Date.now()): void {
  const records = readFiredRecords().filter((record) => record.id !== id);
  records.push({ id, firedAt });
  writeFiredRecords(records);
}

export function clearFiredReminderEvents(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(FIRED_REMINDERS_KEY);
  } catch {
    // Ignore unavailable storage in private browsing contexts.
  }
}

export type ReminderNotificationSink = (event: PrayerReminderEvent) => void | Promise<unknown>;

export class PrayerReminderScheduler {
  private events: PrayerReminderEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly notify: ReminderNotificationSink;

  constructor(notify: ReminderNotificationSink = sendPrayerReminderNotification) {
    this.notify = notify;
  }

  start(events: PrayerReminderEvent[]): void {
    this.events = [...events];
    this.recalculate();
  }

  update(events: PrayerReminderEvent[], now: Date = new Date()): void {
    this.events = [...events];
    this.recalculate(undefined, now);
  }

  recalculate(events?: PrayerReminderEvent[], now: Date = new Date()): void {
    if (events) this.events = [...events];
    this.clearTimer();

    for (const event of getDueReminderEvents(this.events, now, REMINDER_LATE_TOLERANCE_MS)) {
      if (hasFiredReminder(event.id)) continue;
      markReminderFired(event.id, now.getTime());
      Promise.resolve(this.notify(event)).catch(() => undefined);
    }

    const next = getNextReminderEvent(this.events, now);
    if (!next) return;

    const delay = Math.min(
      Math.max(0, next.reminderAt.getTime() - now.getTime()),
      MAX_TIMER_DELAY_MS
    );
    this.timer = setTimeout(() => this.recalculate(), delay);
  }

  stop(): void {
    this.clearTimer();
    this.events = [];
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
