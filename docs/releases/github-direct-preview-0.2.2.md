# Sholatku v0.2.2 Preview 4

Android **Direct Preview / Beta** for testing. This is not a production or stable release.

## Release metadata

- Git tag: `v0.2.2-preview.4`
- GitHub Release title: `Sholatku v0.2.2 Preview 4`
- Release type: `GitHub Pre-release`
- Android `versionName`: `0.2.2`
- Android `versionCode`: `4`
- Build channel: `direct-preview`
- Backend: `https://sholatku-staging.vercel.app` (staging only)
- Signing: direct certificate SHA-256
  `35:CB:53:AE:36:FE:16:90:0E:77:FA:F8:5D:E0:F7:51:18:4C:0C:F4:75:A5:DA:63:98:34:78:09:09:3B:B9:B0`

## Yang baru

- **Cek pembaruan lebih jelas.** Tombol di Pengaturan kini menampilkan "Memeriksa..." lalu popup hasil: "Sudah versi
  terbaru", "Pembaruan tersedia" (dengan tombol Unduh), atau "Gagal memeriksa". Kartu versi juga menampilkan jam
  pengecekan terakhir.
- Mengetuk "Cek pembaruan" berulang kali dalam satu menit memakai hasil terakhir agar tidak melewati batas API GitHub.

## Requirements

- Android 7.0 or newer
- Preview backend access through the documented staging service

## Installation and update

Download `sholatku-latest.apk` only from the explicit pre-release asset URL:

`https://github.com/Arsyacoo/Sholatku/releases/download/v0.2.2-preview.4/sholatku-latest.apk`

Do not use `releases/latest/download/` for this Preview / Beta release. Earlier previews update in place: this build
uses the same direct signing certificate and a higher `versionCode`, so local data is kept. Users on 0.2.1 see this
release in Pengaturan → Cek pembaruan and in the home-screen banner.

Android may ask you to allow Install unknown apps for the browser or file manager being used. Allow only that source and
disable it again after installation. Do not disable Play Protect or device security globally.

## Integrity

SHA-256: `cafb9cd8af508b2c253639c3bba37f7011868be99ee2b9381215495427765157`

## Verification

- Built with `npm run build:mobile:direct` and `./gradlew :app:assembleDirect`; `apksigner` reports the direct
  certificate above, `zipalign -c -P 16 4` passes, and the manifest requests foreground location only.
- On an Android 16 (API 36) emulator, the 0.2.1 build (`versionCode 3`) updated in place to this build
  (`versionCode 4`) with the original install time kept; "Cek pembaruan" showed the loading state and then the
  "Sudah versi terbaru" dialog.
- Not yet tested on physical devices.

## Notes

This build uses `direct-preview` and `https://sholatku-staging.vercel.app`. It must not be treated as production. Without
the "Alarms & reminders" permission, reminders fall back to inexact delivery. Restrictive OEM battery managers can still
delay notifications. Qibla accuracy depends on device sensors and calibration.
