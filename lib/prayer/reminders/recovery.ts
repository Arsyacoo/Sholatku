import { formatDateInTimeZone, getTimeZoneOffsetMinutes, normalizeTimeZone } from '@/lib/time/timezone';
import type { NativeReminderRecoveryState, NativeReminderScheduleFingerprint } from '@/lib/platform/reminder-recovery';

export function buildNativeReminderScheduleFingerprint(
  timezone: string | undefined,
  now = new Date()
): NativeReminderScheduleFingerprint {
  const timezoneId = normalizeTimeZone(timezone);
  return {
    timezoneId,
    timezoneOffsetMinutes: getTimeZoneOffsetMinutes(now, timezoneId),
    localDayKey: formatDateInTimeZone(now, timezoneId),
  };
}

export function needsNativeReminderReconciliation(
  state: NativeReminderRecoveryState,
  fingerprint: NativeReminderScheduleFingerprint
): boolean {
  return (
    state.needsReconciliation ||
    state.timezoneId !== fingerprint.timezoneId ||
    state.timezoneOffsetMinutes !== fingerprint.timezoneOffsetMinutes ||
    state.localDayKey !== fingerprint.localDayKey
  );
}
