-- Patient/association model, step 5 of 5: compliance scaffolding.
--
-- Qatra processes health data (blood type, medical eligibility, patient
-- identity) under Algeria's Loi 18-07 / 25-11. Two obligations are scaffolded
-- here so the product is not retrofitted later:
--
--   * Consent must be specific and demonstrable. A generic Terms-of-Service
--     tick does not cover health data, so consent is recorded per purpose,
--     with the exact version of the text the user was shown — without the
--     version, an old consent cannot be told apart from a current one after
--     the wording changes.
--   * Data-subject rights (access/export, correction, erasure) must have a
--     route. This starts as a request queue worked by a human; automating
--     fulfilment can come later without changing the user-facing contract.
--
-- TODO(compliance): both tables land in a Supabase region outside Algeria.
-- Resolve hosting (Supabase region vs. local hosting vs. ANPDP transfer
-- authorization) before onboarding real patients.

create type consent_purpose as enum ('health_data', 'contact_sharing');
create type dsr_kind as enum ('export', 'correction', 'deletion');
create type dsr_status as enum ('open', 'in_progress', 'resolved', 'rejected');

create table consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  purpose consent_purpose not null,
  -- The identifier of the consent copy shown, e.g. 'health-data-v1'. Bump it
  -- in packages/core/src/consent.ts whenever the wording changes materially.
  consent_version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index consent_records_user_idx on consent_records (user_id, purpose);

create table data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind dsr_kind not null,
  status dsr_status not null default 'open',
  -- What the user asked to have corrected/exported, in their own words.
  details text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index data_subject_requests_user_idx on data_subject_requests (user_id, status);

alter table consent_records enable row level security;
alter table data_subject_requests enable row level security;

-- A consent record is evidence: the user may create and read their own, and
-- withdraw it by setting revoked_at, but there is no delete policy — erasing
-- the record would destroy the proof that consent was ever given.
create policy "consent readable by its subject" on consent_records
  for select to authenticated using (user_id = auth.uid() or is_platform_admin());

create policy "consent insertable by its subject" on consent_records
  for insert to authenticated with check (user_id = auth.uid());

create policy "consent withdrawable by its subject" on consent_records
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "data subject requests readable by their subject" on data_subject_requests
  for select to authenticated using (user_id = auth.uid() or is_platform_admin());

create policy "data subject requests raisable by their subject" on data_subject_requests
  for insert to authenticated with check (user_id = auth.uid());

create policy "data subject requests resolvable by admins" on data_subject_requests
  for update to authenticated using (is_platform_admin())
  with check (is_platform_admin());
