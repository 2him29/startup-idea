-- Qatra staging seed — the manual prerequisites the patient/association model
-- needs before anything works end to end.
--
-- Idempotent: safe to run repeatedly. Re-running will not duplicate the
-- association, the membership, the admin, or the sample requests.
--
-- The Supabase CLI runs this automatically on `supabase db reset`. Against a
-- hosted staging project, paste it into the SQL editor or pipe it through psql.
--
-- ---------------------------------------------------------------------------
-- PREREQUISITE: the three accounts below must already exist in auth.users.
--
-- This script deliberately does NOT create them. Auth users belong to GoTrue —
-- inserting rows into auth.users by hand produces accounts with no usable
-- password and subtly wrong metadata, which then fail to log in and waste an
-- afternoon. Sign them up through the app (or the dashboard) first, then run
-- this. It raises a clear exception naming any address it cannot find rather
-- than silently seeding half a fixture.
-- ---------------------------------------------------------------------------

do $$
declare
  admin_id    uuid;
  member_id   uuid;
  family_id   uuid;
  assoc_id    uuid;
  patient_a   uuid;
  patient_b   uuid;
begin
  select id into admin_id  from auth.users where email = 'demo.admin@weare.app';
  select id into member_id from auth.users where email = 'demo.association@weare.app';
  select id into family_id from auth.users where email = 'demo.donor@weare.app';

  if admin_id is null then
    raise exception 'Seed prerequisite missing: sign up demo.admin@weare.app first';
  end if;
  if member_id is null then
    raise exception 'Seed prerequisite missing: sign up demo.association@weare.app first';
  end if;
  if family_id is null then
    raise exception 'Seed prerequisite missing: sign up demo.donor@weare.app first';
  end if;

  -- Profiles. Phone verification is set here because RLS blocks request
  -- inserts without it, and there is no SMS provider in staging.
  insert into profiles (id, role, full_name, wilaya, phone_verified)
  values (admin_id, 'donor', 'Qatra Admin', 'Alger', true)
  on conflict (id) do update set phone_verified = true;

  insert into profiles (id, role, full_name, wilaya, phone_verified)
  values (member_id, 'donor', 'Association Volunteer', 'Blida', true)
  on conflict (id) do update set phone_verified = true;

  insert into profiles (id, role, full_name, wilaya, phone_verified)
  values (family_id, 'donor', 'Demo Donor', 'Blida', true)
  on conflict (id) do update set phone_verified = true;

  -- Platform admin — the only role that can verify an association.
  insert into platform_admins (user_id) values (admin_id)
  on conflict (user_id) do nothing;

  -- The association itself, created unverified exactly as a real applicant's
  -- would be.
  select id into assoc_id from associations
  where name = 'Croissant-Rouge Algérien — Blida';

  if assoc_id is null then
    insert into associations (name, type, wilaya, contact_phone, contact_email)
    values ('Croissant-Rouge Algérien — Blida', 'red_crescent', 'Blida', '+213555000111', 'blida@cra.test')
    returning id into assoc_id;
  end if;

  insert into association_members (association_id, user_id, role)
  values (assoc_id, member_id, 'admin')
  on conflict (association_id, user_id) do nothing;

  -- The demo donor is enrolled as a volunteer too, so the one account the
  -- splash screen can log into can actually reach the association console.
  -- Without this the console shows only its empty state, which makes the
  -- verification flow impossible to demo or to test end to end.
  insert into association_members (association_id, user_id, role)
  values (assoc_id, family_id, 'volunteer')
  on conflict (association_id, user_id) do nothing;

  -- Verification goes through verify_association(), never a direct UPDATE.
  --
  -- is_verified is not writable by client roles at all (migration 2 revokes it
  -- and re-grants the other columns), so this function is the real path — and
  -- it checks is_platform_admin() on the *caller*. Impersonating the admin via
  -- the same GUC PostgREST sets means this seed exercises the genuine
  -- authorization path instead of quietly bypassing it as table owner.
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  perform verify_association(assoc_id, true);
  perform set_config('request.jwt.claim.sub', '', true);

  if not (select is_verified from associations where id = assoc_id) then
    raise exception 'verify_association() did not verify the association';
  end if;

  -- Two patients with open requests in Blida: one for the association to
  -- verify, one left unverified so the donor list shows both states.
  select id into patient_a from patients where full_name = 'Seed Patient — Amel K.';
  if patient_a is null then
    insert into patients (full_name, blood_type, wilaya, hospital_name, created_by, contact_phone)
    values ('Seed Patient — Amel K.', 'O-', 'Blida', 'CHU Frantz Fanon – Blida', family_id, '+213555000222')
    returning id into patient_a;

    insert into blood_requests (patient_record_id, patient_id, blood_type, units, urgency, wilaya, hospital_name, distance_km)
    values (patient_a, 'SEED-0001', 'O-', 3, 'Critical', 'Blida', 'CHU Frantz Fanon – Blida', 47);
  end if;

  select id into patient_b from patients where full_name = 'Seed Patient — Karim B.';
  if patient_b is null then
    insert into patients (full_name, blood_type, wilaya, hospital_name, created_by, contact_phone)
    values ('Seed Patient — Karim B.', 'A+', 'Blida', 'Clinique El Amel', family_id, '+213555000333')
    returning id into patient_b;

    insert into blood_requests (patient_record_id, patient_id, blood_type, units, urgency, wilaya, hospital_name, distance_km)
    values (patient_b, 'SEED-0002', 'A+', 1, 'High', 'Blida', 'Clinique El Amel', 45);
  end if;

  -- Both verification states, forced rather than left to chance. Patient A's
  -- request is always vouched for so the donor-facing badge has something to
  -- render; patient B's is always reset to unverified so the association
  -- console always has an unclicked Verify action.
  --
  -- The reset matters: verifying is exactly what the console screen does, so
  -- without it the first run consumes the only unverified request and every
  -- later run finds nothing to act on.
  -- status is reset too, so a run that fulfilled one of these still leaves the
  -- next run with two open requests to look at.
  update blood_requests
  set verified_by = assoc_id, verified_at = now(), status = 'open'
  where patient_record_id = patient_a;

  update blood_requests
  set verified_by = null, verified_at = null, status = 'open'
  where patient_record_id = patient_b;

  -- Also vouch for a legacy hospital-authored request in this wilaya, if there
  -- is one with coordinates.
  --
  -- This is the only way to get a verified pin onto the map: coordinates come
  -- from the hospitals join, and a patient-authored request has no hospital_id,
  -- so nothing posted through the new flow is mappable at all. Until that gap
  -- is closed, the map shows legacy requests only.
  update blood_requests r
  set verified_by = assoc_id, verified_at = now()
  from hospitals h
  where h.id = r.hospital_id
    and r.wilaya = 'Blida'
    and h.latitude is not null
    and r.status = 'open';

  -- ---------------------------------------------------------------------
  -- Three donors in Blida, one per state the donor-search screen can show.
  -- All three are set explicitly rather than left to whatever a previous run
  -- did: `npm run test:flow` ends by recording a donation, which would
  -- otherwise leave the eligible donor in cooldown and make donor search look
  -- empty for reasons unrelated to the code.
  --
  --   family_id  eligible, opted in      -> a callable number
  --   admin_id   eligible, not opted in  -> "number not shared"
  --   member_id  inside the 90-day wait  -> hidden unless asked for
  -- ---------------------------------------------------------------------

  update profiles set wilaya = 'Blida' where id = admin_id;

  update profiles set phone = '+213555000444' where id = family_id and phone is null;
  update profiles set phone = '+213555000555' where id = admin_id  and phone is null;
  update profiles set phone = '+213555000666' where id = member_id and phone is null;

  insert into donor_profiles (id, blood_type, age, weight_kg, last_donation_at, last_donation_date)
  values (family_id, 'O+', 29, 72, null, null)
  on conflict (id) do update
    set last_donation_at = null, last_donation_date = null;

  insert into donor_profiles (id, blood_type, age, weight_kg, last_donation_at, last_donation_date)
  values (admin_id, 'A+', 41, 80, null, null)
  on conflict (id) do update
    set last_donation_at = null, last_donation_date = null;

  insert into donor_profiles (id, blood_type, age, weight_kg, last_donation_at, last_donation_date)
  values (member_id, 'A+', 30, 75, now() - interval '10 days', (now() - interval '10 days')::date)
  on conflict (id) do update
    set last_donation_at = excluded.last_donation_at,
        last_donation_date = excluded.last_donation_date;

  -- Only family_id opts into direct contact. Both states have to be present
  -- or the consent gate reads as a bug rather than a rule.
  insert into consent_records (user_id, purpose, consent_version)
  select family_id, 'contact_sharing', 'contact-sharing-v1'
  where not exists (
    select 1 from consent_records
    where user_id = family_id and purpose = 'contact_sharing' and revoked_at is null
  );

  delete from consent_records
  where user_id = admin_id and purpose = 'contact_sharing';

  raise notice 'Seed complete: association %, patients % and %', assoc_id, patient_a, patient_b;
end $$;
