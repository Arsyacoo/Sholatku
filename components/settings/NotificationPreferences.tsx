'use client';

import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, ExternalLink, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import type { PrayerReminderOffset, PrayerReminderSettings } from '@/types';
import { PRAYER_REMINDER_PRAYERS } from '@/types';
import { getPrayerReminderCapabilities } from '@/lib/prayer/reminders/capabilities';
import type { PrayerReminderCapabilities } from '@/lib/prayer/reminders/types';
import {
  getNotificationPermission,
  requestPrayerNotificationPermission,
  sendTestNotification,
} from '@/lib/prayer/reminders/notification';

interface NotificationPreferencesProps {
  value: PrayerReminderSettings;
  onChange: (settings: PrayerReminderSettings) => void;
}

const PRAYER_LABELS: Record<(typeof PRAYER_REMINDER_PRAYERS)[number], string> = {
  fajr: 'Subuh',
  dhuhr: 'Dzuhur',
  asr: 'Ashar',
  maghrib: 'Maghrib',
  isha: 'Isya',
};

const OFFSET_OPTIONS: Array<{ value: 'off' | PrayerReminderOffset; label: string }> = [
  { value: 'off', label: 'Nonaktif' },
  { value: 0, label: 'Tepat waktu' },
  { value: 5, label: '5 menit sebelum' },
  { value: 10, label: '10 menit sebelum' },
  { value: 15, label: '15 menit sebelum' },
  { value: 30, label: '30 menit sebelum' },
];

const INITIAL_CAPABILITIES: PrayerReminderCapabilities = {
  notificationsSupported: false,
  serviceWorkerSupported: false,
  permission: 'unsupported',
  canShowPersistentNotification: false,
  isStandalone: false,
  secureContext: false,
  calendarExportSupported: false,
  exactBackgroundSchedulingGuaranteed: false,
};

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  value,
  onChange,
}) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [capabilities, setCapabilities] = useState<PrayerReminderCapabilities>(INITIAL_CAPABILITIES);

  useEffect(() => {
    const refreshNotificationState = () => {
      setPermissionState(getNotificationPermission());
      setCapabilities(getPrayerReminderCapabilities());
    };

    refreshNotificationState();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshNotificationState();
    };

    window.addEventListener('focus', refreshNotificationState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshNotificationState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const requestPermission = async () => {
    const result = await requestPrayerNotificationPermission();
    setPermissionState(result);
  };

  const handleTestNotification = async () => {
    setIsSendingTest(true);
    await sendTestNotification();
    setIsSendingTest(false);
  };

  const handleReminderChange = (prayer: keyof PrayerReminderSettings, selected: string) => {
    const option = OFFSET_OPTIONS.find((item) => String(item.value) === selected);
    if (!option) return;
    onChange({
      ...value,
      [prayer]: {
        enabled: option.value !== 'off',
        offsetMinutes: option.value === 'off' ? 0 : option.value,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-bold text-slate-900 dark:text-slate-100">
          Pengingat Sholat
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Atur pengingat untuk setiap waktu sholat. Preferensi disimpan di perangkat ini.
        </p>
      </div>

      <div className="p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/80 text-primary-600 dark:text-primary-300 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Status Notifikasi
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
                {permissionState === 'granted'
                  ? 'Notifikasi diizinkan ✓'
                  : permissionState === 'denied'
                  ? 'Izin notifikasi diblokir browser'
                  : permissionState === 'unsupported'
                  ? 'Tidak didukung perangkat ini'
                  : 'Belum diaktifkan'}
              </div>
            </div>
          </div>

          {permissionState === 'default' && capabilities.notificationsSupported && (
            <Button size="sm" onClick={requestPermission}>
              Aktifkan Notifikasi
            </Button>
          )}
        </div>

        {permissionState === 'denied' && (
          <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3">
            Izin notifikasi diblokir. Aktifkan kembali melalui pengaturan browser untuk menggunakan notifikasi Sholatku.
          </p>
        )}
        {permissionState === 'unsupported' && (
          <p className="text-xs text-slate-600 dark:text-slate-300 bg-surface-50 dark:bg-surface-800 rounded-xl p-3">
            Browser ini tidak mendukung notifikasi web. Pengingat kalender tetap dapat digunakan.
          </p>
        )}

        <div className="space-y-2 border-t border-surface-100 dark:border-surface-800 pt-3">
          {PRAYER_REMINDER_PRAYERS.map((prayer) => {
            const reminder = value[prayer];
            const selected = reminder.enabled ? String(reminder.offsetMinutes) : 'off';
            return (
              <div key={prayer} className="flex items-center justify-between gap-3">
                <label htmlFor={`prayer-reminder-${prayer}`} className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {PRAYER_LABELS[prayer]}
                </label>
                <select
                  id={`prayer-reminder-${prayer}`}
                  aria-label={`Pengingat ${PRAYER_LABELS[prayer]}`}
                  value={selected}
                  onChange={(event) => handleReminderChange(prayer, event.target.value)}
                  className="rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-slate-200"
                >
                  {OFFSET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-surface-100 dark:border-surface-800 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestNotification}
            disabled={permissionState !== 'granted'}
            isLoading={isSendingTest}
          >
            <Send className="h-3.5 w-3.5" />
            Kirim Notifikasi Tes
          </Button>
          {capabilities.canShowPersistentNotification && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Notifikasi persisten tersedia saat PWA aktif
            </span>
          )}
        </div>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Notifikasi web bergantung pada dukungan browser. Untuk pengingat yang lebih konsisten saat aplikasi tidak dibuka, gunakan ekspor kalender.
        </p>
      </div>
    </div>
  );
};
