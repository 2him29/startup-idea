/**
 * End-to-end walk of the patient/association flow against a real Supabase
 * project, using the actual @weare/core functions and real signed-in sessions
 * so every step is subject to RLS exactly as the app is.
 *
 *   npm run test:flow
 *
 * WHY THIS EXISTS SEPARATELY FROM PLAYWRIGHT
 * Two links in this chain have no UI yet — searchDonors() and recordDonation()
 * are wired into no screen — so the 90-day cooldown cannot be driven through
 * the browser. Rather than leave the most consequential rule in the product
 * (a donor must not be contacted while ineligible) proven only by a one-off
 * script, it is exercised here at the layer where it actually lives.
 *
 * TARGETING — deliberately awkward. It requires the target to be named
 * explicitly through env vars and refuses to touch the production project,
 * because unlike the Playwright suite this WRITES: it creates a patient, posts
 * a request, pledges a compensation, and records a donation.
 *
 *   QATRA_E2E_URL=https://<ref>.supabase.co \
 *   QATRA_E2E_ANON_KEY=<anon key> \
 *   npm run test:flow
 *
 * The project must have the migrations applied and supabase/seed.sql run.
 */

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** The live/demo project. Never a valid target for a test that writes. */
const PRODUCTION_REF = "wyxrzanirypztxdujsaa";

const URL = process.env.QATRA_E2E_URL;
const ANON = process.env.QATRA_E2E_ANON_KEY;
const PASSWORD = process.env.QATRA_E2E_PASSWORD || "WeAreDemo123!";

if (!URL || !ANON) {
  console.log("SKIPPED — QATRA_E2E_URL and QATRA_E2E_ANON_KEY are not set.");
  console.log("This test writes data, so it never guesses a target. See the header of this file.");
  process.exit(0);
}

if (URL.includes(PRODUCTION_REF)) {
  console.error(`REFUSING TO RUN: ${URL} is the production project.`);
  console.error("This test creates patients, requests and donations. Point it at staging.");
  process.exit(1);
}

// pathToFileURL, not a bare path: Windows absolute paths ("C:\…") are not a
// valid ESM specifier and the loader rejects them as an unknown URL scheme.
const core = await import(pathToFileURL(join(HERE, ".core.mjs")).href);

let step = 0;
const ok = (m) => console.log(`  ok  ${m}`);
const head = (m) => console.log(`\n${++step}. ${m}`);
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function signIn(email) {
  const sb = core.getSupabase();
  await sb.auth.signOut().catch(() => {});
  const { error } = await sb.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`sign-in ${email}: ${error.message}`);
  return sb;
}

async function main() {
  core.configureSupabase(URL, ANON);
  core.configureFeatures({ patientModel: true });
  console.log(`target: ${URL}`);

  // Repeatability. The run ends by recording a donation, which starts a 90-day
  // cooldown — so without clearing it first, every run after the first would
  // fail at "eligible before donating" for a reason that has nothing to do
  // with the code. The donor clears their own row; RLS allows exactly that.
  head("Reset the demo donor's cooldown so this run starts from a clean state");
  const sb = await signIn("demo.donor@weare.app");
  const donorId = (await sb.auth.getSession()).data.session.user.id;
  const { error: resetError } = await sb
    .from("donor_profiles")
    .update({ last_donation_at: null, last_donation_date: null })
    .eq("id", donorId);
  if (resetError) throw new Error(`cooldown reset: ${resetError.message}`);
  ok("previous donation cleared");

  head("Family posts a request for a patient");
  const marker = `Walkthrough ${Date.now()}`;
  const { patientId, requestId } = await core.createPatientRequest({
    patientName: marker,
    bloodType: "B-",
    wilaya: "Blida",
    units: 2,
    urgency: "Critical",
    hospitalName: "CHU Frantz Fanon – Blida",
    contactPhone: "+213555999888",
  });
  ok(`patient ${patientId.slice(0, 8)}… request ${requestId.slice(0, 8)}…`);

  head("It reaches the donor-facing list, unverified");
  let requests = await core.fetchBloodRequests();
  let mine = requests.find((r) => r.id === requestId);
  assert(mine, "the new request is not in the donor-facing list");
  assert(mine.verifiedByName === null, "a brand-new request must not arrive verified");
  ok(`"${mine.hospital}" · ${mine.bloodType} · no badge`);

  head("An association in the same wilaya vouches for it");
  await signIn("demo.association@weare.app");
  const memberships = await core.fetchMyMemberships();
  const assoc = memberships.find((m) => m.association.isVerified);
  assert(assoc, "the association member belongs to no verified association");
  await core.verifyRequest(requestId, assoc.association.id);
  ok(`verified by "${assoc.association.name}" (${assoc.association.wilaya})`);

  head("The badge reaches the donor");
  await signIn("demo.donor@weare.app");
  requests = await core.fetchBloodRequests();
  mine = requests.find((r) => r.id === requestId);
  assert(mine.verifiedByName, "the verification did not reach the donor list");
  ok(`badge: "Verified by ${mine.verifiedByName}"`);

  head("The verification survives a WhatsApp forward");
  const shared = core.formatShareMessage(core.I18N.en, {
    hospital: mine.hospital,
    bloodType: mine.bloodType,
    distance: mine.distance,
    units: mine.units,
    verifiedByName: mine.verifiedByName,
  });
  assert(shared.includes(mine.verifiedByName), "the share text omits the vouching association");
  ok(shared.split("\n").pop());

  head("Donor pledges a compensatory donation");
  const hospitals = await core.fetchHospitals();
  const pledge = await core.createCompensation({
    hospitalId: hospitals[0].id,
    patientName: marker,
    patientFile: "WALK-0001",
  });
  ok(`pledge ${pledge.reference}, status "${pledge.status}"`);

  head("Before donating, the donor is offered by search");
  // Donor search is wilaya-scoped and permitted only for a verified
  // association in that wilaya — the demo donor is enrolled in the Blida one,
  // which the seed guarantees.
  let found = await core.searchDonors({ wilaya: "Blida", bloodType: "O+" });
  assert(found.some((d) => d.id === donorId), "an eligible donor is missing from search");
  ok(`${found.length} eligible O+ donor(s), including this one`);

  head("Record the donation — this starts the 90-day cooldown");
  await core.recordDonation({ requestId });
  ok("donation recorded, request marked fulfilled");

  head("The donor is withheld from search until eligible again");
  found = await core.searchDonors({ wilaya: "Blida", bloodType: "O+" });
  assert(!found.some((d) => d.id === donorId), "a donor inside the cooldown is still being offered");
  ok("hidden from the default eligible-only search");

  const all = await core.searchDonors({ wilaya: "Blida", bloodType: "O+", includeIneligible: true });
  const self = all.find((d) => d.id === donorId);
  assert(self, "the donor vanished entirely instead of being marked ineligible");
  assert(!self.isEligible, "the donor is still flagged eligible after donating");
  assert(self.daysUntilEligible === 90, `expected 90 days, got ${self.daysUntilEligible}`);
  ok(`still visible to coordinators, greyed out: eligible in ${self.daysUntilEligible} days`);

  head("The fulfilled request stops being advertised");
  requests = await core.fetchBloodRequests();
  assert(!requests.some((r) => r.id === requestId), "a fulfilled request is still listed as open");
  ok("gone from the open list");

  console.log(`\n${step} steps passed.`);
}

main().catch((err) => {
  console.error(`\nFAILED at step ${step}: ${err.message}`);
  process.exit(1);
});
