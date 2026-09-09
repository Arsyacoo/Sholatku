package io.github.arsyacoo.sholatku.reminders;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SholatkuReminderRecovery")
public class SholatkuReminderRecoveryPlugin extends Plugin {
    @PluginMethod
    public void getState(PluginCall call) {
        call.resolve(SholatkuReminderRecoveryState.read(getContext()));
    }

    @PluginMethod
    public void markReconciled(PluginCall call) {
        String timezoneId = call.getString("timezoneId");
        Integer timezoneOffsetMinutes = call.getInt("timezoneOffsetMinutes");
        String localDayKey = call.getString("localDayKey");

        if (timezoneId == null || timezoneId.isBlank() || timezoneOffsetMinutes == null || localDayKey == null || localDayKey.isBlank()) {
            call.reject("A complete reminder schedule fingerprint is required.");
            return;
        }

        SholatkuReminderRecoveryState.markReconciled(
            getContext(),
            timezoneId,
            timezoneOffsetMinutes,
            localDayKey
        );
        call.resolve();
    }
}
