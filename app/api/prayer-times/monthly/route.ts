import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, NETWORK_TIMEOUTS, readJsonResponse } from '@/lib/network/fetch';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') || '-6.1754';
  const lon = searchParams.get('lon') || '106.8272';
  const method = searchParams.get('method') || '20';
  const school = searchParams.get('school') || '0';
  const today = new Date();
  const year = searchParams.get('year') || String(today.getFullYear());
  const month = searchParams.get('month') || String(today.getMonth() + 1);

  const targetUrl = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lon}&method=${method}&school=${school}`;

  try {
    const response = await fetchWithTimeout(targetUrl, {
      timeoutMs: NETWORK_TIMEOUTS.prayerProvider,
      rejectHttpErrors: false,
      next: { revalidate: 86400 }, // Cache calendar for 24 hours
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Gagal mengambil jadwal bulanan', status: response.status },
        { status: response.status }
      );
    }

    const data = await readJsonResponse(response);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Gagal menghubungi server jadwal', details: err.message },
      { status: 500 }
    );
  }
}
