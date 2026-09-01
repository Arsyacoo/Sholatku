import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DailyPrayerSchedule, PrayerReminderSettings } from '@/types';
import { buildPrayerReminderEvents, getDueReminderEvents } from '@/lib/prayer/reminders/schedule';
import {
  clearFiredReminderEvents,
  PrayerReminderScheduler,
} from '@/lib/prayer/reminders/scheduler';

const schedule: DailyPrayerSchedule = {
  date: '2026-09-01',
  readableDate: 'Selasa, 1 September 2026',
  hijriDate: { day: '18', month: { en: 'Rabiul Awwal', ar: 'ربيع الأول' }, year: '1448', formatted: '18 Rabiul Awwal 1448 H' },
  timezone: 'Asia/Jakarta',
  offset: 7,
  timings: {
    fajr: '04:35',
    sunrise: '05:50',
    dhuhr: '12:00',
    asr: '15:20',
    maghrib: '17:55',
    isha: '19:05',
  },
  source: 'calculated',
};

const allEnabled: PrayerReminderSettings = {
  fajr: { enabled: true, offsetMinutes: 10 },
  dhuhr: { enabled: true, offsetMinutes: 0 },
  asr: { enabled: true, offsetMinutes: 5 },
  maghrib: { enabled: true, offsetMinutes: 15 },
  isha: { enabled: true, offsetMinutes: 30 },
};

beforeEach(() => {
  const records: Record<string, string> = {};
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => records[key] ?? null,
      setItem: (key: string, value: string) => {
        records[key] = value;
      },
      removeItem: (key: string) => delete records[key],
    },
  });
  clearFiredReminderEvents();
});

describe('active prayer reminder schedule', () => {
  it('generates stable events and applies configured offsets', () => {
    const events = buildPrayerReminderEvents(schedule, allEnabled, new Date(2026, 8, 1, 3, 0));
    expect(events).toHaveLength(5);
    expect(events.find((event) => event.prayer === 'fajr')).toMatchObject({
      id: '2026-09-01-fajr-10',
      offsetMinutes: 10,
    });
    expect(events.find((event) => event.prayer === 'fajr')?.reminderAt).toEqual(
      new Date(2026, 8, 1, 4, 25)
    );
  });

  it('omits disabled reminders', () => {
    const settings = { ...allEnabled, isha: { enabled: false, offsetMinutes: 0 as const } };
    const events = buildPrayerReminderEvents(schedule, settings, new Date(2026, 8, 1, 3, 0));
    expect(events.some((event) => event.prayer === 'isha')).toBe(false);
  });

  it('adds tomorrow Fajr after Isha with a distinct date', () => {
    const events = buildPrayerReminderEvents(schedule, allEnabled, new Date(2026, 8, 1, 23, 30));
    const tomorrowFajr = events.find((event) => event.id === '2026-09-02-fajr-10');
    expect(tomorrowFajr?.prayerAt).toEqual(new Date(2026, 8, 2, 4, 35));
    expect(tomorrowFajr?.reminderAt).toEqual(new Date(2026, 8, 2, 4, 25));
  });

  it('uses an explicit tomorrow schedule when available', () => {
    const tomorrow = { ...schedule, date: '2026-09-02', timings: { ...schedule.timings, fajr: '04:40' } };
    const events = buildPrayerReminderEvents(schedule, allEnabled, new Date(2026, 8, 1, 23, 30), tomorrow);
    expect(events.find((event) => event.id === '2026-09-02-fajr-10')?.prayerAt).toEqual(
      new Date(2026, 8, 2, 4, 40)
    );
  });

  it('skips reminders missed beyond the lateness tolerance', () => {
    const events = buildPrayerReminderEvents(schedule, allEnabled, new Date(2026, 8, 1, 4, 27));
    const due = getDueReminderEvents(events, new Date(2026, 8, 1, 4, 27));
    expect(due.map((event) => event.id)).toContain('2026-09-01-fajr-10');
    expect(
      getDueReminderEvents(events, new Date(2026, 8, 1, 5, 0)).map((event) => event.id)
    ).not.toContain('2026-09-01-fajr-10');
  });
});

describe('prayer reminder scheduler lifecycle', () => {
  it('fires a stable event once even when recalculated repeatedly', () => {
    const notify = vi.fn();
    const scheduler = new PrayerReminderScheduler(notify);
    const event = buildPrayerReminderEvents(schedule, allEnabled, new Date(2026, 8, 1, 4, 25)).find(
      (item) => item.id === '2026-09-01-fajr-10'
    )!;

    scheduler.recalculate([event], new Date(2026, 8, 1, 4, 25));
    scheduler.recalculate([event], new Date(2026, 8, 1, 4, 25, 1));
    expect(notify).toHaveBeenCalledTimes(1);
    scheduler.stop();
  });

  it('replaces stale events when prayer settings are recalculated', () => {
    const notify = vi.fn();
    const scheduler = new PrayerReminderScheduler(notify);
    const firstEvent = buildPrayerReminderEvents(schedule, allEnabled, new Date(2026, 8, 1, 3, 0)).find(
      (item) => item.id === '2026-09-01-fajr-10'
    )!;
    const updatedEvent = {
      ...firstEvent,
      id: '2026-09-01-fajr-5',
      offsetMinutes: 5 as const,
      reminderAt: new Date(2026, 8, 1, 4, 30),
    };

    scheduler.recalculate([firstEvent], new Date(2026, 8, 1, 4, 20));
    scheduler.update([updatedEvent], new Date(2026, 8, 1, 4, 30));
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ id: '2026-09-01-fajr-5' }));
    scheduler.stop();
  });

  it('cleans up its timer on stop', () => {
    vi.useFakeTimers();
    const notify = vi.fn();
    const scheduler = new PrayerReminderScheduler(notify);
    const event = buildPrayerReminderEvents(schedule, allEnabled, new Date(2026, 8, 1, 3, 0)).find(
      (item) => item.id === '2026-09-01-fajr-10'
    )!;
    scheduler.start([event]);
    scheduler.stop();
    vi.advanceTimersByTime(120_000);
    expect(notify).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
