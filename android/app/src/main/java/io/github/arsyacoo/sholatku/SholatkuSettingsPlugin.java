package io.github.arsyacoo.sholatku;

import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Opens Sholatku's system "App info" screen, where battery and unused-app settings live (OEM-specific). */
@CapacitorPlugin(name = "SholatkuSettings")
public class SholatkuSettingsPlugin extends Plugin {
    @PluginMethod
    public void openAppSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            .setData(Uri.fromParts("package", getContext().getPackageName(), null))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }
}
