import { KAABA_COORDINATES } from './constants';

/**
 * Explicit high-latitude adjustment used when Fajr or Isha twilight does not
 * cross the horizon. One seventh of the astronomical night is allocated on
 * either side of the night rather than fabricating a 00:00 value.
 */
export const HIGH_LATITUDE_POLICY = 'one-seventh' as const;
export type HighLatitudePolicy = typeof HIGH_LATITUDE_POLICY;

export type PrayerCalculationErrorCode =
  | 'invalid-input'
  | 'unavailable-solar-event'
  | 'invalid-result';

export class PrayerCalculationError extends Error {
  readonly code: PrayerCalculationErrorCode;

  constructor(code: PrayerCalculationErrorCode, message: string) {
    super(message);
    this.name = 'PrayerCalculationError';
    this.code = code;
  }
}

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

export interface OfflinePrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  highLatitudePolicy: HighLatitudePolicy | null;
}

const TRIGONOMETRY_EPSILON = 1e-12;

function assertFiniteInput(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new PrayerCalculationError('invalid-input', `${name} harus berupa angka finite.`);
  }
}

function safeAcos(value: number, eventName: string): number | null {
  if (!Number.isFinite(value)) {
    throw new PrayerCalculationError('invalid-result', `${eventName} menghasilkan nilai trigonometri tidak valid.`);
  }
  if (value < -1) {
    return value >= -1 - TRIGONOMETRY_EPSILON ? Math.acos(-1) : null;
  }
  if (value > 1) {
    return value <= 1 + TRIGONOMETRY_EPSILON ? Math.acos(1) : null;
  }
  return Math.acos(value);
}

function formatHours(hours: number): string {
  if (!Number.isFinite(hours)) {
    throw new PrayerCalculationError('invalid-result', 'Perhitungan waktu sholat menghasilkan angka tidak valid.');
  }
  const totalMinutes = ((Math.round(hours * 60) % 1440) + 1440) % 1440;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

/**
 * Helper to convert Julian day / solar calculations for fallback offline prayer times.
 *
 * At high latitude, the selected one-seventh policy is applied only when the
 * normal Fajr/Isha twilight angle is unavailable but a meaningful sunrise and
 * sunset still exist. Polar day/night has no bounded astronomical night, so it
 * fails explicitly and lets the caller present an honest error state.
 */
export function calculateOfflinePrayers(
  date: Date,
  lat: number,
  lon: number,
  timezoneOffset: number
): OfflinePrayerTimes {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
    throw new PrayerCalculationError('invalid-input', 'Tanggal perhitungan tidak valid.');
  }
  assertFiniteInput(lat, 'Latitude');
  assertFiniteInput(lon, 'Longitude');
  assertFiniteInput(timezoneOffset, 'Offset zona waktu');
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180 || timezoneOffset < -24 || timezoneOffset > 24) {
    throw new PrayerCalculationError('invalid-input', 'Koordinat atau offset zona waktu berada di luar rentang valid.');
  }

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
  const calculateHourAngle = (angleDeg: number, eventName: string) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const cosHourAngle =
      (Math.sin(angleRad) - Math.sin(latRad) * Math.sin(solarDec)) /
      (Math.cos(latRad) * Math.cos(solarDec));
    const angle = safeAcos(cosHourAngle, eventName);
    return angle === null ? null : (angle * 180) / Math.PI / 15;
  };

  // Asr shadow angle: cot(A) = 1 + tan(latitude - solarDec) (Shafi'i)
  const asrAngle = Math.atan(1 / (1 + Math.tan(Math.abs(latRad - solarDec))));
  const asrRadians = safeAcos(
    (Math.sin(asrAngle) - Math.sin(latRad) * Math.sin(solarDec)) /
      (Math.cos(latRad) * Math.cos(solarDec)),
    'Asar'
  );
  const asrHA = asrRadians === null ? null : (asrRadians * 180) / Math.PI / 15;

  const sunriseHA = calculateHourAngle(-0.833, 'Terbit');
  const fajrHA = calculateHourAngle(-20, 'Fajar');
  const ishaHA = calculateHourAngle(-18, 'Isya');
  if (sunriseHA === null || sunriseHA <= 0 || sunriseHA >= 12 || asrHA === null) {
    throw new PrayerCalculationError(
      'unavailable-solar-event',
      'Perhitungan waktu sholat tidak tersedia karena matahari tidak memiliki terbit dan terbenam yang bermakna di lokasi ini.'
    );
  }

  const nightLength = 24 - 2 * sunriseHA;
  if (!Number.isFinite(nightLength) || nightLength <= 0 || nightLength >= 24) {
    throw new PrayerCalculationError('unavailable-solar-event', 'Durasi malam astronomis tidak dapat ditentukan.');
  }

  const sunrise = solarNoon - sunriseHA;
  const sunset = solarNoon + sunriseHA;
  const oneSeventhNight = nightLength / 7;
  const fajr = fajrHA === null ? sunrise - oneSeventhNight : solarNoon - fajrHA;
  const isha = ishaHA === null ? sunset + oneSeventhNight : solarNoon + ishaHA;

  return {
    fajr: formatHours(fajr),
    sunrise: formatHours(sunrise),
    dhuhr: formatHours(solarNoon + 0.05), // +3 mins for ihtiyat
    asr: formatHours(solarNoon + asrHA),
    maghrib: formatHours(solarNoon + sunriseHA + 0.03), // sunset + 2 mins
    isha: formatHours(isha),
    highLatitudePolicy: fajrHA === null || ishaHA === null ? HIGH_LATITUDE_POLICY : null,
  };
}
