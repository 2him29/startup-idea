-- A notification should arrive in the language its reader chose.
--
-- Until now the chosen language lived only in localStorage, which is exactly
-- the wrong place for it the moment anything server-side needs to write a
-- sentence. A push composed without it would reach an Arabic speaker in French
-- — in an app whose majority language is Arabic, on the one screen the user
-- cannot re-render by switching a toggle.
--
-- Nullable on purpose. Absent means "never told us", which the worker answers
-- with French: it is what the app itself falls back to on these devices, so an
-- unset value produces what the user was already seeing.

alter table profiles add column if not exists language text
  check (language is null or language in ('en', 'fr', 'ar'));

comment on column profiles.language is
  'UI language, mirrored from the client so server-composed messages (push) can match it. Null means never recorded; treat as fr.';

/**
 * Count a failed delivery against an endpoint.
 *
 * Not a plain UPDATE from the worker, because push_subscriptions is readable
 * only by its owner and the worker is nobody's owner. SECURITY DEFINER keeps
 * the write narrow: it can increment a counter and nothing else — it cannot
 * read the keys, move a subscription between users, or reset the count.
 *
 * Five strikes and push_targets_for_request stops selecting the endpoint.
 * Permanent failures (404/410) are deleted outright by the worker instead;
 * this is for the transient ones, where a slow push service should not cost
 * someone their notifications on the first bad night.
 */
create or replace function bump_push_failure(p_endpoint text)
returns void
language sql
volatile
security definer
set search_path = public, pg_temp
as $$
  update push_subscriptions
  set failure_count = failure_count + 1
  where endpoint = p_endpoint;
$$;

revoke all on function bump_push_failure(text) from public, authenticated, anon;

comment on function bump_push_failure(text) is
  'Increments the failure counter for one push endpoint. Service role only.';
