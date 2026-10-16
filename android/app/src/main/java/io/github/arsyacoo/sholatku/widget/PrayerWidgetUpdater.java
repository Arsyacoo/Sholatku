package io.github.arsyacoo.sholatku.widget;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;
import io.github.arsyacoo.sholatku.R;

/** Renders every placed Sholatku widget and schedules the next roll-over to the following prayer. */
final class PrayerWidgetUpdater {
    static final String ACTION_REFRESH = "io.github.arsyacoo.sholatku.widget.REFRESH";

    private static final Class<?>[] PROVIDERS = {
        PrayerWidgetSmall.class,
        PrayerWidgetWide.class,
        PrayerWidgetLarge.class,
    };
    private static final int[] LAYOUTS = {
        R.layout.widget_prayer_small,
        R.layout.widget_prayer_wide,
        R.layout.widget_prayer_large,
    };
    private static final int[] NAME_IDS = {
        R.id.widget_name_0, R.id.widget_name_1, R.id.widget_name_2, R.id.widget_name_3, R.id.widget_name_4,
    };
    private static final int[] TIME_IDS = {
        R.id.widget_time_0, R.id.widget_time_1, R.id.widget_time_2, R.id.widget_time_3, R.id.widget_time_4,
    };
    private static final int[] COLUMN_IDS = {
        R.id.widget_col_0, R.id.widget_col_1, R.id.widget_col_2, R.id.widget_col_3, R.id.widget_col_4,
    };

    private PrayerWidgetUpdater() {}

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        PrayerWidgetSchedule schedule = PrayerWidgetStore.load(context);
        long now = System.currentTimeMillis();
        PrayerWidgetSchedule.Selection selection = schedule == null ? null : schedule.select(now);

        boolean anyPlaced = false;
        for (int p = 0; p < PROVIDERS.length; p++) {
            int[] ids = manager.getAppWidgetIds(new ComponentName(context, PROVIDERS[p]));
            if (ids.length == 0) continue;
            anyPlaced = true;
            manager.updateAppWidget(ids, render(context, LAYOUTS[p], schedule, selection, now));
        }

        scheduleNextRefresh(context, anyPlaced ? selection : null);
    }

    private static RemoteViews render(
        Context context,
        int layout,
        PrayerWidgetSchedule schedule,
        PrayerWidgetSchedule.Selection selection,
        long now
    ) {
        // Actions on view ids a layout does not contain are ignored, so one renderer serves all sizes.
        RemoteViews views = new RemoteViews(context.getPackageName(), layout);
        views.setOnClickPendingIntent(R.id.widget_root, openAppIntent(context));

        if (selection == null) {
            views.setTextViewText(R.id.widget_next_name, "Sholatku");
            views.setTextViewText(R.id.widget_next_arabic, "");
            views.setTextViewText(R.id.widget_next_time, "--:--");
            views.setTextViewText(R.id.widget_next_time_long, "--:--");
            views.setTextViewText(R.id.widget_header, schedule == null ? "" : schedule.city);
            views.setViewVisibility(R.id.widget_countdown, View.GONE);
            views.setViewVisibility(R.id.widget_message, View.VISIBLE);
            views.setViewVisibility(R.id.widget_columns, View.GONE);
            return views;
        }

        PrayerWidgetSchedule.Day day = selection.day;
        int next = selection.nextIndex;
        views.setTextViewText(R.id.widget_next_name, day.names[next]);
        views.setTextViewText(R.id.widget_next_arabic, day.arabic[next]);
        views.setTextViewText(R.id.widget_next_time, day.times[next]);
        views.setTextViewText(R.id.widget_next_time_long, "Masuk pukul " + day.times[next]);
        views.setTextViewText(
            R.id.widget_header,
            day.hijri.isEmpty() ? schedule.city : schedule.city + " · " + day.hijri
        );
        views.setViewVisibility(R.id.widget_message, View.GONE);
        views.setViewVisibility(R.id.widget_columns, View.VISIBLE);
        views.setViewVisibility(R.id.widget_countdown, View.VISIBLE);
        views.setChronometer(R.id.widget_countdown, SystemClock.elapsedRealtime() + (selection.nextAt() - now), null, true);
        views.setChronometerCountDown(R.id.widget_countdown, true);

        int text = context.getColor(R.color.widget_text);
        int secondary = context.getColor(R.color.widget_text_secondary);
        int gold = context.getColor(R.color.widget_gold_soft);
        for (int i = 0; i < PrayerWidgetSchedule.PRAYER_COUNT; i++) {
            boolean isNext = i == next;
            views.setTextViewText(NAME_IDS[i], day.names[i]);
            views.setTextViewText(TIME_IDS[i], day.times[i]);
            views.setTextColor(NAME_IDS[i], isNext ? text : secondary);
            views.setTextColor(TIME_IDS[i], isNext ? gold : text);
            views.setInt(COLUMN_IDS[i], "setBackgroundResource", isNext ? R.drawable.widget_highlight : 0);
        }
        return views;
    }

    private static PendingIntent openAppIntent(Context context) {
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch == null) launch = new Intent();
        return PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private static void scheduleNextRefresh(Context context, PrayerWidgetSchedule.Selection selection) {
        AlarmManager alarms = context.getSystemService(AlarmManager.class);
        Intent intent = new Intent(context, PrayerWidgetRefreshReceiver.class).setAction(ACTION_REFRESH);
        PendingIntent pending = PendingIntent.getBroadcast(
            context, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
        if (selection == null) {
            alarms.cancel(pending);
            return;
        }
        // ponytail: inexact alarm (no exact-alarm permission); the roll-over may lag a few minutes in Doze.
        alarms.setAndAllowWhileIdle(AlarmManager.RTC, selection.nextAt() + 1_000L, pending);
    }
}
