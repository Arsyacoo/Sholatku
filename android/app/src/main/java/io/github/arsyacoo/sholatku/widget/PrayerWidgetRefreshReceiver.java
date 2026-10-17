package io.github.arsyacoo.sholatku.widget;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Moves widgets to the next prayer, and re-arms the alarm after reboot, update, or clock changes. */
public class PrayerWidgetRefreshReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        PrayerWidgetUpdater.updateAll(context);
    }
}
