import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  DailyPrayerSchedule,
  PrayerReminderSettings,
  RamadanPreferences,
  UserLocation,
  UserSettings,
} from '@/types';
import {
  buildReminderNotificationCopy,
  buildReminderNotificationExtra,
  isApprovedReminderRoute,
  REMINDER_NOTIFICATION_SOURCE,
} from '@/lib/prayer/reminders/copy';
import { toAndroidNotificationId } from '@/lib/prayer/reminders/id';

const platformNotificationsMock = vi.hoisted(() => ({
  addNativeNotificationActionListener: vi.fn(),
  cancelNativeNotifications: vi.fn(),
  ensureReminderNotificationChannel: vi.fn(),
  getNativePendingNotifications: vi.fn(),
  getNativeReminderChannelId: vi.fn(),
  getNotificationPermissionState: vi.fn(),
  isNativeReminderNotification: vi.fn(),
  scheduleNativeNotifications: vi.fn(),
}));

const prayerApiMock = vi.hoisted(() => ({
  getDailyPrayerTimes: vi.fn(),
}));

const ramadanCalendarMock = vi.hoisted(() => ({
  getRamadanStatus: vi.fn(),
}));

vi.mock('@/lib/platform/notifications', () => platformNotificationsMock);
vi.mock('@/lib/prayer/api', () => prayerApiMock);
vi.mock('@/lib/ramadan/calendar', () => ramadanCalendarMock);

import { reconcileNativeReminderSchedule } from '@/lib/prayer/reminders/native';

function setNativeRuntime(): void {
  (globalThis as typeof globalThis & {
    Capacitor?: {
      getPlatform?: () => string;
      isNativePlatform?: () => boolean;
    };
  }).Capacitor = {
    getPlatform: () => 'android',
    isNativePlatform: () => true,
  };
}

function createSchedule(date: string, overrides: Partial<DailyPrayerSchedule['timings']> = {}): DailyPrayerSchedule {
  return {
    date,
    readableDate: 'Senin, 8 September 2026',
    hijriDate: {
      day: '16',
      month: {
        en: 'Rabiul Awwal',
        ar: 'ربيع الأول',
      },
      year: '1448',
      formatted: '16 Rabiul Awwal 1448 H',
    },
    timezone: 'Asia/Jakarta',
    offset: 7,
    timings: {
      fajr: '04:30',
      sunrise: '05:45',
      dhuhr: '12:00',
      asr: '15:15',
      maghrib: '18:00',
      isha: '19:05',
      ...overrides,
    },
    source: 'calculated',
  };
}

function createSnapshot(enableNotifications: boolean): {
  location: UserLocation;
  settings: UserSettings;
  reminderSettings: PrayerReminderSettings;
  ramadanPreferences: RamadanPreferences;
} {
  return {
    location: {
      city: 'Jakarta',
      province: 'DKI Jakarta',
      country: 'Indonesia',
      latitude: -6.2,
      longitude: 106.8,
      timezone: 'Asia/Jakarta',
      isAutoDetected: false,
      displayName: 'Jakarta, DKI Jakarta',
    },
    settings: {
      method: '20',
      madhab: 'shafii',
      adjustments: {
        fajr: 0,
        sunrise: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0,
      },
      timeFormat24h: true,
      theme: 'system',
      enableNotifications,
      notifyBeforeMinutes: 0,
      adhanSound: 'beep',
    },
    reminderSettings: {
      fajr: { enabled: true, offsetMinutes: 10 },
      dhuhr: { enabled: true, offsetMinutes: 0 },
      asr: { enabled: true, offsetMinutes: 5 },
      maghrib: { enabled: true, offsetMinutes: 15 },
      isha: { enabled: true, offsetMinutes: 30 },
    },
    ramadanPreferences: {
      mode: 'automatic',
      imsakOffsetMinutes: 10,
      showHomeCard: true,
      reminders: {
        imsak: { enabled: true, offsetMinutes: 0 },
        maghrib: { enabled: true, offsetMinutes: 5 },
      },
    },
  };
}

const ownedPending = {
  id: 101,
  title: 'Old Sholatku reminder',
  body: 'Stale',
  extra: {
    source: REMINDER_NOTIFICATION_SOURCE,
    route: '/',
  },
};

const foreignPending = {
  id: 202,
  title: 'Other app reminder',
  body: 'Keep me',
  extra: {
    source: 'other-app',
    route: '/outside',
  },
};

beforeEach(() => {
  setNativeRuntime();
  vi.resetAllMocks();
  platformNotificationsMock.addNativeNotificationActionListener.mockResolvedValue(async () => undefined);
  platformNotificationsMock.cancelNativeNotifications.mockResolvedValue(undefined);
  platformNotificationsMock.ensureReminderNotificationChannel.mockResolvedValue(undefined);
  platformNotificationsMock.getNativePendingNotifications.mockResolvedValue([ownedPending, foreignPending]);
  platformNotificationsMock.getNativeReminderChannelId.mockReturnValue('prayer-reminders');
  platformNotificationsMock.getNotificationPermissionState.mockResolvedValue('granted');
  platformNotificationsMock.isNativeReminderNotification.mockImplementation(
    (notification: { extra?: { source?: unknown } }) => notification.extra?.source === REMINDER_NOTIFICATION_SOURCE
  );
  platformNotificationsMock.scheduleNativeNotifications.mockResolvedValue({ notifications: [] });
  prayerApiMock.getDailyPrayerTimes.mockResolvedValue(createSchedule('2026-09-08'));
  ramadanCalendarMock.getRamadanStatus.mockReturnValue({ isRamadan: false, ramadanDay: null } as any);
});

afterEach(() => {
  vi.useRealTimers();
  delete (globalThis as typeof globalThis & { Capacitor?: unknown }).Capacitor;
});

describe('native reminder ids and copy', () => {
  it('maps logical reminder ids to stable signed 32-bit android ids', () => {
    const logicalIds = [
      '2026-09-08-fajr-0',
      '2026-09-08-dhuhr-0',
      '2026-09-08-asr-5',
      '2026-09-08-maghrib-15',
      '2026-09-08-isha-30',
      '2026-09-09-fajr-0',
      '2026-09-09-imsak-0',
      '2026-09-09-maghrib-5',
    ];
    const ids = logicalIds.map((logicalId) => toAndroidNotificationId(logicalId));

    expect(toAndroidNotificationId(logicalIds[0])).toBe(ids[0]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => Number.isInteger(id) && id !== 0)).toBe(true);
    expect(ids.every((id) => id >= -2147483648 && id <= 2147483647)).toBe(true);
  });

  it('builds prayer and Ramadan notification copy with approved routes', () => {
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
    const ramadanEvent = {
      kind: 'ramadan',
      route: '/ramadan',
      id: '2026-09-08-ramadan-maghrib-5',
      date: '2026-09-08',
      prayer: 'maghrib',
      prayerAt: new Date('2026-09-08T18:05:00+07:00'),
      reminderAt: new Date('2026-09-08T18:00:00+07:00'),
      offsetMinutes: 5,
      timezone: 'Asia/Jakarta',
    } as const;

    expect(buildReminderNotificationCopy(prayerEvent)).toMatchObject({
      title: 'Subuh sebentar lagi',
      body: '10 menit menuju waktu Subuh - 04:30',
      route: '/',
    });
    expect(buildReminderNotificationCopy(ramadanEvent)).toMatchObject({
      title: 'berbuka akan tiba',
      body: '5 menit menuju waktu berbuka - 18:05',
      route: '/ramadan',
    });
    expect(buildReminderNotificationCopy({
      ...prayerEvent,
      offsetMinutes: 0,
      reminderAt: new Date('2026-09-08T04:30:00+07:00'),
    })).toMatchObject({
      title: 'Waktu Subuh telah masuk',
      body: 'Telah masuk waktu Subuh - 04:30',
    });
    expect(buildReminderNotificationExtra(ramadanEvent)).toEqual(
      expect.objectContaining({
        source: REMINDER_NOTIFICATION_SOURCE,
        kind: 'ramadan',
        logicalId: '2026-09-08-ramadan-maghrib-5',
        route: '/ramadan',
        timezone: 'Asia/Jakarta',
        offsetMinutes: 5,
      })
    );
    expect(isApprovedReminderRoute('/')).toBe(true);
    expect(isApprovedReminderRoute('/ramadan')).toBe(true);
    expect(isApprovedReminderRoute('https://example.com')).toBe(false);
  });
});

describe('native reminder reconciliation', () => {
  it('schedules bounded future reminders when enabled and permission is granted', async () => {
    vi.useFakeTimers({ now: new Date('2026-09-08T03:00:00+07:00') });
    prayerApiMock.getDailyPrayerTimes
      .mockResolvedValueOnce(createSchedule('2026-09-08'))
      .mockResolvedValueOnce(createSchedule('2026-09-09'));

    const result = await reconcileNativeReminderSchedule(createSnapshot(true));
    const scheduledRequests = platformNotificationsMock.scheduleNativeNotifications.mock.calls[0]?.[0] ?? [];

    expect(platformNotificationsMock.ensureReminderNotificationChannel).toHaveBeenCalledTimes(1);
    expect(platformNotificationsMock.cancelNativeNotifications).toHaveBeenCalledWith([ownedPending.id]);
    expect(platformNotificationsMock.scheduleNativeNotifications).toHaveBeenCalledTimes(1);
    expect(scheduledRequests).toHaveLength(10);
    expect(new Set(scheduledRequests.map((request: { id: number }) => request.id)).size).toBe(10);
    expect(
      scheduledRequests.every((request: { at: Date }) => {
        const now = Date.now();
        return request.at.getTime() > now && request.at.getTime() <= now + 48 * 60 * 60 * 1000;
      })
    ).toBe(true);
    expect(
      scheduledRequests.every((request: { extra?: { source?: string } }) => request.extra?.source === REMINDER_NOTIFICATION_SOURCE)
    ).toBe(true);
    expect(prayerApiMock.getDailyPrayerTimes).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      runtime: 'android',
      permission: 'granted',
      enabled: true,
      channelId: 'prayer-reminders',
      horizonHours: 48,
      scheduledCount: 10,
      canceledCount: 1,
      pendingCount: 1,
    });
  });

  it('cancels owned reminders and skips scheduling when the master toggle is off', async () => {
    const result = await reconcileNativeReminderSchedule(createSnapshot(false));

    expect(platformNotificationsMock.ensureReminderNotificationChannel).toHaveBeenCalledTimes(1);
    expect(platformNotificationsMock.cancelNativeNotifications).toHaveBeenCalledWith([ownedPending.id]);
    expect(platformNotificationsMock.scheduleNativeNotifications).not.toHaveBeenCalled();
    expect(prayerApiMock.getDailyPrayerTimes).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      enabled: false,
      permission: 'granted',
      scheduledCount: 0,
      canceledCount: 1,
    });
  });

  it('cancels owned reminders and skips scheduling when permission is denied', async () => {
    platformNotificationsMock.getNotificationPermissionState.mockResolvedValue('denied');

    const result = await reconcileNativeReminderSchedule(createSnapshot(true));

    expect(platformNotificationsMock.ensureReminderNotificationChannel).toHaveBeenCalledTimes(1);
    expect(platformNotificationsMock.cancelNativeNotifications).toHaveBeenCalledWith([ownedPending.id]);
    expect(platformNotificationsMock.scheduleNativeNotifications).not.toHaveBeenCalled();
    expect(prayerApiMock.getDailyPrayerTimes).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      enabled: true,
      permission: 'denied',
      scheduledCount: 0,
      canceledCount: 1,
    });
  });
});
