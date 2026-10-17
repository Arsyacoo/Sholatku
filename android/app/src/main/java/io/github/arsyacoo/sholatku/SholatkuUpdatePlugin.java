package io.github.arsyacoo.sholatku;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import androidx.core.content.pm.PackageInfoCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Downloads a release APK into the app cache and hands it to the system installer. Browsers (notably Chrome's
 * custom-tab view) can leave APK downloads stuck at 100%, so the app does it itself.
 */
@CapacitorPlugin(name = "SholatkuUpdate")
public class SholatkuUpdatePlugin extends Plugin {
    private static final String ALLOWED_PREFIX = "https://github.com/Arsyacoo/Sholatku/releases/download/";
    private static final int TIMEOUT_MS = 30_000;

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        if (url == null || !url.startsWith(ALLOWED_PREFIX) || !url.endsWith(".apk")) {
            call.reject("Only Sholatku GitHub release APKs can be installed.");
            return;
        }

        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !context.getPackageManager().canRequestPackageInstalls()) {
            // The user grants "Install unknown apps" for Sholatku once, then taps the button again. Started from the
            // activity (no new task) so Back returns to Sholatku.
            getActivity().startActivity(
                new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).setData(Uri.parse("package:" + context.getPackageName()))
            );
            call.resolve(result("needs-permission"));
            return;
        }

        new Thread(() -> {
            try {
                File apk = download(url, new File(context.getCacheDir(), "updates"));
                verify(context, apk);
                Uri uri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", apk);
                Intent install = new Intent(Intent.ACTION_VIEW)
                    .setDataAndType(uri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(install);
                call.resolve(result("installer-opened"));
            } catch (Exception e) {
                call.reject("Update download failed: " + e.getMessage(), e);
            }
        }).start();
    }

    private static File download(String url, File dir) throws Exception {
        if (!dir.isDirectory() && !dir.mkdirs()) throw new IllegalStateException("cannot create " + dir);
        File target = new File(dir, "sholatku-update.apk");
        File partial = new File(dir, "sholatku-update.apk.part");

        // GitHub redirects release assets to its HTTPS CDN; HttpURLConnection follows same-protocol redirects.
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setConnectTimeout(TIMEOUT_MS);
        connection.setReadTimeout(TIMEOUT_MS);
        try {
            int code = connection.getResponseCode();
            if (code != HttpURLConnection.HTTP_OK) throw new IllegalStateException("HTTP " + code);
            try (InputStream in = connection.getInputStream(); OutputStream out = new FileOutputStream(partial)) {
                byte[] buffer = new byte[64 * 1024];
                int read;
                while ((read = in.read(buffer)) != -1) out.write(buffer, 0, read);
            }
        } finally {
            connection.disconnect();
        }
        if (target.exists() && !target.delete()) throw new IllegalStateException("cannot replace old download");
        if (!partial.renameTo(target)) throw new IllegalStateException("cannot finalize download");
        return target;
    }

    /** Rejects anything that is not a newer Sholatku build; Android itself enforces the matching signature. */
    private static void verify(Context context, File apk) throws Exception {
        PackageManager pm = context.getPackageManager();
        PackageInfo archive = pm.getPackageArchiveInfo(apk.getPath(), 0);
        if (archive == null || !context.getPackageName().equals(archive.packageName)) {
            throw new IllegalStateException("not a Sholatku APK");
        }
        PackageInfo installed = pm.getPackageInfo(context.getPackageName(), 0);
        if (PackageInfoCompat.getLongVersionCode(archive) <= PackageInfoCompat.getLongVersionCode(installed)) {
            throw new IllegalStateException("APK is not newer than the installed version");
        }
    }

    private static JSObject result(String status) {
        JSObject object = new JSObject();
        object.put("status", status);
        return object;
    }
}
