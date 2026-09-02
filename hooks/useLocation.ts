'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UserLocation, CitySearchResult } from '@/types';
import { DEFAULT_LOCATION } from '@/lib/prayer/constants';
import { getSavedLocation, saveLocation } from '@/lib/storage/preferences';
import { reverseGeocode } from '@/lib/location/geocoding';
import { isNetworkRequestError } from '@/lib/network/fetch';
import { LatestRequestController } from '@/lib/network/latest-request';

export type GeolocationStatus = 'idle' | 'prompt' | 'requesting' | 'granted' | 'denied' | 'error';

export function useLocation() {
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
      setErrorMessage('Perangkat Anda tidak mendukung geolokasi otomatis.');
      return;
    }

    setStatus('requesting');
    setErrorMessage(null);
    const request = reverseRequestsRef.current!.begin();

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const detectedLoc = await reverseGeocode(latitude, longitude, { signal: request.signal });
          if (!request.isCurrent()) return;
          updateLocation(detectedLoc);
          setStatus('granted');
        } catch (err: unknown) {
          if (!request.isCurrent() || isNetworkRequestError(err, 'aborted')) return;
          console.error('Error reverse geocoding:', err);
          setStatus('error');
          setErrorMessage('Gagal mengenali nama wilayah koordinat Anda.');
        } finally {
          reverseRequestsRef.current?.finish(request);
        }
      },
      (error) => {
        if (!request.isCurrent()) return;
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
          setErrorMessage('Izin lokasi ditolak. Anda dapat memilih kota secara manual.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setStatus('error');
          setErrorMessage('Sinyal lokasi tidak tersedia saat ini.');
        } else if (error.code === error.TIMEOUT) {
          setStatus('error');
          setErrorMessage('Permintaan lokasi melebihi batas waktu (timeout).');
        } else {
          setStatus('error');
          setErrorMessage('Terjadi kendala saat membaca lokasi perangkat.');
        }
        reverseRequestsRef.current?.finish(request);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 mins cache
      }
    );
  }, [updateLocation]);

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
