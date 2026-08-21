/**
 * The message a user should see for a thrown value.
 *
 * Every catch in the app used to read `err instanceof Error ? err.message :
 * fallback`, which looks right and is wrong for the errors this app actually
 * throws: supabase-js rejects with a PostgrestError — a plain object carrying
 * `message`, `details`, `hint`, `code` — and `instanceof Error` is false for
 * it. So every database failure in twenty screens rendered as "Something went
 * wrong", including RLS refusals that say exactly what the problem is.
 *
 * A generic fallback is still right for values with nothing readable in them;
 * it just should not be the answer for the common case.
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object") {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}
