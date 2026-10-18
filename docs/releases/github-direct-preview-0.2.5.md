# Sholatku v0.2.5 Preview 7

Android **Direct Preview / Beta** for testing. This is not a production or stable release.

## Release metadata

- Git tag: `v0.2.5-preview.7`
- GitHub Release title: `Sholatku v0.2.5 Preview 7`
- Release type: `GitHub Pre-release`
- Android `versionName`: `0.2.5`
- Android `versionCode`: `7`
- Build channel: `direct-preview`
- Backend: `https://sholatku-staging.vercel.app` (staging only)
- Signing: direct certificate SHA-256
  `35:CB:53:AE:36:FE:16:90:0E:77:FA:F8:5D:E0:F7:51:18:4C:0C:F4:75:A5:DA:63:98:34:78:09:09:3B:B9:B0`

## Yang baru

- **Masjid Terdekat.** Halaman baru (dari Kiblat) berisi masjid dan musala di sekitar lokasi Anda dari
  OpenStreetMap: jarak, arah, nama jalan, dan tombol Rute yang membuka Google Maps. Memerlukan internet.
- **Ihtiyat Kemenag +2 menit.** Jadwal kini mengikuti waktu kehati-hatian Kemenag: awal setiap waktu sholat 2 menit
  lebih lambat dan waktu terbit 2 menit lebih awal, sehingga lebih dekat dengan jadwal resmi dan masjid. Bisa diatur
  0-4 menit di Pengaturan. Bila sebelumnya Anda menambah +2 menit secara manual, kembalikan koreksi manual ke 0.
- **Widget 4x2** kini memakai gaya yang sama dengan 4x1: ikon per waktu sholat, jam dalam Plus Jakarta Sans, dan
  sorotan pada sholat berikutnya.

## Requirements

- Android 7.0 or newer
- Preview backend access through the documented staging service

## Installation and update

Download `sholatku-latest.apk` only from the explicit pre-release asset URL:

`https://github.com/Arsyacoo/Sholatku/releases/download/v0.2.5-preview.7/sholatku-latest.apk`

Do not use `releases/latest/download/` for this Preview / Beta release. Earlier previews update in place: this build
uses the same direct signing certificate and a higher `versionCode`, so local data is kept. Users on 0.2.3 or later tap
"Perbarui ke 0.2.5" in the app (Pengaturan or the home-screen banner); the app downloads the APK and opens the Android
installer. Users on 0.2.2 or earlier download it once through the browser link.

Android may ask you to allow Install unknown apps for the browser or file manager being used. Allow only that source and
disable it again after installation. Do not disable Play Protect or device security globally.

## Integrity

SHA-256: `4f2f8b7dc26021456aff120d4c2a31c26993058693addcccb2167c8f3ccd9101`

## Verification

- Built with `npm run build:mobile:direct` and `./gradlew :app:assembleDirect`; `apksigner` reports the direct
  certificate above and `zipalign -c -P 16 4` passes. The manifest requests foreground location only and, for this
  direct build, `REQUEST_INSTALL_PACKAGES`.
- On an Android 16 (API 36) emulator, the published 0.2.4 build (`versionCode 6`) updated in place to this build
  (`versionCode 7`) with the original install time kept.
- Masjid Terdekat listed places around Jakarta Pusat (nearest 640 m), Rute opened the Google Maps app, and with the
  network off the page showed its offline message.
- Home-screen times were AlAdhan's plus 2 minutes (Subuh 04:20 to 04:22, Terbit 05:30 to 05:28).
- Not yet tested on physical devices.

## Notes

This build uses `direct-preview` and `https://sholatku-staging.vercel.app`. It must not be treated as production. Without
the "Alarms & reminders" permission, reminders fall back to inexact delivery. Restrictive OEM battery managers can still
delay notifications. Qibla accuracy depends on device sensors and calibration.
