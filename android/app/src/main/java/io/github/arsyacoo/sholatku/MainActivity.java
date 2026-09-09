package io.github.arsyacoo.sholatku;

import com.getcapacitor.BridgeActivity;
import io.github.arsyacoo.sholatku.reminders.SholatkuReminderRecoveryPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void load() {
        registerPlugin(SholatkuReminderRecoveryPlugin.class);
        super.load();
    }
}
