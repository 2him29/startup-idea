-- What a volunteer is actually judging.
--
-- The console has always led with the hospital, but nobody vouches for a
-- hospital. The question in front of a committee is whether this particular
-- plea is real, and the signals for that are: who posted it, whether we can
-- reach them, whether they gave a hospital file number, and whether the
-- hospital they named is one we know.
--
-- Three of those live on `patients`, which a verifying association can already
-- read. The fourth — the poster's own name, and whether their phone is
-- verified — lives on `profiles`, which is readable by its owner alone. That
-- is a policy worth keeping: a committee has no business browsing the profile
-- table, and widening it so one screen can show one name would trade a
-- deliberate boundary for a convenience.
--
-- So this exposes exactly those fields for exactly one request at a time, to
-- exactly the people entitled to vouch for it, and nothing else. The profiles
-- policy is untouched.
--
-- Admins only, matching can_verify_in_wilaya: this is the material you read in
-- order to vouch, so it follows the right to vouch rather than mere
-- membership. A volunteer who cannot sign the association's name has no need
-- of the family's phone number to decide something they cannot decide.

create or replace function request_plausibility(p_request_id uuid)
returns table (
  posted_by_name text,
  posted_by_phone_verified boolean,
  contact_phone text,
  file_ref text,
  in_directory boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  req_wilaya text;
begin
  select r.wilaya into req_wilaya from blood_requests r where r.id = p_request_id;
  if req_wilaya is null then
    raise exception 'Unknown request' using errcode = '42501';
  end if;

  if not can_verify_in_wilaya(req_wilaya) then
    raise exception 'Only a verifying association may read this' using errcode = '42501';
  end if;

  return query
  select
    poster.full_name,
    coalesce(poster.phone_verified, false),
    pat.contact_phone,
    -- patient_id is the hospital's own file reference, free text the family
    -- typed. Empty means "they did not have it to hand", which is the common
    -- case and not a mark against the request.
    --
    -- The em dash is the app's own sentinel, not data: the column is NOT NULL,
    -- so createPatientRequest() writes "—" when the field is left blank. It is
    -- stripped here rather than rendered, because "File № —" reads as a file
    -- number that happens to be a dash. TODO: make patient_id nullable and
    -- drop the sentinel — a column that cannot say "absent" forces every
    -- reader to know the placeholder.
    nullif(nullif(btrim(coalesce(r.patient_id, '')), ''), '—'),
    (r.hospital_id is not null)
  from blood_requests r
  left join patients pat on pat.id = r.patient_record_id
  left join profiles poster on poster.id = pat.created_by
  where r.id = p_request_id;
end;
$$;

revoke all on function request_plausibility(uuid) from public;
grant execute on function request_plausibility(uuid) to authenticated;

comment on function request_plausibility(uuid) is
  'The signals a committee weighs before vouching: who posted, whether they are reachable, the hospital file reference, and whether the hospital is in our directory. Admins of a verifying association in the request wilaya only.';
