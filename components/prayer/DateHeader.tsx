'use client';

import React from 'react';
import { Calendar, Moon } from 'lucide-react';
import { DailyPrayerSchedule } from '@/types';
import { formatHijriDate } from '@/lib/ramadan/calendar';
import { normalizeScheduleDate } from '@/lib/ramadan/timing';
import { zonedTimeToUtc } from '@/lib/time/timezone';

interface DateHeaderProps {
  schedule: DailyPrayerSchedule | null;
  hijriAdjustment?: number;
}

export const DateHeader: React.FC<DateHeaderProps> = ({ schedule, hijriAdjustment = 0 }) => {
  if (!schedule) return null;

  // Without a correction keep the provider label; with one, recompute so it matches Ramadan mode.
  const hijriLabel = hijriAdjustment
    ? formatHijriDate(
        zonedTimeToUtc(normalizeScheduleDate(schedule.date), '12:00', schedule.timezone),
        schedule.timezone,
        hijriAdjustment
      )
    : schedule.hijriDate.formatted;

  return (
    <div
      className="flex items-start gap-3 rounded-2xl border border-surface-200/80 bg-white/75 px-3.5 py-3 shadow-2xs dark:border-surface-800 dark:bg-surface-900/55"
      data-testid="home-date-context"
      aria-label="Tanggal hari ini"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/70 dark:text-primary-300">
        <Calendar className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 space-y-1">
        {/* Gregorian date stays primary within the grouped context. */}
        <p
          className="truncate text-sm font-semibold leading-5 text-slate-800 dark:text-slate-100 sm:text-[15px]"
          data-testid="gregorian-date"
        >
          {schedule.readableDate}
        </p>
        <p
          className="flex min-w-0 items-center gap-1.5 truncate text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm"
          data-testid="hijri-date"
        >
          <Moon className="h-3.5 w-3.5 shrink-0 text-gold-500" aria-hidden="true" />
          <span className="truncate">{hijriLabel}</span>
        </p>
      </div>
    </div>
  );
};
