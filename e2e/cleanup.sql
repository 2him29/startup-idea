-- The test data the e2e suite, and npm run test:flow, leave on staging.
--
-- Run by e2e/global-teardown.ts after every Playwright run, and by hand with:
--   npx supabase db query --linked --project-ref <staging ref> --file e2e/cleanup.sql
-- (--linked is required by the CLI; the --project-ref is what picks the database)
--
-- Every pattern is the exact shape a spec generates, anchored at both ends, so
-- a real row that happens to mention "e2e" or "flow" is never caught:
--   patients  "E2E Patient <ms>"  "Map E2E <ms>"  "Flow <ms>"  "Walkthrough <ms>"
--             "Console Test Patient"       patient-model.spec.ts, walkthrough.mjs
--   accounts  e2e.<step>.<ms>@qatra.test   qatra.test is not a real domain
--   invites   "e2e <ms>-<random>"          committee-invites.spec.ts
--
-- Deleting a patient removes its requests, and with them their responses,
-- notifications and compensations: each of those foreign keys cascades.
-- Deleting an account removes what it owned the same way. Nothing here touches
-- the seeded demo accounts, the seeded requests, or the consent and
-- contact-reveal logs, which are records by design.
--
-- Never point this at the live project. The teardown refuses to.
with test_patients as (
  select id from public.patients
  where full_name ~ '^(E2E Patient|Map E2E|Flow|Walkthrough) [0-9]{10,}$'
     or full_name = 'Console Test Patient'
),
-- Counted before anything is deleted: every part of this statement reads the
-- same snapshot, so the cascade below cannot shrink the number.
test_requests as (
  select count(*) as n from public.blood_requests
  where patient_record_id in (select id from test_patients)
),
gone_patients as (
  delete from public.patients
  where id in (select id from test_patients)
  returning id
),
gone_invites as (
  delete from public.association_invites
  where label ~ '^e2e [0-9]{10,}-[a-z0-9]+$'
  returning id
),
gone_accounts as (
  delete from auth.users
  where email ~ '^e2e\.[a-z]+\.[0-9]{10,}@qatra\.test$'
  returning id
)
select
  (select n from test_requests) as requests,
  (select count(*) from gone_patients) as patients,
  (select count(*) from gone_invites) as invite_links,
  (select count(*) from gone_accounts) as accounts;
