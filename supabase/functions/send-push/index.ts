/**
 * Drains notification_outbox and delivers web push.
 *
 * Runs as the service role, which is the only thing allowed to read push
 * endpoints across users — an endpoint plus its keys is a capability, not a
 * preference.
 *
 * Today the browser is the only thing that runs it: drainNotifications() calls
 * it right after a request is posted or answered, and no scheduler exists on
 * either project. A scheduler (pg_cron every minute, say) would bound how long
 * a notification can wait after a failed call; it must send the service-role
 * key. Overlapping calls are safe by lease: claim_notifications() hands each
 * row to one worker for five minutes, so a second call does not send twice.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
/** VAPID requires a contact so a push service can reach the operator. */
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@qatra.app";

/*
 * Say which secret is missing, rather than dying at import.
 *
 * setVapidDetails() throws on undefined keys, and a throw at module scope
 * surfaces as "WORKER_ERROR: Function exited due to an error (please check
 * logs)" — which names neither the cause nor the fix. Naming the missing
 * variable turns an afternoon in the logs into a five-minute correction.
 */
const missing = [
  ["VAPID_PUBLIC_KEY", VAPID_PUBLIC],
  ["VAPID_PRIVATE_KEY", VAPID_PRIVATE],
].filter(([, value]) => !value).map(([name]) => name);

if (missing.length === 0) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

/**
 * Wording, per language, kept here rather than in the trigger.
 *
 * The trigger records what happened; the worker knows who is being told and
 * therefore which language to use. A message rendered at insert time would be
 * frozen in whatever language the writer happened to be using.
 *
 * Notice what is NOT here: no patient name, no hospital, no file number. A
 * push lands on a lock screen that anyone nearby can read, so it carries only
 * what the Find screen already shows publicly — blood type, wilaya, urgency.
 */
const COPY = {
  en: {
    request: (type: string, wilaya: string) => ({
      title: `${type} needed in ${wilaya}`,
      body: "A patient near you needs blood. Tap to see the request.",
    }),
    responded: () => ({
      title: "Someone is coming",
      body: "A donor answered your request.",
    }),
  },
  fr: {
    request: (type: string, wilaya: string) => ({
      title: `${type} recherché à ${wilaya}`,
      body: "Un patient près de chez vous a besoin de sang. Touchez pour voir.",
    }),
    responded: () => ({
      title: "Quelqu'un arrive",
      body: "Un donneur a répondu à votre demande.",
    }),
  },
  ar: {
    // The group is isolated (U+2066 … U+2069). The sign after it is a neutral
    // character, and right-to-left text would otherwise print O+ as +O.
    request: (type: string, wilaya: string) => ({
      title: `مطلوب ⁦${type}⁩ في ${wilaya}`,
      body: "مريض قريب منك يحتاج إلى دم. اضغط لعرض الطلب.",
    }),
    responded: () => ({
      title: "أحدهم في الطريق",
      body: "استجاب متبرع لطلبك.",
    }),
  },
} as const;

type Lang = keyof typeof COPY;

/** Falls back to French: it is the language the app defaults to on these devices. */
function langOf(value: string | null | undefined): Lang {
  return value === "en" || value === "ar" ? value : "fr";
}

interface Target {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  /**
   * The recipient's own blood type, which push_targets_for_request uses to pick
   * compatible donors. Not the request's: a title built from it told an O+
   * donor "O+ needed" about an A+ patient. handleOne reads the request's.
   */
  blood_type?: string;
  wilaya?: string;
}

/**
 * Send to one endpoint, and say what should happen to it afterwards.
 *
 * 404 and 410 mean the subscription is gone for good — the browser was
 * uninstalled, or the user cleared site data. Those are deleted rather than
 * counted as failures: retrying them forever slows every later send for
 * everyone still listening.
 */
async function deliver(target: Target, payload: unknown): Promise<"ok" | "gone" | "failed"> {
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 6 } // Six hours: a blood request older than that is not news.
    );
    return "ok";
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "gone";
    console.error("push failed", status, (err as Error).message);
    return "failed";
  }
}

async function handleOne(job: { id: string; kind: string; request_id: string }): Promise<number> {
  const fn = job.kind === "new_request" ? "push_targets_for_request" : "push_targets_for_family";
  const { data: targets, error } = await db.rpc(fn, { p_request_id: job.request_id });
  if (error) throw error;

  const rows = (targets ?? []) as Target[];
  if (rows.length === 0) return 0;

  /*
   * The request's own blood type and wilaya, read once for all recipients.
   *
   * The targets carry a blood_type too, but it is each donor's, and the title
   * used to be built from it. An O+ donor was told "O+ needed in Blida" about
   * an A+ patient: the wrong group, on a lock screen, in an app where the
   * group is most of the message.
   */
  let request: { blood_type: string; wilaya: string } | null = null;
  if (job.kind === "new_request") {
    const { data, error: requestError } = await db
      .from("blood_requests")
      .select("blood_type, wilaya")
      .eq("id", job.request_id)
      .single();
    if (requestError) throw requestError;
    request = data;
  }

  // Language per recipient, so a push is not English at an Arabic speaker.
  const { data: profiles } = await db
    .from("profiles")
    .select("id, language")
    .in("id", rows.map((r) => r.user_id));
  const langById = new Map((profiles ?? []).map((p: { id: string; language?: string }) => [p.id, langOf(p.language)]));

  let delivered = 0;
  const gone: string[] = [];
  const failed: string[] = [];

  await Promise.all(
    rows.map(async (target) => {
      const lang = langById.get(target.user_id) ?? "fr";
      const copy = COPY[lang];
      const message =
        job.kind === "new_request"
          ? copy.request(request?.blood_type ?? "", request?.wilaya ?? "")
          : copy.responded();

      const result = await deliver(target, {
        ...message,
        // Tagged by request so a second push about the same patient replaces
        // the first rather than stacking.
        tag: `${job.kind}:${job.request_id}`,
        url: "./",
        requestId: job.request_id,
      });

      if (result === "ok") delivered++;
      else if (result === "gone") gone.push(target.endpoint);
      else failed.push(target.endpoint);
    })
  );

  if (gone.length) await db.from("push_subscriptions").delete().in("endpoint", gone);
  for (const endpoint of failed) {
    await db.rpc("bump_push_failure", { p_endpoint: endpoint }).catch(() => {});
  }

  return delivered;
}

/** Constant-time compare, so a wrong token cannot be narrowed one byte at a time. */
function tokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Who may drain the queue: a signed-in user, or the service role. Never an
 * anonymous request.
 *
 * The browser is the caller that matters. drainNotifications() invokes this
 * after every posted request and every response, and it is the only thing that
 * does: no scheduler exists on either project (pg_cron is not installed). A
 * check that admitted only the service role would therefore stop notifications
 * outright, because a browser never holds that key.
 *
 * verify_jwt is off for this function (see supabase/config.toml) because it
 * cannot draw this line: it accepts any signed project JWT, and the public anon
 * key is one. So the check lives here. The service-role key is compared in
 * constant time; anything else is handed to Auth, which confirms the token is
 * real, unexpired and belongs to a user. The anon key has no user, and fails.
 *
 * What an open endpoint allowed was modest, and worth stating precisely: anyone
 * could trigger drains and spend invocations. It could not cancel a
 * notification, because a row that sends is marked done on its first claim.
 * Anyone can still create an account, so this raises the bar rather than
 * closing the door. That is proportionate to the risk, and it keeps the app
 * working.
 */
async function callerIsAllowed(req: Request): Promise<boolean> {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  if (tokensMatch(token, SERVICE_ROLE)) return true;
  const { data, error } = await db.auth.getUser(token);
  return !error && Boolean(data?.user);
}

/**
 * CORS, because the caller is a web page on another origin.
 *
 * Without these headers a browser sends its pre-check, gets an answer that does
 * not name the page, and never makes the real call. In the 24 hours before they
 * were added, staging logged only OPTIONS requests to this function and not one
 * POST.
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // The pre-check is answered here and nothing more. Without this line it
  // would run the whole handler: no auth header, and a drain.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // Before the secret check below, so an anonymous caller learns nothing about
  // which secrets this deployment is missing.
  if (!(await callerIsAllowed(req))) {
    return json({ error: "Sign in to trigger notifications." }, 401);
  }

  if (missing.length > 0) {
    return json(
      {
        error: `Missing secret(s): ${missing.join(", ")}`,
        hint: "supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... (or Dashboard > Edge Functions > Secrets). Nothing is claimed until they are set, so no notification is lost.",
      },
      503
    );
  }

  const { data: jobs, error } = await db.rpc("claim_notifications", { p_limit: 20 });
  if (error) return json({ error: error.message }, 500);

  const claimed = (jobs ?? []) as { id: string; kind: string; request_id: string }[];
  let sent = 0;

  for (const job of claimed) {
    try {
      const delivered = await handleOne(job);
      sent += delivered;
      await db
        .from("notification_outbox")
        .update({ sent_at: new Date().toISOString(), delivered, last_error: null })
        .eq("id", job.id);
    } catch (err) {
      // Left unsent with the reason attached: the lease expires in five
      // minutes and the row is tried again, up to five times.
      await db
        .from("notification_outbox")
        .update({ last_error: String((err as Error).message ?? err).slice(0, 500) })
        .eq("id", job.id);
    }
  }

  return json({ claimed: claimed.length, delivered: sent });
});
