import { test, expect } from "@playwright/test";
import { gotoFresh, gotoFreshIn, demoLogin, openCommittee, t, PATIENT_MODEL_ENABLED } from "./helpers";

/**
 * Committee invite links.
 *
 * These write, and what they write cannot be deleted: revoking an invite is
 * deliberately not a delete, because the redemptions under it are the record
 * of how those donors arrived. So the suite creates as little as it can — one
 * invite in one test, labelled with the run's timestamp so it can be found
 * among the rows earlier runs left behind — and every other assertion is made
 * against codes that never existed, which touches nothing.
 *
 * Counts are never asserted exactly. Three workers share one staging database
 * and one demo account, so "1 joined" is true only until another worker gets
 * there.
 */
test.describe("committee invites", () => {
  test.skip(
    !PATIENT_MODEL_ENABLED,
    "Invites belong to the patient/association model; the legacy app has no committee."
  );

  /**
   * The paragraph before the button.
   *
   * A committee's first instinct is to ask where to upload its member list,
   * and the product's answer is that it cannot — the donor signs up and
   * consents themselves. That is the whole design, so if the sentence ever
   * disappears this should fail rather than the screen quietly becoming a form
   * with no explanation.
   */
  test("the screen says a committee cannot upload anyone's number", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");
    await openCommittee(page, "invites");

    await expect(page.getByText(t("en").invitesTitle).first()).toBeVisible();
    await expect(page.getByText(t("en").invitesIntro)).toBeVisible();
    // The demo donor is an administrator of CRA Blida, so the create form is
    // offered. A volunteer would see invitesAdminOnly instead.
    await expect(page.getByTestId("create-invite")).toBeVisible();
  });

  /**
   * The whole loop, in one journey, because the halves are only meaningful
   * together: a code that cannot be followed is not an invitation.
   *
   * The redemption step is also the regression test for a bug that shipped and
   * was caught the same day. The banner used to tell a donor who was already
   * signed in to "create your account" for the moment between the description
   * arriving and the redemption finishing — premature, and false for someone
   * who already had an account. The assertion is not just that "you're on the
   * list" appears, but that the join prompt never does.
   */
  test("an administrator creates a link, a donor follows it, and the committee sees the join", async ({ page }) => {
    await gotoFresh(page);
    await demoLogin(page, "donor");
    await openCommittee(page, "invites");

    // Both Playwright projects run this concurrently against one staging
    // database, so the label needs more than a timestamp to stay unique.
    const label = `e2e ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await page.getByTestId("invite-label").fill(label);
    await page.getByTestId("create-invite").click();

    const row = page.getByTestId("invite-row").filter({ hasText: label });
    await expect(row).toBeVisible({ timeout: 30_000 });

    // Ten characters from an alphabet with no O/0 and no I/1, because these
    // get read aloud in a room and copied off printed pages.
    const code = (await row.innerText()).match(/\b[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}\b/)?.[0];
    expect(code, "the row should show a generated code").toBeTruthy();

    /*
     * Record every state the banner passes through, not just the one it ends
     * on. The first version of this test asserted the join prompt was absent
     * once the accepted message had arrived, which is trivially true however
     * the code behaves — reintroducing the bug did not fail it. The prompt is
     * a flash, so catching it means watching from before the page loads.
     */
    await page.addInitScript(() => {
      const seen: string[] = [];
      (window as unknown as { __bannerStates: string[] }).__bannerStates = seen;
      const record = () => {
        const el = document.querySelector('[data-testid="invite-banner"]');
        if (!el) return;
        const text = (el as HTMLElement).innerText.replace(/\s+/g, " ").trim();
        if (text && seen[seen.length - 1] !== text) seen.push(text);
      };
      // `document`, not `document.documentElement`: this runs before the
      // document is parsed, and observing a null root throws and takes the
      // whole init script with it — which reads as "the banner never
      // rendered" rather than as a broken observer.
      new MutationObserver(record).observe(document, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });

    // Follow the link as the same signed-in donor.
    await page.goto(`/?invite=${code}`);
    const banner = page.getByTestId("invite-banner");
    await expect(banner).toBeVisible({ timeout: 30_000 });
    await expect(banner).toContainText(t("en").inviteAccepted.split("{association}")[1].trim());

    // Somebody who already has an account must never be told to create one,
    // not even for the moment between the description arriving and the
    // redemption finishing.
    const states = await page.evaluate(
      () => (window as unknown as { __bannerStates: string[] }).__bannerStates
    );
    expect(states.length, "the observer should have seen the banner").toBeGreaterThan(0);
    expect(
      states.filter((s) => s.includes(t("en").inviteJoinBody)),
      `banner passed through a "create your account" state: ${JSON.stringify(states)}`
    ).toEqual([]);

    await page.getByTestId("dismiss-invite").click();
    await expect(banner).toBeHidden();

    // Back on the committee side, the join is counted.
    await openCommittee(page, "invites");
    await expect(page.getByTestId("invite-row").filter({ hasText: label })).toContainText(
      t("en").invitesJoined.replace("{count}", "1")
    );

    // Withdraw it so later runs are not offered a live link from this one.
    // Revoking is not deleting: the row stays, marked, and its redemption with
    // it — which is the point of the assertion that follows.
    await page.getByTestId("invite-row").filter({ hasText: label }).getByTestId("revoke-invite").click();
    await expect(page.getByTestId("invite-row").filter({ hasText: label })).toContainText(
      t("en").invitesRevoked
    );
  });

  /**
   * A code that never existed.
   *
   * Writes nothing, and covers the second half of the same bug: the code used
   * to sit in localStorage after failing to resolve, to be looked up again on
   * every load for the life of the install. It is dropped on the spot now.
   */
  test("a link that was never real says so, and does not linger", async ({ page }) => {
    await gotoFresh(page);
    await page.goto("/?invite=NOTAREALXX");

    const banner = page.getByTestId("invite-banner");
    await expect(banner).toBeVisible({ timeout: 30_000 });
    await expect(banner).toContainText(t("en").inviteInvalidTitle);

    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem("qatra-invite")), {
        message: "a code that resolves to nothing must not be kept for next time",
        timeout: 15_000,
      })
      .toBeNull();

    // And the code is taken out of the address bar, so a refresh does not
    // re-run the flow and a screenshot does not carry it.
    expect(new URL(page.url()).searchParams.get("invite")).toBeNull();
  });

  /** The banner is mounted above the screen switch, so it has to mirror too. */
  test("[ar] the invite banner renders right-to-left", async ({ page }) => {
    await gotoFreshIn(page, "ar");
    await page.goto("/?invite=NOTAREALXX");

    const banner = page.getByTestId("invite-banner");
    await expect(banner).toBeVisible({ timeout: 30_000 });
    await expect(banner).toContainText(t("ar").inviteInvalidTitle);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
