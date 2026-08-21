/**
 * Drains notification_outbox and delivers web push.
 *
 * Runs as the service role, which is the only thing allowed to read push
 * endpoints across users — an endpoint plus its keys is a capability, not a
 * preference.
 *
 * Invoke it on a schedule (pg_cron every minute) or immediately after a write.
 * Either way it is idempotent-ish by lease: claim_notifications() hands each
 * row to one worker for five minutes, so a second invocation overlapping the
 * first does not send twice.
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
    request: (type: string, wilaya: string) => ({
      title: `مطلوب ${type} في ${wilaya}`,
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
          ? copy.request(target.blood_type ?? "", target.wilaya ?? "")
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

Deno.serve(async () => {
  if (missing.length > 0) {
    return new Response(
      JSON.stringify({
        error: `Missing secret(s): ${missing.join(", ")}`,
        hint: "supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... (or Dashboard > Edge Functions > Secrets). Nothing is claimed until they are set, so no notification is lost.",
      }),
      { status: 503, headers: { "content-type": "application/json" } }
    );
  }

  const { data: jobs, error } = await db.rpc("claim_notifications", { p_limit: 20 });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

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

  return new Response(JSON.stringify({ claimed: claimed.length, delivered: sent }), {
    headers: { "content-type": "application/json" },
  });
});
