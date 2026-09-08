import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  cancelNativeNotifications,
  getNativePendingNotifications,
  getNotificationPermissionState,
  requestNotificationPermission,
  scheduleNativeNotifications,
} from '@/lib/platform/notifications';

const localNotificationsMock = vi.hoisted(() => ({
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  listChannels: vi.fn(),
  createChannel: vi.fn(),
  schedule: vi.fn(),
  cancel: vi.fn(),
  getPending: vi.fn(),
  addListener: vi.fn(),
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: localNotificationsMock,
}));

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

beforeEach(() => {
  setNativeRuntime();
  vi.resetAllMocks();
  localNotificationsMock.listChannels.mockResolvedValue({ channels: [] });
  localNotificationsMock.createChannel.mockResolvedValue(undefined);
  localNotificationsMock.schedule.mockResolvedValue({ notifications: [] });
  localNotificationsMock.cancel.mockResolvedValue(undefined);
  localNotificationsMock.getPending.mockResolvedValue({ notifications: [] });
  localNotificationsMock.checkPermissions.mockResolvedValue({ display: 'granted' });
  localNotificationsMock.requestPermissions.mockResolvedValue({ display: 'granted' });
  localNotificationsMock.addListener.mockResolvedValue({ remove: vi.fn().mockResolvedValue(undefined) });
});

afterEach(() => {
  delete (globalThis as typeof globalThis & { Capacitor?: unknown }).Capacitor;
});

describe('native notification adapter', () => {
  it('normalizes native permission states', async () => {
    localNotificationsMock.checkPermissions.mockResolvedValueOnce({ display: 'prompt-with-rationale' });
    localNotificationsMock.requestPermissions.mockResolvedValueOnce({ display: 'denied' });

    await expect(getNotificationPermissionState()).resolves.toBe('prompt');
    await expect(requestNotificationPermission()).resolves.toBe('denied');
  });

  it('schedules inexact local notifications on the shared channel', async () => {
    const scheduledAt = new Date('2026-09-08T04:30:00+07:00');
    const result = await scheduleNativeNotifications([
      {
        id: 123456789,
        title: 'Subuh sebentar lagi',
        body: '10 menit menuju waktu Subuh - 04:30',
        at: scheduledAt,
        extra: {
          source: 'sholatku-native-reminder',
          route: '/',
        },
      },
    ]);

    expect(localNotificationsMock.listChannels).toHaveBeenCalledTimes(1);
    expect(localNotificationsMock.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'prayer-reminders',
        name: 'Pengingat Waktu Sholat',
        description: 'Notifikasi pengingat waktu sholat dan Ramadan',
        importance: 3,
      })
    );
    expect(localNotificationsMock.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        notifications: [
          expect.objectContaining({
            id: 123456789,
            title: 'Subuh sebentar lagi',
            body: '10 menit menuju waktu Subuh - 04:30',
            channelId: 'prayer-reminders',
            autoCancel: true,
            foreground: true,
            isExactNotification: false,
            schedule: { at: scheduledAt },
            extra: expect.objectContaining({
              source: 'sholatku-native-reminder',
              route: '/',
            }),
          }),
        ],
      })
    );
    expect(result).toEqual({ notifications: [] });
  });

  it('cancels only the requested native reminder ids', async () => {
    await cancelNativeNotifications([11, 22, 33]);

    expect(localNotificationsMock.cancel).toHaveBeenCalledWith({
      notifications: [{ id: 11 }, { id: 22 }, { id: 33 }],
    });
  });

  it('returns pending notifications from the native plugin', async () => {
    const pending = [
      { id: 1, title: 'A', body: 'B', extra: { source: 'sholatku-native-reminder' } },
    ];
    localNotificationsMock.getPending.mockResolvedValueOnce({ notifications: pending });

    await expect(getNativePendingNotifications()).resolves.toEqual(pending);
  });
});
