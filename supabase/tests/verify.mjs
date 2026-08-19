/**
 * Validates the Qatra database against a real PostgreSQL instance.
 *
 * Runs real Postgres binaries directly (embedded-postgres) rather than through
 * Docker, because Docker Desktop is not reliably available on this project's
 * machines — and "the migrations were hand-reviewed" is not verification. This
 * harness is what caught the backfill silently linking zero rows.
 *
 *   npm run verify:db
 *
 * WHAT THIS IS NOT: it is not Supabase. There is no PostgREST and no GoTrue,
 * so it cannot exercise the HTTP API, auth, or the Playwright suite. The auth
 * schema below is a stub shaped like Supabase's — enough that auth.uid() and
 * the anon/authenticated roles behave the same way, so RLS is genuinely
 * enforced, but end-to-end coverage still requires a real Supabase project.
 */

import EmbeddedPostgres from "embedded-postgres";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(HERE, "..", "migrations");
const SEED_FILE = join(HERE, "..", "seed.sql");

/**
 * The parts of a Supabase database the migrations depend on. The default
 * privileges matter: Supabase grants table-level ALL to `authenticated` on new
 * public tables, and migration 2's is_verified revoke is only meaningful — and
 * only correct — if that grant exists first.
 */
const SUPABASE_STUB = `
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid; $$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin; end if;
end $$;
grant usage on schema public to anon, authenticated, service_role;
-- Supabase grants this too. Without it a client query that calls auth.uid()
-- directly (as opposed to one where a policy calls it internally) fails with
-- "permission denied for schema auth" — a difference between this stub and
-- production that would otherwise show up as a phantom test failure.
grant usage on schema auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
`;

let pass = 0;
let fail = 0;
let client;

function section(title) {
  console.log(`\n--- ${title} ---`);
}

async function check(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
    pass++;
  } catch (err) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${String(err.message).split("\n")[0]}`);
    fail++;
  }
}

/** Runs `fn` as a given user, then rolls back so checks cannot affect each other. */
async function asUser(userId, fn) {
  await client.query("begin");
  try {
    await client.query("set local role authenticated");
    await client.query(`set local request.jwt.claim.sub = '${userId}'`);
    return await fn();
  } finally {
    await client.query("rollback").catch(() => {});
  }
}

/** The important direction for RLS: assert the statement is refused. */
async function expectDenied(sql, params = []) {
  try {
    await client.query(sql, params);
  } catch {
    return;
  }
  throw new Error("expected denial, but the statement succeeded");
}

async function expectRows(sql, params, n) {
  const res = await client.query(sql, params);
  if (res.rowCount !== n) throw new Error(`expected ${n} row(s), got ${res.rowCount}`);
}

async function applyMigrations() {
  section("migrations");
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    await check(file, async () => {
      // One transaction per file, matching how the Supabase CLI applies them.
      await client.query("begin");
      try {
        await client.query(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
        await client.query("commit");
      } catch (err) {
        await client.query("rollback").catch(() => {});
        throw err;
      }
    });
  }
  if (fail > 0) {
    console.log("\nMigrations failed — stopping before the RLS checks.");
    await shutdown(1);
  }
}

async function checkRls() {
  const ids = {};
  for (const who of ["family", "outsider", "member", "wrongWilaya", "admin", "donor"]) {
    const r = await client.query("insert into auth.users (email) values ($1) returning id", [`${who}@qatra.test`]);
    ids[who] = r.rows[0].id;
    await client.query(
      "insert into profiles (id, role, full_name, phone_verified) values ($1,'donor',$2,$3)",
      [ids[who], who, who === "family" || who === "donor"]
    );
  }
  await client.query("insert into platform_admins (user_id) values ($1)", [ids.admin]);

  const verified = (await client.query(
    "insert into associations (name,type,wilaya,is_verified) values ('CRA Blida','red_crescent','Blida',true) returning id"
  )).rows[0].id;
  const pending = (await client.query(
    "insert into associations (name,type,wilaya,is_verified) values ('CRA Oran','red_crescent','Oran',false) returning id"
  )).rows[0].id;

  await client.query("insert into association_members (association_id,user_id,role) values ($1,$2,'admin')", [verified, ids.member]);
  await client.query("insert into association_members (association_id,user_id,role) values ($1,$2,'admin')", [pending, ids.wrongWilaya]);

  const patient = (await client.query(
    "insert into patients (full_name,blood_type,wilaya,created_by) values ('Amel K.','O+','Blida',$1) returning id", [ids.family]
  )).rows[0].id;
  const request = (await client.query(
    "insert into blood_requests (patient_record_id,patient_id,blood_type,units,urgency,wilaya) values ($1,'P-1','O+',2,'Critical','Blida') returning id", [patient]
  )).rows[0].id;

  section("patients: PII containment");
  await check("creator reads their own patient row", () => asUser(ids.family, () => expectRows("select 1 from patients where id=$1", [patient], 1)));
  await check("unrelated user cannot read it", () => asUser(ids.outsider, () => expectRows("select 1 from patients where id=$1", [patient], 0)));
  await check("verifying association in the same wilaya can read it", () => asUser(ids.member, () => expectRows("select 1 from patients where id=$1", [patient], 1)));
  await check("member of an unverified association cannot read it", () => asUser(ids.wrongWilaya, () => expectRows("select 1 from patients where id=$1", [patient], 0)));
  await check("platform admin can read it", () => asUser(ids.admin, () => expectRows("select 1 from patients where id=$1", [patient], 1)));
  await check("cannot create a patient row owned by someone else", () =>
    asUser(ids.outsider, () => expectDenied("insert into patients (full_name,blood_type,wilaya,created_by) values ('X','A+','Alger',$1)", [ids.family])));

  section("blood_requests: phone-verification gate");
  await check("phone-verified creator can post", () =>
    asUser(ids.family, () => client.query(
      "insert into blood_requests (patient_record_id,patient_id,blood_type,units,urgency,wilaya) values ($1,'P-2','A+',1,'High','Blida')", [patient])));
  await check("unverified phone cannot post", async () => {
    const own = (await client.query(
      "insert into patients (full_name,blood_type,wilaya,created_by) values ('Own','B+','Alger',$1) returning id", [ids.outsider])).rows[0].id;
    await asUser(ids.outsider, () => expectDenied(
      "insert into blood_requests (patient_record_id,patient_id,blood_type,units,urgency,wilaya) values ($1,'P-3','B+',1,'Low','Alger')", [own]));
  });
  await check("cannot post against someone else's patient", () =>
    asUser(ids.donor, () => expectDenied(
      "insert into blood_requests (patient_record_id,patient_id,blood_type,units,urgency,wilaya) values ($1,'P-4','O+',1,'Low','Blida')", [patient])));

  section("verification: wilaya scoping");
  await check("verified association in matching wilaya can verify", () =>
    asUser(ids.member, async () => {
      const r = await client.query("update blood_requests set verified_by=$1, verified_at=now() where id=$2", [verified, request]);
      if (r.rowCount !== 1) throw new Error("update affected no rows");
    }));
  await check("association from another wilaya cannot verify", () =>
    asUser(ids.wrongWilaya, async () => {
      const r = await client.query("update blood_requests set verified_by=$1 where id=$2", [pending, request]);
      if (r.rowCount !== 0) throw new Error("update unexpectedly affected rows");
    }));
  await check("ordinary donor cannot verify", () =>
    asUser(ids.donor, async () => {
      const r = await client.query("update blood_requests set verified_by=$1 where id=$2", [verified, request]);
      if (r.rowCount !== 0) throw new Error("update unexpectedly affected rows");
    }));

  section("is_verified: only via verify_association()");
  await check("member cannot self-verify directly", () =>
    asUser(ids.member, () => expectDenied("update associations set is_verified=true where id=$1", [pending])));
  await check("non-admin calling verify_association() is rejected", () =>
    asUser(ids.member, () => expectDenied("select verify_association($1,true)", [pending])));
  await check("platform admin can verify via the function", () =>
    asUser(ids.admin, async () => {
      await client.query("select verify_association($1,true)", [pending]);
      const r = await client.query("select is_verified from associations where id=$1", [pending]);
      if (r.rows[0].is_verified !== true) throw new Error("is_verified did not change");
    }));
  await check("association admin can still edit permitted columns", () =>
    asUser(ids.member, async () => {
      const r = await client.query("update associations set contact_phone='0555' where id=$1", [verified]);
      if (r.rowCount !== 1) throw new Error("permitted update was blocked");
    }));

  section("association_members: bootstrap without recursion");
  await check("first member of an empty association self-enrols", () =>
    asUser(ids.outsider, async () => {
      const empty = (await client.query("insert into associations (name,type,wilaya) values ('Empty','other','Alger') returning id")).rows[0].id;
      await client.query("insert into association_members (association_id,user_id,role) values ($1,$2,'admin')", [empty, ids.outsider]);
    }));
  await check("outsider cannot join an association that has members", () =>
    asUser(ids.outsider, () => expectDenied(
      "insert into association_members (association_id,user_id,role) values ($1,$2,'volunteer')", [verified, ids.outsider])));

  section("consent + data-subject rights");
  await check("user records and reads their own consent", () =>
    asUser(ids.donor, async () => {
      await client.query("insert into consent_records (user_id,purpose,consent_version) values ($1,'health_data','health-data-v1')", [ids.donor]);
      await expectRows("select 1 from consent_records where user_id=$1", [ids.donor], 1);
    }));
  await check("user cannot read another's consent", () =>
    asUser(ids.outsider, () => expectRows("select 1 from consent_records where user_id=$1", [ids.donor], 0)));
  await check("consent rows cannot be deleted (evidence preserved)", () =>
    asUser(ids.donor, async () => {
      await client.query("insert into consent_records (user_id,purpose,consent_version) values ($1,'health_data','v1')", [ids.donor]);
      const r = await client.query("delete from consent_records where user_id=$1", [ids.donor]);
      if (r.rowCount !== 0) throw new Error("a consent row was deleted");
    }));
  await check("user cannot resolve their own data request", () =>
    asUser(ids.donor, async () => {
      await client.query("insert into data_subject_requests (user_id,kind) values ($1,'deletion')", [ids.donor]);
      const r = await client.query("update data_subject_requests set status='resolved' where user_id=$1", [ids.donor]);
      if (r.rowCount !== 0) throw new Error("user resolved their own request");
    }));

  section("backfill + eligibility");
  await check("every hospital-authored request linked to a patient", async () => {
    const r = await client.query("select count(*)::int n from blood_requests where hospital_id is not null and patient_record_id is null");
    if (r.rows[0].n !== 0) throw new Error(`${r.rows[0].n} legacy request(s) unlinked`);
  });
  await check("migrated names are placeholders, not invented", async () => {
    const r = await client.query("select count(*)::int n from patients where full_name like '[migrated]%'");
    if (r.rows[0].n === 0) throw new Error("no migrated placeholder rows found");
  });
  await check("no fabricated verification history", async () => {
    const r = await client.query("select count(*)::int n from blood_requests where verified_by is not null");
    if (r.rows[0].n !== 0) throw new Error("backfill invented verification");
  });
  await check("donor_eligibility computes the 90-day cooldown", async () => {
    await client.query("insert into donor_profiles (id,blood_type,last_donation_at) values ($1,'O+', now() - interval '10 days')", [ids.donor]);
    await client.query("insert into donor_profiles (id,blood_type,last_donation_at) values ($1,'A+', now() - interval '100 days')", [ids.member]);
    const recent = await client.query("select is_eligible, days_until_eligible from donor_eligibility where id=$1", [ids.donor]);
    const old = await client.query("select is_eligible from donor_eligibility where id=$1", [ids.member]);
    if (recent.rows[0].is_eligible !== false) throw new Error("recent donor reported eligible");
    if (recent.rows[0].days_until_eligible !== 80) throw new Error(`expected 80 days, got ${recent.rows[0].days_until_eligible}`);
    if (old.rows[0].is_eligible !== true) throw new Error("donor past 90 days reported ineligible");
  });
}

/**
 * Donor search and the privacy repair underneath it.
 *
 * The point of these is the *negative* cases. A donor-search feature is only
 * safe if the rows it exposes are unreachable any other way, so each check
 * that proves an association can see something is paired with one proving an
 * ordinary account cannot.
 */
async function checkDonorSearch() {
  // Fixtures: a verified Blida association with a member, plus two donors in
  // Blida — one who agreed to be phoned, one who did not — and a donor in
  // another wilaya who must never appear in Blida results.
  const mk = async (who, wilaya) => {
    const u = (await client.query("insert into auth.users (email) values ($1) returning id", [`${who}-ds@qatra.test`])).rows[0].id;
    await client.query(
      "insert into profiles (id, role, full_name, wilaya, phone, phone_verified) values ($1,'donor',$2,$3,$4,true)",
      [u, who, wilaya, "+2135550000"]
    );
    return u;
  };

  const assoc = (await client.query(
    "insert into associations (name,type,wilaya,is_verified) values ('CRA Blida DS','red_crescent','Blida',true) returning id"
  )).rows[0].id;

  const coordinator = await mk("coordinator", "Blida");
  await client.query("insert into association_members (association_id,user_id,role) values ($1,$2,'volunteer')", [assoc, coordinator]);

  const sharing = await mk("sharing-donor", "Blida");
  const private_ = await mk("private-donor", "Blida");
  const elsewhere = await mk("oran-donor", "Oran");
  const cooling = await mk("cooling-donor", "Blida");

  await client.query("insert into donor_profiles (id, blood_type) values ($1,'A+')", [sharing]);
  await client.query("insert into donor_profiles (id, blood_type) values ($1,'A+')", [private_]);
  await client.query("insert into donor_profiles (id, blood_type) values ($1,'A+')", [elsewhere]);
  await client.query("insert into donor_profiles (id, blood_type, last_donation_at) values ($1,'A+', now() - interval '10 days')", [cooling]);

  await client.query(
    "insert into consent_records (user_id, purpose, consent_version) values ($1,'contact_sharing','contact-sharing-v1')",
    [sharing]
  );

  section("privacy: the base tables are no longer world-readable");
  await check("an ordinary user cannot read another profile", () =>
    asUser(private_, () => expectRows("select 1 from profiles where id=$1", [sharing], 0)));
  await check("an ordinary user cannot read another donor_profile", () =>
    asUser(private_, () => expectRows("select 1 from donor_profiles where id=$1", [sharing], 0)));
  await check("a user can still read their own profile", () =>
    asUser(private_, () => expectRows("select 1 from profiles where id=$1", [private_], 1)));

  section("donor search: who may call it");
  await check("an ordinary donor calling search_donors is refused", () =>
    asUser(private_, () => expectDenied("select * from search_donors('Blida')")));
  await check("an association member may search its own wilaya", () =>
    asUser(coordinator, async () => {
      const r = await client.query("select * from search_donors('Blida')");
      if (r.rowCount === 0) throw new Error("returned no donors");
    }));
  await check("the same member is refused another wilaya", () =>
    asUser(coordinator, () => expectDenied("select * from search_donors('Oran')")));
  await check("donors from other wilayas never appear", () =>
    asUser(coordinator, async () => {
      const r = await client.query("select id from search_donors('Blida')");
      if (r.rows.some((x) => x.id === elsewhere)) throw new Error("an Oran donor leaked into Blida results");
    }));

  section("donor search: phone numbers follow consent");
  await check("a donor who opted in has their number returned", () =>
    asUser(coordinator, async () => {
      const r = await client.query("select phone, shares_phone from search_donors('Blida') where id=$1", [sharing]);
      if (r.rows[0].shares_phone !== true) throw new Error("shares_phone should be true");
      if (!r.rows[0].phone) throw new Error("phone withheld from a consenting donor");
    }));
  await check("a donor who did not opt in is listed WITHOUT their number", () =>
    asUser(coordinator, async () => {
      const r = await client.query("select phone, shares_phone from search_donors('Blida') where id=$1", [private_]);
      if (r.rowCount !== 1) throw new Error("the donor should still be findable");
      if (r.rows[0].phone !== null) throw new Error("phone leaked for a donor who never consented");
      if (r.rows[0].shares_phone !== false) throw new Error("shares_phone should be false");
    }));
  await check("an association cannot withdraw a donor's consent for them", () =>
    asUser(coordinator, async () => {
      const r = await client.query("update consent_records set revoked_at = now() where user_id=$1", [sharing]);
      if (r.rowCount !== 0) throw new Error("a coordinator edited someone else's consent record");
    }));

  // Withdrawal has to be performed by the donor and read back by the
  // coordinator, so this switches identity mid-transaction rather than using
  // two asUser blocks — each of those rolls back, which would undo the
  // withdrawal before the search could observe it.
  await check("when the donor withdraws consent, the number disappears", async () => {
    await client.query("begin");
    try {
      await client.query("set local role authenticated");
      await client.query(`set local request.jwt.claim.sub = '${sharing}'`);
      const upd = await client.query("update consent_records set revoked_at = now() where user_id = auth.uid()");
      if (upd.rowCount !== 1) throw new Error("the donor could not withdraw their own consent");

      await client.query(`set local request.jwt.claim.sub = '${coordinator}'`);
      const r = await client.query("select phone, shares_phone from search_donors('Blida') where id=$1", [sharing]);
      if (r.rows[0].phone !== null) throw new Error("phone still returned after consent was withdrawn");
      if (r.rows[0].shares_phone !== false) throw new Error("shares_phone should have flipped to false");
    } finally {
      await client.query("rollback").catch(() => {});
    }
  });

  section("donor search: the 90-day cooldown");
  await check("a cooling-off donor is hidden by default", () =>
    asUser(coordinator, async () => {
      const r = await client.query("select id from search_donors('Blida','A+',false)");
      if (r.rows.some((x) => x.id === cooling)) throw new Error("an ineligible donor was offered");
    }));
  await check("...but visible with a countdown when asked for", () =>
    asUser(coordinator, async () => {
      const r = await client.query("select is_eligible, days_until_eligible from search_donors('Blida','A+',true) where id=$1", [cooling]);
      if (r.rowCount !== 1) throw new Error("the donor is missing even with include_ineligible");
      if (r.rows[0].is_eligible !== false) throw new Error("should be flagged ineligible");
      if (r.rows[0].days_until_eligible !== 80) throw new Error(`expected 80 days, got ${r.rows[0].days_until_eligible}`);
    }));

  section("consent version drift");
  await check("search_donors() checks the version compliance.ts declares", async () => {
    const ts = readFileSync(join(HERE, "..", "..", "packages", "core", "src", "compliance.ts"), "utf8");
    const declared = ts.match(/contact_sharing:\s*"([^"]+)"/)?.[1];
    if (!declared) throw new Error("could not find CONSENT_VERSIONS.contact_sharing");
    const def = (await client.query("select pg_get_functiondef(p.oid) d from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='search_donors'")).rows[0].d;
    if (!def.includes(`'${declared}'`)) {
      throw new Error(`SQL does not check "${declared}" — bump it in the migration too`);
    }
  });
}

/**
 * Everything the client asks PostgREST for must exist. This is the check that
 * would have caught the api.ts regression where the query named columns the
 * database didn't have — PostgREST rejects such a query wholesale, and the
 * app's fallback then quietly serves mock data instead.
 */
async function checkClientContract() {
  section("client/schema contract");

  const requestColumns = [
    "id", "patient_id", "patient_record_id", "blood_type", "units", "urgency",
    "distance_km", "created_at", "wilaya", "hospital_name", "verified_at", "verified_by",
  ];
  await check("blood_requests has every column api.ts selects", async () => {
    const cols = (await client.query(
      "select column_name from information_schema.columns where table_schema='public' and table_name='blood_requests'"
    )).rows.map((r) => r.column_name);
    const missing = requestColumns.filter((c) => !cols.includes(c));
    if (missing.length) throw new Error(`missing: ${missing.join(", ")}`);
  });

  await check("FK hint blood_requests_verified_by_fkey exists", async () => {
    const r = await client.query(
      "select 1 from pg_constraint where conrelid='blood_requests'::regclass and contype='f' and conname='blood_requests_verified_by_fkey'"
    );
    if (r.rowCount !== 1) throw new Error("PostgREST embedded-resource hint would not resolve");
  });

  for (const [table, expected] of Object.entries({
    patients: ["id", "full_name", "blood_type", "wilaya", "hospital_name", "created_by", "contact_phone"],
    associations: ["id", "name", "type", "wilaya", "contact_phone", "contact_email", "is_verified"],
    association_members: ["id", "association_id", "user_id", "role"],
    platform_admins: ["user_id"],
    consent_records: ["id", "user_id", "purpose", "consent_version", "granted_at", "revoked_at"],
    data_subject_requests: ["id", "user_id", "kind", "status", "details", "resolved_at"],
    donor_profiles: ["id", "blood_type", "last_donation_date", "last_donation_at"],
    profiles: ["id", "role", "full_name", "phone", "wilaya", "phone_verified"],
  })) {
    await check(`${table} has the columns the client reads`, async () => {
      const cols = (await client.query(
        "select column_name from information_schema.columns where table_schema='public' and table_name=$1", [table]
      )).rows.map((r) => r.column_name);
      const missing = expected.filter((c) => !cols.includes(c));
      if (missing.length) throw new Error(`missing: ${missing.join(", ")}`);
    });
  }

  for (const [fn, args] of Object.entries({ verify_association: ["p_association_id", "p_verified"], is_platform_admin: [] })) {
    await check(`rpc ${fn}() callable`, async () => {
      const r = await client.query(
        `select pg_get_function_arguments(p.oid) args from pg_proc p
         join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=$1`, [fn]
      );
      if (r.rowCount !== 1) throw new Error("function not found");
      const missing = args.filter((a) => !r.rows[0].args.includes(a));
      if (missing.length) throw new Error(`arg mismatch: ${r.rows[0].args}`);
    });
  }

  await check("legacy column list still selectable (flag off)", () =>
    client.query("select id, patient_id, blood_type, units, urgency, distance_km, created_at from blood_requests limit 1"));
}

async function checkSeed() {
  section("seed.sql");

  await check("refuses to run without its prerequisite accounts", async () => {
    try {
      await client.query(readFileSync(SEED_FILE, "utf8"));
    } catch (err) {
      if (!/Seed prerequisite missing/.test(err.message)) throw new Error(`wrong failure: ${err.message}`);
      return;
    }
    throw new Error("seed ran without its prerequisite accounts");
  });

  for (const email of ["demo.admin@weare.app", "demo.association@weare.app", "demo.donor@weare.app"]) {
    await client.query("insert into auth.users (email) values ($1)", [email]);
  }

  const seedSql = readFileSync(SEED_FILE, "utf8");
  await check("runs cleanly once accounts exist", () => client.query(seedSql));
  await check("association verified through verify_association()", async () => {
    const r = await client.query("select is_verified from associations where name='Croissant-Rouge Algérien — Blida'");
    if (r.rowCount !== 1 || r.rows[0].is_verified !== true) throw new Error("association not verified");
  });
  await check("second run is idempotent", async () => {
    // Compare before against after rather than against a hardcoded fixture
    // size: what this asserts is that re-running duplicates nothing, and
    // pinning the number meant every new seed row failed this check for the
    // wrong reason.
    const counts = async () => {
      const p = await client.query("select count(*)::int n from patients where full_name like 'Seed Patient%'");
      const q = await client.query("select count(*)::int n from blood_requests where patient_id like 'SEED-%'");
      return { patients: p.rows[0].n, requests: q.rows[0].n };
    };

    const before = await counts();
    if (before.patients === 0 || before.requests === 0) throw new Error("first run seeded nothing");

    await client.query(seedSql);
    const after = await counts();

    if (after.patients !== before.patients || after.requests !== before.requests) {
      throw new Error(
        `duplicated: ${before.patients}->${after.patients} patients, ${before.requests}->${after.requests} requests`
      );
    }
  });
}

async function shutdown(code) {
  try { await client?.end(); } catch {}
  try { await pg.stop(); } catch {}
  process.exit(code);
}

const pg = new EmbeddedPostgres({
  databaseDir: join(HERE, ".pgdata"),
  user: "postgres",
  password: "postgres",
  port: 55432,
  persistent: false,
});

async function main() {
  await pg.initialise();
  await pg.start();
  client = pg.getPgClient();
  await client.connect();

  const version = (await client.query("select version()")).rows[0].version.split(",")[0];
  console.log(`${version}\n(not Supabase: auth schema is stubbed, no PostgREST/GoTrue)`);

  await client.query(SUPABASE_STUB);
  await applyMigrations();
  await checkRls();
  await checkDonorSearch();
  await checkClientContract();
  await checkSeed();

  console.log(`\n${pass} passed, ${fail} failed`);
  await shutdown(fail === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error("HARNESS ERROR:", err.message);
  await shutdown(2);
});
