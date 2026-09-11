import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Clears what the suite wrote to staging, once, after every run.
 *
 * The specs post requests, sign up accounts and create invite links, and the
 * app deletes none of it on purpose: a family closes a request rather than
 * erasing it, and a withdrawn invite stays as the record of who arrived through
 * it. Left alone, that came to 117 of staging's 128 requests and 218 accounts
 * by September 2026, and the demo link, which is built against staging, opened
 * on a feed of "Map E2E 1789081484718" almost entirely in Blida.
 *
 * What counts as test data is written down once, in cleanup.sql, as the exact
 * names the specs generate. This file only decides where it may run.
 *
 * It goes through the Supabase CLI rather than a service-role key, so no secret
 * lives in the repo or in an env file: the CLI uses this machine's
 * `supabase login`. The target is the ref from .env, passed as --project-ref.
 * The CLI refuses --project-ref without --linked, but the ref is what decides:
 * with the link on staging, `--linked --project-ref <live ref>` returned live's
 * 49 accounts and not staging's 229 (checked 11 Sep 2026). That is what keeps
 * this safe, because the link itself gets moved to live for every deploy.
 *
 * A failed cleanup warns and does not fail the run. The tests have already
 * passed or failed on their own merits, and a missing login should not turn a
 * green run red.
 */

// process.cwd(), not import.meta: Playwright transpiles this to CommonJS. It
// resolves its config from the repo root, so that is the cwd.
const LIVE_PROJECT_REF = "wyxrzanirypztxdujsaa";

export default function globalTeardown(): void {
  let env = "";
  try {
    env = readFileSync(path.resolve(process.cwd(), "apps", "web", ".env"), "utf8");
  } catch {
    // No .env: the app ran on its fallback data and wrote nowhere.
    return;
  }

  const ref = env.match(/^\s*VITE_SUPABASE_URL\s*=\s*https:\/\/([a-z0-9]+)\.supabase\.co/m)?.[1];
  if (!ref) return;
  if (ref === LIVE_PROJECT_REF) {
    console.warn(`[cleanup] skipped: apps/web/.env names the live project (${ref}). Test data is only cleared on staging.`);
    return;
  }

  // One command string, because npx is a .cmd on Windows and needs a shell.
  // The ref went through [a-z0-9]+ above, so nothing can be injected through it.
  const result = spawnSync(`npx supabase db query --linked --project-ref ${ref} --file e2e/cleanup.sql`, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: true,
    timeout: 120_000,
  });

  if (result.status === 0) {
    console.log(`[cleanup] removed test data from staging (${ref}):\n${result.stdout.trim()}`);
    return;
  }
  const detail = (result.stderr || result.stdout || String(result.error ?? "")).trim().split("\n").slice(-4).join("\n");
  console.warn(
    `[cleanup] could not clear test data on ${ref}. If the CLI is not logged in, run \`npx supabase login\`.\n${detail}`
  );
}
