'use client';

import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Info, Send, Smartphone, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import type { PrayerReminderOffset, PrayerReminderSettings, UserSettings } from '@/types';
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
  getExactAlarmPermissionState,
  getNotificationPermissionState,
  requestExactAlarmPermission,
  requestNotificationPermission,
  type ExactAlarmPermissionState,
  type NormalizedNotificationPermissionState,
} from '@/lib/platform/notifications';

declare const __SHOLATKU_NATIVE_REMINDER_QA__: boolean | undefined;
import { getAppRuntime } from '@/lib/platform/runtime';
import { openAppSettings } from '@/lib/platform/app-settings';
import { useLanguage } from '@/hooks/useLanguage';
import { prayerName } from '@/lib/prayer/constants';

type Translate = ReturnType<typeof useLanguage>['t'];

interface NotificationPreferencesProps {
  value: PrayerReminderSettings;
  enabled: boolean;
  onChange: (settings: PrayerReminderSettings) => void;
  onEnabledChange: (enabled: boolean) => void;
  sound: UserSettings['adhanSound'];
  onSoundChange: (sound: UserSettings['adhanSound']) => void;
}

const soundSelectOptions = (t: Translate): Array<{ value: UserSettings['adhanSound']; label: string }> => [
  { value: 'beep', label: t('Bunyi bawaan', 'Default sound') },
  { value: 'adhan_short', label: t('Adzan', 'Adhan') },
  { value: 'none', label: t('Tanpa suara', 'Silent') },
];

const OFFSET_VALUES: Array<'off' | PrayerReminderOffset> = ['off', 0, 5, 10, 15, 30];

const offsetSelectOptions = (t: Translate) =>
  OFFSET_VALUES.map((value) => ({
    value: String(value),
    label:
      value === 'off'
        ? t('Nonaktif', 'Off')
        : value === 0
        ? t('Tepat waktu', 'On time')
        : t(`${value} menit sebelum`, `${value} minutes before`),
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
  isNativeRuntime: boolean,
  t: Translate
): string {
  if (!enabled) return t('Pengingat belum diaktifkan.', 'Reminders are not turned on yet.');
  if (permissionState === 'granted') {
    return isNativeRuntime
      ? t('Notifikasi aktif. Pengingat akan dijadwalkan di perangkat.', 'Notifications are on. Reminders will be scheduled on this device.')
      : t('Notifikasi diizinkan. Pengingat akan muncul saat browser mendukung.', 'Notifications are allowed. Reminders will appear when the browser supports it.');
  }
  if (permissionState === 'denied') {
    return t('Notifikasi diblokir di perangkat. Ubah izin untuk menjalankan pengingat.', 'Notifications are blocked on this device. Change the permission to use reminders.');
  }
  if (permissionState === 'unsupported') {
    return t('Perangkat atau browser ini belum mendukung notifikasi.', 'This device or browser does not support notifications.');
  }
  return t('Izinkan notifikasi untuk menjalankan pengingat.', 'Allow notifications to use reminders.');
}

function getReminderToggleLabel(
  enabled: boolean,
  permissionState: NormalizedNotificationPermissionState,
  t: Translate
): string {
  if (!enabled) return t('Nonaktif', 'Off');
  if (permissionState === 'granted') return t('Aktif', 'On');
  if (permissionState === 'denied') return t('Izin diblokir', 'Permission blocked');
  if (permissionState === 'unsupported') return t('Tidak tersedia', 'Unavailable');
  return t('Izin diperlukan', 'Permission needed');
}

function formatPendingSummary(diagnostics: NativeReminderDiagnostics | null, locale: string): string | null {
  if (!diagnostics?.nextPending) return null;
  const { nextPending } = diagnostics;
  const time = nextPending.scheduleAt?.toLocaleString(locale, {
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
  sound,
  onSoundChange,
}) => {
  const { t, language, locale } = useLanguage();
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
  const [exactAlarmState, setExactAlarmState] = useState<ExactAlarmPermissionState>('unsupported');

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
          const [nextDiagnostics, nextExactAlarmState] = await Promise.all([
            getNativeReminderDiagnostics(),
            getExactAlarmPermissionState(),
          ]);
          if (!cancelled) {
            setDiagnostics(nextDiagnostics);
            setExactAlarmState(nextExactAlarmState);
          }
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
        setTestMessage(t('Notifikasi diizinkan. Pengingat akan dijadwalkan ulang.', 'Notifications allowed. Reminders will be rescheduled.'));
      } else if (result === 'denied') {
        setTestMessage(t('Notifikasi diblokir di perangkat. Pilihan pengingat tetap tersimpan.', 'Notifications are blocked on this device. Your reminder choices are still saved.'));
      } else if (result === 'unsupported') {
        setTestMessage(t('Notifikasi tidak didukung pada perangkat ini.', 'Notifications are not supported on this device.'));
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
      setTestMessage(t('Pengingat dimatikan.', 'Reminders turned off.'));
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
            ? t('Notifikasi tes native dijadwalkan dan akan muncul sebentar lagi.', 'Native test notification scheduled; it will appear shortly.')
            : t('Notifikasi tes dikirim. Suara mengikuti pengaturan notifikasi perangkat.', 'Test notification sent. The sound follows your device notification settings.')
          : t('Notifikasi tes tidak dapat dikirim. Periksa izin dan pengaturan notifikasi perangkat.', 'The test notification could not be sent. Check your device notification permission and settings.')
      );
    } catch {
      setTestMessage(t('Notifikasi tes gagal dikirim. Periksa izin dan pengaturan notifikasi perangkat.', 'Failed to send the test notification. Check your device notification permission and settings.'));
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleReminderChange = (prayer: keyof PrayerReminderSettings, selected: string) => {
    const option = OFFSET_VALUES.find((item) => String(item) === selected);
    if (option === undefined) return;
    onChange({
      ...value,
      [prayer]: {
        enabled: option !== 'off',
        offsetMinutes: option === 'off' ? 0 : option,
      },
    });
  };

  const statusText = describePermissionState(enabled, permissionState, isNativeAndroid, t);
  const pendingSummary = isNativeAndroid && isDev ? formatPendingSummary(diagnostics, locale) : null;
  const offsetOptions = offsetSelectOptions(t);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {t('Pengingat Waktu Sholat', 'Prayer Time Reminders')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('Atur pengingat untuk setiap waktu sholat. Pilihan disimpan di perangkat ini.', 'Set a reminder for each prayer time. Your choices are saved on this device.')}
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
                {t('Pengingat waktu sholat', 'Prayer time reminders')}
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {t('Aktifkan pengingat yang ingin Anda terima.', 'Turn on the reminders you want to receive.')}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={enabled ? t('Nonaktifkan pengingat waktu sholat', 'Turn off prayer time reminders') : t('Aktifkan pengingat waktu sholat', 'Turn on prayer time reminders')}
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
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('Status notifikasi', 'Notification status')}</h3>
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
              {getReminderToggleLabel(enabled, permissionState, t)}
            </span>
          </div>
        </div>

        {permissionState === 'denied' && (
          <p className="mx-4 mb-3 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
            {t(
              'Notifikasi diblokir di perangkat. Ubah izin notifikasi di pengaturan perangkat untuk memakai pengingat Sholatku.',
              'Notifications are blocked on this device. Change the notification permission in your device settings to use Sholatku reminders.'
            )}
          </p>
        )}
        {isNativeAndroid && enabled && permissionState === 'granted' && (
          exactAlarmState === 'granted' ? (
            <p className="mx-4 mb-3 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t('Pengingat tepat waktu aktif.', 'Exact-time reminders are on.')}
            </p>
          ) : exactAlarmState === 'denied' ? (
            <div className="mx-4 mb-3 space-y-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <p>
                {t(
                  'Pengingat bisa terlambat beberapa menit saat ponsel menghemat baterai. Izinkan “Alarm & pengingat” agar adzan berbunyi tepat waktu.',
                  'Reminders may be a few minutes late while the phone saves battery. Allow “Alarms & reminders” so the adhan plays on time.'
                )}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const next = await requestExactAlarmPermission();
                  setExactAlarmState(next);
                  // Reschedule so pending reminders switch to exact delivery right away.
                  window.dispatchEvent(new CustomEvent('sholatku:prayer-reminders-changed', { detail: value }));
                }}
              >
                {t('Izinkan Alarm & pengingat', 'Allow Alarms & reminders')}
              </Button>
            </div>
          ) : null
        )}
        {permissionState === 'unsupported' && (
          <p className="mx-4 mb-3 rounded-xl bg-surface-50 p-3 text-xs leading-relaxed text-slate-600 dark:bg-surface-800 dark:text-slate-300">
            {t(
              'Perangkat atau browser ini belum mendukung notifikasi. Pengingat tidak bisa dijalankan di runtime ini.',
              'This device or browser does not support notifications. Reminders cannot run here.'
            )}
          </p>
        )}

        <div className="border-t border-surface-100 p-4 dark:border-surface-800">
          <div className="mb-3 space-y-0.5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('Waktu pengingat', 'Reminder time')}</h3>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {t('Pilih kapan pengingat muncul sebelum waktu sholat.', 'Choose when the reminder appears before each prayer time.')}
            </p>
          </div>
          <div className="space-y-2">
            {PRAYER_REMINDER_PRAYERS.map((prayer) => {
              const reminder = value[prayer];
              const selected = reminder.enabled ? String(reminder.offsetMinutes) : 'off';
              return (
                <div key={prayer} className="flex items-center justify-between gap-3">
                  <label htmlFor={`prayer-reminder-${prayer}`} className="min-w-0 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {prayerName(prayer, language)}
                  </label>
                  <Select
                    id={`prayer-reminder-${prayer}`}
                    value={selected}
                    options={offsetOptions}
                    onValueChange={(nextValue) => handleReminderChange(prayer, nextValue)}
                    ariaLabel={t(`Pengingat ${prayerName(prayer, language)}`, `${prayerName(prayer, language)} reminder`)}
                    size="sm"
                    className="w-[164px] shrink-0"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {isNativeAndroid && (
          <div className="space-y-1.5 border-t border-surface-100 p-4 dark:border-surface-800">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="prayer-reminder-sound" className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('Suara pengingat', 'Reminder sound')}</label>
              <Select
                id="prayer-reminder-sound"
                value={sound}
                options={soundSelectOptions(t)}
                onValueChange={onSoundChange}
                ariaLabel={t('Suara pengingat', 'Reminder sound')}
                size="sm"
                className="w-[164px] shrink-0"
              />
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {t(
                'Adzan diputar saat pengingat diatur tepat waktu. Pengingat sebelum waktu sholat dan Imsak tetap memakai bunyi bawaan.',
                'The adhan plays when a reminder is set to on time. Early reminders and Imsak still use the default sound.'
              )}
            </p>
          </div>
        )}

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
              {isNativeAndroid ? t('Tes Pengingat Native', 'Test Native Reminder') : t('Kirim Notifikasi Tes', 'Send Test Notification')}
            </Button>
          )}
          {capabilities.canShowPersistentNotification && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('Notifikasi tetap dapat tampil saat aplikasi web aktif', 'Notifications can still appear while the web app is open')}
            </span>
          )}
          {isNativeAndroid && isDev && pendingSummary && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
              <ShieldAlert className="h-3.5 w-3.5" />
              {t('Pengingat berikutnya', 'Next reminder')}: {pendingSummary}
            </span>
          )}
        </div>

        {testMessage && (
          <p className="px-4 pb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300" role="status" aria-live="polite">
            {testMessage}
          </p>
        )}

        {isNativeAndroid && (
          <details className="group border-t border-surface-100 px-4 py-3 dark:border-surface-800">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800 marker:text-slate-400 dark:text-slate-200">
              {t('Pengingat tidak muncul?', 'Reminders not showing?')}
            </summary>
            <div className="mt-2 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                {t(
                  'Beberapa ponsel menghentikan aplikasi untuk menghemat baterai. Buka pengaturan aplikasi Sholatku, lalu:',
                  'Some phones stop apps to save battery. Open the Sholatku app settings, then:'
                )}
              </p>
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  <span className="font-semibold">Samsung:</span>{' '}
                  {t(
                    'Baterai → pilih “Tidak dibatasi”. Di Izin aplikasi, matikan “Kelola aplikasi jika tidak digunakan”. Pastikan Sholatku tidak ada di daftar “Aplikasi tidur”.',
                    'Battery → choose “Unrestricted”. Under App permissions, turn off “Manage app if unused”. Make sure Sholatku is not in the “Sleeping apps” list.'
                  )}
                </li>
                <li>
                  <span className="font-semibold">Xiaomi, Oppo, Vivo, Realme:</span>{' '}
                  {t(
                    'aktifkan “Mulai otomatis” / Autostart dan matikan penghemat baterai untuk Sholatku.',
                    'turn on Autostart and turn off battery saver for Sholatku.'
                  )}
                </li>
                <li>
                  {t(
                    'Jangan tutup paksa Sholatku dari daftar aplikasi terbaru; Android menahan pengingat sampai aplikasi dibuka lagi.',
                    'Do not force-close Sholatku from the recent apps list; Android holds reminders until the app is opened again.'
                  )}
                </li>
              </ul>
              <Button variant="outline" size="sm" onClick={() => void openAppSettings()}>
                {t('Buka pengaturan aplikasi', 'Open app settings')}
              </Button>
            </div>
          </details>
        )}

        <p className="flex items-start gap-2 border-t border-surface-100 px-4 py-3 text-xs leading-relaxed text-slate-500 dark:border-surface-800 dark:text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {isNativeAndroid
            ? t('Di Android, pengingat muncul sebagai notifikasi lokal di perangkat.', 'On Android, reminders appear as local notifications on the device.')
            : t(
                'Notifikasi web bergantung pada dukungan browser. Untuk pengingat yang lebih konsisten saat aplikasi tidak dibuka, gunakan ekspor kalender.',
                'Web notifications depend on browser support. For more reliable reminders when the app is closed, use the calendar export.'
              )}

        </p>
      </div>
    </div>
  );
};
