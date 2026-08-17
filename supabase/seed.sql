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

  -- Leave one of the two requests already vouched for, so the donor-facing
  -- badge has something to render without depending on someone having clicked
  -- Verify first. The other stays unverified on purpose: both states need to
  -- be visible side by side to demo — and to test — the difference.
  update blood_requests
  set verified_by = assoc_id, verified_at = now()
  where patient_record_id = patient_a and verified_by is null;

  -- A donor who gave recently, so the 90-day cooldown has something to hide.
  insert into donor_profiles (id, blood_type, age, weight_kg, last_donation_at, last_donation_date)
  values (member_id, 'A+', 30, 75, now() - interval '10 days', (now() - interval '10 days')::date)
  on conflict (id) do update
    set last_donation_at = excluded.last_donation_at,
        last_donation_date = excluded.last_donation_date;

  raise notice 'Seed complete: association %, patients % and %', assoc_id, patient_a, patient_b;
end $$;
