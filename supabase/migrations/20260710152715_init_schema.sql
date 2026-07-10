-- WeAre core schema: profiles (donor/hospital), hospitals, blood requests, and responses (matches).

create type user_role as enum ('donor', 'hospital');
create type urgency_level as enum ('Critical', 'High', 'Medium', 'Low');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table hospitals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles (id) on delete set null,
  name text not null,
  created_at timestamptz not null default now()
);

create table donor_profiles (
  id uuid primary key references profiles (id) on delete cascade,
  blood_type text not null,
  age int,
  weight_kg int,
  last_donation_date date,
  created_at timestamptz not null default now()
);

create table blood_requests (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals (id) on delete cascade,
  patient_id text not null,
  blood_type text not null,
  units int not null default 1,
  urgency urgency_level not null,
  distance_km numeric,
  status text not null default 'open' check (status in ('open', 'matched', 'fulfilled', 'cancelled')),
  created_at timestamptz not null default now()
);

create table request_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references blood_requests (id) on delete cascade,
  donor_id uuid not null references donor_profiles (id) on delete cascade,
  status text not null default 'confirmed' check (status in ('confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Row-level security: read is open to any authenticated user (small trust-based
-- network for the MVP/demo), writes are restricted to the acting party.

alter table profiles enable row level security;
alter table hospitals enable row level security;
alter table donor_profiles enable row level security;
alter table blood_requests enable row level security;
alter table request_responses enable row level security;

create policy "profiles readable by authenticated users" on profiles
  for select to authenticated using (true);
create policy "profiles editable by owner" on profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles updatable by owner" on profiles
  for update to authenticated using (auth.uid() = id);

create policy "hospitals readable by authenticated users" on hospitals
  for select to authenticated using (true);
create policy "hospitals editable by owner" on hospitals
  for insert to authenticated with check (auth.uid() = owner_id);
create policy "hospitals updatable by owner" on hospitals
  for update to authenticated using (auth.uid() = owner_id);

create policy "donor profiles readable by authenticated users" on donor_profiles
  for select to authenticated using (true);
create policy "donor profiles editable by owner" on donor_profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "donor profiles updatable by owner" on donor_profiles
  for update to authenticated using (auth.uid() = id);

create policy "requests readable by authenticated users" on blood_requests
  for select to authenticated using (true);
create policy "requests editable by owning hospital" on blood_requests
  for insert to authenticated with check (
    hospital_id in (select id from hospitals where owner_id = auth.uid())
  );
create policy "requests updatable by owning hospital" on blood_requests
  for update to authenticated using (
    hospital_id in (select id from hospitals where owner_id = auth.uid())
  );

create policy "responses readable by authenticated users" on request_responses
  for select to authenticated using (true);
create policy "responses editable by responding donor" on request_responses
  for insert to authenticated with check (auth.uid() = donor_id);
