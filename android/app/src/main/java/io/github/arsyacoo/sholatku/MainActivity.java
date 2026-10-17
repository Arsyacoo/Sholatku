package io.github.arsyacoo.sholatku;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import io.github.arsyacoo.sholatku.reminders.SholatkuReminderRecoveryPlugin;
import io.github.arsyacoo.sholatku.widget.SholatkuWidgetPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void load() {
        registerPlugin(SholatkuReminderRecoveryPlugin.class);
        registerPlugin(SholatkuWidgetPlugin.class);
        super.load();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Registered before onStart, as required for its permission launcher.
        bridge.getWebView().setWebChromeClient(new ApproximateLocationChromeClient(bridge));
    }
}
