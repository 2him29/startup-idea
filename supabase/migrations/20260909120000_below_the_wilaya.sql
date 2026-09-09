-- A wilaya is not an answer to "who is near me".
--
-- Alger is 58 communes; Tamanrasset is larger than several European countries.
-- "A donor in your wilaya" can mean a donor four hours away, and the registry
-- that already holds several thousand Algerian donors searches to commune --
-- the one thing it does better than this application.
--
-- So requests and donors can now say where they are below the wilaya. The
-- names come from the official division (58 wilayas, 548 daïras, 1541
-- communes) and live in packages/core/src/communes.ts; nothing here validates
-- against that list, deliberately. A commune renamed or created between that
-- dataset and today is a real place someone lives in, and a check constraint
-- would reject the person rather than the stale list.

alter table profiles       add column if not exists commune text;
alter table blood_requests add column if not exists commune text;

comment on column profiles.commune is
  'Donor''s commune, stored canonically as its French name (see communes.ts). Null for every account created before this migration, and optional after it.';
comment on column blood_requests.commune is
  'Commune the patient is in, stored canonically as its French name. Null when the family did not say, which stays allowed.';

-- Ordering, not filtering. See the note on search_donors below: a partial
-- index is enough because the column is null for every pre-existing row and
-- optional afterwards.
create index if not exists profiles_wilaya_commune_idx
  on profiles (wilaya, commune)
  where commune is not null;

/**
 * Donor search, now aware of the commune.
 *
 * THE COMMUNE ORDERS THE RESULTS. IT DOES NOT FILTER THEM.
 *
 * This is the whole design decision, and it is the opposite of what the
 * competing registry does. There, a commune is a filter: choose one, search,
 * and see only the donors inside it. That returns nobody at all in a commune
 * with no registered donor, while a compatible donor sits ten minutes away
 * across a boundary that means nothing to a car.
 *
 * For blood, a narrowed *search* is dangerous and a narrowed *ordering* is
 * useful. So the wilaya still decides who is returned -- which also keeps this
 * function's authorisation rule exactly as it was, one wilaya at a time -- and
 * the commune decides who is at the top. Same commune first, then the rest of
 * the wilaya, then the existing eligibility and name order.
 *
 * The old three-argument version is dropped rather than left alongside. A
 * fourth parameter with a default does not replace it: Postgres would keep
 * both and then refuse every three-argument call as ambiguous.
 */
drop function if exists search_donors(text, text, boolean);

create or replace function search_donors(
  p_wilaya text,
  p_blood_type text default null,
  p_include_ineligible boolean default false,
  p_commune text default null
)
returns table (
  id uuid,
  full_name text,
  blood_type text,
  wilaya text,
  commune text,
  phone text,
  is_eligible boolean,
  days_until_eligible int,
  shares_phone boolean,
  same_commune boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  -- is_association_in_wilaya, NOT can_verify_in_wilaya. Verification is an
  -- admin act; donor search is not. 20260820120000 split these two predicates
  -- for exactly that reason, and restating this function from its original
  -- 20260818120000 body -- which predates the split -- silently locks every
  -- volunteer out of donor search again. verify:db catches it eight assertions
  -- deep, which is how this line came to be commented.
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
    p.commune,
    -- Masked, per 20260820130000: enough to recognise a number you already
    -- know, useless for ringing someone. reveal_donor_contact() is the only
    -- route to the whole number, and it writes down who took it. Restating
    -- this function from an older body returns fifty whole numbers to someone
    -- who will ring two -- verify:db asserts the mask for that reason.
    case
      when c.user_id is null or p.phone is null then null
      else left(p.phone, 3) || ' •• •• •• ' || right(p.phone, 2)
    end as phone,
    (d.last_donation_at is null or now() - d.last_donation_at > interval '90 days') as is_eligible,
    case
      when d.last_donation_at is null then 0
      else greatest(0, ceil(extract(epoch from (d.last_donation_at + interval '90 days' - now())) / 86400)::int)
    end as days_until_eligible,
    (c.user_id is not null) as shares_phone,
    -- Told to the caller rather than merely sorted on, so the console can say
    -- "same commune" instead of leaving a volunteer to guess why this donor is
    -- first.
    (p_commune is not null and p.commune is not null and p.commune = p_commune) as same_commune
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
    (p_commune is not null and p.commune = p_commune) desc nulls last,
    (d.last_donation_at is null or now() - d.last_donation_at > interval '90 days') desc,
    p.full_name asc;
end;
$$;

-- `create or replace` resets privileges, and on Supabase that hands PUBLIC back
-- EXECUTE. Repeated here for the same reason 20260821160000 gives: the revoke
-- has to name public AND anon, because Supabase grants the roles separately and
-- revoking only public leaves anon inheriting nothing but keeping its own.
revoke all on function search_donors(text, text, boolean, text) from public, anon;
grant execute on function search_donors(text, text, boolean, text) to authenticated;

comment on function search_donors(text, text, boolean, text) is
  'Donors in one wilaya, ordered by commune proximity then eligibility. The commune orders and never filters: hiding a compatible donor one commune away is the failure this avoids. Verified association admins only.';
