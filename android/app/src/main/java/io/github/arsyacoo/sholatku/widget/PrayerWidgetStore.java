package io.github.arsyacoo.sholatku.widget;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Persists the JS-provided widget schedule so widgets render without starting the WebView. */
final class PrayerWidgetStore {
    private static final String PREFS = "sholatku_prayer_widget";
    private static final String KEY_SCHEDULE = "schedule_v1";
    private static final int MAX_DAYS = 14;

    private PrayerWidgetStore() {}

    /** Validates and stores the payload; throws when it is malformed so the JS caller can see it. */
    static void save(Context context, String json) throws JSONException {
        parse(json);
        prefs(context).edit().putString(KEY_SCHEDULE, json).apply();
    }

    static PrayerWidgetSchedule load(Context context) {
        String json = prefs(context).getString(KEY_SCHEDULE, null);
        if (json == null) return null;
        try {
            return parse(json);
        } catch (JSONException error) {
            return null;
        }
    }

    static PrayerWidgetSchedule parse(String json) throws JSONException {
        JSONObject root = new JSONObject(json);
        if (root.getInt("version") != 1) throw new JSONException("Unsupported widget schedule version.");

        JSONArray rawDays = root.getJSONArray("days");
        if (rawDays.length() == 0 || rawDays.length() > MAX_DAYS) throw new JSONException("Invalid day count.");

        List<PrayerWidgetSchedule.Day> days = new ArrayList<>();
        for (int d = 0; d < rawDays.length(); d++) {
            JSONObject rawDay = rawDays.getJSONObject(d);
            JSONArray prayers = rawDay.getJSONArray("prayers");
            if (prayers.length() != PrayerWidgetSchedule.PRAYER_COUNT) throw new JSONException("Expected five prayers.");

            String[] names = new String[PrayerWidgetSchedule.PRAYER_COUNT];
            String[] times = new String[PrayerWidgetSchedule.PRAYER_COUNT];
            long[] at = new long[PrayerWidgetSchedule.PRAYER_COUNT];
            for (int i = 0; i < PrayerWidgetSchedule.PRAYER_COUNT; i++) {
                JSONObject prayer = prayers.getJSONObject(i);
                names[i] = prayer.getString("name");
                times[i] = prayer.getString("time");
                at[i] = prayer.getLong("at");
            }
            days.add(new PrayerWidgetSchedule.Day(rawDay.optString("hijri", ""), names, times, at));
        }
        return new PrayerWidgetSchedule(root.optString("city", ""), days);
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
