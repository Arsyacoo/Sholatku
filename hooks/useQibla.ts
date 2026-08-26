'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserLocation } from '@/types';
import { calculateQiblaBearing, calculateDistanceToKaaba } from '@/lib/prayer/calculation';

export interface QiblaState {
  bearing: number; // Degree from North to Kaaba (0-360)
  distanceKm: number;
  deviceHeading: number | null; // Compass heading of device (0-360)
  relativeBearing: number; // Angle difference to align needle
  hasSensor: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unsupported';
  isCalibrated: boolean;
}

export function useQibla(location: UserLocation) {
  const [bearing, setBearing] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [hasSensor, setHasSensor] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');

  // Recalculate bearing whenever location coordinates change
  useEffect(() => {
    const qiblaDeg = calculateQiblaBearing(location.latitude, location.longitude);
    const dist = calculateDistanceToKaaba(location.latitude, location.longitude);
    setBearing(qiblaDeg);
    setDistanceKm(dist);
  }, [location.latitude, location.longitude]);

  // Handle device orientation
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    setHasSensor(true);
    let heading: number | null = null;

    // iOS WebKit compass heading
    if ('webkitCompassHeading' in e && typeof (e as any).webkitCompassHeading === 'number') {
      heading = (e as any).webkitCompassHeading;
    } else if (e.alpha !== null) {
      // Standard Android/Chrome DeviceOrientation (alpha is rotation around Z axis)
      // On Android absolute orientation might need inversion
      heading = 360 - e.alpha;
    }

    if (heading !== null) {
      setDeviceHeading(Math.round((heading + 360) % 360));
    }
  }, []);

  const requestSensorPermission = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // Check if iOS 13+ permission request is needed
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionState('granted');
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setPermissionState('denied');
        }
      } catch (err) {
        console.warn('Device orientation permission error:', err);
        setPermissionState('denied');
      }
    } else if ('ondeviceorientationabsolute' in window || 'ondeviceorientation' in window) {
      // Android / Desktop standard
      setPermissionState('granted');
      window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      setPermissionState('unsupported');
    }
  }, [handleOrientation]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !('requestPermission' in DeviceOrientationEvent)) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, [handleOrientation]);

  // Relative bearing (how much user needs to rotate device to point at Kaaba)
  const relativeBearing =
    deviceHeading !== null ? Math.round(((bearing - deviceHeading + 360) % 360) * 10) / 10 : bearing;

  const isAligned = Math.abs(relativeBearing) < 4 || Math.abs(relativeBearing - 360) < 4;

  return {
    bearing,
    distanceKm,
    deviceHeading,
    relativeBearing,
    hasSensor,
    permissionState,
    isAligned,
    requestSensorPermission,
  };
}
