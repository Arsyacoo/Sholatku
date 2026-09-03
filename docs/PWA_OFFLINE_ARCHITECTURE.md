# PWA dan Arsitektur Offline Sholatku

Dokumen ini mencatat perilaku offline Sholatku tanpa mengubah alur bisnis yang sudah ada. API jadwal sholat tetap mencoba endpoint internal, lalu AlAdhan, kemudian fallback perhitungan solar lokal seperti sebelumnya.

Untuk lokasi lintang tinggi, kalkulasi lokal menggunakan kebijakan eksplisit *one-seventh* ketika waktu twilight tidak tersedia. Jika matahari tidak terbit/terbenam atau input tidak valid, kalkulator mengembalikan error terstruktur agar UI dapat menampilkan status tidak tersedia; aplikasi tidak mengarang waktu `00:00`.

## Service worker

`app/sw.ts` dibundel Serwist menjadi `public/sw.js` pada `npm run build`. Integrasi dinonaktifkan saat development agar hot reload tidak berkompetisi dengan worker produksi. Worker tidak memanggil `skipWaiting()` otomatis. Saat ada versi baru, pengguna mendapat prompt; reload hanya dilakukan setelah pengguna menekan **Perbarui**.

Strategi runtime yang digunakan:

- Asset build `/_next/static` dan gambar Next memakai Cache First dengan batas entri dan usia.
- Navigasi dokumen memakai Network First (timeout singkat), kemudian cache halaman, lalu `/~offline` jika tidak ada respons.
- GET `/api/*` memakai Network First dengan cache 24 jam dan hanya menyimpan respons HTTP 200.
- Font tertentu boleh di-cache terbatas. Audio tidak diprecache dan tidak memiliki aturan cache agresif.

Halaman `/~offline` memberi tautan ke beranda dan katalog Al-Qur'an. Surat yang sudah pernah dibaca tetap dapat dirender dari IndexedDB walaupun halaman jaringan gagal.

## IndexedDB Quran

Database bernama `sholatku`, versi schema `1`, dengan object store `surahs` dan key `surahNumber`. Nilai yang disimpan memiliki bentuk:

```ts
{
  surahNumber: number,
  data: SurahDetail,
  cachedAt: number,
  schemaVersion: 1
}
```

`lib/storage/quran-db.ts` menyediakan save/read/update (put), delete, enumerate, clear, serta validasi data. Semua operasi bersifat best-effort: kegagalan IndexedDB, mode private browsing, atau quota tidak boleh membuat reader crash.

## Migrasi localStorage

Reader memanggil migrasi secara lazy dan idempotent untuk key lama `sholatku_cached_surah_<number>`. Data JSON divalidasi sebelum ditulis. Key lama hanya dihapus setelah write IndexedDB dan read-back sukses. Jika JSON rusak, storage gagal, atau read-back tidak cocok, key dipertahankan. Key localStorage lain (pengaturan, bookmark, tema, dan sebagainya) tidak disentuh.

## Perilaku online/offline

`useOnlineStatus` mendengarkan event `online`/`offline` dan `ConnectionStatus` menampilkan banner non-blocking. Status online tidak memaksa reload. Ketika reader dibuka, cache dibaca async terlebih dahulu untuk render cepat; request jaringan berjalan sebagai pembaruan latar belakang. Guard unmount/race mencegah respons surat lama menimpa navigasi baru.

Kalender bulanan memiliki state `hydrating`, `loading`, `success`, `empty`, dan `error`. Perubahan lokasi, metode hisab, madhab, atau koreksi menit memulai permintaan baru; respons yang sudah tidak relevan dibatalkan/diabaikan. Saat provider gagal, kalkulasi lokal dicoba bila kondisi matahari memungkinkan, dan jika tidak tersedia pengguna mendapat tombol **Coba Lagi**.

Pengingat adzan bergantung pada dukungan Notification API dan service worker browser. Browser tidak menjamin notifikasi atau suara ketika tab/aplikasi benar-benar ditutup, sehingga ekspor kalender tetap disediakan sebagai jalur yang lebih konsisten.

## Verifikasi

```bash
npm test
npm run build
npx tsc --noEmit
npm run lint
npm run test:e2e
```

Setelah `npm run build && npm start`, buka DevTools Application untuk memastikan manifest, worker `/sw.js`, dan cache runtime muncul. Matikan jaringan, reload halaman yang pernah dibuka, lalu buka surat yang sudah tersimpan. Pastikan halaman baru yang belum pernah dikunjungi menampilkan `/~offline`, sedangkan audio tetap memerlukan jaringan dan tidak memenuhi cache secara otomatis.

## Batas implementasi offline

Implementasi ini tidak mengunduh audio secara otomatis, tidak menjamin push notification/background adhan ketika aplikasi ditutup, dan tidak menyediakan dashboard manajemen cache penuh, tracker/analytics, pencarian AI, autentikasi, sinkronisasi cloud, atau perubahan backend.
