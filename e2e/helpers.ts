import { expect, type Page } from '@playwright/test';

const dailyPrayerResponse = {
  code: 200,
  data: {
    timings: {
      Fajr: '04:35', Sunrise: '05:53', Dhuhr: '11:53', Asr: '15:10', Maghrib: '17:53', Isha: '19:02', Imsak: '04:25',
    },
    date: {
      gregorian: { date: '03-09-2026' },
      hijri: { day: '21', month: { en: 'Safar', ar: 'صفر' }, year: '1448' },
    },
    meta: { timezone: 'Asia/Jakarta', offset: 7, latitude: -6.1754, longitude: 106.8272, method: { name: 'Kemenag RI' } },
  },
};

function monthlyPrayerResponse() {
  return {
    code: 200,
    data: Array.from({ length: 31 }, (_, index) => ({
      timings: dailyPrayerResponse.data.timings,
      date: {
        gregorian: { date: `${String(index + 1).padStart(2, '0')}-09-2026` },
        hijri: { day: String(index + 1), month: { en: 'Safar', ar: 'صفر' }, year: '1448' },
      },
      meta: dailyPrayerResponse.data.meta,
    })),
  };
}

function quranDetailResponse() {
  const ayahs = Array.from({ length: 286 }, (_, index) => ({
    numberInSurah: index + 1,
    numberInQuran: 7 + index,
    arabText: `آية البقرة ${index + 1}`,
    latinText: `ayat al baqarah ${index + 1}`,
    translation: `Terjemahan Al-Baqarah ayat ${index + 1}`,
    tafsir: null,
    juz: index < 142 ? 1 : index < 253 ? 2 : 3,
    audio: { '01': `https://example.test/audio/${index + 1}.mp3` },
  }));
  return {
    code: 200,
    message: 'OK',
    data: {
      number: 2,
      name: 'Al-Baqarah',
      arabicName: 'البقرة',
      translation: 'Sapi Betina',
      numberOfAyahs: 286,
      revelation: 'Madaniyah',
      description: 'Surah fixture untuk pengujian browser.',
      audioFull: 'https://example.test/audio-full.mp3',
      ayahs,
    },
  };
}

function quranSearchResponse() {
  return {
    code: 200,
    message: 'OK',
    data: {
      records: [
        {
          id: '2:153',
          surahNumber: 2,
          surahName: 'Al-Baqarah',
          surahNameArabic: 'البقرة',
          ayahNumber: 153,
          arabic: '',
          arabicNormalized: '',
          translation: 'Jadikanlah sabar dan shalat sebagai penolongmu.',
          translationNormalized: 'jadikanlah sabar dan shalat sebagai penolongmu.',
          indexedAt: 1,
          schemaVersion: 1,
        },
      ],
      totalMatches: 1,
      hasMore: false,
    },
  };
}

async function fulfillJson(route: Parameters<Parameters<Page['route']>[1]>[0], payload: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

export async function mockApplicationApis(page: Page): Promise<void> {
  await page.route('**/api/prayer-times/monthly**', (route) => fulfillJson(route, monthlyPrayerResponse()));
  await page.route('**/api/prayer-times**', (route) => fulfillJson(route, dailyPrayerResponse));
  await page.route('**/api/quran/surah/**', (route) => fulfillJson(route, quranDetailResponse()));
  await page.route('**/api/quran/search**', (route) => fulfillJson(route, quranSearchResponse()));
}

export function installConsoleGuards(page: Page): () => Promise<void> {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return async () => {
    expect(errors, errors.join('\n')).toEqual([]);
  };
}

export async function clearBrowserStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}
