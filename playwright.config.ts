import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end config for Qatra.
 *
 * `locale` is pinned to en-US deliberately and must stay pinned: the app
 * auto-detects the device language on first launch (see readStoredLang in
 * LangContext), and this project's dev machines are set to French — without
 * the override the UI comes up in French and every English assertion fails
 * for a reason that has nothing to do with the code under test. Tests that
 * exercise French or Arabic switch language explicitly instead.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",

  // One retry locally, not zero.
  //
  // These specs drive the real app against a live Supabase project, so a slow
  // round trip is indistinguishable from a broken assertion — measured at
  // roughly one full run in six, landing on a different test each time and
  // always as a visibility timeout, never a wrong value. Every affected test
  // passes repeatedly in isolation. A retry absorbs that without hiding real
  // breakage: a genuinely broken test fails both attempts, and retried runs
  // are reported as flaky rather than silently green.
  retries: process.env.CI ? 2 : 1,

  // Capped deliberately. Every spec drives one Vite dev server and one shared
  // Supabase demo account, so extra workers add contention rather than speed —
  // at the default (half the CPU count) requests occasionally time out purely
  // from queueing, which reads as a failure in the app. Retries stay off
  // locally so a genuine flake stays visible instead of being papered over.
  workers: 3,

  // These specs drive the real app against a real Supabase project, and every
  // worker signs in as the same demo account — so with both projects running
  // there are six concurrent sessions competing for the same backend. The
  // defaults (5s expect, no action timeout) are tuned for local fixtures and
  // are too tight for that; a slow round trip should not read as a failure.
  expect: { timeout: 15_000 },

  use: {
    baseURL: "http://localhost:5173",
    locale: "en-US",
    actionTimeout: 20_000,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], locale: "en-US" },
    },
    {
      // The app is a phone app first — the bottom nav is `md:hidden`, so the
      // mobile viewport is the only one where those nav assertions mean
      // anything.
      name: "mobile",
      use: { ...devices["Pixel 7"], locale: "en-US" },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
