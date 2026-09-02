'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DailyPrayerSchedule, UserLocation, UserSettings } from '@/types';
import { getDailyPrayerTimes } from '@/lib/prayer/api';
import { buildPrayerScheduleCacheContext, getCachedSchedule, saveCachedSchedule } from '@/lib/storage/preferences';
import { formatDateInTimeZone, normalizeTimeZone } from '@/lib/time/timezone';
import { isNetworkRequestError } from '@/lib/network/fetch';
import { LatestRequestController } from '@/lib/network/latest-request';

export function usePrayerTimes(location: UserLocation, settings: UserSettings) {
  const [schedule, setSchedule] = useState<DailyPrayerSchedule | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const requestsRef = useRef<LatestRequestController | null>(null);
  if (!requestsRef.current) requestsRef.current = new LatestRequestController();

  const fetchSchedule = useCallback(
    async (isBackgroundRefresh = false) => {
      const request = requestsRef.current!.begin();
      if (isBackgroundRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const today = new Date();
        const data = await getDailyPrayerTimes(location, settings, today, {
          signal: request.signal,
        });
        if (!request.isCurrent()) return;
        setSchedule(data);
        saveCachedSchedule(data, buildPrayerScheduleCacheContext(data.date, location, settings));
        setIsStale(data.source === 'offline');
      } catch (err: unknown) {
        if (!request.isCurrent() || isNetworkRequestError(err, 'aborted')) return;
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
        if (request.isCurrent()) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
        requestsRef.current?.finish(request);
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
    setSchedule(cached);
    setError(null);
    void fetchSchedule(Boolean(cached));
    return () => requestsRef.current?.cancel();
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
