'use client';

import React, { useState } from 'react';
import { CalendarDays, Download } from 'lucide-react';
import type { PrayerReminderSettings, UserLocation, UserSettings } from '@/types';
import { getMonthlyPrayerTimes } from '@/lib/prayer/api';
import {
  downloadPrayerCalendar,
  generatePrayerCalendarIcs,
  getPrayerCalendarFilename,
} from '@/lib/prayer/reminders/ics';
import { Button } from '../ui/Button';

interface PrayerCalendarExportProps {
  location: UserLocation;
  settings: UserSettings;
  reminderSettings: PrayerReminderSettings;
}

export const PrayerCalendarExport: React.FC<PrayerCalendarExportProps> = ({
  location,
  settings,
  reminderSettings,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const exportCurrentMonth = async () => {
    setIsExporting(true);
    setMessage(null);
    const now = new Date();
    try {
      const schedule = await getMonthlyPrayerTimes(location, settings, now.getFullYear(), now.getMonth() + 1);
      const ics = generatePrayerCalendarIcs(schedule, location, reminderSettings);
      const downloaded = downloadPrayerCalendar(
        ics,
        getPrayerCalendarFilename(now.getFullYear(), now.getMonth() + 1)
      );
      setMessage(downloaded ? 'Jadwal kalender berhasil dibuat.' : 'Browser tidak dapat mengunduh file kalender.');
    } catch {
      setMessage('Gagal menyiapkan jadwal kalender. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-bold text-slate-900 dark:text-slate-100">Kalender</label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tambahkan jadwal sholat bulan ini ke Google Calendar, Apple Calendar, Outlook, atau aplikasi kalender lain.
        </p>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950/80 dark:text-primary-300">
            <CalendarDays className="h-5 w-5" />
          </div>
          <p className="max-w-md text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Gunakan kalender untuk pengingat yang lebih konsisten saat Sholatku tidak sedang dibuka. Alarm mengikuti preferensi setiap sholat.
          </p>
        </div>
        <Button size="sm" onClick={exportCurrentMonth} isLoading={isExporting}>
          <Download className="h-3.5 w-3.5" />
          Export Jadwal Bulan Ini
        </Button>
      </div>
      {message && <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">{message}</p>}
    </div>
  );
};
