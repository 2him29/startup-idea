-- Two performance findings from Supabase's own linter, neither of which
-- changes what any policy permits.
--
-- ---------------------------------------------------------------------------
-- 1. auth.uid() was being called once per row.
--
-- A policy expression is evaluated for every row the query touches, so a bare
-- auth.uid() in `using (...)` runs once per row scanned. Wrapped in a scalar
-- subquery it becomes an InitPlan: Postgres evaluates it once and reuses the
-- result. The predicate is identical -- auth.uid() is stable within a
-- statement -- and the difference is entirely in how many times it is called.
-- 36 policies across 14 tables were flagged.
--
-- These are ALTER POLICY, not drop-and-recreate, and the expressions were not
-- retyped. They were read back from pg_policies on a throwaway cluster with
-- every migration applied, rewritten mechanically, and checked: 41 occurrences
-- of auth.uid(), 41 now wrapped, none double-wrapped. Rewriting thirty-six
-- security predicates by hand is how a hole gets opened, and the point of this
-- migration is that nobody did.
--
-- `npm run verify:db` is the check that matters here: it exercises these
-- policies as several different users and will fail if any of them stopped
-- meaning what it meant.
-- ---------------------------------------------------------------------------

alter policy "donors read their own redemptions" on association_invite_redemptions
  using ((donor_id = (select auth.uid())));

alter policy "association members insertable by admins or first member" on association_members
  with check ((is_association_admin(association_id) OR is_platform_admin() OR ((user_id = (select auth.uid())) AND (NOT association_has_members(association_id)))));

alter policy "association members readable by their own association" on association_members
  using (((user_id = (select auth.uid())) OR is_association_admin(association_id) OR is_platform_admin()));

alter policy "requests editable by owning hospital" on blood_requests
  with check ((hospital_id IN ( SELECT hospitals.id
   FROM hospitals
  WHERE (hospitals.owner_id = (select auth.uid())))));

alter policy "requests insertable by phone-verified patients" on blood_requests
  with check ((is_phone_verified() AND (patient_record_id IN ( SELECT patients.id
   FROM patients
  WHERE (patients.created_by = (select auth.uid()))))));

alter policy "requests updatable by owning hospital" on blood_requests
  using ((hospital_id IN ( SELECT hospitals.id
   FROM hospitals
  WHERE (hospitals.owner_id = (select auth.uid())))));

alter policy "requests updatable by their patient author" on blood_requests
  using ((patient_record_id IN ( SELECT patients.id
   FROM patients
  WHERE (patients.created_by = (select auth.uid())))));

alter policy "compensations insertable by the pledging donor" on compensations
  with check (((select auth.uid()) = donor_id));

alter policy "compensations updatable by donor or owning hospital" on compensations
  using ((((select auth.uid()) = donor_id) OR (hospital_id IN ( SELECT hospitals.id
   FROM hospitals
  WHERE (hospitals.owner_id = (select auth.uid()))))));

alter policy "consent insertable by its subject" on consent_records
  with check ((user_id = (select auth.uid())));

alter policy "consent readable by its subject" on consent_records
  using (((user_id = (select auth.uid())) OR is_platform_admin()));

alter policy "consent withdrawable by its subject" on consent_records
  using ((user_id = (select auth.uid())))
  with check ((user_id = (select auth.uid())));

alter policy "data subject requests raisable by their subject" on data_subject_requests
  with check ((user_id = (select auth.uid())));

alter policy "data subject requests readable by their subject" on data_subject_requests
  using (((user_id = (select auth.uid())) OR is_platform_admin()));

alter policy "reveals readable by the donor" on donor_contact_reveals
  using ((donor_id = (select auth.uid())));

alter policy "reveals readable by whoever made them" on donor_contact_reveals
  using ((revealed_by = (select auth.uid())));

alter policy "donor profiles editable by owner" on donor_profiles
  with check (((select auth.uid()) = id));

alter policy "donor profiles readable by their owner" on donor_profiles
  using (((id = (select auth.uid())) OR is_platform_admin()));

alter policy "donor profiles updatable by owner" on donor_profiles
  using (((select auth.uid()) = id));

alter policy "hospitals editable by owner" on hospitals
  with check (((select auth.uid()) = owner_id));

alter policy "hospitals updatable by owner" on hospitals
  using (((select auth.uid()) = owner_id));

alter policy "patients deletable by their creator" on patients
  using ((created_by = (select auth.uid())));

alter policy "patients insertable by their creator" on patients
  with check ((created_by = (select auth.uid())));

alter policy "patients readable by creator, verifier, or admin" on patients
  using (((created_by = (select auth.uid())) OR can_verify_in_wilaya(wilaya) OR is_platform_admin()));

alter policy "patients updatable by their creator" on patients
  using ((created_by = (select auth.uid())))
  with check ((created_by = (select auth.uid())));

alter policy "profiles editable by owner" on profiles
  with check (((select auth.uid()) = id));

alter policy "profiles readable by their owner" on profiles
  using (((id = (select auth.uid())) OR is_platform_admin()));

alter policy "profiles updatable by owner" on profiles
  using (((select auth.uid()) = id));

alter policy "push subscriptions deletable by their owner" on push_subscriptions
  using ((user_id = (select auth.uid())));

alter policy "push subscriptions insertable by their owner" on push_subscriptions
  with check ((user_id = (select auth.uid())));

alter policy "push subscriptions readable by their owner" on push_subscriptions
  using ((user_id = (select auth.uid())));

alter policy "push subscriptions updatable by their owner" on push_subscriptions
  using ((user_id = (select auth.uid())))
  with check ((user_id = (select auth.uid())));

alter policy "responses editable by responding donor" on request_responses
  with check (((select auth.uid()) = donor_id));

alter policy "responses readable by the donor who made them" on request_responses
  using ((donor_id = (select auth.uid())));

alter policy "responses readable by the requesting family" on request_responses
  using ((request_id IN ( SELECT r.id
   FROM (blood_requests r
     JOIN patients p ON ((p.id = r.patient_record_id)))
  WHERE (p.created_by = (select auth.uid())))));

alter policy "responses updatable by the donor who made them" on request_responses
  using ((donor_id = (select auth.uid())))
  with check ((donor_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- 2. Seven foreign keys had no covering index.
--
-- Postgres indexes the primary key side of a reference and not the referencing
-- column, so a join across one of these -- and every ON DELETE check -- was a
-- sequential scan. Two of them are on the hot path: blood_requests.verified_by
-- backs the `verifier:associations!blood_requests_verified_by_fkey(name)`
-- embed that every request query in the patient model selects, and
-- blood_requests.hospital_id backs the hospital embed behind the map.
--
-- Named after the constraint they cover so the next linter run lines up with
-- what is here.
-- ---------------------------------------------------------------------------

create index if not exists association_invites_created_by_idx
  on association_invites (created_by);

create index if not exists blood_requests_hospital_id_idx
  on blood_requests (hospital_id);

create index if not exists blood_requests_verified_by_idx
  on blood_requests (verified_by);

create index if not exists donor_contact_reveals_association_id_idx
  on donor_contact_reveals (association_id);

create index if not exists hospitals_owner_id_idx
  on hospitals (owner_id);

create index if not exists notification_outbox_request_id_idx
  on notification_outbox (request_id);

create index if not exists request_responses_donor_id_idx
  on request_responses (donor_id);
