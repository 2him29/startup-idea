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
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://localhost:5173",
    locale: "en-US",
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
