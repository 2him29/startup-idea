-- Two layers of defence, not one.
--
-- Every gated function here already refuses the wrong caller from inside: ask
-- reveal_donor_contact() for a number as an anonymous visitor and it raises
-- rather than answering. But it *runs* — the request reaches the function body,
-- and only the guard inside stops it. Meanwhile push_targets_for_request(),
-- where the grant was revoked properly, answers "permission denied for
-- function" and never executes at all.
--
-- The difference is a missed detail: `revoke ... from public` does not remove
-- Supabase's separate grants to the `anon` and `authenticated` roles. Every
-- function revoked only from public stayed callable, and Supabase's own
-- security linter flags each one.
--
-- Nothing leaked — the guards were verified doing their job — but a health
-- application should not rely on a single layer, and a security report full of
-- warnings is a poor look for a project whose case rests on handling this data
-- properly.
--
-- Anon keeps nothing it needs: the public read policies on blood_requests,
-- hospitals, associations and blood_drives are all plain `using (true)` and
-- call no functions, so the signed-out splash is unaffected.

-- ---------------------------------------------------------------------------
-- 1. Signed-out visitors cannot call anything that touches people.
-- ---------------------------------------------------------------------------

-- PUBLIC first, then the role.
--
-- Revoking the role alone achieves nothing where PUBLIC still holds the grant:
-- anon inherits it and the function stays callable. That is precisely the trap
-- this migration exists to close, so it must not repeat it one line lower.
-- Every revoke below therefore names public, and every privilege that is
-- actually needed is granted back explicitly.

revoke all on function search_donors(text, text, boolean) from public, anon;
grant execute on function search_donors(text, text, boolean) to authenticated;

revoke all on function reveal_donor_contact(uuid) from public, anon;
grant execute on function reveal_donor_contact(uuid) to authenticated;

revoke all on function request_plausibility(uuid) from public, anon;
grant execute on function request_plausibility(uuid) to authenticated;

revoke all on function verify_association(uuid, boolean) from public, anon;
grant execute on function verify_association(uuid, boolean) to authenticated;

-- The predicates behind RLS. `authenticated` must keep EXECUTE — a policy
-- expression is evaluated as the querying role, so a policy calling one of
-- these would fail outright without it. Anon needs none of them: every
-- anon-facing policy is a plain `using (true)`.
revoke all on function can_verify_in_wilaya(text) from public, anon;
grant execute on function can_verify_in_wilaya(text) to authenticated;

revoke all on function is_association_in_wilaya(text) from public, anon;
grant execute on function is_association_in_wilaya(text) to authenticated;

revoke all on function is_association_admin(uuid) from public, anon;
grant execute on function is_association_admin(uuid) to authenticated;

revoke all on function is_platform_admin() from public, anon;
grant execute on function is_platform_admin() to authenticated;

revoke all on function is_phone_verified() from public, anon;
grant execute on function is_phone_verified() to authenticated;

revoke all on function association_has_members(uuid) from public, anon;
grant execute on function association_has_members(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Trigger functions are not API.
--
-- These exist to be fired by a trigger, which does not need the caller to hold
-- EXECUTE. Exposed on /rest/v1/rpc they are simply a way to write rows into the
-- notification queue by hand.
-- ---------------------------------------------------------------------------

revoke all on function queue_new_request_notification() from public, authenticated, anon;
revoke all on function queue_response_notification() from public, authenticated, anon;

-- ---------------------------------------------------------------------------
-- 3. The counts view becomes a function.
--
-- request_response_counts was a view, and a view runs as its owner unless told
-- otherwise — which is exactly why it worked: it reports how many donors are
-- coming without the rows behind it being readable. Deliberate, but Postgres
-- and Supabase both treat a SECURITY DEFINER view as an error-level smell,
-- because the property is invisible at the call site and easy to inherit by
-- accident.
--
-- A function says the same thing out loud: it is `security definer` in its own
-- definition, it takes the ids the caller already has, and it is granted to
-- signed-in users only. The result is identical — numbers, never identities.
-- ---------------------------------------------------------------------------

drop view if exists request_response_counts;

create or replace function response_counts(p_request_ids uuid[])
returns table (request_id uuid, confirmed int)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select r.request_id, count(*)::int
  from request_responses r
  where r.request_id = any (p_request_ids)
    and r.status in ('confirmed', 'completed')
  group by r.request_id;
$$;

revoke all on function response_counts(uuid[]) from public, anon;
grant execute on function response_counts(uuid[]) to authenticated;

comment on function response_counts(uuid[]) is
  'How many donors are coming, per request. Numbers without identities: the rows behind these counts stay unreadable. Signed-in callers only.';
