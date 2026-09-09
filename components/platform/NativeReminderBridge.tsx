'use client';

import { useEffect, useRef } from 'react';

import { addDaysToCanonicalDate } from '@/lib/prayer/date';
import { loadNativeReminderSyncSnapshot, reconcileNativeReminderSchedule, addNativeReminderActionListener } from '@/lib/prayer/reminders/native';
import { getNativeReminderRecoveryState } from '@/lib/platform/reminder-recovery';
import { buildNativeReminderScheduleFingerprint, needsNativeReminderReconciliation } from '@/lib/prayer/reminders/recovery';
import { formatDateInTimeZone, normalizeTimeZone, zonedTimeToUtc } from '@/lib/time/timezone';
import { isNativeRuntime } from '@/lib/platform/runtime';

function getNextDayCheckDelay(timeZone: string, now = new Date()): number {
  const normalizedTimeZone = normalizeTimeZone(timeZone);
  const currentDate = formatDateInTimeZone(now, normalizedTimeZone);
  const tomorrow = addDaysToCanonicalDate(currentDate, 1);
  const nextCheckAt = zonedTimeToUtc(tomorrow, '00:05', normalizedTimeZone);
  return Math.max(60_000, nextCheckAt.getTime() - now.getTime());
}

function dispatchSyncResult(detail: Awaited<ReturnType<typeof reconcileNativeReminderSchedule>>): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('sholatku:native-reminders-synced', { detail }));
}

export function NativeReminderBridge() {
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const dayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isNativeRuntime()) return undefined;

    let cancelled = false;
    const cleanupHandles: Array<() => Promise<void> | void> = [];

    const clearDayTimer = () => {
      if (dayTimerRef.current !== null) {
        window.clearTimeout(dayTimerRef.current);
        dayTimerRef.current = null;
      }
    };

    const scheduleNextDayCheck = (timeZone?: string) => {
      clearDayTimer();
      const delay = getNextDayCheckDelay(timeZone ?? 'Asia/Jakarta');
      dayTimerRef.current = window.setTimeout(() => {
        void sync('day-change');
      }, delay);
    };

    const sync = async (reason: string) => {
      if (cancelled) return;
      if (inFlightRef.current) {
        queuedRef.current = true;
        return;
      }

      inFlightRef.current = true;
      const snapshot = loadNativeReminderSyncSnapshot();
      try {
        const recoveryState = await getNativeReminderRecoveryState();
        const fingerprint = buildNativeReminderScheduleFingerprint(snapshot.location.timezone);
        const recoveryRequired = needsNativeReminderReconciliation(recoveryState, fingerprint);
        const result = await reconcileNativeReminderSchedule(snapshot);
        if (cancelled) return;
        dispatchSyncResult(result);
        if (recoveryRequired) {
          console.info(`Native reminder recovery reconciled (${recoveryState.recoveryReason ?? reason}).`);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn(`Failed to reconcile native reminders (${reason}):`, error);
        }
      } finally {
        if (!cancelled) {
          scheduleNextDayCheck(snapshot.location.timezone);
        }
        inFlightRef.current = false;
        if (queuedRef.current && !cancelled) {
          queuedRef.current = false;
          void sync('queued');
        }
      }
    };

    const handleRefresh = () => {
      void sync('refresh');
    };

    const handleFocus = () => handleRefresh();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') handleRefresh();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('sholatku:settings-changed', handleRefresh);
    window.addEventListener('sholatku:prayer-reminders-changed', handleRefresh);
    window.addEventListener('sholatku:ramadan-preferences-changed', handleRefresh);
    window.addEventListener('sholatku:location-changed', handleRefresh);

    void addNativeReminderActionListener((route) => {
      if (cancelled || typeof window === 'undefined') return;
      window.history.pushState(window.history.state, '', route);
    }).then((cleanup) => {
      if (cancelled) {
        void cleanup();
        return;
      }
      cleanupHandles.push(cleanup);
    });

    void sync('boot');

    return () => {
      cancelled = true;
      clearDayTimer();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('sholatku:settings-changed', handleRefresh);
      window.removeEventListener('sholatku:prayer-reminders-changed', handleRefresh);
      window.removeEventListener('sholatku:ramadan-preferences-changed', handleRefresh);
      window.removeEventListener('sholatku:location-changed', handleRefresh);
      for (const cleanup of cleanupHandles) {
        void cleanup();
      }
    };
  }, []);

  return null;
}
