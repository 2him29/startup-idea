-- Verification binds the association's name, so only its admins may do it.
--
-- Until now can_verify_in_wilaya() asked two questions — is this caller a
-- member of a verified association, and is that association in the request's
-- wilaya — and never looked at association_members.role. A volunteer therefore
-- vouched with exactly the authority of the committee's admin.
--
-- Why that is the wrong default here, in order of weight:
--
--   1. An association is a legal person that acts through its statutory
--      representatives (Loi 12-06), not through whichever member is holding a
--      phone. Verification is an attestation published under the association's
--      name to strangers; if the request turns out to be fraudulent, the
--      association carries it. The act should belong to someone entitled to
--      bind the association.
--
--   2. Verifying is a processing of health data. Narrowing who performs it is
--      data minimisation under Loi 18-07 / 25-11, the same principle that put
--      consent behind donor phone numbers.
--
-- NOTE(product): "association admin" is our proxy for "entitled to bind the
-- association". A real committee's mandate structure may be richer than one
-- boolean, and blood-request vetting is not itself a regulated medical act, so
-- confirm the mapping with the ANS before a public launch.
--
-- ---------------------------------------------------------------------------
-- One predicate was carrying three different rights.
--
-- can_verify_in_wilaya() gated all of: verifying a request, reading the
-- patient row behind it, and searching donors. Those are not the same
-- permission and must not narrow together — tightening verification to admins
-- silently locked volunteers out of donor search, which is the one job an
-- association's volunteers most obviously exist to do. (`npm run verify:db`
-- caught exactly that: seven donor-search assertions failed.)
--
-- So they split here:
--
--   can_verify_in_wilaya()        admin of a verified association  — vouching,
--                                 and the patient PII that vouching requires
--   is_association_in_wilaya()    any member of a verified association —
--                                 donor search, i.e. mobilising people
--
-- Patient PII follows verification rather than membership deliberately: a
-- volunteer who cannot perform the vetting act has no need of the family's
-- name and phone number to do it, and Loi 18-07 asks us to say so.
-- ---------------------------------------------------------------------------

create or replace function can_verify_in_wilaya(p_wilaya text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from association_members m
    join associations a on a.id = m.association_id
    where m.user_id = auth.uid()
      and a.is_verified
      and a.wilaya = p_wilaya
      and m.role = 'admin'
  );
$$;

comment on function can_verify_in_wilaya(text) is
  'Whether the caller may vouch for a request in this wilaya: admin of a verified association there. Role matters because verification binds the association.';

/**
 * Membership without the authority to bind: any member of a verified
 * association in this wilaya. Volunteers included, by design.
 */
create or replace function is_association_in_wilaya(p_wilaya text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from association_members m
    join associations a on a.id = m.association_id
    where m.user_id = auth.uid()
      and a.is_verified
      and a.wilaya = p_wilaya
  );
$$;

comment on function is_association_in_wilaya(text) is
  'Whether the caller belongs to a verified association in this wilaya, at any role. Gates donor search, not verification.';

-- Re-point donor search at the wider predicate. The body is unchanged from
-- 20260818120000 except for this one line; it is restated in full because
-- create or replace cannot patch a function in place.
create or replace function search_donors(
  p_wilaya text,
  p_blood_type text default null,
  p_include_ineligible boolean default false
)
returns table (
  id uuid,
  full_name text,
  blood_type text,
  wilaya text,
  phone text,
  is_eligible boolean,
  days_until_eligible int,
  shares_phone boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not is_association_in_wilaya(p_wilaya) then
    raise exception 'Only a verified association may search donors in %', p_wilaya
      using errcode = '42501';
  end if;

  return query
  select
    d.id,
    p.full_name,
    d.blood_type,
    p.wilaya,
    case when c.user_id is not null then p.phone else null end as phone,
    (d.last_donation_at is null or now() - d.last_donation_at > interval '90 days') as is_eligible,
    case
      when d.last_donation_at is null then 0
      else greatest(0, ceil(extract(epoch from (d.last_donation_at + interval '90 days' - now())) / 86400)::int)
    end as days_until_eligible,
    (c.user_id is not null) as shares_phone
  from donor_profiles d
  join profiles p on p.id = d.id
  left join lateral (
    select cr.user_id
    from consent_records cr
    where cr.user_id = d.id
      and cr.purpose = 'contact_sharing'
      and cr.consent_version = 'contact-sharing-v1'
      and cr.revoked_at is null
    limit 1
  ) c on true
  where p.wilaya = p_wilaya
    and (p_blood_type is null or d.blood_type = p_blood_type)
    and (
      p_include_ineligible
      or d.last_donation_at is null
      or now() - d.last_donation_at > interval '90 days'
    )
  order by
    (d.last_donation_at is null or now() - d.last_donation_at > interval '90 days') desc,
    p.full_name;
end;
$$;

revoke all on function search_donors(text, text, boolean) from public;
grant execute on function search_donors(text, text, boolean) to authenticated;
