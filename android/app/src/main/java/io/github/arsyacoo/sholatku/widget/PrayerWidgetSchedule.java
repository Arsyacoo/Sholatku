package io.github.arsyacoo.sholatku.widget;

import java.util.Collections;
import java.util.List;

/**
 * Prayer schedule pushed from the JS layer. Times are already resolved to epoch millis there,
 * so native code never repeats prayer or timezone calculations.
 */
final class PrayerWidgetSchedule {
    static final int PRAYER_COUNT = 5;

    static final class Day {
        final String hijri;
        final String[] names;
        final String[] times;
        final long[] at;

        Day(String hijri, String[] names, String[] times, long[] at) {
            this.hijri = hijri;
            this.names = names;
            this.times = times;
            this.at = at;
        }
    }

    static final class Selection {
        final Day day;
        final int nextIndex;

        Selection(Day day, int nextIndex) {
            this.day = day;
            this.nextIndex = nextIndex;
        }

        long nextAt() {
            return day.at[nextIndex];
        }
    }

    final String city;
    final List<Day> days;

    PrayerWidgetSchedule(String city, List<Day> days) {
        this.city = city;
        this.days = Collections.unmodifiableList(days);
    }

    /** First prayer still ahead of {@code nowMillis}, or null when the stored schedule has run out. */
    Selection select(long nowMillis) {
        for (Day day : days) {
            for (int i = 0; i < PRAYER_COUNT; i++) {
                if (day.at[i] > nowMillis) return new Selection(day, i);
            }
        }
        return null;
    }
}
