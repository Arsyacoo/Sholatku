'use client';

import React from 'react';
import { MoonStar } from 'lucide-react';
import type { HijriAdjustment, RamadanMode, RamadanPreferences as RamadanPreferencesValue, RamadanReminderSettings } from '@/types';
import { IMSAK_OFFSET_OPTIONS } from '@/lib/ramadan/timing';
import { Select } from '../ui/Select';
import { useLanguage } from '@/hooks/useLanguage';
import { prayerName } from '@/lib/prayer/constants';

type Translate = ReturnType<typeof useLanguage>['t'];

interface RamadanPreferencesProps {
  value: RamadanPreferencesValue;
  onChange: (value: RamadanPreferencesValue) => void;
}

const modeSelectOptions = (t: Translate): Array<{ value: RamadanMode; label: string }> => [
  { value: 'automatic', label: t('Otomatis', 'Automatic') },
  { value: 'enabled', label: t('Aktif', 'On') },
  { value: 'disabled', label: t('Nonaktif', 'Off') },
];

const REMINDER_VALUES = ['off', '0', '5'] as const;

const reminderSelectOptions = (t: Translate) => [
  { value: 'off', label: t('Nonaktif', 'Off') },
  { value: '0', label: t('Tepat waktu', 'On time') },
  { value: '5', label: t('5 menit sebelumnya', '5 minutes before') },
];

const imsakSelectOptions = (t: Translate) =>
  IMSAK_OFFSET_OPTIONS.map((offset) => ({
    value: offset,
    label: t(`${offset} menit sebelum Subuh`, `${offset} minutes before Fajr`),
  }));

const hijriAdjustmentOptions = (t: Translate): Array<{ value: HijriAdjustment; label: string }> => [
  { value: -1, label: t('-1 hari', '-1 day') },
  { value: 0, label: t('Tanpa koreksi', 'No adjustment') },
  { value: 1, label: t('+1 hari', '+1 day') },
];

function updateReminder(
  value: RamadanPreferencesValue,
  key: keyof RamadanReminderSettings,
  selected: string
): RamadanPreferencesValue {
  const option = REMINDER_VALUES.find((item) => item === selected);
  if (!option) return value;
  return {
    ...value,
    reminders: {
      ...value.reminders,
      [key]: {
        enabled: option !== 'off',
        offsetMinutes: option === 'off' ? 0 : Number(option) as 0 | 5,
      },
    },
  };
}

export const RamadanPreferences: React.FC<RamadanPreferencesProps> = ({ value, onChange }) => {
  const { t, language } = useLanguage();
  return (
  <div className="space-y-4">
    <div className="space-y-1">
      <label className="block text-sm font-bold text-slate-900 dark:text-slate-100">Ramadan</label>
      <p className="text-xs text-slate-500 dark:text-slate-400">{t('Atur tampilan Ramadan, waktu Imsak, dan pengingat tambahan secara ringkas.', 'Set up the Ramadan view, Imsak time and extra reminders.')}</p>
    </div>

    <div className="space-y-4 rounded-2xl border border-surface-200 bg-white p-4 shadow-2xs dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950/80 dark:text-primary-300">
          <MoonStar className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="ramadan-mode" className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('Mode Ramadan', 'Ramadan mode')}</label>
            <Select
              id="ramadan-mode"
              value={value.mode}
              options={modeSelectOptions(t)}
              onValueChange={(mode) => onChange({ ...value, mode: mode as RamadanMode })}
              ariaLabel={t('Mode Ramadan', 'Ramadan mode')}
              size="sm"
              className="w-[120px] shrink-0"
            />
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {value.mode === 'automatic'
              ? t('Mengikuti kalender Hijriah yang dihitung Sholatku.', 'Follows the Hijri calendar calculated by Sholatku.')
              : value.mode === 'enabled'
              ? t('Mode Ramadan dipaksa tampil.', 'Ramadan mode is always shown.')
              : t('Mode Ramadan disembunyikan.', 'Ramadan mode is hidden.')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-surface-100 pt-3 dark:border-surface-800">
        <label htmlFor="ramadan-imsak-offset" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Imsak</label>
        <Select
          id="ramadan-imsak-offset"
          value={value.imsakOffsetMinutes}
          options={imsakSelectOptions(t)}
          onValueChange={(offset) => onChange({ ...value, imsakOffsetMinutes: offset })}
          ariaLabel={t('Waktu Imsak', 'Imsak time')}
          size="sm"
          className="w-[180px] shrink-0"
        />
      </div>

      <div className="space-y-1.5 border-t border-surface-100 pt-3 dark:border-surface-800">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="ramadan-hijri-adjustment" className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('Koreksi tanggal Hijriah', 'Hijri date adjustment')}</label>
          <Select
            id="ramadan-hijri-adjustment"
            value={value.hijriAdjustment ?? 0}
            options={hijriAdjustmentOptions(t)}
            onValueChange={(hijriAdjustment) => onChange({ ...value, hijriAdjustment })}
            ariaLabel={t('Koreksi tanggal Hijriah', 'Hijri date adjustment')}
            size="sm"
            className="w-[180px] shrink-0"
          />
        </div>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t('Sesuaikan bila tanggal berbeda dengan pengumuman resmi, misalnya hasil sidang isbat. Berlaku untuk tanggal Hijriah di Beranda dan mode Ramadan.', 'Adjust if the date differs from the official announcement, such as the isbat session result. Applies to the Hijri date on Home and in Ramadan mode.')}</p>
      </div>

      <label className="flex items-center justify-between gap-3 border-t border-surface-100 pt-3 text-sm font-semibold text-slate-700 dark:border-surface-800 dark:text-slate-200">
        <span>{t('Tampilkan Ramadan di Beranda', 'Show Ramadan on Home')}</span>
        <input type="checkbox" checked={value.showHomeCard} onChange={(event) => onChange({ ...value, showHomeCard: event.target.checked })} className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
      </label>

      <div className="space-y-2 border-t border-surface-100 pt-3 dark:border-surface-800">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('Pengingat Ramadan (opsional)', 'Ramadan reminders (optional)')}</p>
        {(['imsak', 'maghrib'] as const).map((key) => {
          const label = key === 'imsak' ? prayerName('imsak', language) : t('Berbuka / Maghrib', 'Iftar / Maghrib');
          const reminder = value.reminders[key];
          const selected = reminder.enabled ? String(reminder.offsetMinutes) : 'off';
          return (
            <div key={key} className="flex items-center justify-between gap-3">
              <label htmlFor={`ramadan-reminder-${key}`} className="text-sm text-slate-700 dark:text-slate-200">{label}</label>
              <Select
                id={`ramadan-reminder-${key}`}
                value={selected}
                options={reminderSelectOptions(t)}
                onValueChange={(nextValue) => onChange(updateReminder(value, key, nextValue))}
                ariaLabel={t(`Pengingat ${label}`, `${label} reminder`)}
                size="sm"
                className="w-[180px] shrink-0"
              />
            </div>
          );
        })}
        <p className="pt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{t('Notifikasi mengikuti izin yang tersedia di perangkat ini. Ekspor kalender tetap tersedia jika notifikasi tidak didukung.', 'Notifications follow the permissions available on this device. Calendar export is still available if notifications are not supported.')}</p>
      </div>
    </div>
  </div>
  );
};

