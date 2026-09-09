import test from "node:test";
import assert from "node:assert/strict";
import { WILAYAS } from "./wilayas.ts";
import {
  wilayaCode,
  dairasForWilaya,
  communesForWilaya,
  communesForDaira,
  communeLabel,
  communeInWilaya,
} from "./communes.ts";

/*
 * These are coverage tests, not spot checks.
 *
 * 1541 communes cannot be read by eye, and the failure they guard against is
 * silent: a wilaya whose communes did not survive the join renders as an empty
 * dropdown in one province and nowhere else, which nobody notices until a
 * family in that province cannot post a request.
 *
 * So the assertions that matter here are the ones that hold for all 58.
 */

test("every wilaya resolves to a code, and every code carries communes", () => {
  for (const w of WILAYAS) {
    const code = wilayaCode(w.fr);
    assert.equal(code, w.code, `${w.fr} should resolve to ${w.code}`);

    const communes = communesForWilaya(w.fr);
    assert.ok(
      communes.length > 0,
      `${w.fr} (${w.code}) has no communes — the join dropped it`
    );
  }
});

test("the totals match the official division", () => {
  const dairas = WILAYAS.reduce((n, w) => n + dairasForWilaya(w.fr).length, 0);
  const communes = WILAYAS.reduce((n, w) => n + communesForWilaya(w.fr).length, 0);

  assert.equal(dairas, 548, "Algeria has 548 daïras");
  assert.equal(communes, 1541, "Algeria has 1541 communes");
});

test("the three wilayas whose spelling differs from the dataset still resolve", () => {
  // The whole reason the lookup keys on code. Joining on the name would return
  // nothing for exactly these three and everything for the other 55.
  for (const fr of ["Bordj Bou Arréridj", "El M'Ghair", "El Meniaa"]) {
    assert.ok(
      communesForWilaya(fr).length > 0,
      `${fr} lost its communes — the lookup is matching on name again`
    );
  }
});

test("a known commune sits in the wilaya it belongs to, and not in another", () => {
  assert.ok(communeInWilaya("Bab El Oued", "Alger"));
  assert.ok(!communeInWilaya("Bab El Oued", "Oran"));
});

test("communes of a daïra are a subset of the wilaya's communes", () => {
  const wilaya = "Blida";
  const all = new Set(communesForWilaya(wilaya).map((c) => c.fr));
  for (const d of dairasForWilaya(wilaya)) {
    for (const c of communesForDaira(wilaya, d.fr)) {
      assert.ok(all.has(c.fr), `${c.fr} is in daïra ${d.fr} but not in ${wilaya}`);
    }
  }
});

test("every commune carries a non-empty Arabic name", () => {
  // An empty string would render as a blank option in the Arabic UI rather
  // than as an obvious error, so it is worth asserting across the whole set.
  for (const w of WILAYAS) {
    for (const c of communesForWilaya(w.fr)) {
      assert.ok(c.ar.trim().length > 0, `${c.fr} (${w.fr}) has no Arabic name`);
    }
  }
});

test("communeLabel follows the language, and returns Arabic only for ar", () => {
  assert.equal(communeLabel("Bab El Oued", "fr"), "Bab El Oued");
  assert.equal(communeLabel("Bab El Oued", "en"), "Bab El Oued");
  assert.notEqual(communeLabel("Bab El Oued", "ar"), "Bab El Oued");
});

test("unknown and missing values are handled the way wilayaLabel handles them", () => {
  // A commune this dataset does not carry is likelier to be a real place
  // spelled differently than a mistake, so it comes back as given.
  assert.equal(communeLabel("Somewhere Not In The Division", "fr"), "Somewhere Not In The Division");
  assert.equal(communeLabel(null, "fr"), "—");
  assert.equal(communeLabel(undefined, "ar"), "—");

  assert.equal(wilayaCode("Not A Wilaya"), null);
  assert.deepEqual(communesForWilaya("Not A Wilaya"), []);
  assert.deepEqual(dairasForWilaya(null), []);
  assert.deepEqual(communesForDaira("Alger", null), []);
  assert.equal(communeInWilaya(null, "Alger"), false);
});
