# Android development

Sholatku Android uses the same product language as the web app, but runs as a local bundled Capacitor shell.

Current architecture:

- Capacitor 8
- local Vite mobile shell in `mobile/`
- shared Sholatku domain logic in `app/`, `components/`, `hooks/`, and `lib/`
- hosted Next.js BFF for runtime API calls

The Android app must keep booting from `dist-mobile/`. Do not add a permanent `server.url`.

## Sprint 02 scope

Sprint 02 replaces the proof shell with the real Sholatku experience while keeping the same app identity and shared design system.

Primary mobile routes:

- `/`
- `/quran`
- `/quran/:id`
- `/quran/offline`
- `/monthly`
- `/qibla`
- `/settings`
- `/ramadan`
- `/~offline`

The mobile router lives in `mobile/src/router.tsx` and `mobile/src/MobileRoutes.tsx`.
It reuses the real Next.js page modules through thin adapters instead of cloning page logic into `mobile/`.

## Reused web modules

Directly reused:

- `app/page.tsx`
- `app/quran/page.tsx`
- `app/quran/[id]/page.tsx`
- `app/monthly/page.tsx`
- `app/qibla/page.tsx`
- `app/settings/page.tsx`
- `app/ramadan/page.tsx`
- prayer, Quran, Ramadan, location, theme, and storage hooks in `hooks/` and `lib/`

Android-specific adapters:

- `mobile/src/adapters/next-link.tsx`
- `mobile/src/adapters/next-navigation.ts`
- `mobile/src/adapters/noop-footer.tsx`
- `lib/platform/back.ts`
- `lib/platform/lifecycle.ts`
- `lib/platform/navigation.ts`

## Navigation shell

The mobile shell uses bottom navigation for the main areas:

- Hari Ini
- Al-Qur'an
- Bulanan
- Kiblat
- Setelan

The bottom nav is fixed to the bottom edge, respects the safe area, and uses the same icon language as the web UI.

## Home / Hari Ini

The home route reuses the full web prayer experience:

- location and timezone
- current date and Hijri date
- next prayer hero
- countdown
- today's prayer schedule
- Ramadan contextual card when active

Prayer data still follows the existing fallback chain:

- local BFF/provider
- provider fallback
- local solar calculation

## Quran

The Quran route reuses the real reader and list experience:

- surah list
- juz
- favorites
- bookmarks
- last read
- search
- offline indicators
- surah reader route with deep links and ayah highlight

The mobile shell keeps the real reader page and lets the existing HTMLAudioElement-based behavior continue on supported platforms.
Sprint 02 does not add a native background audio service.

## Monthly, qibla, settings, Ramadan

These routes are the same Sholatku features used on web:

- monthly prayer schedule uses the real monthly fallback logic
- qibla uses the existing bearing and location logic
- settings uses the real persisted preferences
- Ramadan uses the existing Ramadan calendar and imsakiyah logic

## Back behavior

Back handling is centralized in `lib/platform/back.ts` and wired through the Capacitor `backButton` listener in `mobile/src/MobileShell.tsx`.

Priority order:

1. close open Select/listbox
2. close Modal/dialog
3. close transient overlays
4. navigate browser history back
5. exit the app only at root

Do not add separate back handlers inside individual pages unless they register through the shared stack.

## Lifecycle

`lib/platform/lifecycle.ts` centralizes app lifecycle handling through `@capacitor/app`.

It listens for:

- app resume
- app pause
- hardware back

On resume it emits a web focus pulse so existing hooks can refresh without platform-specific code scattered through the app.

## Safe area and system bars

Safe area handling is CSS-based and centralized in `app/globals.css`:

- `--safe-area-top`
- `--safe-area-bottom`
- `--safe-area-left`
- `--safe-area-right`

Mobile body padding uses `env(safe-area-inset-*)` through those variables.
The bottom nav also uses safe-area padding.

Sprint 02 does not patch `node_modules`.
There is no custom native SystemBars plugin code in this repo.
If the emulator still logs the upstream Capacitor safe-area message, treat it as runtime evidence to capture at device QA time rather than suppressing it.

## Theme

Theme state is shared between web and Android:

- stored locally
- applied before first paint on mobile bootstrap when possible
- mirrored into `document.documentElement.style.colorScheme`

The Android shell does not introduce a separate palette.

## API resolution

Web stays same-origin through `resolveApiUrl()`.
Android resolves API calls to the public staging BFF from `.env.mobile`:

- `https://sholatku-staging.vercel.app`

Do not hardcode that origin into UI components.

## Service worker and PWA

Web PWA/Serwist remains web-only.
Android does not register a service worker.

## Build and QA commands

```powershell
npm run build:mobile
npm run verify:mobile-build
npx cap sync android
Set-Location android
.\gradlew.bat assembleDebug
```

Use the mobile Playwright suite for route parity checks:

```powershell
npm run test:e2e:mobile
```

## Known limitations

- Sprint 02 does not add notifications or alarm scheduling.
- Sprint 02 does not request notification permissions.
- Sprint 02 does not add `AlarmManager`, `WorkManager`, or exact-alarm permissions.
- Qibla sensor behavior can still depend on WebView/device support.
- Any residual upstream safe-area warning should be validated with emulator logcat before treating it as a local regression.

## Sprint 04 reminder recovery

Android reminder recovery uses the existing Capacitor Local Notifications v8 storage. Sholatku does not patch the plugin or duplicate prayer-time calculation in native code.

The upstream `LocalNotificationRestoreReceiver` is deliberately removed from the merged app manifest. In version `8.3.1`, that receiver moves a past one-shot notification to roughly fifteen seconds in the future after boot. That behavior is inappropriate for prayer reminders because it can replay a missed prayer after the phone is turned on.

`SholatkuReminderRecoveryReceiver` is the only reboot/package recovery path. It restores a saved notification only when all of the following are true:

- `extra.owner` is `sholatku-prayer-reminders` and `extra.schemaVersion` is `1`.
- The notification belongs to the Sholatku reminder source.
- It is a one-shot notification with a future `schedule.at`.

Expired, malformed, cancelled, repeating, and unrelated records are ignored or removed without preventing other valid records from being processed. Restored records get `isExactNotification` set to whether exact alarms are currently allowed before they are handed back to the version-pinned Capacitor scheduler.

The receiver handles `BOOT_COMPLETED` and `MY_PACKAGE_REPLACED`. It is not direct-boot aware: `LOCKED_BOOT_COMPLETED` is a safe no-op because Capacitor notification storage is credential-protected. `RECEIVE_BOOT_COMPLETED` exists solely for this recovery receiver.

For `TIME_SET` and `TIMEZONE_CHANGED`, the receiver marks the reminder schedule dirty and cancels only Sholatku-owned pending alarms. It never launches the UI or reimplements prayer calculations. On the next app launch/resume, the existing JS reminder reconciliation calculates the normal 48-hour horizon from saved preferences, then clears the dirty flag only after it succeeds. The native fingerprint stores only IANA timezone ID, offset minutes, and local day key.

## Exact prayer reminders

Inexact alarms delivered prayer reminders two to five minutes late in Doze, so reminders now use exact alarms when the
user allows them:

- The manifest declares `SCHEDULE_EXACT_ALARM` (granted under Settings → Apps → Special access → Alarms & reminders;
  denied by default for new installs on Android 14+, always allowed below Android 12).
- `scheduleNativeNotifications` sets `isExactNotification` only when `checkExactNotificationSetting` reports `granted`.
  Sending `true` without the permission makes the plugin open the system settings screen, which must never happen
  during a background sync.
- Settings → Notifikasi shows the state and an "Izinkan Alarm & pengingat" button (`changeExactNotificationSetting`),
  then reschedules pending reminders.
- Without the permission, reminders fall back to the earlier inexact `setAndAllowWhileIdle` behavior described below.

API 36 Doze QA showed a normal inexact alarm remained deferred after roughly one minute of deep idle. Therefore Sholatku sends its bounded 48-hour prayer/Ramadan requests with `allowWhileIdle: true`. Capacitor v8 uses `setAndAllowWhileIdle` when exact access is unavailable because every Sholatku request sets `isExactNotification = false`. Android idle quotas can still defer or coalesce delivery; this is not an exact-delivery guarantee. Android force-stop suppresses broadcasts and alarms until the user launches the app again, and restrictive OEM power managers may delay inexact alarms. Sholatku does not request battery optimization exemptions or OEM autostart whitelisting.

The final permission policy is:

- `INTERNET`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM` (user-granted), foreground `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION` (the GPS button; Capacitor's WebView requests both, and Android 12+ users may pick approximate), and plugin-provided `WAKE_LOCK` are expected.
- `USE_EXACT_ALARM`, foreground-service, battery-optimization, and background-location permissions remain excluded.

## Home-screen widgets

Three widget sizes share one data source: `Sholat Berikutnya` (2x1), `Menuju Sholat` (4x1), and
`Jadwal Sholat Hari Ini` (4x2).

- JS stays the only place that calculates prayer times. `NativeReminderBridge` calls `syncPrayerWidget`, which sends seven
  days of prayer instants (epoch millis), display times, city, and Hijri labels to the `SholatkuWidget` plugin.
- Native code stores that payload in `SharedPreferences`, picks the next prayer, shows a live `Chronometer` countdown, and
  schedules an inexact `setAndAllowWhileIdle` alarm to move to the following prayer. The roll-over can lag a few minutes
  in Doze; no exact-alarm permission is used.
- When the stored week runs out, widgets show "Buka Sholatku untuk memperbarui jadwal" instead of stale times.
- The pure selection logic is covered by `PrayerWidgetScheduleTest` (`./gradlew :app:testDebugUnitTest`).
- Launchers ignore `android:fontFamily="@font/..."` inside RemoteViews. Prayer names are therefore drawn into bitmaps in
  Plus Jakarta Sans by `WidgetTextRenderer`; the live countdown stays a `Chronometer` in the system `sans-serif-light`
  face with tabular figures.
- The 4x1 and 4x2 sizes show the day as a timeline (`widget_prayer_timeline.xml`): five dots on one line built from
  plain RemoteViews, so it stays crisp at any widget width. Passed prayers are filled, the next prayer is a gold ring,
  upcoming ones are hollow, and the line is lit up to the next prayer (`PrayerWidgetSchedule.dotState`).
