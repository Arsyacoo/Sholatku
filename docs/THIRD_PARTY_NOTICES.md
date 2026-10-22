# Third-Party Notices and License Audit

Status: inventory for release preparation. Exact license texts and provider attribution must be rechecked before public
distribution.

## Runtime and build dependencies

- Capacitor Android, App, and Local Notifications plugins.
- React, React DOM, Next.js, Vite, TypeScript, Tailwind CSS, Lucide React, and `idb`.
- AndroidX AppCompat, CoordinatorLayout, Core SplashScreen, and Android Gradle Plugin transitive dependencies.

The exact versions are recorded in `package-lock.json`, `package.json`, Gradle files, and the Gradle dependency graph.
Generate a final dependency/license report from the locked install before uploading any signed artifact. Do not add a
license checker or mass-upgrade dependencies as part of this sprint.

## Network providers

- AlAdhan prayer timing API, used by the BFF and current client fallback.
- Nominatim OpenStreetMap, used for uncached search/reverse geocoding.
- Quran data/search/audio providers used by the BFF and returned audio URLs.
- English Quran translation: Saheeh International, from the Tanzil project (https://tanzil.net/trans/) via the
  AlQuran.cloud API (edition `en.sahih`). Tanzil's terms allow these translations for non-commercial purposes only and
  require the translator's or publisher's permission otherwise. Sholatku is free with no ads or payments; adding either
  requires permission from Saheeh International (Al-Muntada Al-Islami) or switching to a public-domain translation such
  as Pickthall (`en.pickthall`). The reader credits "Saheeh International · Text via Tanzil.net".

Provider terms, attribution requirements, rate limits, and production endpoint contracts must be verified by the developer.
The app must not imply that a provider endorses Sholatku.

## Bundled media

- `android/app/src/main/res/raw/adhan.ogg`: "Adhan.ogg" by Aishatu98, from Wikimedia Commons
  (https://commons.wikimedia.org/wiki/File:Adhan.ogg), released under CC0 1.0 (public domain dedication).
  Unmodified; SHA-1 `b86432f1581e11f898de1dc3402af0d541af110e`. Used as the optional Android adhan reminder sound.
- `android/app/src/main/res/font/plus_jakarta_sans_bold.ttf`: Plus Jakarta Sans Bold, Copyright 2020 The Plus Jakarta
  Sans Project Authors (https://github.com/tokotype/PlusJakartaSans), SIL Open Font License 1.1. Used by the home-screen
  widgets.
