-- How a committee brings the donors it already has.
--
-- Every product in this field has the same real problem, and it is not
-- features: a directory with three donors in your wilaya and your blood type
-- is useless. The market leader has ten thousand installs and is still not
-- useful. Qatra's answer is that a Croissant-Rouge wilaya committee already
-- holds a donor list and already holds the trust — one committee in Blida with
-- two hundred known donors beats ten thousand scattered installs.
--
-- Until now the app had no way for a committee to act on that. Donors self
-- registered, one at a time, and a committee's existing list stayed on paper.
--
-- The mechanism is a link, and the distinction matters more than it looks.
--
-- The obvious implementation is an import: the committee uploads its member
-- list, we create accounts. That would process the personal data of people who
-- never asked us to, to build a health-adjacent profile, without a lawful basis
-- any of them gave — which contradicts the entire case this project makes
-- about handling data properly, and would be the single fact that sinks a
-- review of it. It is also how the market leader ended up publishing donors'
-- phone numbers to anyone who installs the app.
--
-- So the committee gets a code it can pass along however it already reaches
-- its people, and each donor still signs up themselves, still consents, still
-- verifies their own number. The invite attributes them to the committee; it
-- does not create them. What the committee gains is not access to data it
-- lacked, it is the ability to see that the people it already knows have
-- arrived.

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists association_invites (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references associations (id) on delete cascade,
  -- Unguessable, generated below rather than supplied by the caller. A code a
  -- committee could choose would be a code an outsider could guess, and
  -- describe_invite() answers to anonymous visitors by necessity.
  code text not null unique,
  -- The committee's own note: "Blida list, August". Never shown to a donor.
  label text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Null means no expiry and no limit respectively. A committee running a
  -- standing recruitment link wants both null; one printing a code on a poster
  -- for a single drive wants both set.
  expires_at timestamptz,
  max_uses int check (max_uses is null or max_uses > 0),
  revoked_at timestamptz
);

create index association_invites_association_idx on association_invites (association_id);

comment on table association_invites is
  'Invite links a committee shares with donors it already knows. A code, never an import: the donor still signs up and still consents.';

-- Who arrived through which invite. Deliberately holds nothing but the link
-- itself — no name, no phone, no blood type. A committee reading this learns
-- that someone joined, and to learn who it must go through search_donors and
-- reveal_donor_contact like anyone else, which writes an audit row.
create table if not exists association_invite_redemptions (
  invite_id uuid not null references association_invites (id) on delete cascade,
  donor_id uuid not null references auth.users (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  primary key (invite_id, donor_id)
);

create index association_invite_redemptions_donor_idx on association_invite_redemptions (donor_id);

comment on table association_invite_redemptions is
  'Which donor accepted which invite. Holds no personal data of its own; identity still goes through the audited reveal path.';

-- ---------------------------------------------------------------------------
-- 2. Predicates
-- ---------------------------------------------------------------------------

-- Membership of one association, by id.
--
-- The neighbours are is_association_admin(uuid), which is narrower, and
-- is_association_in_wilaya(text), which asks a different question. Seeing that
-- a hundred donors joined is not an act that binds the association the way
-- vouching for a request is, so it belongs to any member rather than to
-- administrators — the same split 20260820120000 had to make after one
-- predicate gated three different rights and locking it down locked
-- volunteers out of donor search.
create or replace function is_association_member(p_association_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from association_members
    where association_id = p_association_id
      and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Row level security
--
-- Reads are policies; every write is a function. An update policy broad enough
-- to let an administrator revoke an invite is also broad enough to let them
-- rewrite its code or lift its own use limit, and there is no reason to hand
-- out that shape when revocation is one specific act.
-- ---------------------------------------------------------------------------

alter table association_invites enable row level security;
alter table association_invite_redemptions enable row level security;

create policy "members read their association's invites"
  on association_invites for select
  using (is_association_member(association_id));

create policy "members read their association's redemptions"
  on association_invite_redemptions for select
  using (
    exists (
      select 1 from association_invites i
      where i.id = association_invite_redemptions.invite_id
        and is_association_member(i.association_id)
    )
  );

-- A donor may see that they themselves accepted an invite; the app uses this
-- to stop offering a link they have already taken.
create policy "donors read their own redemptions"
  on association_invite_redemptions for select
  using (donor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. Creating an invite
-- ---------------------------------------------------------------------------

-- 32 characters, ambiguous glyphs removed: no O or 0, no I or 1. These codes
-- get read aloud in a room and copied off a printed page, and "was that an O
-- or a zero" is a support burden that costs more than the extra entropy is
-- worth. Ten characters of it is fifty bits, which is not guessable at any
-- rate an HTTP endpoint will serve.
create or replace function generate_invite_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32)::int + 1, 1),
    ''
  )
  from generate_series(1, 10);
$$;

create or replace function create_association_invite(
  p_association_id uuid,
  p_label text default null,
  p_expires_at timestamptz default null,
  p_max_uses int default null
)
returns association_invites
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text;
  v_row association_invites;
  v_tries int := 0;
begin
  -- Creating a recruitment link under the association's name is an act that
  -- speaks for the association, so it sits with administrators, next to
  -- vouching, rather than with any member.
  if not is_association_admin(p_association_id) then
    raise exception 'Only an administrator of this association may create an invite'
      using errcode = '42501';
  end if;

  loop
    v_tries := v_tries + 1;
    v_code := generate_invite_code();
    begin
      insert into association_invites (association_id, code, label, created_by, expires_at, max_uses)
      values (p_association_id, v_code, nullif(btrim(p_label), ''), auth.uid(), p_expires_at, p_max_uses)
      returning * into v_row;
      return v_row;
    exception when unique_violation then
      -- A collision at 49 bits means something is wrong with random(), not
      -- that we were unlucky. Retry a few times, then say so rather than
      -- looping forever inside a request.
      if v_tries >= 5 then
        raise exception 'Could not generate a unique invite code after % attempts', v_tries;
      end if;
    end;
  end loop;
end;
$$;

create or replace function revoke_association_invite(p_invite_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_association uuid;
begin
  select association_id into v_association from association_invites where id = p_invite_id;
  if v_association is null then
    raise exception 'No such invite' using errcode = '42704';
  end if;
  if not is_association_admin(v_association) then
    raise exception 'Only an administrator of this association may revoke an invite'
      using errcode = '42501';
  end if;

  -- Revoking closes the door to new donors and leaves everyone already through
  -- it exactly where they are. The redemptions stay: they are the record of
  -- how those donors arrived, and deleting them would quietly rewrite it.
  update association_invites set revoked_at = now()
  where id = p_invite_id and revoked_at is null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Reading an invite before you have an account
-- ---------------------------------------------------------------------------

-- This one answers to anonymous callers, and that is deliberate.
--
-- A donor meets this link before they have an account — that is the entire
-- point of it — and a page that says "you are joining Croissant-Rouge Algérien
-- — Blida" before asking anyone to sign up is the difference between an
-- invitation and a suspicious link. Every other function added since
-- 20260821160000 is closed to anon; this is the exception, so it returns the
-- least that will do the job: the association's name, its wilaya, and whether
-- the code is still good. No committee contact details, no counts, no id.
create or replace function describe_invite(p_code text)
returns table (association_name text, wilaya text, is_valid boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    a.name,
    a.wilaya,
    i.revoked_at is null
      and (i.expires_at is null or i.expires_at > now())
      and (
        i.max_uses is null
        or (select count(*) from association_invite_redemptions r where r.invite_id = i.id) < i.max_uses
      )
  from association_invites i
  join associations a on a.id = i.association_id
  where i.code = upper(btrim(p_code));
$$;

-- ---------------------------------------------------------------------------
-- 6. Accepting an invite
-- ---------------------------------------------------------------------------

create or replace function redeem_association_invite(p_code text)
returns table (association_name text, wilaya text)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite association_invites;
  v_used int;
begin
  if auth.uid() is null then
    raise exception 'Sign in before accepting an invite' using errcode = '42501';
  end if;

  select * into v_invite from association_invites
  where code = upper(btrim(p_code));

  if v_invite.id is null then
    raise exception 'No such invite' using errcode = '42704';
  end if;
  if v_invite.revoked_at is not null then
    raise exception 'This invite has been withdrawn' using errcode = '42501';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    raise exception 'This invite has expired' using errcode = '42501';
  end if;

  -- Counted rather than kept in a column on the invite. A used_count that the
  -- redemptions can disagree with is a bug waiting for the day they do.
  if v_invite.max_uses is not null then
    select count(*) into v_used from association_invite_redemptions where invite_id = v_invite.id;
    if v_used >= v_invite.max_uses then
      raise exception 'This invite has already been used its full number of times'
        using errcode = '42501';
    end if;
  end if;

  -- Idempotent: a donor who opens the same link twice, or reinstalls and
  -- follows it again, has still joined once. Without this the second visit
  -- would either raise at them for no reason or inflate the committee's count.
  insert into association_invite_redemptions (invite_id, donor_id)
  values (v_invite.id, auth.uid())
  on conflict (invite_id, donor_id) do nothing;

  return query
    select a.name, a.wilaya from associations a where a.id = v_invite.association_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. What the committee sees
-- ---------------------------------------------------------------------------

-- Counts, not people. The console needs to say "42 donors joined through this
-- link"; it does not need, and so does not get, a list of who they are.
create or replace function association_invite_counts(p_association_id uuid)
returns table (invite_id uuid, redeemed int)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select i.id, count(r.donor_id)::int
  from association_invites i
  left join association_invite_redemptions r on r.invite_id = i.id
  where i.association_id = p_association_id
    and is_association_member(p_association_id)
  group by i.id;
$$;

-- ---------------------------------------------------------------------------
-- 8. Grants
--
-- PUBLIC first, then the role. Revoking the role alone achieves nothing while
-- PUBLIC still holds the grant — anon inherits it and the function stays
-- callable, which is the exact trap 20260821160000 was written to close.
-- ---------------------------------------------------------------------------

-- The tables themselves, before the policies.
--
-- RLS is not the outer door. Supabase grants SELECT on public tables to anon
-- and authenticated, so an anonymous read of association_invites got far
-- enough to evaluate the policy and failed inside it with "permission denied
-- for function is_association_member" — refused, but by the second layer,
-- after the request had already reached a predicate written for signed-in
-- callers. Revoking the table grant refuses it at the door instead.
--
-- No write grant is issued to anybody: every mutation goes through the
-- functions above, which is what keeps codes unguessable and use limits
-- counted against real rows.
revoke all on table association_invites from public, anon;
revoke all on table association_invite_redemptions from public, anon;
grant select on table association_invites to authenticated;
grant select on table association_invite_redemptions to authenticated;

revoke all on function is_association_member(uuid) from public, anon;
grant execute on function is_association_member(uuid) to authenticated;

revoke all on function create_association_invite(uuid, text, timestamptz, int) from public, anon;
grant execute on function create_association_invite(uuid, text, timestamptz, int) to authenticated;

revoke all on function revoke_association_invite(uuid) from public, anon;
grant execute on function revoke_association_invite(uuid) to authenticated;

revoke all on function redeem_association_invite(text) from public, anon;
grant execute on function redeem_association_invite(text) to authenticated;

revoke all on function association_invite_counts(uuid) from public, anon;
grant execute on function association_invite_counts(uuid) to authenticated;

-- generate_invite_code() is an implementation detail of create_association_invite.
-- Exposed on /rest/v1/rpc it is a random string generator, which is harmless
-- and still not API.
revoke all on function generate_invite_code() from public, anon, authenticated;

-- The deliberate exception, per section 5.
revoke all on function describe_invite(text) from public;
grant execute on function describe_invite(text) to anon, authenticated;
