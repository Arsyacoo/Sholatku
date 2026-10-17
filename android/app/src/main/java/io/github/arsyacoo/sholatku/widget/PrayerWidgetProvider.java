package io.github.arsyacoo.sholatku.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** Shared behavior for every widget size; each size is a separate manifest receiver. */
public abstract class PrayerWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        PrayerWidgetUpdater.updateAll(context);
    }

    @Override
    public void onDisabled(Context context) {
        // Cancels the roll-over alarm when the last widget of any size is removed.
        PrayerWidgetUpdater.updateAll(context);
    }
}
