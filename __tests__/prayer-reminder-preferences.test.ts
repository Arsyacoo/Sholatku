import { beforeEach, describe, expect, it } from 'vitest';
import {
  getDefaultPrayerReminderSettings,
  getPrayerReminderSettings,
  resetPrayerReminderSettings,
  savePrayerReminderSettings,
  updatePrayerReminder,
} from '@/lib/storage/preferences';
import { getPrayerReminderCapabilities } from '@/lib/prayer/reminders/capabilities';
import { PRAYER_REMINDER_PRAYERS, PrayerReminderOffset } from '@/types';

const storage: Record<string, string> = {};

beforeEach(() => {
  for (const key of Object.keys(storage)) delete storage[key];
  (globalThis as any).localStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => delete storage[key],
  };
  (globalThis as any).window = {};
});

describe('Prayer reminder preferences', () => {
  it('uses safe disabled defaults', () => {
    expect(getPrayerReminderSettings()).toEqual(getDefaultPrayerReminderSettings());
    expect(PRAYER_REMINDER_PRAYERS.every((prayer) => !getPrayerReminderSettings()[prayer].enabled)).toBe(true);
  });

  it('persists independent prayer settings and supported offsets', () => {
    const offsets: PrayerReminderOffset[] = [0, 5, 10, 15, 30];
    for (const [index, prayer] of PRAYER_REMINDER_PRAYERS.entries()) {
      updatePrayerReminder(prayer, { enabled: true, offsetMinutes: offsets[index] ?? 0 });
    }
    expect(getPrayerReminderSettings()).toEqual({
      fajr: { enabled: true, offsetMinutes: 0 },
      dhuhr: { enabled: true, offsetMinutes: 5 },
      asr: { enabled: true, offsetMinutes: 10 },
      maghrib: { enabled: true, offsetMinutes: 15 },
      isha: { enabled: true, offsetMinutes: 30 },
    });
  });

  it('recovers corrupt and invalid persisted values without throwing', () => {
    storage.sholatku_prayer_reminders_v1 = '{broken';
    expect(getPrayerReminderSettings()).toEqual(getDefaultPrayerReminderSettings());

    savePrayerReminderSettings({
      fajr: { enabled: true, offsetMinutes: 99 as PrayerReminderOffset },
      dhuhr: { enabled: true, offsetMinutes: 5 },
      asr: { enabled: 'yes' as unknown as boolean, offsetMinutes: 10 },
      maghrib: { enabled: true, offsetMinutes: 15 },
      isha: { enabled: true, offsetMinutes: 30 },
    });
    expect(getPrayerReminderSettings().fajr).toEqual({ enabled: true, offsetMinutes: 0 });
    expect(getPrayerReminderSettings().asr).toEqual({ enabled: false, offsetMinutes: 10 });
  });

  it('resets saved settings', () => {
    updatePrayerReminder('isha', { enabled: true, offsetMinutes: 30 });
    expect(resetPrayerReminderSettings().isha.enabled).toBe(false);
    expect(getPrayerReminderSettings().isha.offsetMinutes).toBe(0);
  });
});

describe('Prayer reminder capability detection', () => {
  it('returns an honest unsupported fallback outside a browser', () => {
    const originalWindow = (globalThis as any).window;
    const originalNavigator = (globalThis as any).navigator;
    try {
      delete (globalThis as any).window;
      delete (globalThis as any).navigator;
      const capabilities = getPrayerReminderCapabilities();
      expect(capabilities.notificationsSupported).toBe(false);
      expect(capabilities.serviceWorkerSupported).toBe(false);
      expect(capabilities.permission).toBe('unsupported');
      expect(capabilities.exactBackgroundSchedulingGuaranteed).toBe(false);
    } finally {
      (globalThis as any).window = originalWindow;
      (globalThis as any).navigator = originalNavigator;
    }
  });

  it('does not overstate persistent support when service workers are unavailable', () => {
    class MockNotification {
      static permission = 'granted' as NotificationPermission;
    }
    (globalThis as any).window = { Notification: MockNotification, isSecureContext: true };
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {},
    });
    const capabilities = getPrayerReminderCapabilities();
    expect(capabilities.notificationsSupported).toBe(true);
    expect(capabilities.serviceWorkerSupported).toBe(false);
    expect(capabilities.canShowPersistentNotification).toBe(false);
    expect(capabilities.exactBackgroundSchedulingGuaranteed).toBe(false);
  });
});
