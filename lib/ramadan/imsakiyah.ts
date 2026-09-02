import type { MonthlyPrayerItem, RamadanDateRange, RamadanTiming, UserLocation, UserSettings } from '@/types';
import { getMonthlyPrayerTimes } from '@/lib/prayer/api';
import { buildRamadanTiming, normalizeScheduleDate } from './timing';

export interface RamadanImsakiyahRow {
  ramadanDay: number;
  date: string;
  isToday: boolean;
  timing: RamadanTiming;
}

export type MonthlyScheduleLoader = (
  location: UserLocation,
  settings: UserSettings,
  year: number,
  month: number
) => Promise<MonthlyPrayerItem[]>;

function monthKey(date: string): string {
  return date.slice(0, 7);
}

/** Builds focused Ramadan rows from the existing monthly prayer-time infrastructure. */
export async function buildRamadanImsakiyah(
  range: RamadanDateRange,
  location: UserLocation,
  settings: UserSettings,
  imsakOffsetMinutes: number,
  now = new Date(),
  loadMonth: MonthlyScheduleLoader = getMonthlyPrayerTimes
): Promise<RamadanImsakiyahRow[]> {
  const requiredMonths = [...new Set(range.dates.map(monthKey))];
  const monthlySchedules = await Promise.all(
    requiredMonths.map((key) => {
      const [year, month] = key.split('-').map(Number);
      return loadMonth(location, settings, year, month);
    })
  );
  const byDate = new Map<string, MonthlyPrayerItem>();
  monthlySchedules.flat().forEach((item) => byDate.set(normalizeScheduleDate(item.date), item));

  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return range.dates.flatMap((date, index) => {
    const item = byDate.get(date);
    if (!item) return [];
    return [{
      ramadanDay: index + 1,
      date,
      isToday: date === today,
      timing: buildRamadanTiming(item, imsakOffsetMinutes),
    }];
  });
}
