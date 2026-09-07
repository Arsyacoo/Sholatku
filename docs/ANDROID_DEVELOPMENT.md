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
