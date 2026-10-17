# Sholatku v0.2.0 Preview 2

Android **Direct Preview / Beta** for testing. This is not a production or stable release.

## Release metadata

- Git tag: `v0.2.0-preview.2`
- GitHub Release title: `Sholatku v0.2.0 Preview 2`
- Release type: `GitHub Pre-release`
- Android `versionName`: `0.2.0`
- Android `versionCode`: `2`
- Build channel: `direct-preview`
- Backend: `https://sholatku-staging.vercel.app` (staging only)
- Signing: direct certificate SHA-256
  `35:CB:53:AE:36:FE:16:90:0E:77:FA:F8:5D:E0:F7:51:18:4C:0C:F4:75:A5:DA:63:98:34:78:09:09:3B:B9:B0`

## Yang baru

- **Widget layar utama** dalam tiga ukuran (2x1, 4x1, 4x2) dengan hitung mundur dan garis waktu lima sholat.
- **Adzan tepat waktu.** Pengingat memakai exact alarm setelah izin "Alarm & pengingat" diberikan
  (Pengaturan → Notifikasi). Sebelumnya pengingat bisa terlambat beberapa menit.
- **Suara adzan** opsional untuk pengingat yang tepat waktu.
- **Koreksi tanggal Hijriah ±1 hari** untuk mengikuti sidang isbat.
- Koreksi menit per waktu sholat kini juga berlaku saat offline.
- Nama bulan Hijriah tidak lagi tampil sebagai nama bulan Masehi di Android.
- Pencarian kota mengikuti kebijakan penggunaan Nominatim (pencarian online lewat tombol, atribusi OpenStreetMap).

## Requirements

- Android 7.0 or newer
- Preview backend access through the documented staging service

## Installation and update

Download `sholatku-latest.apk` only from the explicit pre-release asset URL:

`https://github.com/Arsyacoo/Sholatku/releases/download/v0.2.0-preview.2/sholatku-latest.apk`

Do not use `releases/latest/download/` for this Preview / Beta release. Preview 1 installs update in place: Preview 2
uses the same direct signing certificate and a higher `versionCode`, so local data is kept.

Android may ask you to allow Install unknown apps for the browser or file manager being used. Allow only that source and
disable it again after installation. Do not disable Play Protect or device security globally.

## Integrity

SHA-256: `d8864115203c702a529be2714039d30aeb6168f5f9e8e229fd3d51a184b03ec4`

## Verification

- Built with `npm run build:mobile:direct` and `./gradlew :app:assembleDirect`; `apksigner` reports the direct
  certificate above and `zipalign -c -P 16 4` passes.
- On an Android 16 (API 36) emulator, Preview 1 (`versionCode 1`) updated in place to this build (`versionCode 2`)
  with the original install time kept, and the app launched without errors.
- Not yet tested on physical devices.

## Notes

This build uses `direct-preview` and `https://sholatku-staging.vercel.app`. It must not be treated as production. Without
the "Alarms & reminders" permission, reminders fall back to inexact delivery. Restrictive OEM battery managers can still
delay notifications. Qibla accuracy depends on device sensors and calibration.
