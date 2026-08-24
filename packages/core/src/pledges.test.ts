import { test } from "node:test";
import assert from "node:assert/strict";
import { pledgeProgress } from "./pledges.ts";

test("reports progress against what the request asked for", () => {
  const p = pledgeProgress(3, 4);
  assert.equal(p.pledged, 3);
  assert.equal(p.needed, 4);
  assert.equal(p.percent, 75);
  assert.equal(p.enough, false);
});

test("the same count means different things at different needs", () => {
  // The whole reason this module exists: two donors is a finished request at
  // one unit and a quarter of the way there at eight.
  assert.equal(pledgeProgress(2, 1).enough, true);
  assert.equal(pledgeProgress(2, 8).enough, false);
  assert.equal(pledgeProgress(2, 8).percent, 25);
});

test("nobody yet is zero, not a division", () => {
  const p = pledgeProgress(0, 3);
  assert.equal(p.percent, 0);
  assert.equal(p.enough, false);
});

test("over-subscription caps the bar but still reads as enough", () => {
  const p = pledgeProgress(9, 2);
  assert.equal(p.percent, 100, "a bar past its own end reads as a rendering fault");
  assert.equal(p.enough, true);
  assert.equal(p.pledged, 9, "the real count survives for the copy to use");
});

test("a request needing zero or fewer units is treated as needing one", () => {
  // `units` is not null default 1, so this is defensive rather than expected —
  // but the alternative is dividing by zero and rendering NaN%.
  for (const bad of [0, -4]) {
    const p = pledgeProgress(1, bad);
    assert.equal(p.needed, 1);
    assert.equal(p.percent, 100);
    assert.equal(p.enough, true);
  }
});

test("junk numbers never produce NaN", () => {
  for (const bad of [NaN, Infinity, -Infinity]) {
    const byPledged = pledgeProgress(bad, 3);
    assert.equal(byPledged.pledged, 0);
    assert.equal(Number.isFinite(byPledged.percent), true);

    const byNeeded = pledgeProgress(2, bad);
    assert.equal(byNeeded.needed, 1);
    assert.equal(Number.isFinite(byNeeded.percent), true);
  }
});

test("fractional inputs floor rather than round up", () => {
  // Rounding 2.9 donors up to 3 would let a request claim a pledge it does not
  // have. Under-claiming is the safe direction.
  assert.equal(pledgeProgress(2.9, 4).pledged, 2);
  assert.equal(pledgeProgress(3, 4.9).needed, 4);
});
