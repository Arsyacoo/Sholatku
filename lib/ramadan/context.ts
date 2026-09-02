import type { RamadanContext, RamadanTiming } from '@/types';
import { formatCountdown } from '@/lib/prayer/next-prayer';
import { formatDateInTimeZone } from '@/lib/time/timezone';

export interface RamadanContextInput {
  now?: Date;
  timing: RamadanTiming;
  nextDayTiming?: RamadanTiming | null;
  preIftarThresholdMinutes?: number;
}

function createContext(
  state: RamadanContext['state'],
  target: RamadanContext['target'],
  targetAt: Date | null,
  targetLabel: string,
  now: Date
): RamadanContext {
  const remainingSeconds = targetAt
    ? Math.max(0, Math.floor((targetAt.getTime() - now.getTime()) / 1000))
    : 0;
  return {
    state,
    target,
    targetAt,
    targetLabel,
    remainingSeconds,
    formattedCountdown: formatCountdown(remainingSeconds),
  };
}

function isNextLocalDate(now: Date, nextDate: string, timeZone: string): boolean {
  return formatDateInTimeZone(now, timeZone) === nextDate;
}

/** Chooses one positive countdown target for the current Ramadan moment. */
export function getRamadanContext({
  now = new Date(),
  timing,
  nextDayTiming = null,
  preIftarThresholdMinutes = 60,
}: RamadanContextInput): RamadanContext {
  if (now.getTime() < timing.imsakAt.getTime()) {
    return createContext('PRE_FAJR', 'imsak', timing.imsakAt, 'Imsak', now);
  }
  if (now.getTime() < timing.fajrAt.getTime()) {
    return createContext('PRE_FAJR', 'fajr', timing.fajrAt, 'Subuh', now);
  }
  if (now.getTime() < timing.maghribAt.getTime()) {
    const minutesUntilMaghrib = (timing.maghribAt.getTime() - now.getTime()) / 60000;
    return createContext(
      minutesUntilMaghrib <= preIftarThresholdMinutes ? 'PRE_IFTAR' : 'DAYTIME_FASTING',
      'maghrib',
      timing.maghribAt,
      'Berbuka / Maghrib',
      now
    );
  }

  if (nextDayTiming) {
    const state = isNextLocalDate(now, nextDayTiming.date, nextDayTiming.timezone) ? 'NIGHT' : 'POST_MAGHRIB';
    return createContext(state, 'next-imsak', nextDayTiming.imsakAt, 'Imsak berikutnya', now);
  }

  return createContext('POST_MAGHRIB', null, null, 'Malam Ramadan', now);
}
