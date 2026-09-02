import { KAABA_COORDINATES } from './constants';
import { Coordinates } from '@/types';

/**
 * Calculates Qibla direction (bearing in degrees clockwise from True North)
 * from given latitude and longitude using Great Circle spherical trigonometry.
 */
export function calculateQiblaBearing(lat: number, lon: number): number {
  const phiK = (KAABA_COORDINATES.latitude * Math.PI) / 180.0;
  const lambdaK = (KAABA_COORDINATES.longitude * Math.PI) / 180.0;
  const phi = (lat * Math.PI) / 180.0;
  const lambda = (lon * Math.PI) / 180.0;

  const deltaLambda = lambdaK - lambda;

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(deltaLambda);

  let qiblaRad = Math.atan2(y, x);
  let qiblaDeg = (qiblaRad * 180.0) / Math.PI;

  // Normalize to 0 - 360
  qiblaDeg = (qiblaDeg + 360) % 360;

  return Math.round(qiblaDeg * 10) / 10;
}

/**
 * Calculates distance to Kaaba in kilometers.
 */
export function calculateDistanceToKaaba(lat: number, lon: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((KAABA_COORDINATES.latitude - lat) * Math.PI) / 180;
  const dLon = ((KAABA_COORDINATES.longitude - lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((KAABA_COORDINATES.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Helper to convert Julian day / solar calculations for fallback offline prayer times.
 */
export function calculateOfflinePrayers(date: Date, lat: number, lon: number, timezoneOffset: number) {
  // Approximate calculation based on solar declination and equation of time
  const dayOfYear = Math.floor(
    (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) -
      Date.UTC(date.getUTCFullYear(), 0, 0)) /
      (24 * 60 * 60 * 1000)
  );

  const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
  const eqTime = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b); // minutes
  const solarDec = 23.45 * Math.sin(((dayOfYear - 81) * 2 * Math.PI) / 365) * (Math.PI / 180); // radians

  const latRad = (lat * Math.PI) / 180;

  // Solar noon
  const solarNoon = 12 + (timezoneOffset * 15 - lon) / 15 - eqTime / 60;

  // Fajr angle (-20 deg for Kemenag), Sunrise (-0.833 deg), Isha (-18 deg)
  const calculateHourAngle = (angleDeg: number) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const cosHA =
      (Math.sin(angleRad) - Math.sin(latRad) * Math.sin(solarDec)) /
      (Math.cos(latRad) * Math.cos(solarDec));
    if (cosHA > 1 || cosHA < -1) return 0;
    return (Math.acos(cosHA) * 180) / Math.PI / 15;
  };

  // Asr shadow angle: cot(A) = 1 + tan(latitude - solarDec) (Shafi'i)
  const asrAngle = Math.atan(1 / (1 + Math.tan(Math.abs(latRad - solarDec))));
  const asrHA = (Math.acos((Math.sin(asrAngle) - Math.sin(latRad) * Math.sin(solarDec)) / (Math.cos(latRad) * Math.cos(solarDec))) * 180) / Math.PI / 15;

  const sunriseHA = calculateHourAngle(-0.833);
  const fajrHA = calculateHourAngle(-20);
  const ishaHA = calculateHourAngle(-18);

  const formatHours = (h: number) => {
    const totalMinutes = Math.round(h * 60);
    const hours = Math.floor((totalMinutes / 60) % 24);
    const minutes = Math.floor(totalMinutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  return {
    fajr: formatHours(solarNoon - fajrHA),
    sunrise: formatHours(solarNoon - sunriseHA),
    dhuhr: formatHours(solarNoon + 0.05), // +3 mins for ihtiyat
    asr: formatHours(solarNoon + asrHA),
    maghrib: formatHours(solarNoon + sunriseHA + 0.03), // sunset + 2 mins
    isha: formatHours(solarNoon + ishaHA),
  };
}
