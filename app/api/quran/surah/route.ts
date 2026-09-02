import { NextRequest, NextResponse } from 'next/server';
import { SURAH_LIST, searchSurahs } from '@/lib/quran/surah-list';
import { ApiInputError, parseQuranSearchQuery } from '@/lib/api/validation';
import { apiError, logSafeApiError } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  try {
    const query = parseQuranSearchQuery(request.nextUrl.searchParams.get('q'));
    if (query) {
      return NextResponse.json({ code: 200, message: 'OK', data: searchSurahs(query) });
    }

    return NextResponse.json(
      { code: 200, message: 'OK', data: SURAH_LIST },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
    );
  } catch (error) {
    if (error instanceof ApiInputError) {
      return apiError('INVALID_INPUT', `Parameter ${error.field} tidak valid.`, 400);
    }
    logSafeApiError('Quran Surah list request failed', error);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan internal.', 500);
  }
}
