-- One function in 20260824120000 went out without a search_path.
--
-- Every other function that migration added carries `set search_path = public,
-- pg_temp`. generate_invite_code() did not, because it reads no tables and the
-- setting looked like ceremony — it calls string_agg, substr, floor, random
-- and generate_series, all of which live in pg_catalog, which Postgres always
-- searches first regardless.
--
-- Supabase's security linter flags it anyway, and the linter is right to. The
-- function is called from inside create_association_invite(), which is
-- SECURITY DEFINER: today it inherits that caller's pinned search_path and is
-- safe, but that safety is a property of the caller rather than of this
-- function, and the next caller need not have it. A function whose safety
-- depends on who happens to call it is exactly the shape that turns into a
-- privilege-escalation note later.
--
-- It also mattered for a smaller reason. This project's case rests on handling
-- health data properly, and a security report carrying warnings is a poor
-- thing to hand a reviewer — 20260821160000 was written for that reason too.

create or replace function generate_invite_code()
returns text
language sql
volatile
set search_path = public, pg_temp
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32)::int + 1, 1),
    ''
  )
  from generate_series(1, 10);
$$;

-- create or replace resets privileges to the default, which on Supabase means
-- PUBLIC gets EXECUTE back. Re-revoking is not optional here: without it this
-- migration would quietly undo the lockdown the previous one established.
revoke all on function generate_invite_code() from public, anon, authenticated;
