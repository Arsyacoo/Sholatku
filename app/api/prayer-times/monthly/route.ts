import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, NETWORK_TIMEOUTS, readJsonResponse } from '@/lib/network/fetch';
import { ApiInputError, parseMonthlyPrayerQuery } from '@/lib/api/validation';
import { apiError, isObject, logSafeApiError, providerErrorStatus } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  let query;
  try {
    query = parseMonthlyPrayerQuery(request.nextUrl.searchParams);
  } catch (error) {
    if (error instanceof ApiInputError) {
      return apiError('INVALID_INPUT', `Parameter ${error.field} tidak valid.`, 400);
    }
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan internal.', 500);
  }

  const targetUrl = `https://api.aladhan.com/v1/calendar/${query.year}/${query.month}?latitude=${query.latitude}&longitude=${query.longitude}&method=${query.method}&school=${query.school}`;

  try {
    const response = await fetchWithTimeout(targetUrl, {
      timeoutMs: NETWORK_TIMEOUTS.prayerProvider,
      rejectHttpErrors: false,
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.error('Monthly prayer provider rejected request', { status: response.status });
      return apiError('PRAYER_PROVIDER_UNAVAILABLE', 'Jadwal bulanan belum dapat dimuat.', 502);
    }

    const data = await readJsonResponse<unknown>(response);
    if (!isObject(data) || data.code !== 200 || !Array.isArray(data.data)) {
      return apiError('PRAYER_PROVIDER_INVALID_RESPONSE', 'Jadwal bulanan belum dapat dimuat.', 502);
    }
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    });
  } catch (error) {
    logSafeApiError('Monthly prayer provider request failed', error);
    const status = providerErrorStatus(error);
    return apiError(
      status === 504 ? 'PRAYER_PROVIDER_TIMEOUT' : status === 502 ? 'PRAYER_PROVIDER_UNAVAILABLE' : 'INTERNAL_ERROR',
      status === 500 ? 'Terjadi kesalahan internal.' : 'Jadwal bulanan belum dapat dimuat.',
      status
    );
  }
}
