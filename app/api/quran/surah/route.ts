import { NextRequest, NextResponse } from 'next/server';
import { SURAH_LIST, searchSurahs } from '@/lib/quran/surah-list';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (q) {
    const results = searchSurahs(q);
    return NextResponse.json({
      code: 200,
      message: 'OK',
      data: results,
    });
  }

  return NextResponse.json(
    {
      code: 200,
      message: 'OK',
      data: SURAH_LIST,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
