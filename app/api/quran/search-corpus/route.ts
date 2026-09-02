import { NextResponse } from 'next/server';
import { SURAH_LIST } from '@/lib/quran/surah-list';
import { normalizeArabicText, normalizeSearchText } from '@/lib/quran/search/normalize';
import type { QuranSearchRecord } from '@/lib/quran/search/types';
import { fetchWithTimeout, NETWORK_TIMEOUTS, readJsonResponse } from '@/lib/network/fetch';

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
  const result = await getCorpusBuild();
  return NextResponse.json(
    {
      code: result.failedSurahs.length === 0 ? 200 : 206,
      message: result.failedSurahs.length === 0 ? 'OK' : 'Pencarian sebagian tersedia',
      data: {
        records: result.records,
        indexedSurahs: result.indexedSurahs,
        totalSurahs: SURAH_LIST.length,
        isComplete: result.failedSurahs.length === 0 && result.indexedSurahs === SURAH_LIST.length,
        failedSurahs: result.failedSurahs,
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
