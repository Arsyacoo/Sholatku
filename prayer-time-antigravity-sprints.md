# Prayer Time Website — Antigravity Implementation Prompts

## Project Context

Build a production-quality, responsive web application that shows accurate Islamic prayer times based on the user's location.

The product should feel like a polished modern "prayer companion", not a generic API demo. The primary experience is:

**Location → Today's prayer schedule → Current/next prayer → Live countdown**

The application must be mobile-first, accessible, fast, visually refined, and suitable as a portfolio-quality project.

## Important Instruction for Antigravity

You already have access to the **Impeccable skill**. Use it throughout this project.

Apply Impeccable principles proactively for:
- visual hierarchy
- spacing and rhythm
- typography
- responsive composition
- component consistency
- interaction states
- accessibility
- empty/loading/error states
- visual polish
- design critique and refinement
- avoiding generic AI-generated UI patterns

Do not merely make the UI functional. Make deliberate design decisions and refine the interface until it feels like a real, high-quality product.

Do not ask for unnecessary confirmation between sprints. Inspect the existing codebase, make sensible decisions, implement the sprint, test it, and report what was completed.

---

# Product Requirements

## Core Product Goal

Users should be able to open the website and immediately understand:

1. Where the prayer schedule is being calculated for.
2. Today's date.
3. The current prayer status.
4. Which prayer is next.
5. How long remains until the next prayer.
6. The complete prayer schedule for today.

## Prayer Times

The daily schedule must support:

- Fajr / Subuh
- Sunrise / Terbit
- Dhuhr / Dzuhur
- Asr / Ashar
- Maghrib
- Isha / Isya

The implementation must correctly handle:
- local timezone
- midnight/day rollover
- prayer transitions
- daylight-saving differences where relevant
- API failures
- stale cached data

## Location

Support:

- browser geolocation
- reverse geocoding
- manual location search
- changing location
- graceful permission denial
- unavailable location services

Never expose or store precise user coordinates unnecessarily.

## Recommended Technology

Use the existing project stack if one already exists. Otherwise prefer:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui where appropriate
- Lucide icons
- a reliable prayer-time API
- a reliable geocoding/location API
- localStorage for lightweight client preferences
- PostgreSQL/Prisma only if persistent user accounts become necessary

Do not introduce unnecessary dependencies.

---

# Sprint 0 — Discovery, Architecture & Design Direction

## Goal

Understand the existing project and establish a strong technical and visual foundation before building features.

## Prompt

> Inspect the entire existing project before changing anything. Identify the current framework, package manager, folder structure, installed dependencies, existing design system, reusable components, routing, environment configuration, and available skills.
>
> Use the Impeccable skill to establish the product's visual direction.
>
> Define a clean architecture for a location-aware prayer-time application. Keep the MVP intentionally focused.
>
> Establish:
> - application architecture
> - component architecture
> - API/data layer strategy
> - location flow
> - prayer-time data model
> - timezone strategy
> - error-handling strategy
> - caching strategy
> - responsive breakpoints
> - accessibility baseline
>
> Design direction:
> - modern Islamic-tech aesthetic
> - calm and premium
> - minimal rather than ornamental
> - generous whitespace
> - strong typography
> - subtle Islamic visual references rather than decorative overload
> - clear hierarchy around the next prayer
> - excellent mobile experience
>
> Avoid:
> - generic dashboard templates
> - excessive cards
> - excessive gradients
> - unnecessary glassmorphism
> - decorative Arabic patterns everywhere
> - oversized hero sections
> - visual clutter
>
> Before implementation, inspect the project and make decisions based on what already exists rather than rebuilding unnecessarily.
>
> Deliver a short implementation plan and then implement the foundational setup.

## Acceptance Criteria

- Existing project structure has been understood.
- Architecture is documented in code comments/docs where useful.
- Design tokens or reusable styles are established.
- No unnecessary dependencies are added.
- The application runs successfully.

---

# Sprint 1 — Core UI Shell & Responsive Dashboard

## Goal

Build the complete visual dashboard using realistic mock data before integrating external APIs.

## Prompt

> Build the primary prayer-time dashboard using realistic mock data.
>
> Use the Impeccable skill to create a highly polished, responsive interface.
>
> The main page should communicate the following hierarchy:
>
> 1. Product identity
> 2. Current location
> 3. Today's date
> 4. Next prayer
> 5. Live countdown placeholder
> 6. Today's prayer schedule
> 7. Supporting controls
>
> Create reusable components for:
> - Header
> - Location selector
> - Date display
> - NextPrayerCard
> - CountdownTimer
> - PrayerSchedule
> - PrayerTimeItem
> - Settings entry
>
> The Next Prayer card must be the visual focal point without dominating the entire screen.
>
> Use semantic HTML and accessible labels.
>
> Design the desktop and mobile layouts intentionally rather than simply stacking desktop components on mobile.
>
> Include:
> - hover states
> - focus states
> - active states
> - loading placeholders
> - empty states
> - error-state placeholders
>
> Use realistic Indonesian prayer-time examples for visual testing.
>
> Do not integrate external APIs yet. Keep the data layer replaceable.

## Acceptance Criteria

- Dashboard is visually polished.
- Mobile layout feels intentional.
- Desktop layout uses space effectively.
- Prayer schedule is easy to scan.
- Next prayer is immediately understandable.
- Components are reusable.
- No hard-coded visual duplication across components.

---

# Sprint 2 — Location Detection & Location Search

## Goal

Make the application location-aware.

## Prompt

> Implement the complete location experience.
>
> Use browser Geolocation API to request the user's location.
>
> The flow should be:
>
> 1. Open application.
> 2. Determine whether a usable saved location exists.
> 3. If not, offer browser location detection.
> 4. Request permission with clear user-facing context.
> 5. Obtain latitude and longitude.
> 6. Reverse geocode the coordinates.
> 7. Display a human-readable location.
>
> Also implement manual location search as a first-class fallback.
>
> The location selector should allow users to:
> - use current location
> - search for another city/location
> - select a result
> - replace the active location
>
> Handle:
> - permission denied
> - permission unavailable
> - timeout
> - malformed geocoding response
> - no search results
> - network failure
>
> Never make the user feel trapped if location permission is denied.
>
> Use Impeccable to refine the location picker UX, including empty, loading, error, keyboard, and mobile states.
>
> Store only the minimum non-sensitive preference needed to restore the selected location. Avoid storing precise GPS coordinates unless technically necessary.

## Acceptance Criteria

- Current location can be detected.
- Manual search works.
- Location can be changed.
- Permission denial has a useful fallback.
- Loading and error states are polished.
- Location information is clearly displayed.

---

# Sprint 3 — Prayer Time API Integration

## Goal

Replace mock data with real prayer-time data.

## Prompt

> Integrate a reliable prayer-time data source.
>
> First inspect the available API configuration and existing environment variables. Do not hard-code secrets.
>
> Create a clean prayer-time service abstraction so the UI does not depend directly on the external API response format.
>
> The normalized application model should contain:
>
> - date
> - timezone
> - location
> - Fajr
> - Sunrise
> - Dhuhr
> - Asr
> - Maghrib
> - Isha
>
> The API layer must correctly account for:
> - latitude
> - longitude
> - date
> - timezone
> - calculation method
> - madhab/asr method when supported
>
> Add robust handling for:
> - API errors
> - malformed responses
> - rate limits
> - network failures
> - missing prayer values
> - timezone mismatches
>
> Prefer server-side/API-route integration where appropriate so external API details remain isolated.
>
> Add caching where safe to reduce unnecessary requests.
>
> Keep the service replaceable so another prayer API can be used later without rewriting the UI.
>
> Use Impeccable to ensure loading transitions and API-error states feel polished rather than abrupt.

## Acceptance Criteria

- Real prayer times are displayed.
- Timezone is correct for the selected location.
- API credentials are not exposed.
- API failures are gracefully handled.
- UI remains independent of the provider's raw response format.

---

# Sprint 4 — Current Prayer, Next Prayer & Live Countdown

## Goal

Implement the application's core intelligence.

## Prompt

> Implement accurate prayer-state logic and a realtime countdown.
>
> Given the current local time and today's prayer schedule, determine:
> - current prayer state
> - next prayer
> - elapsed prayers
> - upcoming prayers
>
> Sunrise should be treated as a schedule event but not as a prayer that becomes the "next prayer" unless the product logic explicitly requires it. The user-facing prayer sequence should prioritize the five daily prayers.
>
> Correctly handle:
> - before Fajr
> - between Fajr and sunrise
> - between sunrise and Dhuhr
> - between Dhuhr and Asr
> - between Asr and Maghrib
> - between Maghrib and Isha
> - after Isha
> - midnight rollover
>
> After Isha, the next prayer should become tomorrow's Fajr rather than producing an invalid empty state.
>
> Build a reusable countdown system that:
> - updates every second
> - calculates remaining time from timestamps rather than repeatedly subtracting one second
> - avoids timer drift
> - cleans up timers correctly
> - handles browser tab visibility changes
>
> Display examples:
>
> "Next prayer: Asr"
>
> "00:42:17"
>
> "Today at 15:05"
>
> When the prayer time arrives, update the state smoothly and automatically.
>
> Use Impeccable to make the transition between prayer states visually clear but subtle.
>
> Add unit tests for the prayer-state calculation.

## Acceptance Criteria

- Next prayer is always correct.
- Countdown is accurate.
- Midnight rollover works.
- Tomorrow's Fajr is handled.
- No timer memory leaks.
- State transitions happen automatically.
- Core prayer-state logic is unit tested.

---

# Sprint 5 — Settings & Calculation Preferences

## Goal

Allow users to customize calculation behavior.

## Prompt

> Build a polished settings experience for prayer-time preferences.
>
> Support, where provided by the selected prayer-time provider:
>
> - calculation method
> - Asr/madhab method
> - individual prayer-time adjustments
>
> The default experience should be appropriate for users in Indonesia.
>
> Do not overwhelm users with technical astronomy terminology.
>
> Use progressive disclosure:
> - simple settings first
> - advanced adjustments behind an "Advanced" section
>
> Settings should persist locally.
>
> Changing a relevant setting must invalidate or refresh prayer-time data as necessary.
>
> Provide clear explanations for settings that materially change prayer times.
>
> Use Impeccable to make the settings interface feel consistent with the main dashboard.
>
> Ensure all controls are keyboard accessible.

## Acceptance Criteria

- Settings can be changed.
- Preferences persist after reload.
- Prayer data updates when needed.
- Advanced controls do not clutter the primary experience.
- Accessible form controls are used.

---

# Sprint 6 — States, Accessibility, Performance & Resilience

## Goal

Make the application production-quality.

## Prompt

> Perform a complete quality pass using the Impeccable skill.
>
> Audit and improve:
> - loading states
> - skeletons
> - empty states
> - error states
> - offline behavior
> - API failures
> - location failures
> - accessibility
> - keyboard navigation
> - focus management
> - reduced motion
> - color contrast
> - responsive behavior
> - touch targets
> - typography
> - spacing
> - performance
>
> Add a useful offline/fallback experience when previously loaded prayer data is available.
>
> Avoid misleading users when cached data is stale. Clearly indicate when appropriate.
>
> Optimize:
> - unnecessary renders
> - API calls
> - countdown updates
> - image usage
> - bundle size
> - font loading
>
> Run linting, type checking, tests, and production build.
>
> Fix issues rather than merely reporting them.

## Acceptance Criteria

- No obvious accessibility violations.
- No broken mobile states.
- No uncaught API/location errors.
- Production build succeeds.
- Type checking succeeds.
- Tests pass.
- UI remains polished under slow/error conditions.

---

# Sprint 7 — PWA, Notifications & Enhanced Mobile Experience

## Goal

Turn the website into a useful daily mobile prayer companion.

## Prompt

> Extend the application into a high-quality Progressive Web App where technically appropriate.
>
> Implement:
> - installable PWA behavior
> - app manifest
> - suitable icons
> - offline shell
> - mobile-friendly navigation
>
> Add optional prayer notifications if the platform/browser capabilities allow them.
>
> Notifications should be opt-in and clearly explained.
>
> Potential notification preferences:
> - notify at prayer time
> - notify 10 minutes before
> - per-prayer toggles
>
> Do not request notification permission immediately on page load. Explain the value first.
>
> Use Impeccable to refine the mobile experience for one-handed use.
>
> Make sure notification and PWA functionality degrades gracefully on unsupported browsers.

## Acceptance Criteria

- PWA metadata is valid.
- App can be installed where supported.
- Offline shell works where supported.
- Notification permission is user-initiated.
- Unsupported environments have graceful fallbacks.

---

# Sprint 8 — Monthly Schedule, Qibla & Product Expansion

## Goal

Add useful secondary features without weakening the core experience.

## Prompt

> Add secondary features only after the primary daily prayer experience remains fast and clear.
>
> Implement a monthly prayer schedule page:
> - selected location
> - selected month
> - daily prayer times
> - clear current-day highlighting
> - responsive table/list behavior
>
> Then implement a Qibla page using the selected/current location.
>
> Qibla experience should show:
> - direction to Kaaba
> - bearing in degrees
> - compass-style visual
> - permission guidance for device orientation
> - fallback when orientation sensors are unavailable
>
> Keep these features visually subordinate to the daily prayer dashboard.
>
> Use Impeccable to prevent feature expansion from turning the product into a cluttered dashboard.

## Acceptance Criteria

- Monthly schedule is readable on mobile.
- Qibla works where device capabilities permit.
- Unsupported sensor environments have a useful fallback.
- Navigation between features is intuitive.
- Core dashboard remains the product's primary destination.

---

# Sprint 9 — Final Impeccable Design Review

## Goal

Perform a dedicated design-quality pass.

## Prompt

> Act as a senior product designer and frontend engineer performing a final Impeccable review.
>
> Do not add random features.
>
> Instead, inspect the complete application and identify the highest-impact visual and UX weaknesses.
>
> Review:
> - hierarchy
> - typography
> - spacing
> - alignment
> - component consistency
> - visual density
> - color usage
> - contrast
> - icon consistency
> - interaction feedback
> - mobile composition
> - desktop composition
> - empty/loading/error states
> - accessibility
> - perceived performance
>
> Look specifically for common AI-generated UI problems:
> - excessive rounded cards
> - repetitive containers
> - unnecessary gradients
> - arbitrary icon usage
> - weak hierarchy
> - too much text
> - generic hero sections
> - inconsistent spacing
> - excessive shadows
> - decorative elements without purpose
>
> Make the minimum number of high-impact changes necessary to produce a cohesive, premium product.
>
> Preserve functionality while improving the experience.
>
> Finish by running the full validation suite and production build.

## Acceptance Criteria

- UI feels cohesive.
- No obvious generic AI-dashboard patterns remain.
- Mobile and desktop both feel intentionally designed.
- Accessibility remains intact.
- Production build succeeds.

---

# Sprint 10 — Final QA & Launch Readiness

## Goal

Prepare the application for deployment.

## Prompt

> Perform a final end-to-end QA pass.
>
> Test at minimum:
>
> ### Location
> - location permission granted
> - location permission denied
> - manual location search
> - changing location
> - unavailable geolocation
>
> ### Prayer data
> - successful API response
> - API failure
> - invalid response
> - timezone correctness
> - different locations
>
> ### Prayer state
> - before Fajr
> - after Fajr
> - before Dhuhr
> - before Asr
> - before Maghrib
> - before Isha
> - after Isha
> - midnight rollover
> - tomorrow's Fajr
>
> ### UI
> - mobile
> - tablet
> - desktop
> - keyboard navigation
> - reduced motion
> - slow network
> - offline/cached state
>
> Run:
> - lint
> - typecheck
> - unit tests
> - integration tests where available
> - production build
>
> Fix all issues that materially affect reliability or UX.
>
> Do not leave TODOs for core MVP functionality.
>
> Finish with a concise launch-readiness report containing:
> - completed features
> - known limitations
> - environment variables required
> - deployment requirements
> - recommended next improvements

---

# Definition of Done

The project is complete when a new user can:

1. Open the website.
2. Understand what the product does immediately.
3. Allow location access or manually select a location.
4. See today's accurate prayer schedule.
5. Clearly identify the next prayer.
6. See a reliable realtime countdown.
7. Change location.
8. Change supported prayer calculation settings.
9. Use the interface comfortably on mobile and desktop.
10. Recover gracefully from API, location, and network failures.

The final product should feel like a **real, polished prayer-time product**, not a tutorial project or API showcase.

---

# Implementation Rules

## Rule 1 — Inspect Before Editing

Always inspect the current implementation before modifying it.

Do not overwrite working functionality unnecessarily.

## Rule 2 — Reuse Before Creating

Reuse existing components, utilities, styles, and dependencies when appropriate.

## Rule 3 — Keep the Core Simple

The primary screen should answer:

**Where am I? What time is it? What prayer is next? When does it start?**

Everything else is secondary.

## Rule 4 — No Fake Data in Production

Mock data is acceptable only during UI development. Production flows must use the real data source.

## Rule 5 — Never Hard-Code Location

The application must work for different locations.

## Rule 6 — Timezone Is Critical

Never assume the browser's timezone is the prayer location's timezone.

## Rule 7 — Handle Midnight Explicitly

After Isha, calculate the next prayer as tomorrow's Fajr.

## Rule 8 — Accessibility Is Not Optional

Use semantic elements, proper labels, keyboard navigation, visible focus states, sufficient contrast, and reduced-motion support.

## Rule 9 — Use Impeccable Continuously

Do not wait until the final sprint to use Impeccable. Apply it during every UI-related sprint.

## Rule 10 — Avoid Overengineering

Do not add authentication, a database, complex state management, or unnecessary infrastructure unless a real product requirement needs it.

---

# Suggested Final Project Structure

```text
app/
├── page.tsx
├── settings/
│   └── page.tsx
├── monthly/
│   └── page.tsx
├── qibla/
│   └── page.tsx
└── api/
    ├── prayer-times/
    └── location/

components/
├── layout/
├── prayer/
├── location/
├── settings/
└── ui/

lib/
├── prayer/
│   ├── api.ts
│   ├── normalize.ts
│   ├── calculation.ts
│   └── next-prayer.ts
├── location/
│   ├── geolocation.ts
│   └── geocoding.ts
├── time/
│   └── timezone.ts
└── utils/

hooks/
├── useLocation.ts
├── usePrayerTimes.ts
├── useNextPrayer.ts
└── useCountdown.ts

types/
├── prayer.ts
├── location.ts
└── settings.ts
```

---

# Final Antigravity Master Instruction

If you prefer to give Antigravity one instruction before starting the sprint sequence, use this:

> You are building a production-quality location-aware Islamic prayer-time web application.
>
> Use the existing codebase and technology choices where possible. Do not rebuild unnecessarily.
>
> Use the Impeccable skill throughout the entire project. Treat visual quality, UX, accessibility, responsive behavior, typography, spacing, interaction states, and product polish as first-class engineering requirements.
>
> Build the project incrementally according to the sprint plan in this document. Complete one sprint at a time, validate the result, then proceed to the next sprint.
>
> The core experience must always remain:
>
> **Location → Today's schedule → Next prayer → Live countdown**
>
> The application must support browser geolocation, manual location search, real prayer-time data, correct timezone handling, prayer-state calculation, midnight rollover, calculation preferences, resilient loading/error states, responsive design, and production-quality accessibility.
>
> Prioritize simplicity and reliability over feature quantity.
>
> Do not introduce unnecessary dependencies or infrastructure.
>
> Do not use fake data in production.
>
> Never hard-code a single city or timezone.
>
> Never assume the browser timezone is the same as the selected prayer location timezone.
>
> After implementation, run linting, type checking, tests, and a production build. Fix material issues before declaring the sprint complete.
>
> When reviewing the UI, actively look for generic AI-generated design patterns and eliminate them using the Impeccable skill.
>
> The final result should feel like a polished, modern product that could be shipped to real users and presented as a strong frontend/full-stack portfolio project.
