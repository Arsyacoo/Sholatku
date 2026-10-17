# Sholatku v0.2.3 Preview 5

Android **Direct Preview / Beta** for testing. This is not a production or stable release.

## Release metadata

- Git tag: `v0.2.3-preview.5`
- GitHub Release title: `Sholatku v0.2.3 Preview 5`
- Release type: `GitHub Pre-release`
- Android `versionName`: `0.2.3`
- Android `versionCode`: `5`
- Build channel: `direct-preview`
- Backend: `https://sholatku-staging.vercel.app` (staging only)
- Signing: direct certificate SHA-256
  `35:CB:53:AE:36:FE:16:90:0E:77:FA:F8:5D:E0:F7:51:18:4C:0C:F4:75:A5:DA:63:98:34:78:09:09:3B:B9:B0`

## Yang baru

- **Pembaruan langsung dari aplikasi.** Tombol "Perbarui ke X" kini mengunduh APK di dalam Sholatku lalu membuka layar
  Update Android. Tidak lagi lewat Chrome, yang kadang membuat unduhan macet di 100%.
- Pertama kali, Android meminta izin "Izinkan dari sumber ini" untuk Sholatku. Aktifkan, kembali ke aplikasi, lalu
  ketuk tombolnya lagi. Bila unduhan gagal, tersedia tautan "unduh lewat browser".
- Aplikasi hanya memasang APK rilis resmi dari GitHub Sholatku dengan versi yang lebih baru; Android tetap memeriksa
  tanda tangan yang sama dan meminta konfirmasi.

## Requirements

- Android 7.0 or newer
- Preview backend access through the documented staging service

## Installation and update

Download `sholatku-latest.apk` only from the explicit pre-release asset URL:

`https://github.com/Arsyacoo/Sholatku/releases/download/v0.2.3-preview.5/sholatku-latest.apk`

Do not use `releases/latest/download/` for this Preview / Beta release. Earlier previews update in place: this build
uses the same direct signing certificate and a higher `versionCode`, so local data is kept. Users on 0.2.1 or 0.2.2 see
this release in Pengaturan → Cek pembaruan and in the home-screen banner, then download it once through the browser
link; from 0.2.3 onward updates install from inside the app.

Android may ask you to allow Install unknown apps for the browser or file manager being used. Allow only that source and
disable it again after installation. Do not disable Play Protect or device security globally.

## Integrity

SHA-256: `6f64fcf9ebf9122073862e9e1cbebf93d758caccc11677109452a535c1353ab1`

## Verification

- Built with `npm run build:mobile:direct` and `./gradlew :app:assembleDirect`; `apksigner` reports the direct
  certificate above and `zipalign -c -P 16 4` passes. The manifest requests foreground location only and, for this
  direct build, `REQUEST_INSTALL_PACKAGES`.
- On an Android 16 (API 36) emulator, the 0.2.2 build (`versionCode 4`) updated in place to this build
  (`versionCode 5`) with the original install time kept, and Settings showed 0.2.3 as current.
- The in-app flow (permission screen, Back to the app, download, system "update this app?" dialog, install) was tested
  on the same emulator with a test build against the published `v0.2.2-preview.4` asset.
- Not yet tested on physical devices.

## Notes

This build uses `direct-preview` and `https://sholatku-staging.vercel.app`. It must not be treated as production. Without
the "Alarms & reminders" permission, reminders fall back to inexact delivery. Restrictive OEM battery managers can still
delay notifications. Qibla accuracy depends on device sensors and calibration.
