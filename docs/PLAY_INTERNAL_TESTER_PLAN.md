# Internal Tester Plan

Status: planning only. No tester email addresses are stored in Git and no Play track was created automatically.

## Recommended first group

Use 3-10 trusted testers for the first smoke pass. This is a project recommendation, not a Google Play requirement.

Prefer device diversity without claiming coverage that has not happened:

- Pixel or stock-like Android.
- Samsung.
- Xiaomi, POCO, or Redmi if available.
- OPPO, realme, or vivo if available.
- One older Android device near `minSdk=24` when practical.
- Modern Android 15/16 device when available.

## Test focus

- Install and launch, then navigate Home, Quran, offline Quran, Monthly, Qibla, Settings, Privacy Policy, and Ramadan.
- Verify manual city selection, optional location detection, network failure fallback, and offline cache behavior.
- Verify notification permission, local delivery, next-day reminders, timezone changes, lock screen, background, and app
  update behavior.
- Verify Qibla sensor calibration, dark mode, font scaling, landscape, TalkBack smoke behavior, and Android Back.
- Record OEM power-management behavior without requesting battery optimization exemptions.

## Feedback template

```text
Device:
Android version:
App version:
versionCode:
Screen:
Action:
Expected:
Actual:
Screenshot:
Reproducible:
Notification permission state:
Battery saver state if relevant:
```

Do not request passwords, account credentials, exact personal location, or other unnecessary personal information in
feedback. Testers should report only the location scenario needed to reproduce a scheduling issue.
