import { describe, expect, it } from 'vitest';

import {
  buildNativeReminderScheduleFingerprint,
  needsNativeReminderReconciliation,
} from '@/lib/prayer/reminders/recovery';

describe('native reminder recovery fingerprint', () => {
  it('is stable for the same timezone and local day', () => {
    const fingerprint = buildNativeReminderScheduleFingerprint(
      'Asia/Jakarta',
      new Date('2026-09-09T02:00:00.000Z')
    );

    expect(
      needsNativeReminderReconciliation(
        {
          needsReconciliation: false,
          recoveryReason: null,
          recoveryTimestamp: null,
          ...fingerprint,
        },
        fingerprint
      )
    ).toBe(false);
  });

  it('requires a rebuild for dirty, timezone, offset, or day mismatch', () => {
    const fingerprint = buildNativeReminderScheduleFingerprint(
      'Asia/Jakarta',
      new Date('2026-09-09T02:00:00.000Z')
    );

    const baseState = {
      needsReconciliation: false,
      recoveryReason: null,
      recoveryTimestamp: null,
      ...fingerprint,
    };

    expect(needsNativeReminderReconciliation({ ...baseState, needsReconciliation: true }, fingerprint)).toBe(true);
    expect(needsNativeReminderReconciliation({ ...baseState, timezoneId: 'Asia/Makassar' }, fingerprint)).toBe(true);
    expect(needsNativeReminderReconciliation({ ...baseState, timezoneOffsetMinutes: 480 }, fingerprint)).toBe(true);
    expect(needsNativeReminderReconciliation({ ...baseState, localDayKey: '2026-09-10' }, fingerprint)).toBe(true);
  });
});
