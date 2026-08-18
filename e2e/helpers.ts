import type { Page } from "@playwright/test";
import { I18N, dir as dirFor, type Lang, type Strings } from "../packages/core/src/i18n";

/**
 * Shared steps for the Qatra suite.
 *
 * Assertions read their expected copy from the real dictionary rather than
 * hardcoding English. That is what lets the same journey run in all three
 * languages, and it means a translation deleted from i18n.ts breaks the tests
 * that depend on it instead of silently going untested.
 *
 * The i18n module is imported directly rather than through @weare/core so the
 * test process doesn't pull in supabase-js and React just to read strings.
 *
 * Every helper starts from a clean localStorage. The app persists both the
 * chosen language and the Supabase session there, so a leaked value from a
 * previous test changes which language the UI renders in and whether the
 * splash screen appears at all.
 */

export type { Lang };
export const LANGUAGES: Lang[] = ["en", "fr", "ar"];

/** The dictionary the app itself will render in this language. */
export function t(lang: Lang): Strings {
  return I18N[lang];
}

export function expectedDir(lang: Lang): "ltr" | "rtl" {
  return dirFor(lang);
}

/**
 * Splash-screen copy that lives inline in HomeScreen rather than in the
 * dictionary, so it has to be mirrored here. If these drift, the login helper
 * fails immediately and visibly rather than silently testing the wrong thing.
 */
const DEMO_BUTTON: Record<Lang, { donor: string; hospital: string }> = {
  en: { donor: "View demo as Donor", hospital: "View demo as Hospital" },
  fr: { donor: "Démo en tant que donneur", hospital: "Démo en tant qu'hôpital" },
  ar: { donor: "عرض تجريبي كمتبرع", hospital: "عرض تجريبي كمستشفى" },
};

const LANG_BUTTON: Record<Lang, string> = { en: "EN", fr: "FR", ar: "ع" };

/** Matches the storage key LangContext reads on first paint. */
const LANG_STORAGE_KEY = "qatra-lang";

export async function gotoFresh(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
}

/**
 * Start in a given language by seeding the stored preference before the app
 * boots, rather than clicking the switcher afterwards.
 *
 * Deliberate: the switcher is only rendered on some screens and viewports, so
 * driving it makes language setup depend on layout. Seeding storage sets the
 * language the same way a returning user's device would.
 */
export async function gotoFreshIn(page: Page, lang: Lang): Promise<void> {
  await page.goto("/");
  await page.evaluate(
    ([key, value]) => {
      window.localStorage.clear();
      window.localStorage.setItem(key, value);
    },
    [LANG_STORAGE_KEY, lang]
  );
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
