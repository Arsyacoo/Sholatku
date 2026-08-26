import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') || '-6.1754';
  const lon = searchParams.get('lon') || '106.8272';
  const method = searchParams.get('method') || '20'; // Kemenag default
  const school = searchParams.get('school') || '0'; // Shafi'i
  const timestamp = searchParams.get('timestamp') || String(Math.floor(Date.now() / 1000));

  const targetUrl = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lon}&method=${method}&school=${school}`;

  try {
    const response = await fetch(targetUrl, {
      next: { revalidate: 3600 }, // Cache on edge for 1 hour
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Gagal mengambil data dari penyedia waktu sholat', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan jaringan saat memuat jadwal', details: err.message },
      { status: 500 }
    );
  }
}
