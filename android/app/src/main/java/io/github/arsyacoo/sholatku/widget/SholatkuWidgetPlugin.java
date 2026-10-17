package io.github.arsyacoo.sholatku.widget;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONException;

@CapacitorPlugin(name = "SholatkuWidget")
public class SholatkuWidgetPlugin extends Plugin {
    @PluginMethod
    public void updateSchedule(PluginCall call) {
        try {
            PrayerWidgetStore.save(getContext(), call.getData().toString());
        } catch (JSONException error) {
            call.reject("Invalid widget schedule.", error);
            return;
        }
        PrayerWidgetUpdater.updateAll(getContext());
        call.resolve();
    }
}
