'use client';

import React from 'react';
import { Calendar, Moon } from 'lucide-react';
import { DailyPrayerSchedule } from '@/types';

interface DateHeaderProps {
  schedule: DailyPrayerSchedule | null;
}

export const DateHeader: React.FC<DateHeaderProps> = ({ schedule }) => {
  if (!schedule) return null;

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
          <span className="truncate">{schedule.hijriDate.formatted}</span>
        </p>
      </div>
    </div>
  );
};
