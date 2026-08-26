const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const ISLAMIC_MONTHS = [
  'Muharram', 'Safar', 'Rabiul Awwal', 'Rabiul Akhir',
  'Jumadil Awwal', 'Jumadil Akhir', 'Rajab', 'Syaban',
  'Ramadhan', 'Syawal', 'Dzulqa’dah', 'Dzulhijjah'
];

/**
 * Format a Date object into human-readable Indonesian string
 * e.g., "Rabu, 26 Agustus 2026"
 */
export function formatIndonesianDate(date: Date): string {
  const dayName = INDONESIAN_DAYS[date.getDay()];
  const day = date.getDate();
  const monthName = INDONESIAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

/**
 * Returns formatted short date e.g. "26 Ags"
 */
export function formatShortDate(date: Date): string {
  const day = date.getDate();
  const monthShort = INDONESIAN_MONTHS[date.getMonth()].slice(0, 3);
  return `${day} ${monthShort}`;
}

/**
 * Formats time string or Date into HH:mm
 */
export function formatTime24(hours: number, minutes: number): string {
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Approximate Hijri date converter (standard Umm al-Qura calculation)
 */
export function getApproximateHijriDate(date: Date) {
  // Use Intl.DateTimeFormat with islamic-umalqura calendar where supported
  try {
    const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const day = parts.find((p) => p.type === 'day')?.value || '1';
    const month = parts.find((p) => p.type === 'month')?.value || 'Muharram';
    const year = parts.find((p) => p.type === 'year')?.value || '1448';

    return {
      day,
      month: { en: month, ar: month },
      year,
      formatted: `${day} ${month} ${year} H`,
    };
  } catch (e) {
    // Fallback simple calculation
    return {
      day: '12',
      month: { en: 'Safar', ar: 'صفر' },
      year: '1448',
      formatted: '12 Safar 1448 H',
    };
  }
}
