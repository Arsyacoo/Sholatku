# Sholatku v0.2.4 Preview 6

Android **Direct Preview / Beta** for testing. This is not a production or stable release.

## Release metadata

- Git tag: `v0.2.4-preview.6`
- GitHub Release title: `Sholatku v0.2.4 Preview 6`
- Release type: `GitHub Pre-release`
- Android `versionName`: `0.2.4`
- Android `versionCode`: `6`
- Build channel: `direct-preview`
- Backend: `https://sholatku-staging.vercel.app` (staging only)
- Signing: direct certificate SHA-256
  `35:CB:53:AE:36:FE:16:90:0E:77:FA:F8:5D:E0:F7:51:18:4C:0C:F4:75:A5:DA:63:98:34:78:09:09:3B:B9:B0`

## Yang baru

- **Widget 4x1 "Menuju Sholat" didesain ulang.** Kiri: sholat berikutnya dan hitung mundur ("dalam 01:12"). Kanan: lima
  waktu sholat, masing-masing dengan ikon (fajar, matahari, awan, senja, bulan), jam dalam font Plus Jakarta Sans, dan
  namanya. Sholat berikutnya disorot emas di dalam pill; yang lain diredupkan.
- Di widget 4x2, jam sholat yang sudah lewat kini juga diredupkan.

## Requirements

- Android 7.0 or newer
- Preview backend access through the documented staging service

## Installation and update

Download `sholatku-latest.apk` only from the explicit pre-release asset URL:

`https://github.com/Arsyacoo/Sholatku/releases/download/v0.2.4-preview.6/sholatku-latest.apk`

Do not use `releases/latest/download/` for this Preview / Beta release. Earlier previews update in place: this build
uses the same direct signing certificate and a higher `versionCode`, so local data is kept. Users on 0.2.3 tap
"Perbarui ke 0.2.4" in the app (Pengaturan or the home-screen banner); the app downloads the APK and opens the Android
installer. Users on 0.2.2 or earlier download it once through the browser link.

Android may ask you to allow Install unknown apps for the browser or file manager being used. Allow only that source and
disable it again after installation. Do not disable Play Protect or device security globally.

## Integrity

SHA-256: `fce51270d7b901d60d525090ee548840c44f951e0c2d422e37546ee2f5e54481`

## Verification

- Built with `npm run build:mobile:direct` and `./gradlew :app:assembleDirect`; `apksigner` reports the direct
  certificate above and `zipalign -c -P 16 4` passes. The manifest requests foreground location only and, for this
  direct build, `REQUEST_INSTALL_PACKAGES`.
- On an Android 16 (API 36) emulator, the published 0.2.3 build (`versionCode 5`) updated in place to this build
  (`versionCode 6`) with the original install time kept; the app launched and the 4x1 widget rendered the new layout.
- Not yet tested on physical devices.

## Notes

This build uses `direct-preview` and `https://sholatku-staging.vercel.app`. It must not be treated as production. Without
the "Alarms & reminders" permission, reminders fall back to inexact delivery. Restrictive OEM battery managers can still
delay notifications. Qibla accuracy depends on device sensors and calibration.
