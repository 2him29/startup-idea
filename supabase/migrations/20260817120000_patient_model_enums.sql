-- Patient/association model, step 1 of 5: enum values only.
--
-- Postgres forbids USING a new enum value in the same transaction that added
-- it, and the Supabase CLI wraps each migration file in its own transaction —
-- so the ALTER TYPE statements must live alone in the earliest file and the
-- tables that reference them come in the next migration.
--
-- 'hospital' is deliberately kept: the legacy hospital-account flow stays
-- behind the VITE_PATIENT_MODEL feature flag until the pilot association has
-- verified real requests. Nothing here drops or rewrites existing data.

alter type user_role add value if not exists 'patient';
alter type user_role add value if not exists 'association';

create type association_type as enum ('red_crescent', 'scouts', 'student', 'other');
create type association_member_role as enum ('admin', 'moderator', 'volunteer');
