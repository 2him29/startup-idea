-- Real Algiers-area coordinates for the seeded demo hospitals, plus
-- recomputed blood_requests.distance_km (Haversine from Algiers centre,
-- ~36.7755N 3.0597E) so the map and the "X km" labels agree.

alter table hospitals
  add column latitude double precision,
  add column longitude double precision;

update hospitals set latitude = 36.7169, longitude = 3.1846 where id = '11111111-1111-1111-1111-111111111111'; -- City General Hospital, Bab Ezzouar
update hospitals set latitude = 36.7378, longitude = 3.0392 where id = '22222222-2222-2222-2222-222222222222'; -- Memorial Medical Center, Hydra
update hospitals set latitude = 36.7590, longitude = 3.0335 where id = '33333333-3333-3333-3333-333333333333'; -- St. Mary's Hospital, El Biar
update hospitals set latitude = 36.7280, longitude = 3.0780 where id = '44444444-4444-4444-4444-444444444444'; -- County Hospital, Kouba

update blood_requests set distance_km = 12.90 where hospital_id = '11111111-1111-1111-1111-111111111111';
update blood_requests set distance_km = 4.57  where hospital_id = '22222222-2222-2222-2222-222222222222';
update blood_requests set distance_km = 2.97  where hospital_id = '33333333-3333-3333-3333-333333333333';
update blood_requests set distance_km = 5.53  where hospital_id = '44444444-4444-4444-4444-444444444444';
