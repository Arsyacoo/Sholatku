package io.github.arsyacoo.sholatku.reminders;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.UserManager;
import android.util.Log;

import com.capacitorjs.plugins.localnotifications.LocalNotification;
import com.capacitorjs.plugins.localnotifications.LocalNotificationManager;
import com.capacitorjs.plugins.localnotifications.NotificationStorage;
import com.capacitorjs.plugins.localnotifications.TimedNotificationPublisher;
import com.getcapacitor.CapConfig;
import com.getcapacitor.JSObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/** Restores only future Sholatku reminder records from Capacitor's pinned v8 storage. */
public final class SholatkuReminderRecoveryReceiver extends BroadcastReceiver {
    private static final String TAG = "SholatkuReminderRecovery";
    private static final String REMINDER_SOURCE = "sholatku-native-reminder";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action)) {
            Log.i(TAG, "Locked boot received; credential-protected reminder storage is intentionally deferred.");
            return;
        }

        if (!isUserUnlocked(context)) {
            Log.i(TAG, "Recovery deferred until the Android user is unlocked.");
            return;
        }

        if (Intent.ACTION_TIME_CHANGED.equals(action) || Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            SholatkuReminderRecoveryState.markDirty(context, action);
            invalidateOwnedSchedules(context);
            return;
        }

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            restoreFutureOwnedSchedules(context, action);
        }
    }

    private static void restoreFutureOwnedSchedules(Context context, String action) {
        NotificationStorage storage = new NotificationStorage(context);
        List<LocalNotification> futureNotifications = new ArrayList<>();
        long now = System.currentTimeMillis();

        for (String id : storage.getSavedNotificationIds()) {
            try {
                JSObject raw = storage.getSavedNotificationAsJSObject(id);
                if (!isOwnedReminder(raw)) continue;

                LocalNotification notification = storage.getSavedNotification(id);
                if (notification == null || notification.getId() == null || notification.getSchedule() == null ||
                    notification.getSchedule().getAt() == null || notification.getSchedule().isPerpetual()) {
                    storage.deleteNotification(id);
                    continue;
                }

                Date scheduledAt = notification.getSchedule().getAt();
                if (notification.isTriggered() || !SholatkuReminderRecoveryPolicy.shouldRestore(scheduledAt.getTime(), now)) {
                    cancelAlarm(context, notification.getId());
                    storage.deleteNotification(id);
                    continue;
                }

                // Recovery hardens all restored records to the app's inexact scheduling policy.
                notification.setExactNotification(false);
                futureNotifications.add(notification);
            } catch (Exception exception) {
                Log.w(TAG, "Skipped malformed saved notification " + id, exception);
            }
        }

        if (futureNotifications.isEmpty()) {
            Log.i(TAG, "No future Sholatku reminders to restore for " + action + ".");
            return;
        }

        LocalNotificationManager manager = new LocalNotificationManager(
            storage,
            null,
            context,
            CapConfig.loadDefault(context)
        );
        manager.schedule(null, futureNotifications);
        Log.i(TAG, "Restored " + futureNotifications.size() + " future Sholatku reminders for " + action + ".");
    }

    private static void invalidateOwnedSchedules(Context context) {
        NotificationStorage storage = new NotificationStorage(context);
        int invalidated = 0;

        for (String id : storage.getSavedNotificationIds()) {
            try {
                JSObject raw = storage.getSavedNotificationAsJSObject(id);
                if (!isOwnedReminder(raw)) continue;

                LocalNotification notification = storage.getSavedNotification(id);
                if (notification != null && notification.getId() != null) {
                    cancelAlarm(context, notification.getId());
                }
                storage.deleteNotification(id);
                invalidated++;
            } catch (Exception exception) {
                Log.w(TAG, "Skipped malformed saved notification " + id, exception);
            }
        }

        Log.i(TAG, "Invalidated " + invalidated + " Sholatku reminders after a clock or timezone change.");
    }

    private static boolean isOwnedReminder(JSObject raw) {
        if (raw == null) return false;
        JSObject extra = raw.getJSObject("extra");
        if (extra == null || !REMINDER_SOURCE.equals(extra.getString("source"))) return false;
        return SholatkuReminderRecoveryPolicy.isOwnedReminder(
            extra.getString("owner"),
            extra.getInteger("schemaVersion")
        );
    }

    private static boolean isUserUnlocked(Context context) {
        UserManager userManager = context.getSystemService(UserManager.class);
        return userManager == null || userManager.isUserUnlocked();
    }

    private static void cancelAlarm(Context context, int notificationId) {
        Intent publisherIntent = new Intent(context, TimedNotificationPublisher.class);
        int flags = PendingIntent.FLAG_NO_CREATE;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) flags |= PendingIntent.FLAG_MUTABLE;
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, notificationId, publisherIntent, flags);
        if (pendingIntent == null) return;

        AlarmManager alarmManager = context.getSystemService(AlarmManager.class);
        if (alarmManager != null) alarmManager.cancel(pendingIntent);
        pendingIntent.cancel();
    }
}
