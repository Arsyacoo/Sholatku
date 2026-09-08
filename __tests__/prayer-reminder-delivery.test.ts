import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearFiredReminderEvents,
  hasFiredReminder,
  PrayerReminderDeliveryCoordinator,
  PrayerReminderScheduler,
  REMINDER_CLAIM_EXPIRY_MS,
  REMINDER_LEDGER_KEY,
  REMINDER_LEDGER_RETENTION_MS,
} from '@/lib/prayer/reminders/scheduler';
import type { ReminderEvent } from '@/lib/prayer/reminders/types';

function createStorage() {
  const records = new Map<string, string>();
  return {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => records.set(key, value),
    removeItem: (key: string) => records.delete(key),
    clear: () => records.clear(),
  };
}

const event: ReminderEvent = {
  kind: 'prayer',
  route: '/',
  id: '2026-09-03-fajr-0',
  date: '2026-09-03',
  prayer: 'fajr',
  prayerAt: new Date('2026-09-03T04:35:00+07:00'),
  reminderAt: new Date('2026-09-03T04:35:00+07:00'),
  offsetMinutes: 0,
  timezone: 'Asia/Jakarta',
};

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: createStorage() });
  clearFiredReminderEvents();
});

describe('cross-tab reminder delivery coordinator', () => {
  it('allows one claim, suppresses a competing claim, and expires stale claims', () => {
    const first = new PrayerReminderDeliveryCoordinator('tab-a');
    const second = new PrayerReminderDeliveryCoordinator('tab-b');
    expect(first.claim(event.id, 1_000)).toBe(true);
    expect(second.claim(event.id, 1_001)).toBe(false);
    expect(second.claim(event.id, 1_000 + REMINDER_CLAIM_EXPIRY_MS + 1)).toBe(true);
    first.close();
    second.close();
  });

  it('suppresses delivered events and prunes old ledger records', () => {
    const coordinator = new PrayerReminderDeliveryCoordinator('tab-a');
    const now = Date.now();
    coordinator.claim(event.id, now);
    coordinator.markDelivered(event.id, now + 1);
    expect(hasFiredReminder(event.id)).toBe(true);
    expect(coordinator.claim(event.id, now + 2)).toBe(false);

    const storage = globalThis.localStorage as unknown as ReturnType<typeof createStorage>;
    storage.setItem(REMINDER_LEDGER_KEY, JSON.stringify([
      { id: 'old', status: 'DELIVERED', updatedAt: now - REMINDER_LEDGER_RETENTION_MS - 1 },
      { id: 'new', status: 'DELIVERED', updatedAt: now },
    ]));
    coordinator.prune(now);
    expect(JSON.parse(storage.getItem(REMINDER_LEDGER_KEY) ?? '[]')).toEqual([
      { id: 'new', status: 'DELIVERED', updatedAt: now },
    ]);
    coordinator.close();
  });
});

describe('scheduler delivery outcomes', () => {
  it('marks delivered only after a successful notification', async () => {
    const notify = vi.fn().mockResolvedValue(true);
    const scheduler = new PrayerReminderScheduler(notify);
    scheduler.recalculate([event], new Date(event.reminderAt.getTime()));
    await Promise.resolve();
    expect(notify).toHaveBeenCalledWith(event);
    expect(hasFiredReminder(event.id)).toBe(true);
    scheduler.stop();
  });

  it('releases failed or denied notifications without marking them delivered', async () => {
    const notify = vi.fn().mockResolvedValue(false);
    const scheduler = new PrayerReminderScheduler(notify);
    scheduler.recalculate([event], new Date(event.reminderAt.getTime()));
    await Promise.resolve();
    expect(notify).toHaveBeenCalledTimes(1);
    expect(hasFiredReminder(event.id)).toBe(false);
    scheduler.stop();
  });
});
