package io.github.arsyacoo.sholatku.reminders;

/** Pure ownership and time policy so recovery decisions stay JVM-testable. */
public final class SholatkuReminderRecoveryPolicy {
    public static final String OWNER = "sholatku-prayer-reminders";
    public static final int SCHEMA_VERSION = 1;

    private SholatkuReminderRecoveryPolicy() {}

    public static boolean isOwnedReminder(String owner, Integer schemaVersion) {
        return OWNER.equals(owner) && schemaVersion != null && schemaVersion == SCHEMA_VERSION;
    }

    public static boolean shouldRestore(long scheduledAtMillis, long nowMillis) {
        return scheduledAtMillis > nowMillis;
    }
}
