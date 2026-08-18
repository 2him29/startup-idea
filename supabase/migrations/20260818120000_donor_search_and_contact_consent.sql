-- Donor search, and the privacy repair it depends on.
--
-- THE PROBLEM THIS FIXES
-- Since the initial schema, `profiles` and `donor_profiles` have been readable
-- by any authenticated user (`using (true)`). That was a defensible shortcut
-- for a closed demo, but it means anyone who registers can enumerate every
-- donor's name, wilaya, blood type and phone number. Building a donor-search
-- screen on top of it would have turned a latent exposure into a feature.
--
-- Under Loi 18-07 a phone number tied to a blood type is sensitive health data
-- about an identified person, so this narrows both tables to the owner and
-- routes search through a checked function instead.
--
-- WHO MAY SEARCH
-- Members of a Qatra-verified association, and only within the wilaya that
-- association is verified for — the same rule that governs who may vouch for a
-- request, reused deliberately so there is one trust model rather than two.
--
-- PHONE NUMBERS
-- Withheld unless the donor has explicitly opted in (an un-revoked
-- `contact_sharing` consent). Blood coordination in Algeria happens by phone,
-- so committees genuinely need to call people — but that is the donor's
-- decision to grant and to withdraw, not a blanket default. A donor who has
-- not opted in is still findable and still contactable through the app; only
-- the number is withheld.

-- ---------------------------------------------------------------------------
-- Narrow the base tables
-- ---------------------------------------------------------------------------

drop policy "profiles readable by authenticated users" on profiles;
drop policy "donor profiles readable by authenticated users" on donor_profiles;

create policy "profiles readable by their owner" on profiles
  for select to authenticated using (id = auth.uid() or is_platform_admin());

create policy "donor profiles readable by their owner" on donor_profiles
  for select to authenticated using (id = auth.uid() or is_platform_admin());

-- ---------------------------------------------------------------------------
-- Donor search
-- ---------------------------------------------------------------------------

/**
 * Donors a verified association may see in its own wilaya.
 *
 * SECURITY DEFINER because the policies above deliberately hide these rows
 * from everyone but their owner; this function is the single, audited hole in
 * that wall, and it re-checks the caller itself rather than trusting the
 * client. Raising (rather than returning zero rows) when the caller has no
 * standing in the wilaya keeps an unauthorized query distinguishable from a
 * genuinely empty result.
 *
 * `p_include_ineligible` lets a coordinator see who exists but is still
 * cooling off, greyed out with a countdown, instead of concluding there is
 * nobody available. The 90-day rule is computed here, at read time, for the
 * same reason the donor_eligibility view does it: a stored flag would need a
 * nightly job and would be wrong for the hours between the anniversary and
 * that job running.
 */
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
  if not can_verify_in_wilaya(p_wilaya) then
    raise exception 'Only a verified association may search donors in %', p_wilaya
      using errcode = '42501';
  end if;

  return query
  select
    d.id,
    p.full_name,
    d.blood_type,
    p.wilaya,
    -- The opt-in gate. Withheld rather than absent: shares_phone tells the UI
    -- whether to offer "request contact" or show the number.
    case when c.user_id is not null then p.phone else null end as phone,
    (d.last_donation_at is null or now() - d.last_donation_at > interval '90 days') as is_eligible,
    case
      when d.last_donation_at is null then 0
      else greatest(0, ceil(extract(epoch from (d.last_donation_at + interval '90 days' - now())) / 86400)::int)
    end as days_until_eligible,
    (c.user_id is not null) as shares_phone
  from donor_profiles d
  join profiles p on p.id = d.id
  -- Version-matched, not merely un-revoked: if the wording of what contact
  -- sharing means changes materially, consent given against the old text must
  -- stop granting access until the donor agrees again. The literal has to stay
  -- in step with CONSENT_VERSIONS.contact_sharing in
  -- packages/core/src/compliance.ts — `npm run verify:db` fails if it drifts.
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

-- Client roles reach donors only through the function above.
revoke all on function search_donors(text, text, boolean) from public;
grant execute on function search_donors(text, text, boolean) to authenticated;
