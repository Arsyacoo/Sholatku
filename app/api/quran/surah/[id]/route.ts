import { NextRequest, NextResponse } from 'next/server';
import { SURAH_LIST } from '@/lib/quran/surah-list';
import { SurahDetail, Ayah } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const surahNumber = parseInt(id, 10);

  if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return NextResponse.json({ error: 'Nomor surat tidak valid' }, { status: 400 });
  }

  const surahMeta = SURAH_LIST.find((s) => s.number === surahNumber);
  if (!surahMeta) {
    return NextResponse.json({ error: 'Surat tidak ditemukan' }, { status: 404 });
  }

  try {
    // Fetch from equran.id API (reliable Indonesian Kemenag source with full audio)
    const response = await fetch(`https://equran.id/api/v2/surat/${surahNumber}`, {
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const json = await response.json();
      if (json.code === 200 && json.data) {
        const d = json.data;

        const ayahs: Ayah[] = (d.ayat || []).map((a: any) => ({
          numberInSurah: a.nomorAyat,
          numberInQuran: a.nomorAyat,
          arabText: a.teksArab,
          latinText: a.teksLatin,
          translation: a.teksIndonesia,
          juz: 1, // Will be mapped by number
          audio: a.audio || {
            '01': 'https://equran.nos.wjv-1.neo.id/audio-full/Abdullah-Al-Juhany/' + String(surahNumber).padStart(3, '0') + '.mp3',
            '05': 'https://equran.nos.wjv-1.neo.id/audio-full/Misyari-Rasyid-Al-Afasi/' + String(surahNumber).padStart(3, '0') + '.mp3',
          },
        }));

        const detail: SurahDetail = {
          ...surahMeta,
          description: d.deskripsi ? d.deskripsi.replace(/<[^>]*>?/gm, '') : '',
          audioFull: d.audioFull?.['05'] || d.audioFull?.['01'] || '',
          ayahs,
        };

        return NextResponse.json(
          { code: 200, message: 'OK', data: detail },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
            },
          }
        );
      }
    }
  } catch (err: any) {
    console.warn('Equran API error, fallbacking to quran.com or basic payload:', err);
  }

  // Basic fallback metadata
  const fallbackDetail: SurahDetail = {
    ...surahMeta,
    ayahs: [],
  };

  return NextResponse.json({ code: 200, message: 'OK', data: fallbackDetail });
}
