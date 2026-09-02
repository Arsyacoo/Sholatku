import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, NETWORK_TIMEOUTS, readJsonResponse } from '@/lib/network/fetch';
import { ApiInputError, parseDailyPrayerQuery } from '@/lib/api/validation';
import { apiError, isObject, logSafeApiError, providerErrorStatus } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  let query;
  try {
    query = parseDailyPrayerQuery(request.nextUrl.searchParams);
  } catch (error) {
    if (error instanceof ApiInputError) {
      return apiError('INVALID_INPUT', `Parameter ${error.field} tidak valid.`, 400);
    }
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan internal.', 500);
  }

  const targetUrl = `https://api.aladhan.com/v1/timings/${query.timestamp}?latitude=${query.latitude}&longitude=${query.longitude}&method=${query.method}&school=${query.school}`;

  try {
    const response = await fetchWithTimeout(targetUrl, {
      timeoutMs: NETWORK_TIMEOUTS.prayerProvider,
      rejectHttpErrors: false,
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.error('Daily prayer provider rejected request', { status: response.status });
      return apiError('PRAYER_PROVIDER_UNAVAILABLE', 'Jadwal sholat belum dapat dimuat.', 502);
    }

    const data = await readJsonResponse<unknown>(response);
    if (!isObject(data) || data.code !== 200 || !isObject(data.data)) {
      return apiError('PRAYER_PROVIDER_INVALID_RESPONSE', 'Jadwal sholat belum dapat dimuat.', 502);
    }
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    logSafeApiError('Daily prayer provider request failed', error);
    const status = providerErrorStatus(error);
    return apiError(
      status === 504 ? 'PRAYER_PROVIDER_TIMEOUT' : status === 502 ? 'PRAYER_PROVIDER_UNAVAILABLE' : 'INTERNAL_ERROR',
      status === 500 ? 'Terjadi kesalahan internal.' : 'Jadwal sholat belum dapat dimuat.',
      status
    );
  }
}
