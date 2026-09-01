import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getNotificationPermission,
  requestPrayerNotificationPermission,
  sendTestNotification,
  TEST_NOTIFICATION_TAG,
} from '@/lib/prayer/reminders/notification';

beforeEach(() => {
  (globalThis as any).window = {};
  Object.defineProperty(globalThis, 'navigator', {
    value: {},
    configurable: true,
    writable: true,
  });
});

describe('notification permission experience', () => {
  it('does not request permission when Notification API is unsupported', async () => {
    expect(getNotificationPermission()).toBe('unsupported');
    expect(await requestPrayerNotificationPermission()).toBe('unsupported');
  });

  it('requests permission only through explicit helper action', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted');
    class MockNotification {
      static permission = 'default' as NotificationPermission;
      static requestPermission = requestPermission;
      constructor() {}
    }
    (globalThis as any).window.Notification = MockNotification;

    expect(getNotificationPermission()).toBe('default');
    expect(await requestPrayerNotificationPermission()).toBe('granted');
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it('handles denied permission and does not attempt a test notification', async () => {
    class MockNotification {
      static permission = 'denied' as NotificationPermission;
      constructor() {
        throw new Error('should not construct');
      }
    }
    (globalThis as any).window.Notification = MockNotification;
    expect(getNotificationPermission()).toBe('denied');
    expect(await sendTestNotification()).toBe(false);
  });

  it('uses service worker notification with a stable test tag', async () => {
    const showNotification = vi.fn().mockResolvedValue(undefined);
    class MockNotification {
      static permission = 'granted' as NotificationPermission;
      constructor() {}
    }
    (globalThis as any).window.Notification = MockNotification;
    (globalThis as any).navigator = {
      serviceWorker: { getRegistration: vi.fn().mockResolvedValue({ showNotification }) },
    };

    expect(await sendTestNotification()).toBe(true);
    expect(showNotification).toHaveBeenCalledWith(
      'Sholatku',
      expect.objectContaining({ tag: TEST_NOTIFICATION_TAG })
    );
  });

  it('falls back to page notification when no service worker is registered', async () => {
    const MockNotification = class {
      static permission = 'granted' as NotificationPermission;
      constructor() {}
    };
    (globalThis as any).window.Notification = MockNotification;
    (globalThis as any).navigator = {
      serviceWorker: { getRegistration: vi.fn().mockResolvedValue(undefined) },
    };

    expect(await sendTestNotification()).toBe(true);
  });
});
