-- Replace the placeholder demo hospitals with their real Algiers counterparts
-- (keeping the same ids so the seeded blood_requests stay attached), then seed
-- the major public hospitals Algerians actually know: the CHU network plus
-- flagship EPH/EHS/EHU institutions, with real coordinates so "open in maps"
-- and the nationwide directory map work out of the box.

update hospitals set name = 'Hôpital Salim Zemirli – El Harrach',              latitude = 36.7226, longitude = 3.1367  where id = '11111111-1111-1111-1111-111111111111';
update hospitals set name = 'EHS Maouche Mohand Amokrane – El Biar',          latitude = 36.7520, longitude = 3.0170  where id = '22222222-2222-2222-2222-222222222222';
update hospitals set name = 'CHU Lamine Debaghine – Bab El Oued',             latitude = 36.7925, longitude = 3.0511  where id = '33333333-3333-3333-3333-333333333333';
update hospitals set name = 'Hôpital Nafissa Hamoud (ex-Parnet) – Hussein Dey', latitude = 36.7440, longitude = 3.0960 where id = '44444444-4444-4444-4444-444444444444';
update hospitals set name = 'CHU Oran – Dr Benzerdjeb'                        where id = '55555555-5555-5555-5555-555555555555';
update hospitals set name = 'CHU Frantz Fanon – Blida'                        where id = '66666666-6666-6666-6666-666666666666';

insert into hospitals (name, wilaya, latitude, longitude) values
  ('CHU Mustapha Pacha – Alger',               'Alger',           36.7575, 3.0530),
  ('CHU Beni Messous – Issad Hassani',         'Alger',           36.7797, 2.9797),
  ('CPMC – Centre Pierre et Marie Curie',      'Alger',           36.7590, 3.0555),
  ('Hôpital Central de l''Armée – Aïn Naâdja', 'Alger',           36.6975, 3.0730),
  ('EHU 1er Novembre 1954 – Oran',             'Oran',            35.7140, -0.5880),
  ('CHU Benbadis – Constantine',               'Constantine',     36.3575, 6.6147),
  ('CHU Ibn Rochd – Annaba',                   'Annaba',          36.8980, 7.7560),
  ('CHU Saâdna Abdenour – Sétif',              'Sétif',           36.1898, 5.4108),
  ('CHU Nedir Mohamed – Tizi Ouzou',           'Tizi Ouzou',      36.7169, 4.0497),
  ('CHU Benflis Touhami – Batna',              'Batna',           35.5550, 6.1741),
  ('CHU Khelil Amrane – Béjaïa',               'Béjaïa',          36.7509, 5.0567),
  ('CHU Tidjani Damerdji – Tlemcen',           'Tlemcen',         34.8828, -1.3167),
  ('CHU Abdelkader Hassani – Sidi Bel Abbès',  'Sidi Bel Abbès',  35.1900, -0.6400),
  ('EPH Mohamed Boudiaf – Ouargla',            'Ouargla',         31.9493, 5.3339);
