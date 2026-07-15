# قطرة Qatra — Blood Donation Network for Algeria

**Every drop connects a life.** Qatra matches blood donors with hospitals across Algeria in real time — trilingual (Arabic RTL / French / English), on web, Android, and iOS.

## What it does

**For donors:**
- Live urgent blood requests with a real map (Leaflet/OSM), filterable by wilaya
- Eligibility tracking — a progress ring computed from your last donation date (90-day rule)
- **Don compensatoire** — pledge a donation in a named patient's name so their transfusion is released (family replacement, any blood type)
- SOS alerts with one-tap WhatsApp sharing (how urgent calls actually spread here)
- Blood drives calendar, downloadable donation certificates (PDF), Ramadan night-donation mode (auto-enables during the real Hijri month)
- Directory of 20+ real Algerian hospitals (CHU Mustapha, Beni Messous, CHU Oran, Constantine…) with one-tap Google Maps directions

**For hospitals:**
- Publish real blood requests (blood type, units, urgency) from a bottom sheet
- Mobile dashboard + full desktop console: stats, requests table, national reserve, donors map
- SOS broadcast toggle, print/CSV export of requests
- Live notification bell fed by open critical requests

## Stack

- **Frontend:** React + TypeScript + Vite, Tailwind v4, lucide-react, react-leaflet
- **Backend:** Supabase (Postgres + Auth + RLS) — schema in `supabase/migrations/`
- **Mobile:** Capacitor wraps the same web app into native Android (`apps/web/android`) and iOS (`apps/web/ios`) shells
- **Monorepo:** npm workspaces — `apps/web` (UI), `packages/core` (types, API, i18n, hooks), `packages/ui-tokens` (palette)

## Run it

```bash
npm install
npm run dev            # web app on http://localhost:5173
```

Requires `apps/web/.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**Database:** `npx supabase login && npx supabase db push` applies all migrations.

**Android:** (needs Android Studio's JDK — Gradle doesn't support JDK 25 yet)
```bash
npm run build && cd apps/web && npx cap sync
cd android && JAVA_HOME="C:\Program Files\Android\Android Studio\jbr" ./gradlew assembleDebug
# APK: apps/web/android/app/build/outputs/apk/debug/app-debug.apk
```

**iOS:** project scaffold is in `apps/web/ios` — building/signing requires a Mac with Xcode (`npx cap open ios`).

**Demo accounts** (pre-seeded, not secret): one-click "View demo as Donor / Hospital" buttons on the splash screen.

## i18n

All copy lives in `packages/core/src/i18n.ts` (EN/FR/AR). Arabic flips the whole layout via CSS logical properties. First launch auto-detects the device language.

## Status

Fully working demo: real auth, real database round-trips (requests, compensations, profiles), verified end-to-end with Playwright across all three languages and both roles. Known follow-ups: push notifications & SMS need a provider (Firebase/Twilio), phone-OTP auth, dark mode (needs a CSS-variable refactor), iOS build needs Mac access.
