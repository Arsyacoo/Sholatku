# Android development

Sholatku Android memakai Capacitor dengan shell web statis lokal. APK memuat `dist-mobile`; ia bukan pembungkus situs Next.js yang di-host. Data Quran dan preferensi dapat memakai `localStorage` serta IndexedDB, sedangkan API dinamis diarahkan ke BFF HTTPS yang dikonfigurasi secara publik.

## Prasyarat

- Node.js dan npm sesuai `package.json`.
- Android Studio beserta Android SDK Platform 36 dan Build Tools yang sesuai.
- JDK 21 atau JDK bawaan Android Studio yang diekspos sebagai `JAVA_HOME` dan tersedia melalui `java` di `PATH`.

Konfigurasi Android saat ini menggunakan `compileSdk` 36, `targetSdk` 36, dan `minSdk` 24. Jangan menurunkan nilai tersebut secara manual.

## Menjalankan shell lokal

```powershell
npm install
npm run dev:mobile
```

Build produksi shell dilakukan dengan:

```powershell
npm run build:mobile
npm run verify:mobile-build
```

`dist-mobile/` adalah output yang dihasilkan dan tidak dikomit.

## Menyinkronkan Android

Setelah mengubah file dalam `mobile/`, logika bersama yang dipakai shell, atau `.env.mobile`, jalankan:

```powershell
npm run build:mobile
npx cap sync android
npx cap open android
```

Android Studio dapat dipakai untuk menjalankan aplikasi pada emulator atau perangkat. Untuk build Gradle dari terminal Windows:

```powershell
Set-Location android
.\gradlew.bat assembleDebug
```

## Batas runtime dan API

- `capacitor.config.ts` memakai `webDir: 'dist-mobile'` dan sengaja tidak memiliki `server.url`.
- `NEXT_PUBLIC_MOBILE_API_BASE_URL` di `.env.mobile` menunjuk ke BFF staging. Nilai ini adalah URL publik, bukan tempat untuk secret.
- Semua caller API same-origin melalui `resolveApiUrl()`: web tetap memakai path relatif, sedangkan runtime Android memakai BFF HTTPS tersebut.
- API Next menerima origin default Capacitor Android `https://localhost` melalui middleware CORS terbatas. Setelah perubahan API dipush dan dideploy, staging harus menyajikan header ini; jangan menggantinya dengan remote `server.url` atau plugin HTTP native di Sprint 01.
- PWA/Serwist hanya aktif pada runtime web. Android tidak mendaftarkan service worker.

## Pemeriksaan sebelum mengirim perubahan

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
npm run test:e2e:mobile
npx cap sync android
```

`npm run test:e2e:mobile` menguji static shell melalui Chromium. Itu membuktikan perilaku browser shell, bukan pengganti uji APK debug di emulator/perangkat Android.
