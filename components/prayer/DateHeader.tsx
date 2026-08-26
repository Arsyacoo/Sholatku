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
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 py-1">
      {/* Gregorian Date */}
      <div className="flex items-center gap-2 font-medium">
        <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
        <span>{schedule.readableDate}</span>
      </div>

      {/* Hijri Date */}
      <div className="flex items-center gap-2 px-3 py-1 bg-surface-100 dark:bg-surface-800/80 rounded-full border border-surface-200/80 dark:border-surface-700/80 font-medium">
        <Moon className="w-3.5 h-3.5 text-gold-500 shrink-0" />
        <span className="text-slate-700 dark:text-slate-200">{schedule.hijriDate.formatted}</span>
      </div>
    </div>
  );
};
