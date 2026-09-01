import type { MonthlyPrayerItem, PrayerReminderSettings, UserLocation } from '@/types';
import { PRAYER_REMINDER_PRAYERS } from '@/types';

const PRAYER_LABELS: Record<(typeof PRAYER_REMINDER_PRAYERS)[number], string> = {
  fajr: 'Subuh',
  dhuhr: 'Dzuhur',
  asr: 'Ashar',
  maghrib: 'Maghrib',
  isha: 'Isya',
};

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/([;,])/g, '\\$1').replace(/\r?\n/g, '\\n');
}

function safeTimezoneId(timezone?: string): string | null {
  if (!timezone || !/^[A-Za-z0-9_+./-]+$/.test(timezone)) return null;
  return timezone;
}

function toIcsDateTime(date: string, time: string): string {
  const [year, month, day] = date.split('-');
  const [hours, minutes] = time.split(':');
  return `${year}${month}${day}T${hours}${minutes}00`;
}

function addMinutes(date: string, time: string, minutesToAdd: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0, 0);
  result.setMinutes(result.getMinutes() + minutesToAdd);
  return toIcsDateTime(
    `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, '0')}-${String(result.getDate()).padStart(2, '0')}`,
    `${String(result.getHours()).padStart(2, '0')}:${String(result.getMinutes()).padStart(2, '0')}`
  );
}

function utcTimestamp(date: Date): string {
  const iso = date.toISOString().replace(/[-:]/g, '');
  return iso.slice(0, 15) + 'Z';
}

export function getPrayerCalendarFilename(year: number, month: number): string {
  return `sholatku-jadwal-sholat-${year}-${String(month).padStart(2, '0')}.ics`;
}

export function generatePrayerCalendarIcs(
  schedule: readonly MonthlyPrayerItem[],
  location: UserLocation,
  reminderSettings: PrayerReminderSettings,
  generatedAt: Date = new Date()
): string {
  const timezone = safeTimezoneId(location.timezone);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sholatku//Prayer Schedule//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(`Jadwal Sholat Sholatku - ${location.displayName}`)}`,
    ...(timezone ? [`X-WR-TIMEZONE:${timezone}`] : []),
  ];

  for (const day of schedule) {
    for (const prayer of PRAYER_REMINDER_PRAYERS) {
      const time = day.timings[prayer];
      if (!time) continue;
      const label = PRAYER_LABELS[prayer];
      const start = toIcsDateTime(day.date, time);
      const end = addMinutes(day.date, time, 10);
      const dateTimePrefix = timezone ? `;TZID=${timezone}` : '';
      const preference = reminderSettings[prayer];

      lines.push(
        'BEGIN:VEVENT',
        `UID:${day.date}-${prayer}@sholatku`,
        `DTSTAMP:${utcTimestamp(generatedAt)}`,
        `DTSTART${dateTimePrefix}:${start}`,
        `DTEND${dateTimePrefix}:${end}`,
        `SUMMARY:${escapeIcsText(`Sholatku - ${label}`)}`,
        `DESCRIPTION:${escapeIcsText(`Waktu ${label} berdasarkan pengaturan Sholatku di ${location.displayName}.`)}`,
        `LOCATION:${escapeIcsText(location.displayName)}`
      );

      if (preference?.enabled) {
        const trigger = preference.offsetMinutes === 0 ? 'PT0M' : `-PT${preference.offsetMinutes}M`;
        lines.push(
          'BEGIN:VALARM',
          'ACTION:DISPLAY',
          `DESCRIPTION:${escapeIcsText(`Pengingat ${label}`)}`,
          `TRIGGER:${trigger}`,
          'END:VALARM'
        );
      }
      lines.push('END:VEVENT');
    }
  }

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

export function downloadPrayerCalendar(ics: string, filename: string): boolean {
  if (typeof window === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return false;
  try {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    return true;
  } catch {
    return false;
  }
}
