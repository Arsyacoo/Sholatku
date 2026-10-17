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
    // Display sizes (sp) for the bitmap-rendered prayer name, per layout above.
    private static final float[] NAME_SP = {13f, 18f, 24f};
    private static final int[] TIME_IDS = {
        R.id.widget_time_0, R.id.widget_time_1, R.id.widget_time_2, R.id.widget_time_3, R.id.widget_time_4,
    };
    private static final int[] LABEL_IDS = {
        R.id.widget_label_0, R.id.widget_label_1, R.id.widget_label_2, R.id.widget_label_3, R.id.widget_label_4,
    };
    private static final int[] COLUMN_IDS = {
        R.id.widget_col_0, R.id.widget_col_1, R.id.widget_col_2, R.id.widget_col_3, R.id.widget_col_4,
    };
    private static final int[] ICON_IDS = {
        R.id.widget_icon_0, R.id.widget_icon_1, R.id.widget_icon_2, R.id.widget_icon_3, R.id.widget_icon_4,
    };
    private static final int[] TIME_IMAGE_IDS = {
        R.id.widget_time_img_0, R.id.widget_time_img_1, R.id.widget_time_img_2, R.id.widget_time_img_3,
        R.id.widget_time_img_4,
    };
    private static final int[] DOT_IDS = {
        R.id.widget_dot_0, R.id.widget_dot_1, R.id.widget_dot_2, R.id.widget_dot_3, R.id.widget_dot_4,
    };
    private static final int[] LEFT_SEGMENT_IDS = {
        R.id.widget_seg_l_0, R.id.widget_seg_l_1, R.id.widget_seg_l_2, R.id.widget_seg_l_3, R.id.widget_seg_l_4,
    };
    private static final int[] RIGHT_SEGMENT_IDS = {
        R.id.widget_seg_r_0, R.id.widget_seg_r_1, R.id.widget_seg_r_2, R.id.widget_seg_r_3, R.id.widget_seg_r_4,
    };
    private static final int[] DOT_DRAWABLES = {
        R.drawable.widget_dot_passed, R.drawable.widget_dot_next, R.drawable.widget_dot_upcoming,
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
            manager.updateAppWidget(ids, render(context, p, schedule, selection, now));
        }

        scheduleNextRefresh(context, anyPlaced ? selection : null);
    }

    private static RemoteViews render(
        Context context,
        int size,
        PrayerWidgetSchedule schedule,
        PrayerWidgetSchedule.Selection selection,
        long now
    ) {
        // Actions on view ids a layout does not contain are ignored, so one renderer serves all sizes.
        RemoteViews views = new RemoteViews(context.getPackageName(), LAYOUTS[size]);
        views.setOnClickPendingIntent(R.id.widget_root, openAppIntent(context));
        int text = context.getColor(R.color.widget_text);

        if (selection == null) {
            setDisplayText(context, views, R.id.widget_next_name, "Sholatku", NAME_SP[size], text);
            setDisplayText(context, views, R.id.widget_next_label, "Sholatku", NAME_SP[size], text);
            views.setTextViewText(R.id.widget_header, schedule == null ? "" : schedule.city);
            views.setViewVisibility(R.id.widget_countdown, View.GONE);
            views.setViewVisibility(R.id.widget_schedule, View.GONE);
            views.setViewVisibility(R.id.widget_message, View.VISIBLE);
            return views;
        }

        PrayerWidgetSchedule.Day day = selection.day;
        int next = selection.nextIndex;
        setDisplayText(context, views, R.id.widget_next_name, day.names[next], NAME_SP[size], text);
        // 2x1 is too narrow for a separate time view: draw "Dzuhur  11:38" as one bitmap that scales to fit.
        views.setImageViewBitmap(R.id.widget_next_label, WidgetTextRenderer.render(
            context, day.names[next], day.times[next], R.font.plus_jakarta_sans_bold, NAME_SP[size],
            text, context.getColor(R.color.widget_text_secondary)
        ));
        views.setContentDescription(R.id.widget_next_label, day.names[next] + " " + day.times[next]);
        views.setTextViewText(
            R.id.widget_header,
            day.hijri.isEmpty() ? schedule.city : schedule.city + " · " + day.hijri
        );
        views.setViewVisibility(R.id.widget_message, View.GONE);
        views.setViewVisibility(R.id.widget_schedule, View.VISIBLE);
        views.setViewVisibility(R.id.widget_countdown, View.VISIBLE);
        // On 4x1 the countdown sits under the name, where a bare "01:12" would read as a prayer time.
        boolean wide = LAYOUTS[size] == R.layout.widget_prayer_wide;
        String countdownFormat = wide ? "dalam %s" : null;
        views.setChronometer(
            R.id.widget_countdown, SystemClock.elapsedRealtime() + (selection.nextAt() - now), countdownFormat, true
        );
        views.setChronometerCountDown(R.id.widget_countdown, true);

        int secondary = context.getColor(R.color.widget_text_secondary);
        int muted = context.getColor(R.color.widget_text_muted);
        int gold = context.getColor(R.color.widget_gold_soft);
        for (int i = 0; i < PrayerWidgetSchedule.PRAYER_COUNT; i++) {
            views.setImageViewResource(DOT_IDS[i], DOT_DRAWABLES[PrayerWidgetSchedule.dotState(i, next)]);
            views.setInt(LEFT_SEGMENT_IDS[i], "setBackgroundResource", segmentColor(i == 0, PrayerWidgetSchedule.isLeftSegmentLit(i, next)));
            views.setInt(
                RIGHT_SEGMENT_IDS[i], "setBackgroundResource",
                segmentColor(i == PrayerWidgetSchedule.PRAYER_COUNT - 1, PrayerWidgetSchedule.isRightSegmentLit(i, next))
            );
            boolean passed = i < next;
            views.setTextViewText(TIME_IDS[i], day.times[i]);
            views.setTextColor(TIME_IDS[i], i == next ? gold : passed ? muted : secondary);
            views.setTextViewText(LABEL_IDS[i], day.names[i]);
            views.setTextColor(LABEL_IDS[i], i == next ? text : passed ? muted : secondary);
            if (wide) {
                // The pill already marks the next prayer, so every other column stays quiet, passed or not.
                int stateColor = i == next ? gold : muted;
                views.setTextColor(LABEL_IDS[i], i == next ? text : muted);
                views.setInt(ICON_IDS[i], "setColorFilter", stateColor);
                views.setImageViewBitmap(TIME_IMAGE_IDS[i], WidgetTextRenderer.render(
                    context, day.times[i], R.font.plus_jakarta_sans_bold, 13f, stateColor
                ));
            }
            views.setInt(
                COLUMN_IDS[i], "setBackgroundResource", i == next ? R.drawable.widget_pill_next : R.color.widget_transparent
            );
            views.setContentDescription(COLUMN_IDS[i], day.names[i] + " " + day.times[i]);
            views.setContentDescription(DOT_IDS[i], day.names[i] + " " + day.times[i]);
        }
        return views;
    }

    private static int segmentColor(boolean outerEdge, boolean lit) {
        if (outerEdge) return R.color.widget_transparent;
        return lit ? R.color.widget_line_on : R.color.widget_line_off;
    }

    private static void setDisplayText(
        Context context, RemoteViews views, int viewId, String value, float sizeSp, int color
    ) {
        views.setImageViewBitmap(
            viewId, WidgetTextRenderer.render(context, value, R.font.plus_jakarta_sans_bold, sizeSp, color)
        );
        views.setContentDescription(viewId, value);
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
