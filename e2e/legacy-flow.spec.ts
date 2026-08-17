import { test, expect } from "@playwright/test";
import { gotoFresh, switchLanguage, demoLogin, type Lang } from "./helpers";

/**
 * Regression cover for the pre-patient-model app.
 *
 * This is the suite that has to keep passing while the patient/association
 * model is built behind its flag — it is the evidence that the hospital-facing
 * demo still works, which is the whole reason the migration is flagged rather
 * than a cutover. With VITE_PATIENT_MODEL unset (the default), these exercise
 * the legacy paths exactly as they shipped.
 */

test.describe("splash screen", () => {
  const languages: { lang: Lang; donorLabel: string; dir: string }[] = [
    { lang: "en", donorLabel: "I'm a Donor", dir: "ltr" },
    { lang: "fr", donorLabel: "Je suis donneur", dir: "ltr" },
    { lang: "ar", donorLabel: "أنا متبرع", dir: "rtl" },
  ];

  for (const { lang, donorLabel, dir } of languages) {
    test(`renders in ${lang} with dir=${dir}`, async ({ page }) => {
      await gotoFresh(page);
      await switchLanguage(page, lang);

      await expect(page.getByRole("button", { name: donorLabel })).toBeVisible();
      // Arabic must flip the whole document, not just translate the copy.
      await expect(page.locator("html")).toHaveAttribute("dir", dir);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
    });
  }
});

test.describe("donor journey", () => {
  test("demo donor reaches home and can open the find screen", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await expect(page.getByText("Quick actions")).toBeVisible();

    await page.getByText("Find urgent requests").click();
    await expect(page.getByText("Urgent requests")).toBeVisible();
  });

  test("opening a request shows its detail screen", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await page.getByText("Find urgent requests").click();
    await expect(page.getByText("Urgent requests")).toBeVisible();

    // The first request card in the list, whatever the live data happens to be.
    await page.getByRole("button", { name: /View →/ }).first().click();
    await expect(page.getByText("Request details")).toBeVisible();
    await expect(page.getByRole("button", { name: "Respond to request" })).toBeVisible();
  });

  test("compensate flow is reachable and shows its explainer", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await page.getByText("Compensate for a patient").first().click();
    await expect(page.getByText("Family replacement")).toBeVisible();
  });
});

test.describe("hospital journey (legacy role)", () => {
  test("demo hospital reaches its dashboard", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "hospital");

    await expect(page.getByText("Active requests").first()).toBeVisible();
  });

  test("hospital console opens from home", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "hospital");

    await page.getByText("Open the full hospital console").click();
    await expect(page.getByText("Requests overview")).toBeVisible();
  });
});

test.describe("language persistence", () => {
  test("keeps the chosen language across a reload", async ({ page }) => {
    await gotoFresh(page);
    await switchLanguage(page, "fr");
    await expect(page.getByRole("button", { name: "Je suis donneur" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: "Je suis donneur" })).toBeVisible();
  });
});
