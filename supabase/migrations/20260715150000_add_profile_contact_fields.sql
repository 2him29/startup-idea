-- Contact + location fields for the richer Edit Profile screen.
-- phone: hospitals need a way to reach a matched donor (and donors a way to
--        reach the hospital) outside the app -- calls/WhatsApp are how
--        coordination actually happens.
-- wilaya: the donor's home wilaya (canonical French name, same convention as
--         hospitals.wilaya), so matching can respect where they actually live
--         rather than a one-off GPS position.

alter table profiles
  add column phone text,
  add column wilaya text;
