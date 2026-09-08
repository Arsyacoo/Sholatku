'use client';

import React from 'react';
import { MoonStar } from 'lucide-react';
import type { RamadanMode, RamadanPreferences as RamadanPreferencesValue, RamadanReminderSettings } from '@/types';
import { IMSAK_OFFSET_OPTIONS } from '@/lib/ramadan/timing';
import { Select } from '../ui/Select';

interface RamadanPreferencesProps {
  value: RamadanPreferencesValue;
  onChange: (value: RamadanPreferencesValue) => void;
}

const MODE_OPTIONS: Array<{ value: RamadanMode; label: string }> = [
  { value: 'automatic', label: 'Otomatis' },
  { value: 'enabled', label: 'Aktif' },
  { value: 'disabled', label: 'Nonaktif' },
];

const REMINDER_OPTIONS = [
  { value: 'off', label: 'Nonaktif' },
  { value: '0', label: 'Tepat waktu' },
  { value: '5', label: '5 menit sebelumnya' },
] as const;

const MODE_SELECT_OPTIONS = MODE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const IMSAK_SELECT_OPTIONS = IMSAK_OFFSET_OPTIONS.map((offset) => ({
  value: offset,
  label: `${offset} menit sebelum Subuh`,
}));

const REMINDER_SELECT_OPTIONS = REMINDER_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

function updateReminder(
  value: RamadanPreferencesValue,
  key: keyof RamadanReminderSettings,
  selected: string
): RamadanPreferencesValue {
  const option = REMINDER_OPTIONS.find((item) => item.value === selected);
  if (!option) return value;
  return {
    ...value,
    reminders: {
      ...value.reminders,
      [key]: {
        enabled: option.value !== 'off',
        offsetMinutes: option.value === 'off' ? 0 : Number(option.value) as 0 | 5,
      },
    },
  };
}

export const RamadanPreferences: React.FC<RamadanPreferencesProps> = ({ value, onChange }) => (
  <div className="space-y-4">
    <div className="space-y-1">
      <label className="block text-sm font-bold text-slate-900 dark:text-slate-100">Ramadan</label>
      <p className="text-xs text-slate-500 dark:text-slate-400">Atur tampilan Ramadan, waktu Imsak, dan pengingat tambahan secara ringkas.</p>
    </div>

    <div className="space-y-4 rounded-2xl border border-surface-200 bg-white p-4 shadow-2xs dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950/80 dark:text-primary-300">
          <MoonStar className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="ramadan-mode" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mode Ramadan</label>
            <Select
              id="ramadan-mode"
              value={value.mode}
              options={MODE_SELECT_OPTIONS}
              onValueChange={(mode) => onChange({ ...value, mode: mode as RamadanMode })}
              ariaLabel="Mode Ramadan"
              size="sm"
              className="w-[120px] shrink-0"
            />
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {value.mode === 'automatic' ? 'Mengikuti kalender Hijriah yang dihitung Sholatku.' : value.mode === 'enabled' ? 'Mode Ramadan dipaksa tampil.' : 'Mode Ramadan disembunyikan.'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-surface-100 pt-3 dark:border-surface-800">
        <label htmlFor="ramadan-imsak-offset" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Imsak</label>
        <Select
          id="ramadan-imsak-offset"
          value={value.imsakOffsetMinutes}
          options={IMSAK_SELECT_OPTIONS}
          onValueChange={(offset) => onChange({ ...value, imsakOffsetMinutes: offset })}
          ariaLabel="Waktu Imsak"
          size="sm"
          className="w-[180px] shrink-0"
        />
      </div>

      <label className="flex items-center justify-between gap-3 border-t border-surface-100 pt-3 text-sm font-semibold text-slate-700 dark:border-surface-800 dark:text-slate-200">
        <span>Tampilkan Ramadan di Beranda</span>
        <input type="checkbox" checked={value.showHomeCard} onChange={(event) => onChange({ ...value, showHomeCard: event.target.checked })} className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
      </label>

      <div className="space-y-2 border-t border-surface-100 pt-3 dark:border-surface-800">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pengingat Ramadan (opsional)</p>
        {(['imsak', 'maghrib'] as const).map((key) => {
          const label = key === 'imsak' ? 'Imsak' : 'Berbuka / Maghrib';
          const reminder = value.reminders[key];
          const selected = reminder.enabled ? String(reminder.offsetMinutes) : 'off';
          return (
            <div key={key} className="flex items-center justify-between gap-3">
              <label htmlFor={`ramadan-reminder-${key}`} className="text-sm text-slate-700 dark:text-slate-200">{label}</label>
              <Select
                id={`ramadan-reminder-${key}`}
                value={selected}
                options={REMINDER_SELECT_OPTIONS}
                onValueChange={(nextValue) => onChange(updateReminder(value, key, nextValue))}
                ariaLabel={`Pengingat ${label}`}
                size="sm"
                className="w-[180px] shrink-0"
              />
            </div>
          );
        })}
        <p className="pt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">Notifikasi mengikuti izin yang tersedia di perangkat ini. Ekspor kalender tetap tersedia jika notifikasi tidak didukung.</p>
      </div>
    </div>
  </div>
);
