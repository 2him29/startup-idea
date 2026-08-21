# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Qatra (قطرة) — a blood-donation matching app for Algeria. Trilingual EN/FR/AR with full RTL, running as a web app and as Capacitor-wrapped Android/iOS shells over the same React code. Backend is Supabase (Postgres + Auth + RLS).

## Commands

```bash
npm run dev          # Vite dev server on :5173
npm run build        # production build (delegates to @weare/web)
npm test             # Playwright e2e (starts the dev server itself)
npm run test:ui      # Playwright interactive runner
npm run verify:db    # migrations + RLS against a real throwaway Postgres
npm run typecheck    # tsc on packages/core
```

Run one Playwright test or file:
```bash
npx playwright test -g "opening a request shows its detail screen"
npx playwright test e2e/legacy-flow.spec.ts --project=chromium
```

There is **no lint step** — no ESLint or Prettier config exists. Match surrounding style by hand.

Android (APK lands in `apps/web/android/app/build/outputs/apk/debug/`):
```bash
npm run build && cd apps/web && npx cap sync
cd android && ./gradlew assembleDebug
```

Deploy build for GitHub Pages (sets Vite `base` to `/startup-idea/`):
```bash
cd apps/web && GHPAGES=1 npx vite build
```

## Architecture

npm workspaces monorepo:

- **`packages/core`** — everything non-visual: Supabase calls, React hooks, types, the full i18n dictionary, feature flags. Framework-agnostic by design; it must not import Vite or React Native specifics. Config is *injected* (`configureSupabase()`, `configureFeatures()`, `configureOtpProvider()`) rather than read from `import.meta.env`, so a non-Vite host can consume it. `main.tsx` does that wiring.
- **`apps/web`** — all UI. Screens live in `src/app/components/`.
- **`packages/ui-tokens`** — the colour palette.
- **`supabase/migrations`** — schema, applied in filename order.

**Routing is a single `currentScreen` string in `App.tsx`,** switched over in `renderScreen()`. There is no router despite `react-router` being a dependency — adding a screen means adding a `case` and a nav entry, not a route.

**Data hooks seed with static fallback data, then swap in live rows** (`useBloodRequests`, `useHospitals`, `useBloodDrives`). Fetch errors are logged and swallowed, keeping the fallback. This makes the UI resilient but means **a broken query is invisible** — it renders plausible mock data instead of failing. If live data looks stale or fake, suspect the query, not the UI.

## Non-obvious things that will cost you time

**The `VITE_PATIENT_MODEL` flag gates SQL, not just UI.** The app is mid-migration from *hospitals post requests* to *patients post requests, associations verify them*. `api.ts` picks between `LEGACY_COLUMNS` and `PATIENT_MODEL_COLUMNS` based on the flag, because PostgREST rejects an entire query with a 400 if it names a column or embedded table that doesn't exist — and the fallback above then hides that as mock data. Never add a new column to a query without gating it, and never set the flag against an unmigrated database.

The e2e suite reads that flag from `apps/web/.env` itself, so the app and the tests cannot disagree about which model is running. They could once, and the failure was thoroughly misleading: the browser had the flag on while the specs assumed it off, so the legacy tests exercised an app with no hospital account (18 red) and the patient-model tests silently skipped. Set `VITE_PATIENT_MODEL` in the environment only to override a single run.

**The e2e suite refuses to run against the live project.** It writes — signups, requests, verifications, responses — and it reads `apps/web/.env` to decide what it is testing. Worse, `reuseExistingServer` means it drives whatever dev server is already on :5173, which holds the env it *started* with, not the current file. That combination put test data into live twice in one afternoon. `playwright.config.ts` now throws if `.env` names the live ref; override with `QATRA_ALLOW_LIVE_E2E=1`. **Changing `.env` is not enough — restart the dev server too.**

**Notifications go through an outbox, never straight out of a trigger.** Triggers on `blood_requests` and `request_responses` write to `notification_outbox`; the `send-push` edge function drains it. An HTTP call inside the transaction would make posting a blood request fail when a push service is slow, and a failed send would leave nothing to retry. `claim_notifications()` gives each row a five-minute lease — `SKIP LOCKED` alone only separates *simultaneous* workers, so without the lease a second worker a moment later sends the same notification twice.

**The `send-push` function needs `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` as Supabase secrets.** Without them it returns 503 naming the missing one and claims nothing, so no notification is lost. The public key also goes in `apps/web/.env` as `VITE_VAPID_PUBLIC_KEY`; **the private key must never go there** — every `VITE_*` var is inlined into the client bundle.

**Blood compatibility lives in `packages/core/src/compatibility.ts`** and is the one module where being wrong is a medical error. The full 8×8 table is written out rather than derived, and `npm run test:unit` checks it from both directions against an independently written chart. Unknown or missing types answer `false`, never `true`.

**Phone verification needs `VITE_DEMO_OTP=true` anywhere without Twilio.** The default OTP provider goes through Supabase phone auth. Without an SMS provider there is no way to obtain a verified number, and posting a request requires one — so the entire patient flow is untestable and undemoable unless this flag is set. `demoOtpProvider` accepts one fixed code (`000000`) and sends nothing. It is opt-in and exact-match for the same reason the patient-model flag is, and **must be off in production**: with it on, anyone can claim any number, which is the precise trust verification exists to create.

**`npm run verify:db` initialises its cluster as UTF-8 explicitly.** `initdb` otherwise takes the encoding from the host locale — WIN1252 on these machines — and a migration containing any character outside it aborts with *"has no equivalent in encoding WIN1252"*, which reads like a SQL error and is not one. A NUMERO SIGN inside a comment was enough. Don't remove the `initdbFlags`.

**Verification is an admin act; donor search is not.** `can_verify_in_wilaya()` requires `role = 'admin'` — vouching publishes an attestation under the association's name, so it belongs to whoever may bind the association. Donor search uses `is_association_in_wilaya()` instead, which any member passes. These were one predicate until `20260820120000`, and narrowing it without splitting it locked volunteers out of donor search — `verify:db` caught that, seven assertions deep.

**`npm run verify:db` is Postgres, not Supabase.** It runs real Postgres binaries (no Docker — Docker Desktop is unreliable on these machines), applies every migration, and exercises RLS as several different users. But there is no PostgREST or GoTrue and the `auth` schema is stubbed, so it cannot cover the HTTP API, auth, or anything Playwright does. Passing `verify:db` is not the same as the feature working.

**The build does not typecheck.** There is no `tsconfig.json`; Vite strips types with esbuild. `npm run build` passes with type errors in it. Run `npm run typecheck` separately. That script also carries explicit compiler flags for the same reason.

**Playwright pins `locale: "en-US"`.** The app auto-detects device language on first launch and these machines are set to French — without the pin the UI comes up in French and English assertions fail for a reason unrelated to the code. Tests that exercise FR/AR switch language explicitly.

**The e2e suite drives a live Supabase project** and every worker shares one dev server and one demo account. Workers are capped at 3 and timeouts raised for that reason; local retries are 1, and a recovered test is reported as *flaky* rather than passing.

**Android Gradle is pinned to Android Studio's bundled JDK** via `org.gradle.java.home` in `apps/web/android/gradle.properties`. The system JDK is newer than Gradle 8.14 supports. Don't remove it.

## Conventions

**All colours are inline styles**, not CSS variables or Tailwind theme tokens — Tailwind is used for layout, `style={{}}` for colour. This is why there's no dark mode: it needs a CSS-variable refactor first, and a cheap `invert()` turns the brand red teal.

**Every user-facing string goes in `packages/core/src/i18n.ts`**, in all three languages. The `Strings` interface makes a missing translation a type error — add EN, FR *and* AR or `npm run typecheck` fails.

**RTL is handled with CSS logical properties**, not conditionals: `textAlign: "start"`, `insetInlineStart/End`, `ms-auto`/`me-auto`. The one thing that needs explicit handling is directional icons — chevrons and back arrows flip with `transform: scaleX(-1)` when `dir === "rtl"`.

**Wilayas are stored canonically as the French name** (`"Alger"`, not `"Algiers"` or `"16"`). `wilayaLabel()` translates for display.

## Hard constraints

**No donor payment, rewards, or paid priority — ever.** Blood donation in Algeria is voluntary and unpaid, and paying donors compromises supply safety by giving them a reason to conceal a disqualifying history. This is a code-review gate documented at the top of `packages/core/src/compliance.ts`, not a preference. Non-transferable recognition (streaks, certificates) is fine precisely because it can't be exchanged.

**Health data is regulated** under Algeria's Loi 18-07 / 25-11. Consent is recorded per purpose with the version of the text shown; consent rows deliberately have no delete policy because they are the evidence processing was lawful. `TODO(compliance)` marks the unresolved question of data being hosted outside Algeria.

**Don't run `supabase db push` against the live/demo project without staging it first.** Migrations that apply cleanly to a fresh database can still misbehave against real rows — that exact gap already produced a backfill bug that silently linked nothing.

**Ask before deleting any table or migration.**

## Demo accounts

Pre-seeded, deliberately non-secret, reachable from one-click buttons on the splash screen: `demo.donor@weare.app` / `demo.hospital@weare.app`, password `WeAreDemo123!`.
