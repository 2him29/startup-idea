-- Wilaya (province) for each hospital, so donors/hospitals can filter by the
-- administrative unit Algerians actually navigate by, not just raw distance.
-- Stored as the canonical French name (matches packages/core/src/wilayas.ts).

alter table hospitals
  add column wilaya text;

update hospitals set wilaya = 'Alger' where wilaya is null;

alter table hospitals
  alter column wilaya set default 'Alger';
