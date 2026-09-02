import { NextResponse } from 'next/server';
import { SURAH_LIST } from '@/lib/quran/surah-list';
import { normalizeArabicText, normalizeSearchText } from '@/lib/quran/search/normalize';
import type { QuranSearchRecord } from '@/lib/quran/search/types';
import { fetchWithTimeout, NETWORK_TIMEOUTS, readJsonResponse } from '@/lib/network/fetch';
import { apiError, logSafeApiError } from '@/lib/api/response';

const SOURCE_URL = 'https://equran.id/api/v2/surat/';
const CONCURRENCY = 4;

interface CorpusBuildResult {
  records: QuranSearchRecord[];
  indexedSurahs: number;
  failedSurahs: number[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function fetchSurahRecords(surahNumber: number): Promise<QuranSearchRecord[]> {
  const response = await fetchWithTimeout(`${SOURCE_URL}${surahNumber}`, {
    timeoutMs: NETWORK_TIMEOUTS.quranCorpusProvider,
    rejectHttpErrors: false,
    headers: { Accept: 'application/json' },
    next: { revalidate: 86400 },
  });
  if (!response.ok) throw new Error(`Surah ${surahNumber} gagal dimuat.`);

  const payload: unknown = await readJsonResponse(response);
  if (!isObject(payload) || payload.code !== 200 || !isObject(payload.data)) {
    throw new Error(`Data Surah ${surahNumber} tidak valid.`);
  }

  const metadata = SURAH_LIST.find((surah) => surah.number === surahNumber);
  const ayahs = Array.isArray(payload.data.ayat) ? payload.data.ayat : [];
  if (!metadata || ayahs.length === 0) throw new Error(`Ayat Surah ${surahNumber} tidak tersedia.`);

  const records: QuranSearchRecord[] = [];
  for (const ayah of ayahs) {
    if (!isObject(ayah)) continue;
    const ayahNumber = ayah.nomorAyat;
    const arabic = ayah.teksArab;
    const translation = ayah.teksIndonesia;
    if (!Number.isInteger(ayahNumber) || typeof arabic !== 'string' || typeof translation !== 'string') continue;
    const validAyahNumber = ayahNumber as number;
    records.push({
      id: `${surahNumber}:${validAyahNumber}`,
      surahNumber,
      surahName: metadata.name,
      surahNameArabic: metadata.arabicName,
      ayahNumber: validAyahNumber,
      arabic,
      arabicNormalized: normalizeArabicText(arabic),
      translation,
      translationNormalized: normalizeSearchText(translation),
      indexedAt: Date.now(),
      schemaVersion: 1,
    });
  }

  if (records.length !== metadata.numberOfAyahs) {
    throw new Error(`Data Surah ${surahNumber} tidak lengkap.`);
  }
  return records;
}

async function buildCorpus(): Promise<CorpusBuildResult> {
  const queue = SURAH_LIST.map((surah) => surah.number);
  const records: QuranSearchRecord[] = [];
  const failedSurahs: number[] = [];

  const worker = async () => {
    while (queue.length > 0) {
      const surahNumber = queue.shift();
      if (surahNumber === undefined) return;
      try {
        records.push(...(await fetchSurahRecords(surahNumber)));
      } catch {
        failedSurahs.push(surahNumber);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  records.sort((left, right) => left.surahNumber - right.surahNumber || left.ayahNumber - right.ayahNumber);
  return {
    records,
    indexedSurahs: new Set(records.map((record) => record.surahNumber)).size,
    failedSurahs: failedSurahs.sort((left, right) => left - right),
  };
}

let inFlightBuild: Promise<CorpusBuildResult> | null = null;

function getCorpusBuild(): Promise<CorpusBuildResult> {
  if (!inFlightBuild) {
    inFlightBuild = buildCorpus().finally(() => {
      inFlightBuild = null;
    });
  }
  return inFlightBuild;
}

export async function GET() {
  try {
    const result = await getCorpusBuild();
    if (result.indexedSurahs === 0) {
      return apiError('QURAN_CORPUS_UNAVAILABLE', 'Pencarian seluruh ayat belum dapat dimuat.', 502);
    }
    const isComplete = result.failedSurahs.length === 0 && result.indexedSurahs === SURAH_LIST.length;
    return NextResponse.json(
      {
        code: isComplete ? 200 : 206,
        message: isComplete ? 'OK' : 'Pencarian sebagian tersedia',
        data: {
          records: result.records,
          indexedSurahs: result.indexedSurahs,
          totalSurahs: SURAH_LIST.length,
          isComplete,
          failedSurahs: result.failedSurahs,
        },
      },
      {
        status: isComplete ? 200 : 206,
        headers: isComplete
          ? { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' }
          : { 'Cache-Control': 'no-store' },
      }
    );
  } catch (error) {
    logSafeApiError('Quran corpus build failed', error);
    return apiError('QURAN_CORPUS_UNAVAILABLE', 'Pencarian seluruh ayat belum dapat dimuat.', 500);
  }
}
