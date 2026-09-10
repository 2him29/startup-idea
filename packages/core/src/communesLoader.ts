import { useEffect, useState } from "react";

/**
 * The commune list, fetched only when a screen asks for it.
 *
 * communes.ts holds 1541 communes and 548 daïras in two scripts, and it was
 * about 21 kB of the compressed bundle that every visitor downloaded on first
 * open, including the many who never reach a screen with a commune on it.
 * Qatra is built for the cheapest Android phone on Algerian mobile data, where
 * that cost is paid before the splash screen is usable.
 *
 * So nothing imports communes.ts statically any more. The dynamic import below
 * is the only reference to it, which is what lets the bundler move it into its
 * own file and fetch it on demand. Re-exporting it from index.ts, or importing
 * one of its helpers directly in a screen, would pull all of it back into the
 * main file, and silently, because everything would still work.
 *
 * communes.ts keeps its synchronous API, so its tests are unchanged.
 */
export type CommunesModule = typeof import("./communes.ts");

let pending: Promise<CommunesModule> | null = null;

/** Fetch the commune module once; every later call reuses the same request. */
export function loadCommunes(): Promise<CommunesModule> {
  if (!pending) {
    pending = import("./communes.ts").catch((err) => {
      // Let a later call try again: a dropped connection should not leave the
      // pickers empty for the rest of the session.
      pending = null;
      throw err;
    });
  }
  return pending;
}

/**
 * The commune module once it has arrived, or null while it is on its way.
 *
 * Screens read null as "no commune picker yet", and show a stored commune by
 * its canonical French name until the translation is available. Pass
 * enabled = false to skip the download on a visit that will not show one.
 */
export function useCommunes(enabled = true): CommunesModule | null {
  const [mod, setMod] = useState<CommunesModule | null>(null);
  useEffect(() => {
    if (!enabled || mod) return;
    let alive = true;
    loadCommunes()
      .then((m) => {
        if (alive) setMod(m);
      })
      .catch((err) => console.error("Failed to load the commune list", err));
    return () => {
      alive = false;
    };
  }, [enabled, mod]);
  return mod;
}
