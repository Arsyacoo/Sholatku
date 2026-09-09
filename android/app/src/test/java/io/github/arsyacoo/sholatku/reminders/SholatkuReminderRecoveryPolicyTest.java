package io.github.arsyacoo.sholatku.reminders;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class SholatkuReminderRecoveryPolicyTest {
    @Test
    public void restoresOnlyFutureSchedules() {
        assertTrue(SholatkuReminderRecoveryPolicy.shouldRestore(10_001L, 10_000L));
        assertFalse(SholatkuReminderRecoveryPolicy.shouldRestore(10_000L, 10_000L));
        assertFalse(SholatkuReminderRecoveryPolicy.shouldRestore(9_999L, 10_000L));
    }

    @Test
    public void requiresExactSholatkuOwnershipMetadata() {
        assertTrue(SholatkuReminderRecoveryPolicy.isOwnedReminder("sholatku-prayer-reminders", 1));
        assertFalse(SholatkuReminderRecoveryPolicy.isOwnedReminder("other-feature", 1));
        assertFalse(SholatkuReminderRecoveryPolicy.isOwnedReminder("sholatku-prayer-reminders", 2));
        assertFalse(SholatkuReminderRecoveryPolicy.isOwnedReminder("sholatku-prayer-reminders", null));
    }
}
