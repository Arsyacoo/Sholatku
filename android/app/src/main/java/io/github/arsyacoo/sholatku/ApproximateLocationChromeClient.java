package io.github.arsyacoo.sholatku;

import android.Manifest;
import android.content.pm.PackageManager;
import android.webkit.GeolocationPermissions;
import androidx.core.content.ContextCompat;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebChromeClient;

/**
 * Capacitor asks for precise and approximate location together on every geolocation call, so a user who
 * chose "approximate" would be asked to upgrade to precise each time. City-level accuracy is enough for
 * prayer times, so an existing approximate grant is honored without prompting again.
 */
class ApproximateLocationChromeClient extends BridgeWebChromeClient {
    private final Bridge bridge;

    ApproximateLocationChromeClient(Bridge bridge) {
        super(bridge);
        this.bridge = bridge;
    }

    @Override
    public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
        boolean hasApproximate = ContextCompat.checkSelfPermission(
            bridge.getContext(), Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED;
        if (hasApproximate) {
            callback.invoke(origin, true, false);
            return;
        }
        super.onGeolocationPermissionsShowPrompt(origin, callback);
    }
}
