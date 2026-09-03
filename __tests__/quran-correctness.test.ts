import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getSurahDetail } from '@/app/api/quran/surah/[id]/route';
import { getJuzForAyah } from '@/lib/quran/juz-list';
import { getGlobalAyahNumber, SURAH_LIST } from '@/lib/quran/surah-list';

function providerResponse(ayahs: unknown[], extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({
    code: 200,
    data: { ayat: ayahs, audioFull: {}, ...extra },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function ayah(number: number, overrides: Record<string, unknown> = {}) {
  return {
    nomorAyat: number,
    teksArab: `arab ${number}`,
    teksLatin: `latin ${number}`,
    teksIndonesia: `terjemahan ${number}`,
    audio: {},
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Quran content correctness', () => {
  it.each([
    [1, 1, 1],
    [2, 142, 2],
    [8, 41, 10],
    [27, 56, 20],
    [78, 1, 30],
  ])('maps %s:%s to canonical Juz %s', (surah, ayahNumber, expectedJuz) => {
    expect(getJuzForAyah(surah, ayahNumber)).toBe(expectedJuz);
  });

  it('returns null for malformed Juz references instead of fabricating a value', () => {
    expect(getJuzForAyah(0, 1)).toBeNull();
    expect(getJuzForAyah(2, 0)).toBeNull();
    expect(getJuzForAyah(999, 1)).toBeNull();
  });

  it('normalizes provider ayahs with canonical Juz and Quran numbers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      providerResponse(
        Array.from({ length: 7 }, (_, index) => ayah(index + 1, { juz: 99, tafsir: 'not verified' }))
      )
    ));

    const response = await getSurahDetail(new NextRequest('http://localhost/api/quran/surah/1'), {
      params: Promise.resolve({ id: '1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.ayahs[0]).toMatchObject({
      numberInQuran: getGlobalAyahNumber(1, 1),
      juz: getJuzForAyah(1, 1),
      tafsir: null,
    });
    expect(body.data.ayahs[0]).not.toHaveProperty('tafsir.text');
  });

  it('does not fabricate a Tafsir when the provider has no verified Tafsir field', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      providerResponse(Array.from({ length: 7 }, (_, index) => ayah(index + 1)))
    ));

    const response = await getSurahDetail(new NextRequest('http://localhost/api/quran/surah/1'), {
      params: Promise.resolve({ id: '1' }),
    });
    const body = await response.json();

    expect(body.data.ayahs.every((item: { tafsir: unknown }) => item.tafsir === null)).toBe(true);
    expect(JSON.stringify(body)).not.toContain('Keterangan ayat');
  });

  it('rejects incomplete provider content instead of filling missing Ayahs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(providerResponse([ayah(1)])));

    const response = await getSurahDetail(new NextRequest('http://localhost/api/quran/surah/1'), {
      params: Promise.resolve({ id: '1' }),
    });

    expect(response.status).toBe(502);
  });

  it('keeps canonical metadata independent from downloaded Reader content', () => {
    expect(SURAH_LIST).toHaveLength(114);
    expect(getJuzForAyah(114, 6)).toBe(30);
  });
});
