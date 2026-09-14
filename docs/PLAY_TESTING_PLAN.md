# Google Play Testing Plan

Status: preparation only. No Play Console track was created or modified.

## Current evidence

- The named candidate command is `npm run build:mobile:internal`; it intentionally packages the documented staging BFF.
- Android debug APK installed and launched on BrowserStack App Live Google Pixel 6 / Android 12.
- The cloud session expired before the full matrix completed, so Sprint 05 remains partial cloud real-device QA.
- Emulator/API 36 and web/mobile automated checks are strong regression evidence but are not a substitute for a real
  device matrix.

## Manual matrix before production access

- Install and launch on a physical Android phone and one cloud real device.
- Home, Quran detail/audio, offline Quran, Monthly, Qibla calibration, Settings, privacy route, and Android Back.
- Notification permission, local delivery, next-day scheduling, timezone change, app update, lock screen, and background.
- Airplane mode/offline cache and recovery after network returns.
- Small portrait, large portrait, landscape rotation, font scaling, dark mode, and TalkBack smoke checks.
- Confirm no stale reminder is replayed after reboot; exact alarm permission and battery-exemption behavior remain absent.

## Track selection gate

Start with internal testing when the developer is ready for artifact handling. If a personal developer account created after
13 November 2023 is used, verify whether the current Google Play rule requires a closed test with at least 12 opted-in
testers for 14 continuous days before production access can be requested. Confirm the account type/date manually.
