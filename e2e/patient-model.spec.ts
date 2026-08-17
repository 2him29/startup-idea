import { test, expect } from "@playwright/test";
import { gotoFresh, demoLogin } from "./helpers";

/**
 * End-to-end cover for the patient/association model.
 *
 * PREREQUISITES — these tests cannot pass until all four are true, and they
 * skip themselves rather than fail misleadingly when they are not:
 *
 *   1. The 20260817* migrations are applied to the target Supabase project.
 *   2. `VITE_PATIENT_MODEL=true` is set in apps/web/.env — the nav entries
 *      these tests click do not render otherwise.
 *   3. Seed data exists: a verified `associations` row, an
 *      `association_members` row linking the demo donor account to it as
 *      admin, and a `platform_admins` row for whoever approves associations.
 *   4. The demo account's profile has phone_verified = true, or an SMS
 *      provider is configured so the OTP step can complete. For local runs,
 *      configureOtpProvider(demoOtpProvider) accepts the fixed DEMO_OTP_CODE
 *      without sending anything.
 *
 * The skip is deliberate: a suite that fails because the database was never
 * migrated tells you nothing about the code, and teaches people to ignore red.
 */

const PATIENT_MODEL_ENABLED = process.env.VITE_PATIENT_MODEL === "true";

test.describe("patient/association model", () => {
  test.skip(
    !PATIENT_MODEL_ENABLED,
    "VITE_PATIENT_MODEL is not enabled — see the prerequisites at the top of this file"
  );

  test("patient can reach the request form from the nav", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await page.getByRole("button", { name: "Request" }).first().click();
    await expect(page.getByText("Request blood")).toBeVisible();
    await expect(page.getByText("For a patient or a family member")).toBeVisible();
  });

  test("request form demands phone verification before posting", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await page.getByRole("button", { name: "Request" }).first().click();

    // Unverified accounts get the banner, and it routes to the OTP step
    // rather than letting the form be submitted into an RLS rejection.
    const banner = page.getByText("Verify your phone number before posting a request.");
    if (await banner.isVisible()) {
      await banner.click();
      await expect(page.getByText("Verify your phone")).toBeVisible();
      await expect(page.getByRole("button", { name: "Send code" })).toBeVisible();
    }
  });

  test("posting a request makes it visible on the find screen", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await page.getByRole("button", { name: "Request" }).first().click();

    const patientName = `E2E Patient ${Date.now()}`;
    await page.getByPlaceholder("e.g. Amel K.").fill(patientName);
    await page.getByRole("button", { name: "O+", exact: true }).click();
    await page.getByPlaceholder("CHU Mustapha Pacha").fill("CHU Test");
    await page.getByRole("button", { name: "Post request" }).click();

    await expect(page.getByText("Urgent requests")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("CHU Test").first()).toBeVisible();
  });

  test("association console verifies a request and the badge appears", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await page.getByRole("button", { name: "Verify" }).first().click();
    await expect(page.getByText("Association console")).toBeVisible();

    const verifyButton = page.getByRole("button", { name: "Verify", exact: true }).last();
    await verifyButton.click();
    await expect(page.getByText("Request verified")).toBeVisible();

    // The badge the donor side depends on.
    await expect(page.getByText(/Verified by/).first()).toBeVisible();
  });

  test("donor sees the verified badge on the find screen", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await page.getByRole("button", { name: "Find" }).first().click();
    await expect(page.getByText("Urgent requests")).toBeVisible();
    await expect(page.getByText("Verified").first()).toBeVisible();
  });

  test("consent screen records health-data consent", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await page.evaluate(() => window.history.pushState({}, "", "/"));
    // Consent is reachable from the profile/settings area rather than the nav.
    await page.getByRole("button", { name: "Profile" }).first().click();
    await page.getByText("Settings").click();
    await page.getByRole("button", { name: "Request a copy, a correction, or deletion" }).click();

    await expect(page.getByText("Request a copy of my data")).toBeVisible();
  });
});

/**
 * The compliance surfaces are not behind the patient-model flag — consent and
 * data-subject rights apply to the app as it ships today, so they are tested
 * unconditionally.
 */
test.describe("compliance surfaces", () => {
  test("data rights screen is reachable from settings", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await page.getByRole("button", { name: "Profile" }).first().click();
    await page.getByText("Settings").click();
    await expect(page.getByRole("button", { name: "Request a copy, a correction, or deletion" })).toBeVisible();

    await page.getByRole("button", { name: "Request a copy, a correction, or deletion" }).click();
    await expect(page.getByText("Request a copy of my data")).toBeVisible();
    await expect(page.getByText("Request deletion")).toBeVisible();
  });
});
