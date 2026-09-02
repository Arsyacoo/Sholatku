import { CALCULATION_METHODS } from '@/lib/prayer/constants';

const SUPPORTED_METHODS = new Set<string>(CALCULATION_METHODS.map((method) => method.id));
const SUPPORTED_SCHOOLS = new Set(['0', '1']);

export class ApiInputError extends Error {
  readonly field: string;

  constructor(field: string) {
    super(`Invalid parameter: ${field}.`);
    this.name = 'ApiInputError';
    this.field = field;
  }
}

function finiteNumber(
  params: URLSearchParams,
  field: string,
  fallback: number,
  min: number,
  max: number
): number {
  const raw = params.get(field);
  if (raw === null) return fallback;
  if (!raw.trim()) throw new ApiInputError(field);
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) throw new ApiInputError(field);
  return value;
}

function integer(
  params: URLSearchParams,
  field: string,
  fallback: number,
  min: number,
  max: number
): number {
  const value = finiteNumber(params, field, fallback, min, max);
  if (!Number.isInteger(value)) throw new ApiInputError(field);
  return value;
}

function method(params: URLSearchParams): string {
  const value = params.get('method') || '20';
  if (!SUPPORTED_METHODS.has(value)) throw new ApiInputError('method');
  return value;
}

function school(params: URLSearchParams): string {
  const value = params.get('school') || '0';
  if (!SUPPORTED_SCHOOLS.has(value)) throw new ApiInputError('school');
  return value;
}

export interface DailyPrayerQuery {
  latitude: number;
  longitude: number;
  method: string;
  school: string;
  timestamp: number;
}

export function parseDailyPrayerQuery(params: URLSearchParams): DailyPrayerQuery {
  return {
    latitude: finiteNumber(params, 'lat', -6.1754, -90, 90),
    longitude: finiteNumber(params, 'lon', 106.8272, -180, 180),
    method: method(params),
    school: school(params),
    timestamp: integer(params, 'timestamp', Math.floor(Date.now() / 1000), 0, 4_102_444_800),
  };
}

export interface MonthlyPrayerQuery extends Omit<DailyPrayerQuery, 'timestamp'> {
  year: number;
  month: number;
}

export function parseMonthlyPrayerQuery(params: URLSearchParams): MonthlyPrayerQuery {
  const today = new Date();
  return {
    latitude: finiteNumber(params, 'lat', -6.1754, -90, 90),
    longitude: finiteNumber(params, 'lon', 106.8272, -180, 180),
    method: method(params),
    school: school(params),
    year: integer(params, 'year', today.getFullYear(), 1900, 2100),
    month: integer(params, 'month', today.getMonth() + 1, 1, 12),
  };
}

export function parseSurahNumber(value: string): number {
  if (!/^\d{1,3}$/.test(value)) throw new ApiInputError('surah');
  const surahNumber = Number(value);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    throw new ApiInputError('surah');
  }
  return surahNumber;
}

export function parseQuranSearchQuery(value: string | null): string | null {
  if (value === null || !value.trim()) return null;
  const query = value.trim();
  if (query.length > 100) throw new ApiInputError('q');
  return query;
}
