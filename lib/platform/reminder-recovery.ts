import { registerPlugin } from '@capacitor/core';

import { isNativeRuntime } from './runtime';

export interface NativeReminderRecoveryState {
  needsReconciliation: boolean;
  recoveryReason: string | null;
  recoveryTimestamp: number | null;
  timezoneId: string | null;
  timezoneOffsetMinutes: number | null;
  localDayKey: string | null;
}

export interface NativeReminderScheduleFingerprint {
  timezoneId: string;
  timezoneOffsetMinutes: number;
  localDayKey: string;
}

interface ReminderRecoveryPlugin {
  getState(): Promise<NativeReminderRecoveryState>;
  markReconciled(options: NativeReminderScheduleFingerprint): Promise<void>;
}

const recoveryPlugin = registerPlugin<ReminderRecoveryPlugin>('SholatkuReminderRecovery');

const UNSUPPORTED_RECOVERY_STATE: NativeReminderRecoveryState = {
  needsReconciliation: false,
  recoveryReason: null,
  recoveryTimestamp: null,
  timezoneId: null,
  timezoneOffsetMinutes: null,
  localDayKey: null,
};

export async function getNativeReminderRecoveryState(): Promise<NativeReminderRecoveryState> {
  if (!isNativeRuntime()) return UNSUPPORTED_RECOVERY_STATE;

  try {
    return await recoveryPlugin.getState();
  } catch {
    // Keep the existing JS reconciliation path conservative if the native bridge is unavailable.
    return { ...UNSUPPORTED_RECOVERY_STATE, needsReconciliation: true, recoveryReason: 'bridge-unavailable' };
  }
}

export async function markNativeReminderScheduleReconciled(
  fingerprint: NativeReminderScheduleFingerprint
): Promise<void> {
  if (!isNativeRuntime()) return;
  await recoveryPlugin.markReconciled(fingerprint);
}
