package io.github.arsyacoo.sholatku.reminders;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;

final class SholatkuReminderRecoveryState {
    private static final String STORE = "SHOLATKU_REMINDER_RECOVERY";
    private static final String DIRTY = "reminderScheduleNeedsReconciliation";
    private static final String REASON = "recoveryReason";
    private static final String TIMESTAMP = "recoveryTimestamp";
    private static final String TIMEZONE_ID = "timezoneId";
    private static final String TIMEZONE_OFFSET = "timezoneOffsetMinutes";
    private static final String LOCAL_DAY_KEY = "localDayKey";

    private SholatkuReminderRecoveryState() {}

    static void markDirty(Context context, String reason) {
        preferences(context)
            .edit()
            .putBoolean(DIRTY, true)
            .putString(REASON, reason)
            .putLong(TIMESTAMP, System.currentTimeMillis())
            .apply();
    }

    static void markReconciled(Context context, String timezoneId, int timezoneOffsetMinutes, String localDayKey) {
        preferences(context)
            .edit()
            .putBoolean(DIRTY, false)
            .remove(REASON)
            .remove(TIMESTAMP)
            .putString(TIMEZONE_ID, timezoneId)
            .putInt(TIMEZONE_OFFSET, timezoneOffsetMinutes)
            .putString(LOCAL_DAY_KEY, localDayKey)
            .apply();
    }

    static JSObject read(Context context) {
        SharedPreferences preferences = preferences(context);
        JSObject state = new JSObject();
        state.put("needsReconciliation", preferences.getBoolean(DIRTY, false));
        state.put("recoveryReason", preferences.getString(REASON, null));
        state.put("recoveryTimestamp", preferences.contains(TIMESTAMP) ? preferences.getLong(TIMESTAMP, 0L) : null);
        state.put("timezoneId", preferences.getString(TIMEZONE_ID, null));
        state.put(
            "timezoneOffsetMinutes",
            preferences.contains(TIMEZONE_OFFSET) ? preferences.getInt(TIMEZONE_OFFSET, 0) : null
        );
        state.put("localDayKey", preferences.getString(LOCAL_DAY_KEY, null));
        return state;
    }

    private static SharedPreferences preferences(Context context) {
        return context.getApplicationContext().getSharedPreferences(STORE, Context.MODE_PRIVATE);
    }
}
