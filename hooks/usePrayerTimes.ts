'use client';

import { useState, useEffect, useCallback } from 'react';
import { DailyPrayerSchedule, UserLocation, UserSettings } from '@/types';
import { getDailyPrayerTimes } from '@/lib/prayer/api';
import { buildPrayerScheduleCacheContext, getCachedSchedule, saveCachedSchedule } from '@/lib/storage/preferences';
import { formatDateInTimeZone, normalizeTimeZone } from '@/lib/time/timezone';

export function usePrayerTimes(location: UserLocation, settings: UserSettings) {
  const [schedule, setSchedule] = useState<DailyPrayerSchedule | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  const fetchSchedule = useCallback(
    async (isBackgroundRefresh = false) => {
      if (isBackgroundRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const today = new Date();
        const data = await getDailyPrayerTimes(location, settings, today);
        setSchedule(data);
        saveCachedSchedule(data, buildPrayerScheduleCacheContext(data.date, location, settings));
        setIsStale(data.source === 'offline');
      } catch (err: any) {
        console.error('Failed to fetch prayer schedule:', err);
        // Try fallback to cached schedule
        const cached = getCachedSchedule(
          buildPrayerScheduleCacheContext(
            formatDateInTimeZone(new Date(), normalizeTimeZone(location.timezone)),
            location,
            settings
          )
        );
        if (cached) {
          setSchedule(cached);
          setIsStale(true);
          setError('Menggunakan jadwal tersimpan (offline).');
        } else {
          setError('Gagal memuat jadwal sholat. Silakan periksa koneksi internet.');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [location.latitude, location.longitude, location.timezone, settings.method, settings.madhab, JSON.stringify(settings.adjustments)]
  );

  // Initial load or when location/settings change
  useEffect(() => {
    // Immediate optimistic load from cache if exists
    const cached = getCachedSchedule(
      buildPrayerScheduleCacheContext(
        formatDateInTimeZone(new Date(), normalizeTimeZone(location.timezone)),
        location,
        settings
      )
    );
    if (cached && !schedule) {
      setSchedule(cached);
    }
    fetchSchedule(Boolean(cached));
  }, [fetchSchedule]);

  return {
    schedule,
    isLoading,
    isRefreshing,
    error,
    isStale,
    refresh: () => fetchSchedule(false),
  };
}
