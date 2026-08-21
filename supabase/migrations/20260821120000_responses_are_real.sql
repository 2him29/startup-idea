-- Responding to a request has never written anything down.
--
-- request_responses has existed since the first migration, with RLS and a
-- status column, and has never held a single row: nothing in the app inserts
-- into it. A donor taps Respond, sees a green tick, drives to the hospital —
-- and the family learns none of it. The loop the product exists to close has
-- been open the whole time.
--
-- Three things stand between that table and being usable.

-- ---------------------------------------------------------------------------
-- 1. donor_id pointed at donor_profiles, so most users could not respond.
--
-- donor_profiles holds blood type, age, weight — a medical profile that only
-- someone who completed donor registration has. On the live project 9 of 14
-- profiles have no such row, so the majority of accounts would have met a
-- foreign-key violation on their first tap.
--
-- Responding is a commitment to turn up, not a medical assertion, so being a
-- signed-in person is the right requirement. Safe to repoint: the table is
-- empty, so there is nothing to migrate.
-- ---------------------------------------------------------------------------

alter table request_responses drop constraint if exists request_responses_donor_id_fkey;
alter table request_responses
  add constraint request_responses_donor_id_fkey
  foreign key (donor_id) references auth.users (id) on delete cascade;

-- One response per donor per request. Without this, tapping Respond twice
-- makes it look as though two people are coming.
--
-- A named CONSTRAINT rather than a bare unique index. Both enforce the rule;
-- the constraint is the honest declaration of it and is what shows up in
-- introspection.
--
-- Note for anyone reaching for .upsert() here: PostgREST rejects
-- `on_conflict=request_id,donor_id` with "there is no unique or exclusion
-- constraint matching the ON CONFLICT specification" even with this constraint
-- in place and the schema cache reloaded, while the identical statement runs
-- fine in psql. respondToRequest() does insert-then-update instead. Converting
-- the index to a constraint did NOT fix it — don't repeat that experiment.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'request_responses_one_per_donor'
      and conrelid = 'request_responses'::regclass
  ) then
    alter table request_responses
      add constraint request_responses_one_per_donor unique (request_id, donor_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Anyone signed in could read every response.
--
-- The original policy is `using (true)`, written for "a small trust-based
-- network for the MVP". A response links a named person to one patient's
-- request — it says this individual donates, and for whom. That sits badly
-- beside consent-gated phone numbers and a logged reveal, so it narrows to the
-- people with a reason to know.
--
-- The count stays public (see the view below): "3 donors coming" is what stops
-- twenty people arriving for two units, and it needs no identities at all.
-- ---------------------------------------------------------------------------

drop policy if exists "responses readable by authenticated users" on request_responses;

create policy "responses readable by the donor who made them" on request_responses
  for select to authenticated using (donor_id = auth.uid());

/** The family who posted the request: they are the ones expecting someone. */
create policy "responses readable by the requesting family" on request_responses
  for select to authenticated using (
    request_id in (
      select r.id from blood_requests r
      join patients p on p.id = r.patient_record_id
      where p.created_by = auth.uid()
    )
  );

/**
 * The committee coordinating that wilaya. Admins only, matching every other
 * read of who-is-involved-in-what: this follows the right to vouch rather than
 * mere membership.
 */
create policy "responses readable by the verifying association" on request_responses
  for select to authenticated using (
    request_id in (
      select r.id from blood_requests r
      where r.wilaya is not null and can_verify_in_wilaya(r.wilaya)
    )
  );

create policy "responses readable by platform admins" on request_responses
  for select to authenticated using (is_platform_admin());

-- ---------------------------------------------------------------------------
-- 3. Nothing could set status to 'cancelled'.
--
-- The check constraint has allowed 'cancelled' since day one and no policy
-- permitted an update, so a donor who could no longer go had no way to say so
-- — leaving the family counting on someone who is not coming, which is worse
-- than never having been told.
--
-- Scoped to the donor's own row. Deliberately no delete policy: withdrawing is
-- a state change the family should see, not an erasure that makes the promise
-- disappear.
-- ---------------------------------------------------------------------------

create policy "responses updatable by the donor who made them" on request_responses
  for update to authenticated
  using (donor_id = auth.uid())
  with check (donor_id = auth.uid());

/**
 * How many people have said they are coming, per request.
 *
 * A view rather than a policy exception: it runs as its owner, so the counts
 * are visible without the rows behind them being readable. That is the whole
 * point — the number is useful to everyone, the names are not.
 *
 * Cancelled responses are excluded; a withdrawn promise is not a donor coming.
 */
create or replace view request_response_counts as
  select request_id, count(*)::int as confirmed
  from request_responses
  where status in ('confirmed', 'completed')
  group by request_id;

grant select on request_response_counts to authenticated, anon;

comment on view request_response_counts is
  'Public count of donors coming, per request. Deliberately exposes numbers without identities.';
