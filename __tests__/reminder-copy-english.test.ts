import { describe, expect, it } from 'vitest';
import { buildReminderNotificationCopy } from '@/lib/prayer/reminders/copy';
import { generatePrayerCalendarIcs } from '@/lib/prayer/reminders/ics';
import type { MonthlyPrayerItem, PrayerReminderSettings, UserLocation } from '@/types';

const prayerEvent = {
  kind: 'prayer',
  route: '/',
  id: '2026-09-08-fajr-10',
  date: '2026-09-08',
  prayer: 'fajr',
  prayerAt: new Date('2026-09-08T04:30:00+07:00'),
  reminderAt: new Date('2026-09-08T04:20:00+07:00'),
  offsetMinutes: 10,
  timezone: 'Asia/Jakarta',
} as const;

describe('English reminder copy', () => {
  it('builds English notification text for language en', () => {
    expect(buildReminderNotificationCopy(prayerEvent, 'en')).toMatchObject({
      title: 'Fajr is coming up',
      body: '10 minutes until Fajr - 04:30',
    });
    expect(buildReminderNotificationCopy({ ...prayerEvent, offsetMinutes: 0 }, 'en').title).toBe("It's time for Fajr");
    expect(
      buildReminderNotificationCopy({ ...prayerEvent, kind: 'ramadan', route: '/ramadan', prayer: 'maghrib', offsetMinutes: 0 }, 'en')
    ).toMatchObject({ title: "It's Iftar time", body: 'Time to break your fast - 04:30' });
    expect(buildReminderNotificationCopy(prayerEvent, 'id').title).toBe('Subuh sebentar lagi');
  });

  it('exports an English calendar', () => {
    const location = { displayName: 'Jakarta', timezone: 'Asia/Jakarta' } as UserLocation;
    const day = { date: '2026-09-08', timings: { fajr: '04:30' } } as unknown as MonthlyPrayerItem;
    const reminders = { fajr: { enabled: true, offsetMinutes: 5 } } as unknown as PrayerReminderSettings;
    const ics = generatePrayerCalendarIcs([day], location, reminders, new Date('2026-09-01T00:00:00Z'), 'en');
    expect(ics).toContain('SUMMARY:Sholatku - Fajr');
    expect(ics).toContain('DESCRIPTION:Fajr reminder');
  });
});
