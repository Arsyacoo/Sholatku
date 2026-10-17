package io.github.arsyacoo.sholatku;

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
}
