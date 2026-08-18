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

## Patient/association model (in progress, behind a flag)

Qatra is migrating from *hospitals post requests* to **patients and families post requests, and associations verify them** — Croissant-Rouge committees, scout groups, and student associations act as an optional trust layer, and a hospital becomes plain text on a request rather than an account type.

The new flow is gated on `VITE_PATIENT_MODEL=true` (see `apps/web/.env.example`). With it unset, the app runs the legacy hospital flow exactly as before — including the request queries, which select a different column list depending on the flag, because the new columns don't exist until the migrations are applied.

**Enabling it:**
```bash
npx supabase db push          # applies the 20260817* migrations
# then set VITE_PATIENT_MODEL=true in apps/web/.env
```

It also needs seed data that only you can create: a verified `associations` row, an `association_members` row linking a user to it, and a `platform_admins` row for whoever approves associations. `is_verified` is deliberately not client-writable — it changes only through the `verify_association()` database function, which checks platform-admin membership.

**Compliance:** health-data consent is recorded per purpose with the version of the text shown (`packages/core/src/compliance.ts`), and data-subject requests (export/correction/deletion) go to a queue worked by a human. Search for `TODO(compliance)` for the open hosting question — data currently lands in a Supabase region outside Algeria. Qatra must never introduce donor payment, cash-equivalent rewards, or paid-priority matching; that invariant is documented at the top of `compliance.ts` as a code-review gate.

## Tests

```bash
npm test              # Playwright, e2e/
npm run test:ui       # interactive runner
npm run verify:db     # migrations + RLS against a real Postgres
npm run test:flow     # full patient→association→donor flow against a staging project
```

`npm run test:flow` walks the whole chain with real sessions and RLS in force: a family posts a request, an association vouches for it, the badge reaches the donor and survives a WhatsApp forward, the donor pledges a compensation, the donation is recorded, and the donor drops out of donor search on the 90-day cooldown. It lives outside Playwright because two of those links — `searchDonors()` and `recordDonation()` — are wired into no screen yet, so they cannot be driven through a browser.

Unlike the other suites this one **writes**, so it demands an explicit target and refuses the production project:

```bash
QATRA_E2E_URL=https://<ref>.supabase.co \
QATRA_E2E_ANON_KEY=<anon key> \
npm run test:flow
```

With no target set it skips (exit 0); pointed at production it exits 1 without touching anything.

`npm run verify:db` spins up a throwaway PostgreSQL instance from real binaries (no Docker — Docker Desktop is unreliable on these machines), applies every migration in order, then exercises the RLS policies as different users, the backfill, `seed.sql`, and the contract between `api.ts`'s queries and the actual schema. It is **not** Supabase: the `auth` schema is stubbed and there is no PostgREST or GoTrue, so it cannot cover the HTTP API, auth, or the Playwright suite. It exists because "the SQL was hand-reviewed" is not verification — it caught the backfill silently linking zero rows.

`e2e/legacy-flow.spec.ts` is the regression net for the pre-migration app across all three languages and both roles. `e2e/patient-model.spec.ts` covers the new flow and skips itself until the migrations are applied and the flag is on — its prerequisites are listed at the top of the file.

The Playwright config pins `locale: "en-US"` on purpose: the app auto-detects device language on first launch, and these machines are set to French, so without the pin the UI comes up in French and every English assertion fails for the wrong reason.

## i18n

All copy lives in `packages/core/src/i18n.ts` (EN/FR/AR). Arabic flips the whole layout via CSS logical properties. First launch auto-detects the device language.

## Status

Fully working demo: real auth, real database round-trips (requests, compensations, profiles), verified end-to-end with Playwright across all three languages and both roles. Known follow-ups: push notifications & SMS need a provider (Firebase/Twilio), phone-OTP auth, dark mode (needs a CSS-variable refactor), iOS build needs Mac access.
