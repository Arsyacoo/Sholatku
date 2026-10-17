# Sholatku v0.2.1 Preview 3

Android **Direct Preview / Beta** for testing. This is not a production or stable release.

## Release metadata

- Git tag: `v0.2.1-preview.3`
- GitHub Release title: `Sholatku v0.2.1 Preview 3`
- Release type: `GitHub Pre-release`
- Android `versionName`: `0.2.1`
- Android `versionCode`: `3`
- Build channel: `direct-preview`
- Backend: `https://sholatku-staging.vercel.app` (staging only)
- Signing: direct certificate SHA-256
  `35:CB:53:AE:36:FE:16:90:0E:77:FA:F8:5D:E0:F7:51:18:4C:0C:F4:75:A5:DA:63:98:34:78:09:09:3B:B9:B0`

## Yang baru

- **Lokasi otomatis (GPS) kini berfungsi di APK.** Izin lokasi sebelumnya tidak dideklarasikan sehingga tombol GPS
  ditolak diam-diam. Lokasi perkiraan sudah cukup, dan tidak ada izin lokasi latar belakang.
- **Panduan "Siapkan Sholatku"** saat pertama dibuka: lokasi, pengingat adzan, dan adzan tepat waktu, masing-masing
  satu ketukan.
- **Pemberitahuan pembaruan.** Mulai versi ini aplikasi memberi tahu bila ada rilis baru di GitHub dan menautkan APK-nya;
  Android memasangnya sebagai pembaruan tanpa menghapus data.
- **"Pengingat tidak muncul?"** di Pengaturan → Notifikasi, berisi langkah baterai untuk Samsung, Xiaomi, Oppo, Vivo, dan
  Realme serta tombol ke pengaturan aplikasi.
- Tanggal Hijriah di Beranda memakai ejaan yang sama dengan widget dan mode Ramadan (misalnya "Jumadil Awwal").

## Requirements

- Android 7.0 or newer
- Preview backend access through the documented staging service

## Installation and update

Download `sholatku-latest.apk` only from the explicit pre-release asset URL:

`https://github.com/Arsyacoo/Sholatku/releases/download/v0.2.1-preview.3/sholatku-latest.apk`

Do not use `releases/latest/download/` for this Preview / Beta release. Preview 1 and Preview 2 installs update in place:
this build uses the same direct signing certificate and a higher `versionCode`, so local data is kept. Users on 0.2.0 or
earlier download this build manually once; later releases are announced inside the app.

Android may ask you to allow Install unknown apps for the browser or file manager being used. Allow only that source and
disable it again after installation. Do not disable Play Protect or device security globally.

## Integrity

SHA-256: `436aff7ec030de11053000c5e44ff7891898a1da290c57adc60726ee2d70b313`

## Verification

- Built with `npm run build:mobile:direct` and `./gradlew :app:assembleDirect`; `apksigner` reports the direct
  certificate above, `zipalign -c -P 16 4` passes, and the manifest requests foreground location only.
- On an Android 16 (API 36) emulator, the published 0.2.0 build (`versionCode 2`) updated in place to this build
  (`versionCode 3`) with the original install time kept; the first-run guide appeared and the app launched without
  errors.
- Not yet tested on physical devices.

## Notes

This build uses `direct-preview` and `https://sholatku-staging.vercel.app`. It must not be treated as production. Without
the "Alarms & reminders" permission, reminders fall back to inexact delivery. Restrictive OEM battery managers can still
delay notifications. Qibla accuracy depends on device sensors and calibration.
