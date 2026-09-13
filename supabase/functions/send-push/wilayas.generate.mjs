/**
 * Writes wilayas.ts from packages/core/src/wilayas.ts.
 *
 *   node supabase/functions/send-push/wilayas.generate.mjs
 *
 * The worker needs the wilaya names in three languages to title a push, and an
 * edge function is deployed on its own: it cannot import from the monorepo. So
 * the table is copied rather than shared, generated here rather than typed out
 * (58 names in Arabic is a transcription error waiting to happen), and checked
 * by packages/core/src/wilayaLabels.test.ts, which fails if the two disagree.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CORE = join(HERE, "..", "..", "..", "packages", "core", "src", "wilayas.ts");

// pathToFileURL: a Windows absolute path is not a valid ESM specifier.
const { WILAYAS } = await import(pathToFileURL(CORE).href);

const entries = WILAYAS.map(
  (w) => `  ${JSON.stringify(w.fr)}: { en: ${JSON.stringify(w.en)}, fr: ${JSON.stringify(w.fr)}, ar: ${JSON.stringify(w.ar)} },`
).join("\n");

const file = `/**
 * Wilaya names in the three languages, for the push titles.
 *
 * GENERATED from packages/core/src/wilayas.ts — do not edit by hand. Run
 * \`node supabase/functions/send-push/wilayas.generate.mjs\` after changing that
 * table; packages/core/src/wilayaLabels.test.ts fails while the two disagree.
 *
 * Keyed by the canonical French name, which is what blood_requests.wilaya
 * stores ("Alger", never "Algiers" or "16").
 */
export const WILAYA_LABELS: Record<string, { en: string; fr: string; ar: string }> = {
${entries}
};
`;

writeFileSync(join(HERE, "wilayas.ts"), file, "utf8");
console.log(`wrote wilayas.ts with ${WILAYAS.length} wilayas`);
