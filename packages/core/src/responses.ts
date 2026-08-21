import { getSupabase } from "./supabaseClient";
import { drainNotifications } from "./push";

export type ResponseStatus = "confirmed" | "completed" | "cancelled";

export interface MyResponse {
  requestId: string;
  status: ResponseStatus;
  createdAt: string;
}

/**
 * Say you are coming.
 *
 * This is the half of the loop that never existed: until 20260821120000 the
 * Respond button showed a green tick and wrote nothing, so a family had no way
 * of knowing anyone was on their way. The row is the promise.
 *
 * A unique index makes a second tap a no-op rather than a second donor, so the
 * duplicate is swallowed here instead of surfacing as an error the user cannot
 * act on — they already responded, which is what they wanted.
 */
export async function respondToRequest(requestId: string): Promise<void> {
  const { data: sessionData, error: sessionError } = await getSupabase().auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) throw new Error("Must be signed in to respond");

  const donorId = sessionData.session.user.id;
  const { error } = await getSupabase()
    .from("request_responses")
    .insert({ request_id: requestId, donor_id: donorId, status: "confirmed" });

  /*
   * Insert, then fall back to update on a duplicate — rather than .upsert().
   *
   * There is a real UNIQUE (request_id, donor_id) constraint and Postgres
   * accepts `on conflict (request_id, donor_id)` against it directly, but
   * PostgREST rejects the same conflict target with "there is no unique or
   * exclusion constraint matching the ON CONFLICT specification" regardless.
   * Rather than keep guessing at its schema-cache behaviour, this says plainly
   * what it means: responding twice re-confirms, it does not duplicate.
   *
   * 23505 is the unique-violation code, which here can only be this donor's
   * own earlier response — including a cancelled one they are reinstating.
   */
  if (error && (error as { code?: string }).code === "23505") {
    const { error: updateError } = await getSupabase()
      .from("request_responses")
      .update({ status: "confirmed" })
      .eq("request_id", requestId)
      .eq("donor_id", donorId);
    if (updateError) throw updateError;
    return;
  }
  if (error) throw error;

  // The family should hear now, not on the next scheduled run.
  void drainNotifications();
}

/**
 * Withdraw.
 *
 * Sets status rather than deleting: a family counting on someone who is no
 * longer coming is worse off than one who was never told, so the change has to
 * be visible to them. The row stays; the count drops.
 */
export async function cancelResponse(requestId: string): Promise<void> {
  const { data: sessionData, error: sessionError } = await getSupabase().auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) throw new Error("Must be signed in");

  const { error } = await getSupabase()
    .from("request_responses")
    .update({ status: "cancelled" })
    .eq("request_id", requestId)
    .eq("donor_id", sessionData.session.user.id);
  if (error) throw error;
}

/** Which requests this donor has already answered, so the UI can say so. */
export async function fetchMyResponses(): Promise<MyResponse[]> {
  const { data: sessionData, error: sessionError } = await getSupabase().auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) return [];

  const { data, error } = await getSupabase()
    .from("request_responses")
    .select("request_id, status, created_at")
    .eq("donor_id", sessionData.session.user.id);
  if (error) throw error;

  return (data as { request_id: string; status: ResponseStatus; created_at: string }[]).map((r) => ({
    requestId: r.request_id,
    status: r.status,
    createdAt: r.created_at,
  }));
}

/**
 * How many donors are coming, per request.
 *
 * Reads the counts view, which deliberately exposes numbers without the rows
 * behind them: "3 donors coming" is what stops twenty people turning up for
 * two units, and it needs no identities to do that job.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchResponseCounts(requestIds: string[]): Promise<Record<string, number>> {
  /*
   * Only real ids reach the database.
   *
   * useBloodRequests seeds with the static fallback list so screens render
   * something immediately, and those rows carry ids like "1" — which Postgres
   * rejects outright ("invalid input syntax for type uuid"), turning the first
   * paint of every list into a 400. Mock requests cannot have responses
   * anyway, so filtering them is the honest answer rather than a workaround.
   */
  const ids = requestIds.filter((id) => UUID.test(id));
  if (ids.length === 0) return {};

  const { data, error } = await getSupabase()
    .from("request_response_counts")
    .select("request_id, confirmed")
    .in("request_id", ids);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data as { request_id: string; confirmed: number }[]) {
    counts[row.request_id] = row.confirmed;
  }
  return counts;
}
