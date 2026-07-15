-- Demo hospitals outside Alger, so the new wilaya filter has something real
-- to demonstrate (a blood app that only ever shows Algiers reads as a local
-- pilot, not a national one).

insert into hospitals (id, name, wilaya, latitude, longitude) values
  ('55555555-5555-5555-5555-555555555555', 'CHU Oran', 'Oran', 35.6971, -0.6337),
  ('66666666-6666-6666-6666-666666666666', 'Hôpital Frantz Fanon', 'Blida', 36.4203, 2.8277);

insert into blood_requests (hospital_id, patient_id, blood_type, units, urgency, distance_km, created_at) values
  ('55555555-5555-5555-5555-555555555555', 'P-2024-005', 'O+', 2, 'High', 408.0, now() - interval '2 hours'),
  ('66666666-6666-6666-6666-666666666666', 'P-2024-006', 'A-', 1, 'Critical', 47.0, now() - interval '45 minutes');
