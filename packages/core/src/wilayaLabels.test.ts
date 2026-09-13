import { test } from "node:test";
import assert from "node:assert/strict";
import { WILAYAS } from "./wilayas.ts";
import { WILAYA_LABELS } from "../../../supabase/functions/send-push/wilayas.ts";

/**
 * The push worker carries its own copy of the wilaya names.
 *
 * It has to: an edge function is deployed on its own and cannot import from the
 * monorepo. This is what keeps the copy honest — rename or add a wilaya in core
 * and this fails, naming the command that regenerates it, instead of an Arabic
 * phone quietly reading "في Blida" again.
 */
test("the push worker's wilaya labels match core's table", () => {
  const expected = Object.fromEntries(
    WILAYAS.map((w) => [w.fr, { en: w.en, fr: w.fr, ar: w.ar }])
  );
  assert.deepEqual(
    WILAYA_LABELS,
    expected,
    "regenerate with: node supabase/functions/send-push/wilayas.generate.mjs"
  );
});

/**
 * A request stores the French name, and the title looks it up. A missing or
 * blank translation would land on a lock screen as a request for blood in
 * nowhere at all.
 */
test("every wilaya a request can store has a name in all three languages", () => {
  for (const w of WILAYAS) {
    const label = WILAYA_LABELS[w.fr];
    assert.ok(label, `no labels for ${w.fr}`);
    for (const lang of ["en", "fr", "ar"] as const) {
      assert.ok(label[lang]?.trim(), `${w.fr} has no ${lang} name`);
    }
  }
});
