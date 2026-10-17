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
    <Modal isOpen={isOpen} onClose={close} title="Siapkan Sholatku" maxWidth="md">
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Tiga izin ini membuat jadwal sesuai kota Anda dan adzan berbunyi tepat waktu. Semuanya bisa diubah nanti di
          Pengaturan.
        </p>
        <ol className="space-y-2.5">
          <Step
            icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
            title="Lokasi"
            description={
              locationStatus === 'denied'
                ? 'Izin ditolak. Anda tetap bisa memilih kota secara manual di Beranda.'
                : 'Dipakai sekali untuk menentukan kota. Lokasi perkiraan sudah cukup.'
            }
            done={locationStatus === 'granted'}
            doneLabel="Kota terdeteksi"
            actionLabel={locationStatus === 'requesting' ? 'Mendeteksi...' : 'Izinkan lokasi'}
            onAction={onDetectLocation}
            isBusy={locationStatus === 'requesting'}
          />
          <Step
            icon={<BellRing className="h-4 w-4" aria-hidden="true" />}
            title="Pengingat adzan"
            description="Notifikasi saat masuk waktu Subuh, Dzuhur, Ashar, Maghrib, dan Isya."
            done={remindersOn}
            doneLabel="Pengingat aktif"
            actionLabel="Aktifkan pengingat"
            onAction={enableReminders}
            isBusy={busy === 'reminders'}
          />
          <Step
            icon={<AlarmClock className="h-4 w-4" aria-hidden="true" />}
            title="Adzan tepat waktu"
            description="Izinkan Alarm & pengingat agar notifikasi tidak tertunda saat ponsel menghemat baterai."
            done={exactAlarm === 'granted'}
            doneLabel="Tepat waktu aktif"
            actionLabel="Izinkan Alarm & pengingat"
            onAction={enableExactAlarm}
            isBusy={busy === 'exact'}
          />
        </ol>
        <Button className="w-full" onClick={close}>
          Selesai
        </Button>
      </div>
    </Modal>
  );
};
