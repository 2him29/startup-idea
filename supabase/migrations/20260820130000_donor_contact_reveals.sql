-- Opening a donor's phone number is an event, and it is written down.
--
-- Until now search_donors() returned the full number to every member of a
-- verified association, for every donor who had consented, every time the
-- screen loaded. Consent made that lawful, but nothing recorded who actually
-- looked, so the app could not answer the one question a donor is entitled to
-- ask: who has my number, and when did they take it?
--
-- Loi 18-07 / 25-11 asks for the number of people handling health data to be
-- no larger than the purpose needs, and for processing to be traceable. The
-- design's phrasing is the promise this migration has to make true: "Each
-- number you open is written to your committee's log with your name and the
-- time."
--
-- So the search now returns a masked number and reveal_donor_contact() is the
-- only way to the full one. Masked rather than absent because the shape of the
-- number is not the secret — the point is that the search screen no longer
-- hands out fifty numbers to someone who will ring two.

create table if not exists donor_contact_reveals (
  id             uuid primary key default gen_random_uuid(),
  donor_id       uuid not null references auth.users(id) on delete cascade,
  revealed_by    uuid not null references auth.users(id) on delete cascade,
  association_id uuid not null references associations(id) on delete cascade,
  revealed_at    timestamptz not null default now()
);

create index if not exists donor_contact_reveals_donor_idx on donor_contact_reveals (donor_id, revealed_at desc);
create index if not exists donor_contact_reveals_by_idx on donor_contact_reveals (revealed_by, revealed_at desc);

alter table donor_contact_reveals enable row level security;

/**
 * The donor can read their own log. This is the point of keeping it: a data
 * subject asking "who has seen my number" gets an answer, not a shrug. It is
 * also why DataRightsScreen exists.
 */
create policy "reveals readable by the donor" on donor_contact_reveals
  for select to authenticated using (donor_id = auth.uid());

/**
 * A member can see what they themselves opened.
 *
 * Not a leak — it is their own act, already known to them — and without it the
 * person who took a number cannot check their own trail while the committee's
 * admin can. "Reveal only what you'll use" is a request for restraint, and
 * restraint is easier to exercise when you can see what you have already
 * taken.
 */
create policy "reveals readable by whoever made them" on donor_contact_reveals
  for select to authenticated using (revealed_by = auth.uid());

/** An association's admins can read their own committee's log, nobody else's. */
create policy "reveals readable by the association's admins" on donor_contact_reveals
  for select to authenticated using (is_association_admin(association_id));

create policy "reveals readable by platform admins" on donor_contact_reveals
  for select to authenticated using (is_platform_admin());

-- No insert policy: rows are written only by reveal_donor_contact() below,
-- which is SECURITY DEFINER. A client that could insert its own rows could
-- also forge them, and a forgeable log is worse than none.
--
-- No update and no delete policy, deliberately, for the same reason
-- consent_records has none: this is evidence about processing that happened.
-- An association that could erase its own reads could erase the fact it read.

/**
 * Reveal one donor's number, and record that it happened.
 *
 * Returns null rather than raising when the donor has not consented, so the
 * UI can say "this donor keeps their number private" — a rule stated is
 * better than a gap, and an exception would read as a failure.
 *
 * The wilaya check mirrors search_donors: any member of a verified association
 * in that wilaya, volunteers included. Ringing donors is the job.
 */
create or replace function reveal_donor_contact(p_donor_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  donor_wilaya text;
  assoc_id     uuid;
  the_phone    text;
begin
  select wilaya, phone into donor_wilaya, the_phone from profiles where id = p_donor_id;
  if donor_wilaya is null then
    raise exception 'Unknown donor' using errcode = '42501';
  end if;

  if not is_association_in_wilaya(donor_wilaya) then
    raise exception 'Only a verified association may reveal a number in %', donor_wilaya
      using errcode = '42501';
  end if;

  -- Version-matched consent, exactly as search_donors checks it. Consent given
  -- against superseded wording does not unlock anything.
  if not exists (
    select 1 from consent_records cr
    where cr.user_id = p_donor_id
      and cr.purpose = 'contact_sharing'
      and cr.consent_version = 'contact-sharing-v1'
      and cr.revoked_at is null
  ) then
    return null;
  end if;

  select a.id into assoc_id
  from association_members m
  join associations a on a.id = m.association_id
  where m.user_id = auth.uid() and a.is_verified and a.wilaya = donor_wilaya
  limit 1;

  insert into donor_contact_reveals (donor_id, revealed_by, association_id)
  values (p_donor_id, auth.uid(), assoc_id);

  return the_phone;
end;
$$;

revoke all on function reveal_donor_contact(uuid) from public;
grant execute on function reveal_donor_contact(uuid) to authenticated;

comment on function reveal_donor_contact(uuid) is
  'Returns a consenting donor''s phone number and logs the reveal. Null when the donor has not consented under the current version.';

/**
 * Search now returns the number masked: "05 •• •• •• 56".
 *
 * Enough to recognise a number already known, useless for ringing someone.
 * The body is otherwise unchanged from 20260820120000.
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
    case
      when c.user_id is null or p.phone is null then null
      else left(p.phone, 3) || ' •• •• •• ' || right(p.phone, 2)
    end as phone,
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
