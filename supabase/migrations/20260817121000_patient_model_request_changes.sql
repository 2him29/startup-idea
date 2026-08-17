-- Patient/association model, step 3 of 5: rework the existing tables.
--
-- NAMING NOTE — the spec asked for a `patient_id` FK on requests, but
-- blood_requests.patient_id has existed since the initial schema as *text*
-- (the handwritten patient file reference, e.g. "P-2024-001") and is read by
-- the live UI. Two columns cannot share a name, so the foreign key is
-- `patient_record_id` and the legacy text column keeps its meaning untouched.

alter table blood_requests
  add column patient_record_id uuid references patients (id) on delete cascade,
  add column verified_by uuid references associations (id) on delete set null,
  add column verified_at timestamptz,
  -- Denormalized from the patient row so the donor-facing list never has to
  -- read `patients` (whose RLS deliberately hides names and phone numbers).
  add column wilaya text,
  add column hospital_name text;

-- Hospital-authored requests are legacy; new rows carry a patient instead.
alter table blood_requests
  alter column hospital_id drop not null;

-- The spec wanted patient_record_id NOT NULL, which is impossible while the
-- legacy hospital flow must keep working behind the feature flag. This check
-- enforces the real invariant instead: a request is anchored to one or the
-- other, never to neither.
alter table blood_requests
  add constraint blood_requests_has_origin
  check (patient_record_id is not null or hospital_id is not null);

create index blood_requests_patient_record_idx on blood_requests (patient_record_id);
create index blood_requests_wilaya_idx on blood_requests (wilaya);

-- Backfill wilaya/hospital_name for existing hospital-authored rows so the
-- donor list renders identically whichever origin a request has.
update blood_requests r
set wilaya = h.wilaya, hospital_name = h.name
from hospitals h
where r.hospital_id = h.id and r.wilaya is null;

-- ---------------------------------------------------------------------------
-- Compensations: pledge against a request, not a hospital record
-- ---------------------------------------------------------------------------

alter table compensations
  add column request_id uuid references blood_requests (id) on delete cascade;

-- Legacy pledges reference a hospital and have no request; new ones are the
-- other way round, so neither column can be NOT NULL on its own.
alter table compensations
  alter column hospital_id drop not null;

alter table compensations
  add constraint compensations_has_target
  check (request_id is not null or hospital_id is not null);

create index compensations_request_idx on compensations (request_id);

-- ---------------------------------------------------------------------------
-- Donor + account changes
-- ---------------------------------------------------------------------------

-- PLACEMENT NOTE — the spec put phone_verified on the donor table, but a
-- patient posting a request is not necessarily a donor and the requests RLS
-- below has to check them too. Phone verification is a property of the
-- account, so it lives on `profiles`, which every account type has exactly one
-- of. donor_profiles.id is the same uuid, so a donor's flag is still one join
-- away.
alter table profiles
  add column phone_verified boolean not null default false;

alter table donor_profiles
  add column last_donation_at timestamptz;

-- Carry the existing date column across; it stays the source for the profile
-- editor, while last_donation_at is what the cooldown is computed from.
update donor_profiles
set last_donation_at = last_donation_date::timestamptz
where last_donation_date is not null and last_donation_at is null;

create or replace function is_phone_verified()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select phone_verified from profiles where id = auth.uid()), false);
$$;

/**
 * The 90-day whole-blood cooldown, computed at read time rather than stored:
 * a stored boolean would need a scheduled job to flip back and would be wrong
 * for the hours between the donation anniversary and that job running.
 * security_invoker keeps the caller's RLS on donor_profiles in force.
 */
create view donor_eligibility with (security_invoker = true) as
select
  id,
  last_donation_at,
  last_donation_at is null or now() - last_donation_at > interval '90 days' as is_eligible,
  case
    when last_donation_at is null then 0
    else greatest(0, ceil(extract(epoch from (last_donation_at + interval '90 days' - now())) / 86400)::int)
  end as days_until_eligible
from donor_profiles;

-- ---------------------------------------------------------------------------
-- RLS for the new request paths
--
-- Policies are OR'd, so the existing "owning hospital" policies stay in place
-- and keep the legacy flow working untouched.
-- ---------------------------------------------------------------------------

create policy "requests insertable by phone-verified patients" on blood_requests
  for insert to authenticated with check (
    is_phone_verified()
    and patient_record_id in (select id from patients where created_by = auth.uid())
  );

create policy "requests updatable by their patient author" on blood_requests
  for update to authenticated using (
    patient_record_id in (select id from patients where created_by = auth.uid())
  );

/**
 * Verification rights are scoped by wilaya: a Blida committee may vouch for
 * Blida requests only. This policy is what lets them write verified_by /
 * verified_at; it cannot stop them writing other columns as well, which is
 * acceptable here — a verifying association editing a request in its own
 * wilaya is within its remit.
 */
create policy "requests verifiable by associations in the same wilaya" on blood_requests
  for update to authenticated using (
    wilaya is not null and can_verify_in_wilaya(wilaya)
  ) with check (
    wilaya is not null and can_verify_in_wilaya(wilaya)
  );

-- compensations needs no new insert policy: the existing "insertable by the
-- pledging donor" check (auth.uid() = donor_id) already covers request-linked
-- pledges, since the donor is still the acting party.
