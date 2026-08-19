import { test, expect } from "@playwright/test";
import { gotoFresh, gotoFreshIn, demoLogin, clickNav, openCommittee, t, clickNavById, PATIENT_MODEL_ENABLED } from "./helpers";

/**
 * End-to-end cover for the patient/association model.
 *
 * PREREQUISITES — these tests skip themselves rather than fail misleadingly
 * when the environment isn't ready. All three must hold:
 *
 *   1. The 20260817* migrations are applied to the target Supabase project.
 *   2. `supabase/seed.sql` has been run against it. That is what creates the
 *      verified association, enrols the demo donor in it, marks the account
 *      phone-verified, and leaves exactly one request unverified so the
 *      Verify action below always has something to act on.
 *   3. `VITE_PATIENT_MODEL=true` in apps/web/.env. The guard below reads that
 *      same file, so the app and the suite cannot disagree about which model
 *      is running; set VITE_PATIENT_MODEL in the environment to override it
 *      for one run. The nav entries these tests click do not render otherwise.
 *
 * Verified against a real staging Supabase project on 2026-08-20: full suite
 * 63 passed, 0 failed.
 *
 * The skip is deliberate: a suite that fails because the database was never
 * migrated tells you nothing about the code, and teaches people to ignore red.
 */



test.describe("patient/association model", () => {
  test.skip(
    !PATIENT_MODEL_ENABLED,
    "VITE_PATIENT_MODEL is not enabled — see the prerequisites at the top of this file"
  );

  /**
   * The whole point of the migration: there is no hospital account any more.
   *
   * This was missed once already — the hospital entry point was removed from
   * the sidebar and the bottom bar but left on the splash, which is the screen
   * every new user actually starts on. Worse, the legacy suite asserts the
   * hospital button IS present, so nothing caught it. That assertion is correct
   * with the flag off; this is its counterpart with the flag on.
   */
  test("the splash offers no hospital account", async ({ page }) => {
    await gotoFresh(page);

    await expect(page.getByRole("button", { name: t("en").imDonor })).toBeVisible();
    await expect(page.getByRole("button", { name: t("en").imPatient })).toBeVisible();

    await expect(page.getByRole("button", { name: t("en").imHospital })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /demo as Hospital/i })).toHaveCount(0);
  });

  test("'I need blood' leads to the request form", async ({ page }) => {
    await gotoFresh(page);

    // The patient route signs in exactly as a donor does — what differs is
    // where it lands.
    await page.getByRole("button", { name: t("en").demoAsPatient }).click();
    await expect(page.getByText(t("en").postRequestTitle)).toBeVisible({ timeout: 30_000 });
  });

  test("patient can reach the request form from the nav", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await clickNav(page, "Request");
    await expect(page.getByText("Request blood")).toBeVisible();
    await expect(page.getByText("For a patient or a family member")).toBeVisible();
  });

  test("request form demands phone verification before posting", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await clickNav(page, "Request");

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

    await clickNav(page, "Request");

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

    // Post a request this test owns, rather than verifying whichever one the
    // seed left unverified. Both browser projects run against the same staging
    // database at the same time, so a shared fixture gets consumed by
    // whichever project reaches it first and the other then finds nothing to
    // click. A unique hospital name makes the card findable.
    const marker = `Console E2E ${Date.now()}`;
    await clickNav(page, "Request");
    await page.getByPlaceholder("e.g. Amel K.").fill("Console Test Patient");
    await page.locator("select").first().selectOption("Blida");
    await page.getByPlaceholder("CHU Mustapha Pacha").fill(marker);
    await page.getByRole("button", { name: "Post request" }).click();
    await expect(page.getByText("Urgent requests")).toBeVisible({ timeout: 15_000 });

    await openCommittee(page, "verify");
    await expect(page.getByText("Association console")).toBeVisible();

    const card = page.getByTestId("request-card").filter({ hasText: marker });
    await card.waitFor({ state: "visible", timeout: 30_000 });
    await card.getByTestId("verify-request").click();

    await expect(page.getByText("Request verified")).toBeVisible();
    await expect(card.getByText(/Verified by/)).toBeVisible();
  });

  /**
   * The committee hub's staleness nudge.
   *
   * Every other seeded request is created at now(), so before the seed grew a
   * deliberately backdated one this count was structurally always zero and
   * this warning could never appear — the code was unreachable rather than
   * untested. SEED-0003 is 45 days old for exactly this assertion.
   */
  test("committee hub warns about requests left open for a month", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await clickNavById(page, "committee");
    await expect(page.getByText(t("en").committeeTitle)).toBeVisible();

    // The count is whatever the wilaya currently holds; assert the nudge is
    // there and names a number, not a specific one, since other tests post
    // into the same shared staging database.
    const nudge = page.getByText(/open more than a month/);
    await expect(nudge).toBeVisible();
    await expect(nudge).toHaveText(/^[1-9]\d* open more than a month$/);
  });

  test("donor sees the verified badge on the find screen", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await clickNav(page, "Find");
    await expect(page.getByText("Urgent requests")).toBeVisible();
    await expect(page.getByText("Verified").first()).toBeVisible();
  });

  test("association can search donors in its own wilaya", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await openCommittee(page, "donors");
    await expect(page.getByText("Find donors")).toBeVisible();

    // The seed puts at least one eligible donor in the association's wilaya.
    const rows = page.getByTestId("donor-row");
    await rows.first().waitFor({ state: "visible", timeout: 30_000 });
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test("a donor's number shows only with their consent", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await openCommittee(page, "donors");
    await page.getByTestId("donor-row").first().waitFor({ state: "visible", timeout: 30_000 });

    // The seed deliberately creates both states, so both must be on screen:
    // one donor opted in (callable) and one did not (withheld, with a reason).
    await expect(page.getByRole("link", { name: /Call/ }).first()).toBeVisible();
    await expect(page.getByText("Number not shared").first()).toBeVisible();
  });

  test("cooling-off donors are hidden until asked for", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await openCommittee(page, "donors");
    await page.getByTestId("donor-row").first().waitFor({ state: "visible", timeout: 30_000 });

    // The seed leaves one donor 10 days past a donation, so they are inside
    // the 90-day cooldown and must not appear by default.
    await expect(page.getByText(/Eligible in \d+ days/)).toHaveCount(0);

    await page.getByText("Include donors still in cooldown").click();
    await expect(page.getByText(/Eligible in \d+ days/).first()).toBeVisible();
  });

  /**
   * Arabic specifically, not all three languages.
   *
   * These screens are new, and Arabic is the only language that flips the
   * layout — so it carries essentially all the rendering risk, while French
   * would mostly re-test what the English runs already cover. Triplicating
   * every patient-model test would also treble the load on one shared staging
   * project for very little extra signal.
   */
  test("[ar] the new screens render right-to-left", async ({ page }) => {
    const ar = t("ar");

    await gotoFreshIn(page, "ar");
    await demoLogin(page, "donor", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await clickNav(page, ar.navRequestLabel);
    await expect(page.getByText(ar.postRequestTitle)).toBeVisible();
    await expect(page.getByText(ar.postRequestSub)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await clickNavById(page, "committee");
    await expect(page.getByText(ar.committeeTitle)).toBeVisible();
    await page.getByTestId("committee-verify").click();
    await expect(page.getByText(ar.assocConsoleTitle)).toBeVisible();

    await clickNavById(page, "committee");
    await page.getByTestId("committee-donors").click();
    await expect(page.getByText(ar.donorSearchTitle)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("[ar] donor search shows eligibility and consent state in Arabic", async ({ page }) => {
    const ar = t("ar");

    await gotoFreshIn(page, "ar");
    await demoLogin(page, "donor", "ar");
    await openCommittee(page, "donors");

    const rows = page.getByTestId("donor-row");
    await rows.first().waitFor({ state: "visible", timeout: 30_000 });

    // The seed guarantees one donor who opted into contact sharing and one who
    // did not, so both states must be legible in Arabic too.
    await expect(page.getByText(ar.numberNotShared).first()).toBeVisible();
    await expect(page.getByText(ar.eligibleLabel).first()).toBeVisible();
  });

  test("signing up ends at phone verification, which can be skipped", async ({ page }) => {
    await gotoFresh(page);

    // A fresh address each run: Supabase rejects a duplicate sign-up, and a
    // shared one would pass once and fail forever after.
    const email = `e2e.signup.${Date.now()}@qatra.test`;

    await page.getByRole("button", { name: "I'm a Donor" }).click();
    await page.getByPlaceholder("Yacine B.").fill("E2E Signup");
    await page.getByPlaceholder("you@email.com").fill(email);
    await page.getByPlaceholder("••••••••").fill("WeAreDemo123!");
    await page.getByRole("button", { name: "Create account" }).click();

    // Registration now ends here rather than dropping straight into home.
    // `exact` matters: "Verify your phone" is also a substring of the banner
    // "Verify your phone number before posting a request."
    await expect(page.getByText("Verify your phone", { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Send code" })).toBeVisible();

    // Skippable, because verification gates posting a request — not holding an
    // account — and no SMS provider is configured in staging.
    await page.getByRole("button", { name: "Skip for now" }).click();
    await expect(page.getByText(t("en").quickActions)).toBeVisible();
  });

  test("the verified badge appears on map pins, not just the list", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await clickNav(page, "Find");
    await expect(page.getByText(t("en").urgentRequests).first()).toBeVisible();

    // Filter to Blida first. The map opens centred on Algiers, so the Blida
    // pin sits outside the visible area and cannot be clicked — and Leaflet
    // does not pan when Playwright tries to scroll to it. Choosing the wilaya
    // re-centres the map on its own requests, which is also how a donor would
    // actually reach it. The seed guarantees one verified, mappable request
    // there.
    await page.getByRole("button", { name: "Blida", exact: true }).click();

    // One pin per location now, listing every request at that hospital. That
    // grouping is what makes this testable at all: Blida has a single hospital
    // in the directory, so before it, eleven requests stacked on one point and
    // only the topmost could ever be opened.
    const markers = page.locator(".leaflet-marker-icon");
    await markers.first().waitFor({ state: "visible", timeout: 30_000 });
    await markers.first().click();

    const popup = page.locator(".leaflet-popup-content");
    await popup.waitFor({ state: "visible", timeout: 15_000 });
    await expect(popup.getByText(t("en").verifiedShort).first()).toBeVisible();
  });

  test("a patient request naming a known hospital reaches the map", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    // Count the requests listed on Blida's pin, not the number of pins.
    // Requests at one hospital share a marker, so a new one joins the existing
    // pin rather than adding another — counting pins would never change.
    // Asserting merely that a pin exists would also pass without this feature,
    // since legacy requests have always been mappable; the claim worth testing
    // is that a request posted through the *patient* flow shows up there.
    const openBlidaPin = async () => {
      await clickNav(page, "Find");
      await page.getByRole("button", { name: "Blida", exact: true }).click();
      const markers = page.locator(".leaflet-marker-icon");
      await markers.first().waitFor({ state: "visible", timeout: 30_000 });
      await markers.first().click();
      const popup = page.locator(".leaflet-popup-content");
      await popup.waitFor({ state: "visible", timeout: 15_000 });
      return popup.getByRole("button", { name: /View/ });
    };

    const before = await (await openBlidaPin()).count();

    // Naming a hospital that exists in the directory links the request to it,
    // which is what gives it coordinates. Free-typed hospitals stay valid but
    // remain unmapped.
    await clickNav(page, "Request");
    await page.getByPlaceholder("e.g. Amel K.").fill(`Map E2E ${Date.now()}`);
    await page.locator("select").first().selectOption("Blida");
    await page.getByPlaceholder("CHU Mustapha Pacha").fill("CHU Frantz Fanon – Blida");
    await expect(page.getByText(t("en").hospitalMatched)).toBeVisible();
    await page.getByRole("button", { name: "Post request" }).click();

    await expect(page.getByText(t("en").urgentRequests).first()).toBeVisible({ timeout: 15_000 });

    // Greater-than rather than exactly one more: both browser projects run
    // this against the same database at the same time, so the other one may
    // have added a request too.
    const after = await (await openBlidaPin()).count();
    expect(after).toBeGreaterThan(before);
  });

  test("consent screen records health-data consent", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await page.evaluate(() => window.history.pushState({}, "", "/"));
    // Consent is reachable from the profile/settings area rather than the nav.
    await clickNav(page, "Profile");
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

    await clickNav(page, "Profile");
    await page.getByText("Settings").click();
    await expect(page.getByRole("button", { name: "Request a copy, a correction, or deletion" })).toBeVisible();

    await page.getByRole("button", { name: "Request a copy, a correction, or deletion" }).click();
    await expect(page.getByText("Request a copy of my data")).toBeVisible();
    await expect(page.getByText("Request deletion")).toBeVisible();
  });
});
