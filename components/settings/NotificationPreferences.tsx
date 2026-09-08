'use client';

import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Info, Send, Smartphone, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import type { PrayerReminderOffset, PrayerReminderSettings } from '@/types';
import { PRAYER_REMINDER_PRAYERS } from '@/types';
import { getPrayerReminderCapabilities } from '@/lib/prayer/reminders/capabilities';
import type { PrayerReminderCapabilities } from '@/lib/prayer/reminders/types';
import type { NativeReminderDiagnostics } from '@/lib/prayer/reminders/native';
import {
  getNativeReminderDiagnostics,
  scheduleNativeReminderTestNotification,
} from '@/lib/prayer/reminders/native';
import { sendTestNotification } from '@/lib/prayer/reminders/notification';
import {
  getNotificationPermissionState,
  requestNotificationPermission,
  type NormalizedNotificationPermissionState,
} from '@/lib/platform/notifications';

declare const __SHOLATKU_NATIVE_REMINDER_QA__: boolean | undefined;
import { getAppRuntime } from '@/lib/platform/runtime';

interface NotificationPreferencesProps {
  value: PrayerReminderSettings;
  enabled: boolean;
  onChange: (settings: PrayerReminderSettings) => void;
  onEnabledChange: (enabled: boolean) => void;
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

const OFFSET_SELECT_OPTIONS = OFFSET_OPTIONS.map((option) => ({
  value: String(option.value),
  label: option.label,
}));

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

function describePermissionState(
  enabled: boolean,
  permissionState: NormalizedNotificationPermissionState,
  isNativeRuntime: boolean
): string {
  if (!enabled) return 'Pengingat belum diaktifkan.';
  if (permissionState === 'granted') {
    return isNativeRuntime
      ? 'Notifikasi aktif. Pengingat akan dijadwalkan di perangkat.'
      : 'Notifikasi diizinkan. Pengingat akan muncul saat browser mendukung.';
  }
  if (permissionState === 'denied') {
    return 'Notifikasi diblokir di perangkat. Ubah izin untuk menjalankan pengingat.';
  }
  if (permissionState === 'unsupported') {
    return 'Perangkat atau browser ini belum mendukung notifikasi.';
  }
  return 'Izinkan notifikasi untuk menjalankan pengingat.';
}

function getReminderToggleLabel(
  enabled: boolean,
  permissionState: NormalizedNotificationPermissionState
): string {
  if (!enabled) return 'Nonaktif';
  if (permissionState === 'granted') return 'Aktif';
  if (permissionState === 'denied') return 'Izin diblokir';
  if (permissionState === 'unsupported') return 'Tidak tersedia';
  return 'Izin diperlukan';
}

function formatPendingSummary(diagnostics: NativeReminderDiagnostics | null): string | null {
  if (!diagnostics?.nextPending) return null;
  const { nextPending } = diagnostics;
  const time = nextPending.scheduleAt?.toLocaleString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
  return time ? `${time} - ${nextPending.title}` : nextPending.title;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  value,
  enabled,
  onChange,
  onEnabledChange,
}) => {
  const runtime = getAppRuntime();
  const isNativeAndroid = runtime === 'android';
  const isDev =
    process.env.NODE_ENV !== 'production' ||
    (typeof __SHOLATKU_NATIVE_REMINDER_QA__ !== 'undefined' && __SHOLATKU_NATIVE_REMINDER_QA__);
  const [permissionState, setPermissionState] =
    useState<NormalizedNotificationPermissionState>('unsupported');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<PrayerReminderCapabilities>(INITIAL_CAPABILITIES);
  const [diagnostics, setDiagnostics] = useState<NativeReminderDiagnostics | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const [permission, nextCapabilities] = await Promise.all([
          getNotificationPermissionState(),
          Promise.resolve(getPrayerReminderCapabilities()),
        ]);

        if (cancelled) return;
        setPermissionState(permission);
        setCapabilities(nextCapabilities);

        if (isNativeAndroid) {
          const nextDiagnostics = await getNativeReminderDiagnostics();
          if (!cancelled) setDiagnostics(nextDiagnostics);
        } else {
          setDiagnostics(null);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to refresh reminder notification state:', error);
        }
      }
    };

    const handleNativeRefresh = () => {
      void refresh();
    };

    void refresh();

    window.addEventListener('focus', handleNativeRefresh);
    document.addEventListener('visibilitychange', handleNativeRefresh);
    window.addEventListener('sholatku:native-reminders-synced', handleNativeRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleNativeRefresh);
      document.removeEventListener('visibilitychange', handleNativeRefresh);
      window.removeEventListener('sholatku:native-reminders-synced', handleNativeRefresh);
    };
  }, [isNativeAndroid]);

  const requestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const result = await requestNotificationPermission();
      setPermissionState(result);
      if (result === 'granted') {
        setTestMessage('Notifikasi diizinkan. Pengingat akan dijadwalkan ulang.');
      } else if (result === 'denied') {
        setTestMessage('Notifikasi diblokir di perangkat. Pilihan pengingat tetap tersimpan.');
      } else if (result === 'unsupported') {
        setTestMessage('Notifikasi tidak didukung pada perangkat ini.');
      }
      return result;
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleMasterToggle = async (nextEnabled: boolean) => {
    setTestMessage(null);

    if (nextEnabled && permissionState !== 'granted' && permissionState !== 'unsupported') {
      await requestPermission();
    }

    onEnabledChange(nextEnabled);
    if (!nextEnabled) {
      setTestMessage('Pengingat dimatikan.');
    }
  };

  const handleTestNotification = async () => {
    setIsSendingTest(true);
    setTestMessage(null);
    try {
      const delivered = isNativeAndroid && isDev
        ? await scheduleNativeReminderTestNotification()
        : await sendTestNotification();

      setTestMessage(
        delivered
          ? isNativeAndroid && isDev
            ? 'Notifikasi tes native dijadwalkan dan akan muncul sebentar lagi.'
            : 'Notifikasi tes dikirim. Suara mengikuti pengaturan notifikasi perangkat.'
          : 'Notifikasi tes tidak dapat dikirim. Periksa izin dan pengaturan notifikasi perangkat.'
      );
    } catch {
      setTestMessage('Notifikasi tes gagal dikirim. Periksa izin dan pengaturan notifikasi perangkat.');
    } finally {
      setIsSendingTest(false);
    }
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

  const statusText = describePermissionState(enabled, permissionState, isNativeAndroid);
  const pendingSummary = isNativeAndroid && isDev ? formatPendingSummary(diagnostics) : null;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Pengingat Waktu Sholat
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Atur pengingat untuk setiap waktu sholat. Pilihan disimpan di perangkat ini.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xs dark:border-surface-800 dark:bg-surface-900">
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950/80 dark:text-primary-300">
              {isNativeAndroid ? <Smartphone className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Pengingat waktu sholat
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Aktifkan pengingat yang ingin Anda terima.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={enabled ? 'Nonaktifkan pengingat waktu sholat' : 'Aktifkan pengingat waktu sholat'}
            onClick={() => {
              void handleMasterToggle(!enabled);
            }}
            disabled={permissionState === 'unsupported' || isRequestingPermission}
            className="flex min-h-11 min-w-[60px] shrink-0 items-center justify-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700'}`}>
              <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </span>
          </button>
        </div>

        <div className="border-t border-surface-100 px-4 py-3 dark:border-surface-800">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Status notifikasi</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400" aria-live="polite">
                {statusText}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              permissionState === 'granted' && enabled
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                : permissionState === 'denied'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                : 'bg-surface-100 text-slate-600 dark:bg-surface-800 dark:text-slate-300'
            }`}>
              {getReminderToggleLabel(enabled, permissionState)}
            </span>
          </div>
        </div>

        {permissionState === 'denied' && (
          <p className="mx-4 mb-3 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
            Notifikasi diblokir di perangkat. Ubah izin notifikasi di pengaturan perangkat untuk memakai pengingat Sholatku.
          </p>
        )}
        {permissionState === 'unsupported' && (
          <p className="mx-4 mb-3 rounded-xl bg-surface-50 p-3 text-xs leading-relaxed text-slate-600 dark:bg-surface-800 dark:text-slate-300">
            Perangkat atau browser ini belum mendukung notifikasi. Pengingat tidak bisa dijalankan di runtime ini.
          </p>
        )}

        <div className="border-t border-surface-100 p-4 dark:border-surface-800">
          <div className="mb-3 space-y-0.5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Waktu pengingat</h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Pilih kapan pengingat muncul sebelum waktu sholat.
            </p>
          </div>
          <div className="space-y-2">
            {PRAYER_REMINDER_PRAYERS.map((prayer) => {
              const reminder = value[prayer];
              const selected = reminder.enabled ? String(reminder.offsetMinutes) : 'off';
              return (
                <div key={prayer} className="flex items-center justify-between gap-3">
                  <label htmlFor={`prayer-reminder-${prayer}`} className="min-w-0 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {PRAYER_LABELS[prayer]}
                  </label>
                  <Select
                    id={`prayer-reminder-${prayer}`}
                    value={selected}
                    options={OFFSET_SELECT_OPTIONS}
                    onValueChange={(nextValue) => handleReminderChange(prayer, nextValue)}
                    ariaLabel={`Pengingat ${PRAYER_LABELS[prayer]}`}
                    size="sm"
                    className="w-[164px] shrink-0"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-surface-100 px-4 py-3 dark:border-surface-800">
          {(!isNativeAndroid || isDev) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              disabled={permissionState !== 'granted' || isSendingTest || isRequestingPermission}
              isLoading={isSendingTest}
            >
              <Send className="h-3.5 w-3.5" />
              {isNativeAndroid ? 'Tes Pengingat Native' : 'Kirim Notifikasi Tes'}
            </Button>
          )}
          {capabilities.canShowPersistentNotification && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Notifikasi tetap dapat tampil saat aplikasi web aktif
            </span>
          )}
          {isNativeAndroid && isDev && pendingSummary && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
              <ShieldAlert className="h-3.5 w-3.5" />
              Pengingat berikutnya: {pendingSummary}
            </span>
          )}
        </div>

        {testMessage && (
          <p className="px-4 pb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300" role="status" aria-live="polite">
            {testMessage}
          </p>
        )}

        <p className="flex items-start gap-2 border-t border-surface-100 px-4 py-3 text-xs leading-relaxed text-slate-500 dark:border-surface-800 dark:text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {isNativeAndroid
            ? 'Di Android, pengingat muncul sebagai notifikasi lokal di perangkat.'
            : 'Notifikasi web bergantung pada dukungan browser. Untuk pengingat yang lebih konsisten saat aplikasi tidak dibuka, gunakan ekspor kalender.'}
        </p>
      </div>
    </div>
  );
};
