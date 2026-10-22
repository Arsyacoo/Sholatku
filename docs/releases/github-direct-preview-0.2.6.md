# Sholatku v0.2.6 Preview 8

Android **Direct Preview / Beta** for testing. This is not a production or stable release.

## Release metadata

- Git tag: `v0.2.6-preview.8`
- GitHub Release title: `Sholatku v0.2.6 Preview 8`
- Release type: `GitHub Pre-release`
- Android `versionName`: `0.2.6`
- Android `versionCode`: `8`
- Build channel: `direct-preview`
- Backend: `https://sholatku-staging.vercel.app` (staging only)
- Signing: direct certificate SHA-256
  `35:CB:53:AE:36:FE:16:90:0E:77:FA:F8:5D:E0:F7:51:18:4C:0C:F4:75:A5:DA:63:98:34:78:09:09:3B:B9:B0`

## Yang baru

- **English language / Bahasa Inggris.** Pilih *Bahasa Indonesia* atau *English* di Pengaturan → Bahasa. Instalasi baru
  mengikuti bahasa HP; pengguna lama tetap Bahasa Indonesia. Berlaku untuk semua layar, notifikasi pengingat, ekspor
  kalender, dan widget (nama sholat Fajr/Dhuhr/Asr/Maghrib/Isha, bulan Hijriah, "in 12:30").
- **Al-Qur'an dalam English.** Terjemahan ayat Saheeh International (via Tanzil.net, penggunaan non-komersial) dan arti
  nama surat dalam English, termasuk pencarian. Teks Arab, latin, dan audio tidak berubah. Salinan offline mengikuti
  bahasa saat diunduh.

## Requirements

- Android 7.0 or newer
- Preview backend access through the documented staging service

## Installation and update

Download `sholatku-latest.apk` only from the explicit pre-release asset URL:

`https://github.com/Arsyacoo/Sholatku/releases/download/v0.2.6-preview.8/sholatku-latest.apk`

Do not use `releases/latest/download/` for this Preview / Beta release. Earlier previews update in place: this build
uses the same direct signing certificate and a higher `versionCode`, so local data is kept. Users on 0.2.3 or later tap
"Perbarui ke 0.2.6" in the app (Pengaturan or the home-screen banner); the app downloads the APK and opens the Android
installer. Users on 0.2.2 or earlier download it once through the browser link.

Android may ask you to allow Install unknown apps for the browser or file manager being used. Allow only that source and
disable it again after installation. Do not disable Play Protect or device security globally.

## Integrity

SHA-256: `db3224440fe4ddd55355e8a6c15eeca68f883380f3db5424641e8fdbf9c252ba`

## Verification

- Built with `npm run build:mobile:direct` and `./gradlew :app:assembleDirect`; `apksigner` reports the direct
  certificate above and `zipalign -c -P 16 4` passes. The manifest requests foreground location only and, for this
  direct build, `REQUEST_INSTALL_PACKAGES`.
- On an Android 16 (API 36) emulator, the published 0.2.5 build (`versionCode 7`) updated in place to this build
  (`versionCode 8`) with the original install time kept.
- Switching Pengaturan → Bahasa between Indonesian and English changed the UI immediately; in English, Al-Fatihah showed
  the Saheeh International text with its attribution, and both widgets showed English prayer names, "in 16:29" and
  "11 Jumada al-Ula 1448 AH".
- Not yet tested on physical devices.

## Notes

This build uses `direct-preview` and `https://sholatku-staging.vercel.app`. It must not be treated as production. Without
the "Alarms & reminders" permission, reminders fall back to inexact delivery. Restrictive OEM battery managers can still
delay notifications. Qibla accuracy depends on device sensors and calibration.
