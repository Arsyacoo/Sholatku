'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserLocation, CitySearchResult } from '@/types';
import { DEFAULT_LOCATION } from '@/lib/prayer/constants';
import { getSavedLocation, saveLocation } from '@/lib/storage/preferences';
import { reverseGeocode } from '@/lib/location/geocoding';

export type GeolocationStatus = 'idle' | 'prompt' | 'requesting' | 'granted' | 'denied' | 'error';

export function useLocation() {
  const [location, setLocationState] = useState<UserLocation>(DEFAULT_LOCATION);
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

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
      const newLoc: UserLocation = {
        city: city.name,
        province: city.adminName,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
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

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const detectedLoc = await reverseGeocode(latitude, longitude);
          updateLocation(detectedLoc);
          setStatus('granted');
        } catch (err: any) {
          console.error('Error reverse geocoding:', err);
          setStatus('error');
          setErrorMessage('Gagal mengenali nama wilayah koordinat Anda.');
        }
      },
      (error) => {
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
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 mins cache
      }
    );
  }, [updateLocation]);

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
