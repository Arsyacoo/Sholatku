'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import type { PrayerReminderSettings, RamadanReminderSettings, UserLocation } from '@/types';
import type { RamadanImsakiyahRow } from '@/lib/ramadan/imsakiyah';
import { downloadPrayerCalendar, generateRamadanCalendarIcs, getRamadanCalendarFilename } from '@/lib/prayer/reminders/ics';
import { Button } from '@/components/ui/Button';

interface RamadanCalendarExportProps {
  rows: readonly RamadanImsakiyahRow[];
  hijriYear: number;
  location: UserLocation;
  prayerReminderSettings: PrayerReminderSettings;
  ramadanReminderSettings: RamadanReminderSettings;
}

export const RamadanCalendarExport: React.FC<RamadanCalendarExportProps> = ({
  rows,
  hijriYear,
  location,
  prayerReminderSettings,
  ramadanReminderSettings,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const exportCalendar = () => {
    setIsExporting(true);
    setMessage(null);
    try {
      const ics = generateRamadanCalendarIcs(rows, location, prayerReminderSettings, ramadanReminderSettings, hijriYear);
      const downloaded = downloadPrayerCalendar(ics, getRamadanCalendarFilename(hijriYear));
      setMessage(downloaded ? 'Kalender Ramadan berhasil dibuat.' : 'Browser tidak dapat mengunduh file kalender.');
    } catch {
      setMessage('Gagal menyiapkan kalender Ramadan. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Simpan ke kalender</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Ekspor Imsak, Subuh, dan Maghrib untuk seluruh Ramadan {hijriYear} H.</p>
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <Button size="sm" onClick={exportCalendar} isLoading={isExporting} disabled={!rows.length}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Export Kalender Ramadan
        </Button>
        {message && <p className="text-xs text-slate-500 dark:text-slate-400" role="status" aria-live="polite">{message}</p>}
      </div>
    </div>
  );
};
