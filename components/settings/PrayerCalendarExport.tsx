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
import { useLanguage } from '@/hooks/useLanguage';

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
  const { t } = useLanguage();
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
      setMessage(
        downloaded
          ? t('Jadwal kalender berhasil dibuat.', 'Calendar schedule created.')
          : t('Browser tidak dapat mengunduh file kalender.', 'The browser could not download the calendar file.')
      );
    } catch {
      setMessage(t('Gagal menyiapkan jadwal kalender. Silakan coba lagi.', 'Failed to prepare the calendar schedule. Please try again.'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-bold text-slate-900 dark:text-slate-100">{t('Kalender', 'Calendar')}</label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t(
            'Tambahkan jadwal sholat bulan ini ke Google Calendar, Apple Calendar, Outlook, atau aplikasi kalender lain.',
            "Add this month's prayer times to Google Calendar, Apple Calendar, Outlook or another calendar app."
          )}
        </p>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950/80 dark:text-primary-300">
            <CalendarDays className="h-5 w-5" />
          </div>
          <p className="max-w-md text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {t(
              'Gunakan kalender untuk pengingat yang lebih konsisten saat Sholatku tidak sedang dibuka. Alarm mengikuti preferensi setiap sholat.',
              'Use the calendar for more reliable reminders when Sholatku is not open. Alarms follow each prayer preference.'
            )}
          </p>
        </div>
        <Button size="sm" onClick={exportCurrentMonth} isLoading={isExporting}>
          <Download className="h-3.5 w-3.5" />
          {t('Export Jadwal Bulan Ini', "Export This Month's Schedule")}

        </Button>
      </div>
      {message && <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">{message}</p>}
    </div>
  );
};
