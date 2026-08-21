import test from "node:test";
import assert from "node:assert/strict";
import { canDonate, compatibleDonors, matchKind, isUniversalDonor, BLOOD_TYPES } from "./compatibility.ts";

/**
 * The full 8x8 transfusion table, written out independently of the
 * implementation.
 *
 * Deliberately not derived from CAN_RECEIVE_FROM — a test that reuses the
 * thing it is testing proves only that the code equals itself. Each row is
 * "this donor can give to these recipients", which is the direction a donor
 * thinks in, while the module is keyed the other way round. Getting the same
 * answer from both directions is most of the value here.
 */
const CAN_GIVE_TO: Record<string, string[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], // universal donor
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"], // universal recipient, gives only to its own
};

test("the 8x8 table matches a transfusion chart in both directions", () => {
  for (const donor of BLOOD_TYPES) {
    for (const recipient of BLOOD_TYPES) {
      const expected = CAN_GIVE_TO[donor].includes(recipient);
      assert.equal(
        canDonate(donor, recipient),
        expected,
        `${donor} -> ${recipient} should be ${expected}`
      );
    }
  }
});

test("O- gives to everyone, AB+ receives from everyone", () => {
  for (const recipient of BLOOD_TYPES) assert.ok(canDonate("O-", recipient), `O- should give to ${recipient}`);
  for (const donor of BLOOD_TYPES) assert.ok(canDonate(donor, "AB+"), `AB+ should receive from ${donor}`);
  assert.ok(isUniversalDonor("O-"));
  assert.ok(!isUniversalDonor("O+"));
});

test("AB+ gives only to AB+, and O- receives only from O-", () => {
  const abPlusGivesTo = BLOOD_TYPES.filter((r) => canDonate("AB+", r));
  assert.deepEqual(abPlusGivesTo, ["AB+"]);
  const oMinusReceivesFrom = compatibleDonors("O-");
  assert.deepEqual([...oMinusReceivesFrom], ["O-"]);
});

test("rhesus is not symmetric: positive never gives to negative", () => {
  for (const donor of BLOOD_TYPES.filter((t) => t.endsWith("+"))) {
    for (const recipient of BLOOD_TYPES.filter((t) => t.endsWith("-"))) {
      assert.equal(canDonate(donor, recipient), false, `${donor} must not give to ${recipient}`);
    }
  }
});

test("unknown or missing types answer false, never true", () => {
  // The safe answer to "do we know this is safe?" is no.
  for (const bad of [null, undefined, "", "  ", "C+", "A", "+", "XYZ", "AB", "O±"]) {
    assert.equal(canDonate(bad, "AB+"), false, `donor ${JSON.stringify(bad)} should not match`);
    assert.equal(canDonate("O-", bad), false, `recipient ${JSON.stringify(bad)} should not match`);
  }
});

test("input is forgiving about case, spaces and a zero for O", () => {
  assert.ok(canDonate("o-", "ab+"));
  assert.ok(canDonate(" O- ", "AB+"));
  assert.ok(canDonate("O -", "AB+"));
  // "0+" is a common typo for O+ on a keyboard and in handwriting.
  assert.ok(canDonate("0-", "AB+"));
  assert.equal(matchKind("0+", "O+"), "exact");
});

test("matchKind separates exact from merely compatible, and knows when it does not know", () => {
  assert.equal(matchKind("A+", "A+"), "exact");
  assert.equal(matchKind("O-", "A+"), "compatible");
  assert.equal(matchKind("A+", "O-"), "incompatible");
  assert.equal(matchKind(null, "A+"), "unknown");
  assert.equal(matchKind("A+", null), "unknown");
  // A donor who has not recorded a type should be asked, not refused.
  assert.notEqual(matchKind(undefined, "A+"), "incompatible");
});
