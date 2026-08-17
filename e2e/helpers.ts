import type { Page } from "@playwright/test";

/**
 * Shared steps for the Qatra suite.
 *
 * Every helper starts from a clean localStorage. The app persists both the
 * chosen language and the Supabase session there, so a leaked value from a
 * previous test changes which language the UI renders in and whether the
 * splash screen appears at all — the two things most of these assertions
 * depend on.
 */

export type Lang = "en" | "fr" | "ar";

/** Demo-login button copy, per language (see HomeScreen's splash block). */
const DEMO_BUTTON: Record<Lang, { donor: string; hospital: string }> = {
  en: { donor: "View demo as Donor", hospital: "View demo as Hospital" },
  fr: { donor: "Démo en tant que donneur", hospital: "Démo en tant qu'hôpital" },
  ar: { donor: "عرض تجريبي كمتبرع", hospital: "عرض تجريبي كمستشفى" },
};

/** Language switcher labels, matching LangSwitcher. */
const LANG_BUTTON: Record<Lang, string> = { en: "EN", fr: "FR", ar: "ع" };

export async function gotoFresh(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
}

export async function switchLanguage(page: Page, lang: Lang): Promise<void> {
  await page.getByRole("button", { name: LANG_BUTTON[lang], exact: true }).first().click();
}

/**
 * Sign in through the splash screen's demo shortcut and wait until the
 * signed-in home screen has actually replaced it — asserting on the button
 * disappearing rather than a fixed timeout, since the round trip to Supabase
 * has no fixed duration.
 */
export async function demoLogin(page: Page, role: "donor" | "hospital", lang: Lang = "en"): Promise<void> {
  const button = page.getByRole("button", { name: DEMO_BUTTON[lang][role] });
  await button.click();
  await button.waitFor({ state: "hidden", timeout: 30_000 });
}

export async function signOut(page: Page): Promise<void> {
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
}

/**
 * Click a primary nav entry by its exact label.
 *
 * Two traps this avoids. Playwright matches `name` as a *substring*, so a
 * plain "Request" also matches the home screen's "Find urgent requests…"
 * button — hence `exact`. And the sidebar and the bottom bar carry identical
 * labels, with one hidden at any given viewport, so an unfiltered `.first()`
 * can land on the hidden one and stall until it times out — hence the
 * visibility filter.
 */
export async function clickNav(page: Page, label: string): Promise<void> {
  const item = page.getByRole("button", { name: label, exact: true }).filter({ visible: true }).first();
  await item.waitFor({ state: "visible", timeout: 30_000 });
  await item.click();
}
