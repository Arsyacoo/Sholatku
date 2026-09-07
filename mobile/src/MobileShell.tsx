import { openDB } from 'idb';
import { BookOpen, Database, Search, ShieldCheck, Wifi } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { resolveApiUrl } from '@/lib/platform/api';
import { getAppRuntime } from '@/lib/platform/runtime';
import { searchSurahs, SURAH_LIST } from '@/lib/quran/surah-list';

const MOBILE_STORAGE_KEY = 'sholatku-mobile-shell-ready';
const MOBILE_DATABASE = 'sholatku-mobile-shell';
const MOBILE_STORE = 'runtime';

interface QuranSearchRecord {
  id: string;
  surahNumber: number;
  surahName: string;
  surahNameArabic: string;
  ayahNumber: number;
  translation: string;
}

interface QuranSearchPayload {
  data?: { records?: QuranSearchRecord[] };
}

async function initializeLocalStorage(): Promise<void> {
  localStorage.setItem(MOBILE_STORAGE_KEY, new Date().toISOString());
  const database = await openDB(MOBILE_DATABASE, 1, {
    upgrade(db) {
      db.createObjectStore(MOBILE_STORE);
    },
  });
  await database.put(MOBILE_STORE, { initializedAt: Date.now() }, 'status');
  database.close();
}

export function MobileShell() {
  const [query, setQuery] = useState('sabar');
  const [isLocalReady, setIsLocalReady] = useState(false);
  const [onlineResults, setOnlineResults] = useState<QuranSearchRecord[]>([]);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const offlineMatches = useMemo(() => {
    const matches = searchSurahs(query);
    return (matches.length ? matches : SURAH_LIST).slice(0, 4);
  }, [query]);
  const runtime = getAppRuntime();

  useEffect(() => {
    void initializeLocalStorage()
      .then(() => setIsLocalReady(true))
      .catch(() => setIsLocalReady(false));
  }, []);

  const searchOnline = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setSearchStatus('loading');
    try {
      const params = new URLSearchParams({ q: trimmedQuery, limit: '5' });
      const response = await fetch(resolveApiUrl(`/api/quran/search?${params.toString()}`), {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('Pencarian Quran tidak tersedia.');
      const payload = (await response.json()) as QuranSearchPayload;
      setOnlineResults(payload.data?.records ?? []);
      setSearchStatus('success');
    } catch {
      setOnlineResults([]);
      setSearchStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-safe text-slate-900">
      <header className="border-b border-teal-100 bg-white px-5 py-4 shadow-sm">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/20">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-serif text-xl font-bold">Sholatku</p>
            <p className="text-xs text-slate-500">Shell Android lokal</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl space-y-5 px-5 py-6">
        <section className="rounded-3xl bg-primary-800 p-6 text-white shadow-xl shadow-primary-900/15">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-100">Al-Qur&apos;an digital</p>
          <h1 className="mt-2 font-serif text-3xl font-bold">Baca dan cari Al-Qur&apos;an</h1>
          <p className="mt-3 text-sm leading-6 text-teal-50">
            Katalog surat tersedia dari bundle aplikasi. Pencarian ayat menggunakan BFF Sholatku yang terkonfigurasi.
          </p>
        </section>

        <section aria-label="Status aplikasi lokal" className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <Database className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">Penyimpanan lokal</p>
            <p className="mt-1 text-xs text-slate-500" data-testid="local-storage-status">
              {isLocalReady ? 'localStorage dan IndexedDB siap' : 'Menyiapkan penyimpanan…'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <ShieldCheck className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">Runtime</p>
            <p className="mt-1 text-xs text-slate-500" data-testid="runtime-status">
              {runtime === 'android' ? 'Android Capacitor' : 'Browser preview'}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <h2 className="font-serif text-xl font-bold">Cari Al-Qur&apos;an</h2>
          </div>
          <form className="mt-4 flex gap-2" onSubmit={searchOnline}>
            <label className="sr-only" htmlFor="quran-search">Kata kunci Quran</label>
            <input
              id="quran-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Misalnya: sabar"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-primary-500 transition focus:ring-2"
            />
            <button className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60" disabled={searchStatus === 'loading'}>
              {searchStatus === 'loading' ? 'Mencari…' : 'Cari'}
            </button>
          </form>

          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Surat dari bundle</p>
            <ul className="mt-2 space-y-2" aria-label="Hasil surat lokal">
              {offlineMatches.map((surah) => (
                <li key={surah.number} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span><span className="font-semibold">{surah.number}. {surah.name}</span> <span className="text-slate-500">· {surah.translation}</span></span>
                  <span dir="rtl" className="font-arabic text-base text-primary-800">{surah.arabicName}</span>
                </li>
              ))}
            </ul>
          </div>

          {searchStatus === 'success' && (
            <div className="mt-5" data-testid="online-results">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Hasil ayat dari BFF</p>
              <ul className="mt-2 space-y-2">
                {onlineResults.length ? onlineResults.map((record) => (
                  <li key={record.id} className="rounded-xl border border-teal-100 bg-teal-50/60 p-3 text-sm">
                    <p className="font-semibold">{record.surahName} · Ayat {record.ayahNumber}</p>
                    <p className="mt-1 text-slate-600">{record.translation}</p>
                  </li>
                )) : <li className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Tidak ada hasil ayat.</li>}
              </ul>
            </div>
          )}
          {searchStatus === 'error' && <p role="alert" className="mt-4 text-sm text-red-700">Pencarian online belum tersedia. Katalog surat lokal tetap dapat digunakan.</p>}
        </section>

        <p className="flex items-center gap-2 px-1 text-xs leading-5 text-slate-500">
          <Wifi className="h-4 w-4 shrink-0" aria-hidden="true" />
          Tidak ada service worker atau wrapper situs remote dalam shell Android ini.
        </p>
      </div>
    </main>
  );
}
