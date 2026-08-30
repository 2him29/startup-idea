-- Refuse anonymous callers at the door, not inside the policy.
--
-- 20260821160000 made this argument about functions and 20260824120000 applied
-- it to two tables. Supabase's linter and a privilege audit found the other
-- sixteen: every table in this schema still granted SELECT and INSERT to the
-- `anon` role, so an anonymous request reached the row-level policy and was
-- turned away there.
--
-- Nothing leaked. RLS is on everywhere and the policies are correct — that is
-- why this is hardening rather than a fix. But the difference matters twice
-- over. An anonymous read of association_invites failed with "permission denied
-- for function is_association_member", a predicate written for signed-in
-- callers, which is one layer deeper than anything anonymous should reach. And
-- a project whose case rests on handling health data properly should not need
-- to explain why the audit log of who read a donor's phone number was readable
-- in principle by anyone with the public key.
--
-- WHAT ANON ACTUALLY NEEDS
--
-- Measured rather than assumed: with the app loaded signed out, the only table
-- it queries is blood_requests. hospitals, associations and blood_drives keep
-- their public read because they are public reference data by design and carry
-- no personal information — a hospital's name, a committee's name, when a drive
-- is. Everything else is closed.
--
-- Anonymous callers keep no write anywhere. They never had a policy that would
-- have allowed one; now they do not have the grant either.

-- ---------------------------------------------------------------------------
-- 1. Public reference data: read, and only read.
-- ---------------------------------------------------------------------------

revoke all on table blood_requests from anon;
revoke all on table hospitals      from anon;
revoke all on table associations   from anon;
revoke all on table blood_drives   from anon;

grant select on table blood_requests to anon;
grant select on table hospitals      to anon;
grant select on table associations   to anon;
grant select on table blood_drives   to anon;

-- ---------------------------------------------------------------------------
-- 2. Everything else: closed to anonymous callers entirely.
-- ---------------------------------------------------------------------------

revoke all on table association_members     from public, anon;
revoke all on table compensations           from public, anon;
revoke all on table consent_records         from public, anon;
revoke all on table data_subject_requests   from public, anon;
revoke all on table donor_contact_reveals   from public, anon;
revoke all on table donor_profiles          from public, anon;
revoke all on table notification_outbox     from public, anon;
revoke all on table patients                from public, anon;
revoke all on table platform_admins         from public, anon;
revoke all on table profiles                from public, anon;
revoke all on table push_subscriptions      from public, anon;
revoke all on table request_responses       from public, anon;

-- ---------------------------------------------------------------------------
-- 3. The two tables that are evidence, and must stay append-only.
--
-- Both already have no update or delete policy, so RLS refuses these today.
-- The grants said otherwise, which is a strange thing for a schema to say about
-- its own audit trail: `authenticated` held DELETE on consent_records, the rows
-- this project describes as the proof that processing was lawful.
--
-- Writes still work. reveal_donor_contact() is SECURITY DEFINER owned by
-- postgres, so it inserts the audit row as the owner rather than as the
-- committee member who asked for the number — which is the point of writing it
-- down at all.
-- ---------------------------------------------------------------------------

revoke insert, update, delete on table donor_contact_reveals from authenticated;

-- DELETE only, and the distinction is the whole point of the table.
--
-- Withdrawing consent is an UPDATE that sets revoked_at: the row stays and
-- gains an end date, because a consent that vanishes cannot show either that
-- permission was given or that it was taken back. Revoking UPDATE as well —
-- which the first draft of this migration did — removes a donor's ability to
-- withdraw at all, which is their right under Loi 18-07 and the opposite of
-- protecting the record. verify:db caught it.
revoke delete on table consent_records from authenticated;

-- ---------------------------------------------------------------------------
-- 4. The outbox belongs to the workers.
--
-- It has RLS enabled and no policies at all, which already denies everyone;
-- Supabase's linter flags exactly that combination because it is usually a
-- mistake. Here it is deliberate. The triggers that fill it and
-- claim_notifications() that drains it are all SECURITY DEFINER owned by
-- postgres, and the edge function uses the service role, so none of them needs
-- a grant held by a signed-in user.
-- ---------------------------------------------------------------------------

revoke all on table notification_outbox from authenticated;

comment on table notification_outbox is
  'Queued notifications. No role but the owner and the service role touches this: the triggers that fill it and claim_notifications() that drains it are SECURITY DEFINER. RLS is on with no policies on purpose.';
