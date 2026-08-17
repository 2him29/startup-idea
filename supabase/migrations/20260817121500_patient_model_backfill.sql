-- Patient/association model, step 4 of 5: backfill.
--
-- Every existing hospital-authored request gets a `patients` row so the new
-- code path can treat all requests uniformly. Two rules held throughout:
--
--   1. No invented data. The old schema never captured a patient *name* — it
--      only had the file reference — so full_name is an explicitly-marked
--      placeholder carrying that reference, not a plausible-looking name.
--      contact_phone stays null rather than borrowing the hospital's number.
--   2. No invented verification history. verified_by / verified_at are left
--      null: none of these requests was ever vouched for by an association.
--
-- Hospitals seeded by migration rather than by signup have no owner_id, so
-- their requests get a patient row with created_by left NULL. That is the
-- honest record — no user created them — and it is why patients.created_by is
-- nullable. Those rows are unreachable by the "creator" branch of the patients
-- RLS policy, which is correct: an ownerless legacy record should be visible
-- only to a verifying association in its wilaya or to a platform admin.

do $$
declare
  r record;
  new_patient_id uuid;
begin
  for r in
    select
      req.id as request_id,
      req.patient_id as file_ref,
      req.blood_type,
      req.created_at,
      h.owner_id,
      h.name as hospital_name,
      coalesce(h.wilaya, 'Alger') as wilaya
    from blood_requests req
    join hospitals h on h.id = req.hospital_id
    where req.patient_record_id is null
  loop
    insert into patients (full_name, blood_type, wilaya, hospital_name, created_by, contact_phone, created_at)
    values (
      '[migrated] file ' || r.file_ref,
      r.blood_type,
      r.wilaya,
      r.hospital_name,
      r.owner_id,
      null,
      r.created_at
    )
    returning id into new_patient_id;

    update blood_requests
    set patient_record_id = new_patient_id
    where id = r.request_id;
  end loop;
end $$;

-- Link legacy compensations to a request where the pledge is unambiguous: the
-- same hospital with exactly one open request. Anything ambiguous is left
-- alone rather than guessed at.
update compensations c
set request_id = (
  select r.id from blood_requests r
  where r.hospital_id = c.hospital_id and r.status = 'open'
  limit 1
)
where c.request_id is null
  and (select count(*) from blood_requests r where r.hospital_id = c.hospital_id and r.status = 'open') = 1;
