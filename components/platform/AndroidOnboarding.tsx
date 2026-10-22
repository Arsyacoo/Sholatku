'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlarmClock, BellRing, CheckCircle2, MapPin } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { GeolocationStatus } from '@/hooks/useLocation';
import { isOnboardingDone, markOnboardingDone } from '@/lib/platform/app-settings';
import {
  getExactAlarmPermissionState,
  getNotificationPermissionState,
  requestExactAlarmPermission,
  requestNotificationPermission,
  type ExactAlarmPermissionState,
} from '@/lib/platform/notifications';
import { isNativeRuntime } from '@/lib/platform/runtime';
import { useLanguage } from '@/hooks/useLanguage';
import {
  getPrayerReminderSettings,
  getSavedSettings,
  savePrayerReminderSettings,
  saveSettings,
  withDefaultPrayerReminders,
} from '@/lib/storage/preferences';

interface AndroidOnboardingProps {
  locationStatus: GeolocationStatus;
  onDetectLocation: () => void;
  /** Called after reminder preferences change so the page re-reads them from storage. */
  onPreferencesChanged: () => void;
}

interface StepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  done: boolean;
  doneLabel: string;
  actionLabel: string;
  onAction: () => void;
  isBusy?: boolean;
}

const Step: React.FC<StepProps> = ({ icon, title, description, done, doneLabel, actionLabel, onAction, isBusy }) => (
  <li className="flex items-start gap-3 rounded-2xl border border-surface-200 p-3.5 dark:border-surface-800">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
      {icon}
    </div>
    <div className="min-w-0 flex-1 space-y-2">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {done ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          {doneLabel}
        </p>
      ) : (
        <Button variant="outline" size="sm" onClick={onAction} isLoading={isBusy}>
          {actionLabel}
        </Button>
      )}
    </div>
  </li>
);

/** First-run guide on Android: location, adhan reminders, and on-time delivery, each one tap away. */
export const AndroidOnboarding: React.FC<AndroidOnboardingProps> = ({
  locationStatus,
  onDetectLocation,
  onPreferencesChanged,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [remindersOn, setRemindersOn] = useState(false);
  const [exactAlarm, setExactAlarm] = useState<ExactAlarmPermissionState>('unsupported');
  const [busy, setBusy] = useState<'reminders' | 'exact' | null>(null);

  const refresh = useCallback(async () => {
    const [notification, exact] = await Promise.all([getNotificationPermissionState(), getExactAlarmPermissionState()]);
    setRemindersOn(notification === 'granted' && getSavedSettings().enableNotifications);
    setExactAlarm(exact);
  }, []);

  useEffect(() => {
    if (!isNativeRuntime() || isOnboardingDone()) return;
    setIsOpen(true);
    void refresh();
  }, [refresh]);

  const close = () => {
    markOnboardingDone();
    setIsOpen(false);
  };

  const enableReminders = async () => {
    setBusy('reminders');
    try {
      if ((await requestNotificationPermission()) !== 'granted') return;
      const settings = { ...getSavedSettings(), enableNotifications: true };
      const reminders = withDefaultPrayerReminders(getPrayerReminderSettings());
      saveSettings(settings);
      savePrayerReminderSettings(reminders);
      window.dispatchEvent(new CustomEvent('sholatku:settings-changed', { detail: settings }));
      window.dispatchEvent(new CustomEvent('sholatku:prayer-reminders-changed', { detail: reminders }));
      onPreferencesChanged();
    } finally {
      await refresh();
      setBusy(null);
    }
  };

  const enableExactAlarm = async () => {
    setBusy('exact');
    try {
      await requestExactAlarmPermission();
      // Reschedule so pending reminders switch to exact delivery.
      window.dispatchEvent(new CustomEvent('sholatku:prayer-reminders-changed', { detail: getPrayerReminderSettings() }));
    } finally {
      await refresh();
      setBusy(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title={t('Siapkan Sholatku', 'Set up Sholatku')} maxWidth="md">
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {t(
            'Tiga izin ini membuat jadwal sesuai kota Anda dan adzan berbunyi tepat waktu. Semuanya bisa diubah nanti di Pengaturan.',
            'These three permissions match the schedule to your city and make the adhan play on time. You can change them later in Settings.'
          )}
        </p>
        <ol className="space-y-2.5">
          <Step
            icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
            title={t('Lokasi', 'Location')}
            description={
              locationStatus === 'denied'
                ? t('Izin ditolak. Anda tetap bisa memilih kota secara manual di Beranda.', 'Permission denied. You can still choose your city manually on Home.')
                : t('Dipakai sekali untuk menentukan kota. Lokasi perkiraan sudah cukup.', 'Used once to find your city. Approximate location is enough.')
            }
            done={locationStatus === 'granted'}
            doneLabel={t('Kota terdeteksi', 'City detected')}
            actionLabel={locationStatus === 'requesting' ? t('Mendeteksi...', 'Detecting...') : t('Izinkan lokasi', 'Allow location')}
            onAction={onDetectLocation}
            isBusy={locationStatus === 'requesting'}
          />
          <Step
            icon={<BellRing className="h-4 w-4" aria-hidden="true" />}
            title={t('Pengingat adzan', 'Adhan reminders')}
            description={t(
              'Notifikasi saat masuk waktu Subuh, Dzuhur, Ashar, Maghrib, dan Isya.',
              'A notification when Fajr, Dhuhr, Asr, Maghrib and Isha begin.'
            )}
            done={remindersOn}
            doneLabel={t('Pengingat aktif', 'Reminders on')}
            actionLabel={t('Aktifkan pengingat', 'Turn on reminders')}
            onAction={enableReminders}
            isBusy={busy === 'reminders'}
          />
          <Step
            icon={<AlarmClock className="h-4 w-4" aria-hidden="true" />}
            title={t('Adzan tepat waktu', 'On-time adhan')}
            description={t(
              'Izinkan Alarm & pengingat agar notifikasi tidak tertunda saat ponsel menghemat baterai.',
              'Allow Alarms & reminders so notifications are not delayed while the phone saves battery.'
            )}
            done={exactAlarm === 'granted'}
            doneLabel={t('Tepat waktu aktif', 'On-time delivery on')}
            actionLabel={t('Izinkan Alarm & pengingat', 'Allow Alarms & reminders')}
            onAction={enableExactAlarm}
            isBusy={busy === 'exact'}
          />
        </ol>
        <Button className="w-full" onClick={close}>
          {t('Selesai', 'Done')}

        </Button>
      </div>
    </Modal>
  );
};
