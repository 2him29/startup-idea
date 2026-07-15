-- Community-organized blood drives (universities, mosques, workplaces).
-- Requests are for a specific patient; drives are pre-scheduled, recurring
-- collection events -- Algeria's donation volume actually comes mostly from
-- these, not from one-off urgent requests, so they get their own table
-- rather than being shoehorned into blood_requests.

create table blood_drives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organizer text not null,
  location text not null,
  wilaya text not null,
  starts_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index blood_drives_starts_at_idx on blood_drives (starts_at);

alter table blood_drives enable row level security;

create policy "blood drives readable by everyone" on blood_drives
  for select to public using (true);

insert into blood_drives (title, organizer, location, wilaya, starts_at) values
  ('Collecte de sang — Université d''Alger 1', 'Université d''Alger 1', 'Amphithéâtre central, Alger', 'Alger', now() + interval '3 days'),
  ('Collecte après la prière du vendredi', 'Grande Mosquée d''Alger', 'Grande Mosquée d''Alger', 'Alger', now() + interval '5 days'),
  ('Journée de don du sang Sonatrach', 'Sonatrach', 'Siège Sonatrach, Oran', 'Oran', now() + interval '9 days'),
  ('Collecte du Croissant-Rouge Algérien', 'Croissant-Rouge Algérien — antenne de Blida', 'Maison du Croissant-Rouge, Blida', 'Blida', now() + interval '12 days');
