package io.github.arsyacoo.sholatku.widget;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertSame;
import static org.junit.Assert.assertTrue;

import java.util.Arrays;
import org.junit.Test;

public class PrayerWidgetScheduleTest {
    private static final String[] NAMES = {"Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"};
    private static final String[] ARABIC = {"الفجر", "الظهر", "العصر", "المغرب", "العشاء"};
    private static final String[] TIMES = {"04:00", "12:00", "15:00", "18:00", "19:00"};

    private static PrayerWidgetSchedule.Day day(long base) {
        long[] at = {base + 4, base + 12, base + 15, base + 18, base + 19};
        return new PrayerWidgetSchedule.Day("1 Ramadhan 1447 H", NAMES, ARABIC, TIMES, at);
    }

    @Test
    public void selectsTheNextPrayerOfToday() {
        PrayerWidgetSchedule.Day today = day(0);
        PrayerWidgetSchedule schedule = new PrayerWidgetSchedule("Jakarta", Arrays.asList(today, day(24)));

        PrayerWidgetSchedule.Selection selection = schedule.select(13);
        assertSame(today, selection.day);
        assertEquals(2, selection.nextIndex);
        assertEquals(15, selection.nextAt());
    }

    @Test
    public void rollsToTomorrowFajrAfterIsha() {
        PrayerWidgetSchedule.Day tomorrow = day(24);
        PrayerWidgetSchedule schedule = new PrayerWidgetSchedule("Jakarta", Arrays.asList(day(0), tomorrow));

        PrayerWidgetSchedule.Selection selection = schedule.select(19);
        assertSame(tomorrow, selection.day);
        assertEquals(0, selection.nextIndex);
    }

    @Test
    public void marksTimelineDotsAndLitSegmentsAroundTheNextPrayer() {
        int next = 2; // Ashar
        assertEquals(PrayerWidgetSchedule.DOT_PASSED, PrayerWidgetSchedule.dotState(1, next));
        assertEquals(PrayerWidgetSchedule.DOT_NEXT, PrayerWidgetSchedule.dotState(2, next));
        assertEquals(PrayerWidgetSchedule.DOT_UPCOMING, PrayerWidgetSchedule.dotState(3, next));

        assertFalse(PrayerWidgetSchedule.isLeftSegmentLit(0, next));
        assertTrue(PrayerWidgetSchedule.isRightSegmentLit(1, next));
        assertTrue(PrayerWidgetSchedule.isLeftSegmentLit(2, next));
        assertFalse(PrayerWidgetSchedule.isRightSegmentLit(2, next));
        assertFalse(PrayerWidgetSchedule.isLeftSegmentLit(3, next));
        assertFalse(PrayerWidgetSchedule.isRightSegmentLit(4, 4));
    }

    @Test
    public void returnsNullWhenTheScheduleIsStale() {
        PrayerWidgetSchedule schedule = new PrayerWidgetSchedule("Jakarta", Arrays.asList(day(0), day(24)));
        assertNull(schedule.select(24 + 19));
    }
}
