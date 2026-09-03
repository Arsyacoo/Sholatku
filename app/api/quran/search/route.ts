import { NextRequest, NextResponse } from 'next/server';
import { SURAH_LIST } from '@/lib/quran/surah-list';
import { ApiInputError, parseQuranSearchQuery } from '@/lib/api/validation';
import { apiError, isObject, logSafeApiError, providerErrorStatus } from '@/lib/api/response';
import { fetchWithTimeout, NETWORK_TIMEOUTS, readJsonResponse } from '@/lib/network/fetch';
import { normalizeArabicText, normalizeSearchText } from '@/lib/quran/search/normalize';
import type { QuranSearchRecord } from '@/lib/quran/search/types';

const SEARCH_SOURCE = 'https://api.alquran.cloud/v1/search';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePageParam(request: NextRequest, key: string, fallback: number): number {
  const raw = request.nextUrl.searchParams.get(key);
  if (raw === null || raw === '') return fallback;
  if (!/^\d+$/.test(raw)) throw new ApiInputError(key);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) throw new ApiInputError(key);
  return value;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toRecord(value: unknown): QuranSearchRecord | null {
  if (!isObject(value) || !isObject(value.surah)) return null;
  const surahNumber = value.surah.number;
  const ayahNumber = value.numberInSurah;
  const translation = text(value.text);
  const metadata = SURAH_LIST.find((surah) => surah.number === surahNumber);
  if (
    !Number.isInteger(surahNumber) ||
    !Number.isInteger(ayahNumber) ||
    !metadata ||
    (ayahNumber as number) < 1 ||
    (ayahNumber as number) > metadata.numberOfAyahs ||
    !translation
  ) return null;

  const validSurahNumber = surahNumber as number;
  const validAyahNumber = ayahNumber as number;
  return {
    id: `${validSurahNumber}:${validAyahNumber}`,
    surahNumber: validSurahNumber,
    surahName: metadata.name,
    surahNameArabic: metadata.arabicName,
    ayahNumber: validAyahNumber,
    arabic: '',
    arabicNormalized: normalizeArabicText(''),
    translation,
    translationNormalized: normalizeSearchText(translation),
    indexedAt: Date.now(),
    schemaVersion: 1,
  };
}

export async function GET(request: NextRequest) {
  let query: string | null;
  let limit: number;
  let offset: number;
  try {
    query = parseQuranSearchQuery(request.nextUrl.searchParams.get('q'));
    limit = Math.min(MAX_LIMIT, Math.max(1, parsePageParam(request, 'limit', DEFAULT_LIMIT)));
    offset = parsePageParam(request, 'offset', 0);
  } catch (error) {
    if (error instanceof ApiInputError) {
      return apiError('INVALID_INPUT', `Parameter ${error.field} tidak valid.`, 400);
    }
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan internal.', 500);
  }

  if (!query) {
    return NextResponse.json({
      code: 200,
      message: 'OK',
      data: { records: [], totalMatches: 0, hasMore: false },
    });
  }

  try {
    const url = `${SEARCH_SOURCE}/${encodeURIComponent(query)}/all/id.indonesian`;
    const response = await fetchWithTimeout(url, {
      timeoutMs: NETWORK_TIMEOUTS.quranSearchProvider,
      rejectHttpErrors: false,
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      return apiError('QURAN_SEARCH_UNAVAILABLE', 'Pencarian ayat online belum tersedia.', 502);
    }

    const payload: unknown = await readJsonResponse(response);
    const matches = isObject(payload) && isObject(payload.data) && Array.isArray(payload.data.matches)
      ? payload.data.matches
      : null;
    if (!matches) {
      return apiError('QURAN_SEARCH_INVALID_RESPONSE', 'Hasil pencarian ayat tidak valid.', 502);
    }

    const records = matches.flatMap((match) => {
      const record = toRecord(match);
      return record ? [record] : [];
    });
    const unique = [...new Map(records.map((record) => [record.id, record])).values()];
    const page = unique.slice(offset, offset + limit);
    return NextResponse.json(
      {
        code: 200,
        message: 'OK',
        data: {
          records: page,
          totalMatches: unique.length,
          hasMore: offset + limit < unique.length,
        },
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (error) {
    logSafeApiError('Quran online search failed', error);
    const status = providerErrorStatus(error);
    return apiError(
      status === 504 ? 'QURAN_SEARCH_TIMEOUT' : status === 502 ? 'QURAN_SEARCH_UNAVAILABLE' : 'INTERNAL_ERROR',
      status === 500 ? 'Terjadi kesalahan internal.' : 'Pencarian ayat online belum tersedia.',
      status
    );
  }
}
