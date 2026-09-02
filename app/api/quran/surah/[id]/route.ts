import { NextRequest, NextResponse } from 'next/server';
import { SURAH_LIST } from '@/lib/quran/surah-list';
import { SurahDetail, Ayah } from '@/types';
import { fetchWithTimeout, NETWORK_TIMEOUTS, readJsonResponse } from '@/lib/network/fetch';
import { ApiInputError, parseSurahNumber } from '@/lib/api/validation';
import { apiError, isObject, logSafeApiError, providerErrorStatus } from '@/lib/api/response';

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function audioSources(value: unknown): Record<string, string> {
  if (!isObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] =>
      typeof entry[1] === 'string' && /^https:\/\//.test(entry[1])
    )
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let surahNumber: number;
  try {
    surahNumber = parseSurahNumber((await params).id);
  } catch (error) {
    if (error instanceof ApiInputError) {
      return apiError('INVALID_INPUT', 'Nomor surat tidak valid.', 400);
    }
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan internal.', 500);
  }

  const surahMeta = SURAH_LIST.find((surah) => surah.number === surahNumber);
  if (!surahMeta) return apiError('SURAH_NOT_FOUND', 'Surat tidak ditemukan.', 404);

  try {
    const response = await fetchWithTimeout(`https://equran.id/api/v2/surat/${surahNumber}`, {
      timeoutMs: NETWORK_TIMEOUTS.quranProvider,
      rejectHttpErrors: false,
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      console.error('Quran provider rejected request', { status: response.status });
      return apiError('QURAN_PROVIDER_UNAVAILABLE', 'Data surat belum dapat dimuat.', 502);
    }

    const payload = await readJsonResponse<unknown>(response);
    if (!isObject(payload) || payload.code !== 200 || !isObject(payload.data)) {
      return apiError('QURAN_PROVIDER_INVALID_RESPONSE', 'Data surat belum dapat dimuat.', 502);
    }

    const rawAyahs = Array.isArray(payload.data.ayat) ? payload.data.ayat : [];
    const ayahs: Ayah[] = rawAyahs.flatMap((value) => {
      if (!isObject(value)) return [];
      const number = value.nomorAyat;
      const arabText = text(value.teksArab);
      const latinText = text(value.teksLatin);
      const translation = text(value.teksIndonesia);
      if (!Number.isInteger(number) || !arabText || !latinText || !translation) return [];
      const audio = audioSources(value.audio);
      return [{
        numberInSurah: number as number,
        numberInQuran: number as number,
        arabText,
        latinText,
        translation,
        juz: 1,
        audio: Object.keys(audio).length > 0 ? audio : {
          '01': `https://equran.nos.wjv-1.neo.id/audio-full/Abdullah-Al-Juhany/${String(surahNumber).padStart(3, '0')}.mp3`,
          '05': `https://equran.nos.wjv-1.neo.id/audio-full/Misyari-Rasyid-Al-Afasi/${String(surahNumber).padStart(3, '0')}.mp3`,
        },
      }];
    });
    if (ayahs.length !== surahMeta.numberOfAyahs) {
      return apiError('QURAN_PROVIDER_INVALID_RESPONSE', 'Data surat belum dapat dimuat.', 502);
    }

    const fullAudio = audioSources(payload.data.audioFull);
    const description = text(payload.data.deskripsi);
    const detail: SurahDetail = {
      ...surahMeta,
      description: description?.replace(/<[^>]*>?/gm, '') || '',
      audioFull: fullAudio['05'] || fullAudio['01'] || '',
      ayahs,
    };
    return NextResponse.json(
      { code: 200, message: 'OK', data: detail },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
    );
  } catch (error) {
    logSafeApiError('Quran provider request failed', error);
    const status = providerErrorStatus(error);
    return apiError(
      status === 504 ? 'QURAN_PROVIDER_TIMEOUT' : status === 502 ? 'QURAN_PROVIDER_UNAVAILABLE' : 'INTERNAL_ERROR',
      status === 500 ? 'Terjadi kesalahan internal.' : 'Data surat belum dapat dimuat.',
      status
    );
  }
}
