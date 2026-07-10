-- Demo data for investor-facing walkthroughs. Hospitals here have no owner_id
-- (no real account signed up yet) since owner_id is nullable for that reason.

insert into hospitals (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'City General Hospital'),
  ('22222222-2222-2222-2222-222222222222', 'Memorial Medical Center'),
  ('33333333-3333-3333-3333-333333333333', 'St. Mary''s Hospital'),
  ('44444444-4444-4444-4444-444444444444', 'County Hospital');

insert into blood_requests (hospital_id, patient_id, blood_type, units, urgency, distance_km, created_at) values
  ('11111111-1111-1111-1111-111111111111', 'P-2024-001', 'A+', 2, 'Critical', 2.3, now() - interval '30 minutes'),
  ('22222222-2222-2222-2222-222222222222', 'P-2024-002', 'O-', 3, 'High', 4.1, now() - interval '1 hour'),
  ('33333333-3333-3333-3333-333333333333', 'P-2024-003', 'B+', 1, 'Medium', 5.7, now() - interval '3 hours'),
  ('44444444-4444-4444-4444-444444444444', 'P-2024-004', 'AB+', 2, 'Low', 8.2, now() - interval '5 hours');
