import { test, expect } from "@playwright/test";
import { gotoFresh, gotoFreshIn, switchLanguage, demoLogin, t, expectedDir, LANGUAGES } from "./helpers";

/**
 * Regression cover for the pre-patient-model app.
 *
 * This is the suite that has to keep passing while the patient/association
 * model is built behind its flag — it is the evidence that the hospital-facing
 * demo still works, which is the whole reason the migration is flagged rather
 * than a cutover. With VITE_PATIENT_MODEL unset (the default), these exercise
 * the legacy paths exactly as they shipped.
 *
 * The journeys run in all three languages. Arabic is the point of that: it is
 * the language most Algerian users will pick and the only one that flips the
 * entire layout, so an English-only suite would leave the highest-risk
 * rendering path completely unwatched.
 */

test.describe("splash screen", () => {
  for (const lang of LANGUAGES) {
    test(`renders in ${lang} with dir=${expectedDir(lang)}`, async ({ page }) => {
      await gotoFresh(page);
      await switchLanguage(page, lang);

      await expect(page.getByRole("button", { name: t(lang).imDonor })).toBeVisible();
      await expect(page.getByRole("button", { name: t(lang).imHospital })).toBeVisible();

      // Arabic must flip the whole document, not just translate the copy.
      await expect(page.locator("html")).toHaveAttribute("dir", expectedDir(lang));
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
    });
  }
});

test.describe("donor journey", () => {
  for (const lang of LANGUAGES) {
    test(`[${lang}] donor reaches home and opens the find screen`, async ({ page }) => {
      await gotoFreshIn(page, lang);
      await demoLogin(page, "donor", lang);

      await expect(page.getByText(t(lang).quickActions)).toBeVisible();

      await page.getByText(t(lang).findRequests).click();
      await expect(page.getByText(t(lang).urgentRequests).first()).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("dir", expectedDir(lang));
    });

    test(`[${lang}] opening a request shows its detail screen`, async ({ page }) => {
      await gotoFreshIn(page, lang);
      await demoLogin(page, "donor", lang);

      await page.getByText(t(lang).findRequests).click();
      await expect(page.getByText(t(lang).urgentRequests).first()).toBeVisible();

      // The first request card, whatever the live data happens to be. Waited
      // for explicitly: cards render only once the Supabase fetch resolves and
      // the skeletons clear, so clicking straight away races the network.
      const firstCard = page.getByRole("button", { name: new RegExp(`${t(lang).view}\\s*→`) }).first();
      await firstCard.waitFor({ state: "visible", timeout: 30_000 });
      await firstCard.click();

      await expect(page.getByText(t(lang).requestDetails)).toBeVisible();
      await expect(page.getByRole("button", { name: t(lang).respondRequest })).toBeVisible();
    });

    test(`[${lang}] compensate flow shows its explainer`, async ({ page }) => {
      await gotoFreshIn(page, lang);
      await demoLogin(page, "donor", lang);

      await page.getByText(t(lang).compensateTitle).first().click();
      await expect(page.getByText(t(lang).compensateHint)).toBeVisible();
    });
  }
});

test.describe("hospital journey (legacy role)", () => {
  for (const lang of LANGUAGES) {
    test(`[${lang}] demo hospital reaches its dashboard`, async ({ page }) => {
      await gotoFreshIn(page, lang);
      await demoLogin(page, "hospital", lang);

      await expect(page.getByText(t(lang).activeRequests).first()).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("dir", expectedDir(lang));
    });

    test(`[${lang}] hospital console opens from home`, async ({ page }) => {
      await gotoFreshIn(page, lang);
      await demoLogin(page, "hospital", lang);

      await page.getByText(t(lang).openConsole).click();
      await expect(page.getByText(t(lang).deskTitle)).toBeVisible();
    });
  }
});

test.describe("language persistence", () => {
  test("keeps the chosen language across a reload", async ({ page }) => {
    await gotoFresh(page);
    await switchLanguage(page, "fr");
    await expect(page.getByRole("button", { name: t("fr").imDonor })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: t("fr").imDonor })).toBeVisible();
  });

  test("a stored Arabic preference survives a reload, layout included", async ({ page }) => {
    await gotoFreshIn(page, "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("button", { name: t("ar").imDonor })).toBeVisible();
  });
});
