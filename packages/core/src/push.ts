import { getSupabase } from "./supabaseClient";

/**
 * Browser push, from the donor's side.
 *
 * The server half lives in a Supabase edge function; this module only ever
 * registers a browser and tells the app what state that browser is in.
 *
 * Configured rather than read from import.meta.env, like everything else in
 * core, so a non-Vite host can supply its own key.
 */
let vapidPublicKey: string | null = null;

export function configurePush(publicKey: string | null | undefined): void {
  vapidPublicKey = publicKey && publicKey.trim() ? publicKey.trim() : null;
}

export type PushState =
  /** No service worker, no PushManager, or no key configured. */
  | "unsupported"
  /** Supported, never asked. */
  | "idle"
  /** This browser is registered and will receive notifications. */
  | "on"
  /** The user said no. The browser will not ask again; only they can undo it. */
  | "blocked";

/**
 * What this browser can and will do.
 *
 * "blocked" is separated from "idle" because they need completely different
 * words: one is an invitation, the other has to explain that the app cannot
 * ask again and the change has to be made in browser settings. Showing an
 * enable button to someone who has denied permission produces a button that
 * silently does nothing.
 */
export async function pushState(): Promise<PushState> {
  if (typeof window === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  if (!vapidPublicKey) return "unsupported";
  if (Notification.permission === "denied") return "blocked";

  const registration = await navigator.serviceWorker.getRegistration();
  const existing = await registration?.pushManager.getSubscription();
  if (!existing) return "idle";

  /*
   * A browser subscription is only half of "on".
   *
   * The other half is a row telling the server where to send. Reporting "on"
   * from the browser alone means a failed save still shows a green tick — and
   * a donor who believes they are covered, is not, and finds out by never
   * being called. Checking both is one round trip and the difference between
   * a status and a guess.
   */
  const { data: sessionData } = await getSupabase().auth.getSession();
  if (!sessionData.session) return "idle";

  const { data, error } = await getSupabase()
    .from("push_subscriptions")
    .select("id")
    .eq("endpoint", existing.endpoint)
    .maybeSingle();

  // A failed lookup is not evidence of being off, but claiming "on" without
  // evidence is the thing this guard exists to prevent.
  if (error) return "idle";
  return data ? "on" : "idle";
}

/**
 * The VAPID key travels as url-safe base64 and must reach the browser as bytes.
 *
 * Built on an explicit ArrayBuffer rather than `new Uint8Array(length)`:
 * applicationServerKey wants a BufferSource backed by an ArrayBuffer, and the
 * plain constructor now types as ArrayBufferLike, which admits
 * SharedArrayBuffer and so does not satisfy it.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalised);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * Register the worker and wait for it to be genuinely running.
 *
 * `register()` resolves once registration has *started*, not once the worker is
 * active, and `pushManager.subscribe()` on a registration whose worker has not
 * activated fails with "Subscription failed - no active Service Worker". The
 * timing is invisible on a warm reload and reliable on a cold one, which is the
 * worst kind of bug: it works for whoever wrote it.
 *
 * `navigator.serviceWorker.ready` is the wait that matters — it resolves only
 * with an active worker.
 */
async function ensureWorker(swUrl: string): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (!existing) await navigator.serviceWorker.register(swUrl);
  return navigator.serviceWorker.ready;
}

/**
 * Ask permission, subscribe, and record where to reach this browser.
 *
 * Throws with a readable message rather than resolving quietly on refusal, so
 * the UI can say what happened. The permission prompt is the consent: nothing
 * is stored before the user agrees.
 */
export async function enablePush(swUrl: string): Promise<void> {
  if (!vapidPublicKey) throw new Error("Push is not configured for this build");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(permission === "denied" ? "Notifications are blocked in this browser" : "Notifications were not enabled");
  }

  const registration = await ensureWorker(swUrl);
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      // Required by every browser: a push that shows nothing is not allowed.
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));

  const json = subscription.toJSON();
  if (!json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("This browser returned an unusable subscription");
  }

  const { data: sessionData } = await getSupabase().auth.getSession();
  if (!sessionData.session) throw new Error("Must be signed in to enable notifications");

  /*
   * Upsert on endpoint: re-subscribing in the same browser returns the same
   * endpoint, and a duplicate row would mean being notified twice.
   */
  const { error } = await getSupabase().from("push_subscriptions").upsert(
    {
      user_id: sessionData.session.user.id,
      endpoint: subscription.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent.slice(0, 300),
      failure_count: 0,
    },
    { onConflict: "endpoint" }
  );

  /*
   * If the row cannot be saved, undo the browser subscription too.
   *
   * Otherwise the browser holds a live endpoint nothing will ever send to, and
   * the next visit finds a subscription with no row — a state that reads as
   * "on" to anyone checking only one side.
   */
  if (error) {
    await subscription.unsubscribe().catch(() => {});
    throw error;
  }
}

/**
 * Stop notifications for this browser, both ends.
 *
 * The row goes and the browser subscription is cancelled. Doing only the first
 * leaves the browser holding a live endpoint; only the second leaves a row the
 * sender will keep trying. Both, or the "off" is a half-truth.
 */
export async function disablePush(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();

  if (subscription) {
    await getSupabase().from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
    await subscription.unsubscribe();
  }
}

/**
 * Nudge the worker to drain the outbox now.
 *
 * Notifications are queued by database triggers and sent by an edge function.
 * In production that function runs on a schedule; calling it here as well
 * makes the gap between "a request was posted" and "a phone buzzes" a second
 * rather than up to a minute — which is the difference between a demo that
 * lands and one that needs explaining.
 *
 * Deliberately fire-and-forget. The queue is durable: if this call fails, is
 * blocked, or the tab closes mid-flight, the scheduled run still sends it. So
 * a failure here is a delay, never a loss, and must not surface as an error on
 * a screen the user is trying to leave.
 *
 * Safe to expose: the function takes no input, returns only counts, and sends
 * exactly what the triggers already decided should be sent.
 */
export async function drainNotifications(): Promise<void> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    await supabase.functions.invoke("send-push");
  } catch {
    // Delayed, not lost. See above.
  }
}
