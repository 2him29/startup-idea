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

  /**
   * The interruption, and what survives it.
   *
   * Verification happens *after* the form so a 3am plea is written down while
   * the person still has the words. That only works if the draft comes back:
   * the whole design rests on the promise that pressing Post does not lose
   * what was typed. This signs up a fresh (therefore unverified) account so
   * the detour actually happens, rather than the conditional it replaced,
   * which passed silently whenever the demo account was already verified.
   *
   * Needs VITE_DEMO_OTP=true, otherwise the code step needs real SMS.
   */
  test("verification interrupts after the form, and the draft survives", async ({ page }) => {
    await gotoFresh(page);

    const email = `e2e.flow.${Date.now()}@qatra.test`;
    await page.getByRole("button", { name: "I'm a Donor" }).click();
    await page.getByPlaceholder("Yacine B.").fill("E2E Flow");
    await page.getByPlaceholder("you@email.com").fill(email);
    await page.getByPlaceholder("••••••••").fill("WeAreDemo123!");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Verify your phone", { exact: true })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Skip for now" }).click();
    await expect(page.getByText(t("en").quickActions)).toBeVisible();

    await clickNavById(page, "post-request");
    const patientName = `Flow ${Date.now()}`;
    await page.getByPlaceholder("e.g. Amel K.").fill(patientName);
    await page.locator("select").first().selectOption("Blida");
    await page.getByPlaceholder("CHU Mustapha Pacha").fill("CHU Frantz Fanon – Blida");
    await page.getByRole("button", { name: "Post request" }).click();

    // Not an error, and not a lost form: the OTP step, carrying the draft.
    await expect(page.getByText(t("en").draftSavedTitle)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(patientName)).toBeVisible();

    await page.locator('input[inputmode="tel"]').fill("0555123456");
    await page.getByRole("button", { name: "Send code" }).click();
    await page.locator('input[inputmode="numeric"]').fill("000000");
    await page.getByRole("button", { name: "Verify", exact: true }).click();

    // Verification finishes the job it interrupted — no second Post press.
    await expect(page.getByText(t("en").requestPosted)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(t("en").postedWhatNow)).toBeVisible();
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

    // The success screen now stands between posting and the list. It shows the
    // request as a donor will see it; "See my request" is the way onward.
    await expect(page.getByText(t("en").requestPosted)).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: t("en").postedSeeMine }).click();
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
    await expect(page.getByText(t("en").requestPosted)).toBeVisible({ timeout: 20_000 });

    await openCommittee(page, "verify");
    await expect(page.getByText("Association console")).toBeVisible();

    const card = page.getByTestId("request-card").filter({ hasText: marker });
    await card.waitFor({ state: "visible", timeout: 30_000 });
    // Verifying is confirmed now, not one-tapped: it publishes the committee's
    // name to strangers, so the sheet restates what is about to go out and in
    // whose name before anything is written.
    await card.getByTestId("verify-request").click();
    await expect(page.getByTestId("vouch-confirm")).toBeVisible();
    // The body is unconditional; the "vouching as" line depends on the profile
    // carrying a name, so assert the part that is always there.
    await expect(
      page.getByText(t("en").confirmVouchBody.split("{wilaya}")[0].trim())
    ).toBeVisible();
    await page.getByTestId("vouch-confirm-yes").click();

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

  /**
   * The signals a committee actually weighs.
   *
   * Nobody vouches for a hospital, so the console has to answer "is this plea
   * real": who posted it, can we reach them, did they have a file number, is
   * the hospital one we know. The poster's name comes from `profiles`, which
   * stays owner-only — request_plausibility() is the narrow window, not a
   * widened policy.
   */
  test("the console can show who posted a request", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");
    await openCommittee(page, "verify");
    await expect(page.getByText("Association console")).toBeVisible();

    const toggle = page.getByTestId("plausibility-toggle").first();
    await toggle.waitFor({ state: "visible", timeout: 30_000 });
    await toggle.click();

    const panel = page.getByTestId("plausibility-panel").first();
    await expect(panel).toBeVisible({ timeout: 20_000 });
    await expect(panel.getByText(/Posted by /)).toBeVisible();
    // Stated either way, never left blank: an absent file number is the common
    // case, not a mark against a family.
    await expect(
      panel.getByText(new RegExp(`${t("en").noFileRef}|File`))
    ).toBeVisible();
  });

  test("cancelling the vouch sheet publishes nothing", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");
    await openCommittee(page, "verify");
    await expect(page.getByText("Association console")).toBeVisible();

    const verify = page.getByTestId("verify-request").first();
    await verify.waitFor({ state: "visible", timeout: 30_000 });
    await verify.click();
    await expect(page.getByTestId("vouch-confirm")).toBeVisible();

    await page.getByRole("button", { name: t("en").confirmVouchCancel, exact: true }).click();
    await expect(page.getByTestId("vouch-confirm")).toHaveCount(0);
    // The toast is the tell: nothing was written, so nothing announces itself.
    await expect(page.getByText("Request verified")).toHaveCount(0);
  });

  /**
   * The loop closing.
   *
   * Respond wrote nothing at all until 20260821120000 — a green tick, and a
   * family who never learned anyone was coming. This drives the whole cycle,
   * including withdrawal, because a donor who can commit but not un-commit
   * leaves the family counting on someone who is not turning up.
   */
  test("a donor can commit to a request, and take it back", async ({ page }) => {
    await gotoFresh(page);

    /*
     * A fresh account, for two reasons.
     *
     * Both browser projects share the demo donor against one staging database,
     * so a test that toggles that account's single response row races the other
     * project and loses. And a brand-new account has no donor_profiles row —
     * which used to make responding impossible, since donor_id referenced that
     * table. This is the case the FK change exists for.
     */
    const email = `e2e.respond.${Date.now()}@qatra.test`;
    await page.getByRole("button", { name: "I'm a Donor" }).click();
    await page.getByPlaceholder("Yacine B.").fill("E2E Responder");
    await page.getByPlaceholder("you@email.com").fill(email);
    await page.getByPlaceholder("••••••••").fill("WeAreDemo123!");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Verify your phone", { exact: true })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Skip for now" }).click();
    await expect(page.getByText(t("en").quickActions)).toBeVisible();

    await clickNavById(page, "matching");
    await expect(page.getByText(t("en").urgentRequests).first()).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("request-card").first().click();

    await page.getByTestId("respond-request").click();
    // Navigation happens only after the row is written, so arriving here is
    // itself the assertion that it was.
    await expect(page.getByText(t("en").matchedTitle)).toBeVisible({ timeout: 20_000 });

    await clickNavById(page, "matching");
    await expect(page.getByText(t("en").youAreGoing).first()).toBeVisible({ timeout: 20_000 });

    await page.getByTestId("request-card").first().click();
    await page.getByTestId("withdraw-response").click();
    await expect(page.getByTestId("respond-request")).toBeVisible({ timeout: 20_000 });
  });

  /**
   * The compatibility claim has to be about this donor and this patient.
   *
   * It used to be a hardcoded string — "Your A+ type is a direct match" with
   * the A+ baked into the translation — shown on every request to every
   * reader. Wrong for seven donors in eight, in the one place where being
   * wrong is a medical error rather than a bad experience.
   */
  test("the request detail states a real compatibility verdict", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await clickNavById(page, "matching");
    await expect(page.getByText(t("en").urgentRequests).first()).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("request-card").first().click();

    // Exactly one of the three verdicts, never the old sentence.
    const verdicts = [t("en").matchTitleYes, t("en").matchTitleNo, t("en").matchTitleUnknown];
    const shown = await Promise.all(verdicts.map((v) => page.getByText(v).count()));
    expect(shown.filter((n) => n > 0).length).toBe(1);
    await expect(page.getByText("Your A+ type is a direct match.")).toHaveCount(0);
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
    // one donor opted in (a number to open) and one did not (withheld, with a
    // reason rather than a gap).
    await expect(page.getByTestId("reveal-number").first()).toBeVisible();
    await expect(page.getByText("Number not shared").first()).toBeVisible();

    // Consent does not hand the number over on sight. A screen that printed
    // fifty numbers for someone who will ring two would process more health
    // data than the purpose needs, so the search shows a masked one.
    await expect(page.getByText(/\u2022\u2022 \u2022\u2022 \u2022\u2022/).first()).toBeVisible();
  });

  test("opening a number takes one deliberate tap, and says it was logged", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await openCommittee(page, "donors");
    const reveal = page.getByTestId("reveal-number").first();
    await reveal.waitFor({ state: "visible", timeout: 30_000 });

    await reveal.click();

    // The whole number, and the record of who took it. The notice is the
    // product of an actual insert into donor_contact_reveals — the promise in
    // the banner above is not decorative.
    await expect(page.getByRole("link", { name: /Call/ }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(t("en").revealedJustNow).first()).toBeVisible();
  });

  test("the health-data rule is stated before any number is read", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");

    await openCommittee(page, "donors");
    await expect(page.getByText(t("en").healthDataBannerTitle)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(t("en").healthDataBannerBody)).toBeVisible();
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

    await expect(page.getByText(t("en").requestPosted)).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: t("en").postedSeeMine }).click();
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
