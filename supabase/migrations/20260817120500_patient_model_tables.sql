-- Patient/association model, step 2 of 5: the new tables.
--
-- The model shift: a patient or their family posts a request directly, and an
-- association (Croissant-Rouge committee, scout group, student association)
-- optionally vouches for it. Hospitals stop being an account type and become a
-- free-text reference on the request — the existing `hospitals` table is left
-- untouched and still backs the hospital directory screen.
--
-- TODO(compliance): `patients` and `associations` hold identifying + health
-- data (blood type, patient name, contact phone) under Loi 18-07 / 25-11. This
-- currently lands in a Supabase region outside Algeria. Revisit when the
-- hosting question (Supabase region vs. local hosting vs. ANPDP transfer
-- authorization) is resolved.

create table patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  blood_type text not null,
  wilaya text not null,
  -- Free text on purpose: the treating hospital is a reference the family
  -- types in, not an account, so it must not be constrained to our directory.
  hospital_name text,
  -- Nullable only so the backfill can carry across legacy hospital-authored
  -- requests, which genuinely have no creating user: many seeded hospitals
  -- have no owner_id, and attributing their patients to an invented account
  -- would fabricate provenance. Clients still cannot create an ownerless row —
  -- the insert policy requires created_by = auth.uid(), and NULL never
  -- satisfies it — so only a migration running as the table owner can.
  created_by uuid references auth.users (id) on delete cascade,
  contact_phone text,
  created_at timestamptz not null default now()
);

create index patients_created_by_idx on patients (created_by);
create index patients_wilaya_idx on patients (wilaya);

create table associations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type association_type not null default 'other',
  wilaya text not null,
  contact_phone text,
  contact_email text,
  -- Only a Qatra platform admin may flip this, via verify_association() below.
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index associations_wilaya_idx on associations (wilaya);
create index associations_verified_idx on associations (is_verified);

create table association_members (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references associations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role association_member_role not null default 'volunteer',
  created_at timestamptz not null default now(),
  unique (association_id, user_id)
);

create index association_members_user_idx on association_members (user_id);

-- Qatra staff. Kept as its own table rather than a user_role value because it
-- is orthogonal to account type: an admin is also a donor, patient, or member.
create table platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper functions
--
-- Every one is SECURITY DEFINER so it reads its table with RLS bypassed. A
-- policy on association_members that itself queried association_members would
-- recurse infinitely; routing the check through a definer function is the
-- standard way out. search_path is pinned so a caller cannot shadow `public`
-- with their own objects.
-- ---------------------------------------------------------------------------

create or replace function is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from platform_admins where user_id = auth.uid());
$$;

create or replace function is_association_admin(p_association_id uuid)
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
      and role = 'admin'
  );
$$;

/**
 * Whether an association has any members yet. Exists only so the "first
 * member bootstraps as admin" policy below can ask the question without
 * naming association_members inside its own policy — a table referenced in
 * its own RLS expression re-enters that expression and errors out with
 * infinite recursion. SECURITY DEFINER reads it with RLS bypassed, which
 * breaks the cycle.
 */
create or replace function association_has_members(p_association_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from association_members where association_id = p_association_id);
$$;

/**
 * True when the caller belongs to a *verified* association whose wilaya
 * matches. Verification rights are deliberately gated on the association
 * itself being verified — an unverified applicant must not be able to vouch
 * for requests while its own application is still pending.
 */
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
  );
$$;

/**
 * The only way is_verified changes.
 *
 * Column privileges attach to the *role*, not the policy, so they cannot
 * express "platform admins may write this column, other authenticated users
 * may not" — every client is the same `authenticated` role. The column is
 * therefore withheld from that role entirely (see the grants below) and this
 * function, which runs as the owner and checks the caller itself, is the only
 * door.
 */
create or replace function verify_association(p_association_id uuid, p_verified boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not is_platform_admin() then
    raise exception 'Only a Qatra platform admin can verify an association';
  end if;
  update associations set is_verified = p_verified where id = p_association_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table patients enable row level security;
alter table associations enable row level security;
alter table association_members enable row level security;
alter table platform_admins enable row level security;

-- patients: tighter than the rest of this schema on purpose. The donor-facing
-- request list does NOT read this table — blood_requests carries its own
-- denormalized blood_type/wilaya/hospital_name — so patient names and phone
-- numbers stay visible only to the family that entered them and to the
-- association verifying that specific wilaya.
create policy "patients readable by creator, verifier, or admin" on patients
  for select to authenticated using (
    created_by = auth.uid()
    or can_verify_in_wilaya(wilaya)
    or is_platform_admin()
  );

create policy "patients insertable by their creator" on patients
  for insert to authenticated with check (created_by = auth.uid());

create policy "patients updatable by their creator" on patients
  for update to authenticated using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "patients deletable by their creator" on patients
  for delete to authenticated using (created_by = auth.uid());

-- associations: publicly readable. A donor seeing "verified by Croissant-Rouge
-- Blida" on a request must be able to resolve that name, and an association
-- directory is public information anyway.
create policy "associations readable by everyone" on associations
  for select to public using (true);

create policy "associations insertable by any authenticated user" on associations
  for insert to authenticated with check (true);

create policy "associations updatable by their own admins" on associations
  for update to authenticated using (
    is_association_admin(id) or is_platform_admin()
  ) with check (
    is_association_admin(id) or is_platform_admin()
  );

-- is_verified is off-limits to client roles; verify_association() is the only
-- path to it.
--
-- The table-level grant has to go first. A column-level REVOKE does nothing
-- while a table-level UPDATE grant is still in place — that grant already
-- covers every column, including ones added later — and Supabase's default
-- privileges hand `authenticated` exactly such a table-level grant on every
-- new table in `public`. So: drop it, then re-grant column by column, leaving
-- is_verified off the list.
revoke update on associations from authenticated, anon;
grant update (name, type, wilaya, contact_phone, contact_email) on associations to authenticated;

create policy "association members readable by their own association" on association_members
  for select to authenticated using (
    user_id = auth.uid()
    or is_association_admin(association_id)
    or is_platform_admin()
  );

/**
 * The first member of a brand-new association bootstraps themselves as its
 * admin — there is no admin yet to approve them. Afterwards is_association_admin()
 * is the gate, so a second self-insert by an outsider is rejected.
 */
create policy "association members insertable by admins or first member" on association_members
  for insert to authenticated with check (
    is_association_admin(association_id)
    or is_platform_admin()
    or (user_id = auth.uid() and not association_has_members(association_id))
  );

create policy "association members manageable by their admins" on association_members
  for update to authenticated using (
    is_association_admin(association_id) or is_platform_admin()
  ) with check (
    is_association_admin(association_id) or is_platform_admin()
  );

create policy "association members removable by their admins" on association_members
  for delete to authenticated using (
    is_association_admin(association_id) or is_platform_admin()
  );

-- platform_admins: readable so the UI can show admin-only affordances; never
-- writable from the client (seed a row from the SQL editor / service role).
create policy "platform admins readable by authenticated users" on platform_admins
  for select to authenticated using (true);
