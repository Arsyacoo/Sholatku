'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UserLocation, CitySearchResult } from '@/types';
import { DEFAULT_LOCATION } from '@/lib/prayer/constants';
import { getSavedLocation, saveLocation } from '@/lib/storage/preferences';
import { reverseGeocode } from '@/lib/location/geocoding';
import { isNetworkRequestError } from '@/lib/network/fetch';
import { LatestRequestController } from '@/lib/network/latest-request';
import { useLanguage } from '@/hooks/useLanguage';

export type GeolocationStatus = 'idle' | 'prompt' | 'requesting' | 'granted' | 'denied' | 'error';

export function useLocation() {
  const { t, language } = useLanguage();
  const [location, setLocationState] = useState<UserLocation>(DEFAULT_LOCATION);
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const reverseRequestsRef = useRef<LatestRequestController | null>(null);
  if (!reverseRequestsRef.current) reverseRequestsRef.current = new LatestRequestController();

  // Load saved location on mount
  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      setLocationState(saved);
    }
    setIsHydrated(true);
  }, []);

  // Update and persist location
  const updateLocation = useCallback((newLoc: UserLocation) => {
    setLocationState(newLoc);
    saveLocation(newLoc);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sholatku:location-changed', { detail: newLoc }));
    }
    setErrorMessage(null);
  }, []);

  // Select city from search
  const selectCity = useCallback(
    (city: CitySearchResult) => {
      reverseRequestsRef.current?.cancel();
      const newLoc: UserLocation = {
        city: city.name,
        province: city.adminName,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone,
        isAutoDetected: false,
        displayName: `${city.name}${city.adminName ? ', ' + city.adminName : ''}`,
      };
      updateLocation(newLoc);
      setStatus('idle');
    },
    [updateLocation]
  );

  // Request browser geolocation
  const detectLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatus('error');
      setErrorMessage(t('Perangkat Anda tidak mendukung geolokasi otomatis.', 'Your device does not support automatic location.'));
      return;
    }

    setStatus('requesting');
    setErrorMessage(null);
    const request = reverseRequestsRef.current!.begin();

    const handlePosition = async (pos: GeolocationPosition) => {
      try {
        const { latitude, longitude } = pos.coords;
        const detectedLoc = await reverseGeocode(latitude, longitude, { signal: request.signal, language });
        if (!request.isCurrent()) return;
        updateLocation(detectedLoc);
        setStatus('granted');
      } catch (err: unknown) {
        if (!request.isCurrent() || isNetworkRequestError(err, 'aborted')) return;
        console.error('Error reverse geocoding:', err);
        setStatus('error');
        setErrorMessage(t('Gagal mengenali nama wilayah koordinat Anda.', 'Could not identify the area for your coordinates.'));
      } finally {
        reverseRequestsRef.current?.finish(request);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      if (!request.isCurrent()) return;
      if (error.code === error.PERMISSION_DENIED) {
        setStatus('denied');
        setErrorMessage(t('Izin lokasi ditolak. Anda dapat memilih kota secara manual.', 'Location permission denied. You can choose a city manually.'));
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        setStatus('error');
        setErrorMessage(t('Sinyal lokasi tidak tersedia saat ini.', 'Location signal is unavailable right now.'));
      } else if (error.code === error.TIMEOUT) {
        setStatus('error');
        setErrorMessage(t('Permintaan lokasi melebihi batas waktu (timeout).', 'The location request timed out.'));
      } else {
        setStatus('error');
        setErrorMessage(t('Terjadi kendala saat membaca lokasi perangkat.', 'There was a problem reading the device location.'));
      }
      reverseRequestsRef.current?.finish(request);
    };

    // City-level accuracy is enough, so ask the network provider first. Some phones have it off or slow;
    // then retry once with GPS before giving up. A denied permission is never retried.
    const attempt = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        handlePosition,
        (error) => {
          const retryable = error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE;
          if (!highAccuracy && retryable && request.isCurrent()) {
            attempt(true);
            return;
          }
          handleError(error);
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 15000 : 10000,
          maximumAge: 300000, // 5 mins cache
        }
      );
    };
    attempt(false);
  }, [updateLocation, t, language]);

  useEffect(() => () => reverseRequestsRef.current?.cancel(), []);

  return {
    location,
    status,
    errorMessage,
    isHydrated,
    updateLocation,
    selectCity,
    detectLocation,
  };
}
