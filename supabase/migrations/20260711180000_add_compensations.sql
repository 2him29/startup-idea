-- Compensation donations (family replacement).
--
-- In Algeria, when a region's blood stock is low a patient's non-urgent
-- transfusion can be released once someone donates "in their name" — and the
-- compensating donor does NOT need to share the patient's blood type, because
-- they are topping up the shared reserve rather than giving a directed unit.
-- This table records those pledges so a hospital can see who is compensating
-- for which patient and mark it fulfilled.

create table compensations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references profiles (id) on delete cascade,
  hospital_id uuid not null references hospitals (id) on delete cascade,
  patient_name text not null,
  patient_file text not null,
  status text not null default 'pledged' check (status in ('pledged', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index compensations_hospital_idx on compensations (hospital_id, status);
create index compensations_donor_idx on compensations (donor_id);

-- RLS: same trust model as the rest of the schema — any authenticated user can
-- read (small solidarity network for the MVP), the acting donor owns writes,
-- and the owning hospital may advance the status (e.g. to 'completed').
alter table compensations enable row level security;

create policy "compensations readable by authenticated users" on compensations
  for select to authenticated using (true);

create policy "compensations insertable by the pledging donor" on compensations
  for insert to authenticated with check (auth.uid() = donor_id);

create policy "compensations updatable by donor or owning hospital" on compensations
  for update to authenticated using (
    auth.uid() = donor_id
    or hospital_id in (select id from hospitals where owner_id = auth.uid())
  );
