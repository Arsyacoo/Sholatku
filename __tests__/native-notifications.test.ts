import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  cancelNativeNotifications,
  getExactAlarmPermissionState,
  getNativePendingNotifications,
  getNotificationPermissionState,
  requestExactAlarmPermission,
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
  checkExactNotificationSetting: vi.fn(),
  changeExactNotificationSetting: vi.fn(),
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
  localNotificationsMock.checkExactNotificationSetting.mockResolvedValue({ exact_alarm: 'denied' });
  localNotificationsMock.changeExactNotificationSetting.mockResolvedValue({ exact_alarm: 'granted' });
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

  it('falls back to inexact local notifications without the exact alarm permission', async () => {
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
    expect(localNotificationsMock.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'prayer-reminders-adhan', sound: 'adhan.ogg', importance: 3 })
    );
    expect(localNotificationsMock.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'prayer-reminders-silent', importance: 2 })
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

  it('routes each reminder sound to its own channel', async () => {
    const at = new Date('2026-09-08T04:40:00+07:00');
    await scheduleNativeNotifications([
      { id: 1, title: 'Subuh', body: 'Waktu Subuh', at, sound: 'adhan_short' },
      { id: 2, title: 'Dzuhur', body: 'Waktu Dzuhur', at, sound: 'none' },
    ]);

    const [{ notifications }] = localNotificationsMock.schedule.mock.calls.at(-1)!;
    expect(notifications.map((item: { channelId: string }) => item.channelId)).toEqual([
      'prayer-reminders-adhan',
      'prayer-reminders-silent',
    ]);
  });

  it('schedules exact alarms only once "Alarms & reminders" is granted', async () => {
    const at = new Date('2026-09-08T04:40:00+07:00');
    const request = [{ id: 7, title: 'Subuh', body: 'Waktu Subuh', at }];

    await scheduleNativeNotifications(request);
    expect(localNotificationsMock.schedule.mock.calls.at(-1)![0].notifications[0].isExactNotification).toBe(false);
    expect(localNotificationsMock.changeExactNotificationSetting).not.toHaveBeenCalled();

    localNotificationsMock.checkExactNotificationSetting.mockResolvedValue({ exact_alarm: 'granted' });
    await scheduleNativeNotifications(request);
    expect(localNotificationsMock.schedule.mock.calls.at(-1)![0].notifications[0].isExactNotification).toBe(true);
  });

  it('reports and requests the exact alarm permission', async () => {
    await expect(getExactAlarmPermissionState()).resolves.toBe('denied');
    await expect(requestExactAlarmPermission()).resolves.toBe('granted');
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
