-- Where to reach a donor who is not looking at the app.
--
-- Everything Qatra does so far requires the donor to open it and look. The
-- splash promises requests answered "in real time"; the bell is a filter over
-- rows already fetched. A family in Blida at 3am is relying on someone
-- happening to check, which is the WhatsApp problem this product exists to
-- beat — and WhatsApp at least pushes.
--
-- One row per browser, not per person: a donor with a phone and a laptop has
-- two, and both should ring.

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,

  -- The push service's URL for this browser. Unique because re-subscribing
  -- returns the same endpoint, and a duplicate would mean notifying twice.
  endpoint    text not null unique,

  -- The keys the payload is encrypted to. Web push encrypts end-to-end: the
  -- push service (Google, Mozilla) relays ciphertext it cannot read, which is
  -- the only reason sending "O- needed in Blida" through a third party is
  -- defensible at all.
  p256dh      text not null,
  auth        text not null,

  -- For telling a donor which browser they are looking at, when they come to
  -- turn one off.
  user_agent  text,

  created_at  timestamptz not null default now(),
  last_used_at timestamptz,

  /*
   * Consecutive delivery failures.
   *
   * Browsers expire subscriptions silently and the push service answers 404 or
   * 410 forever after. Without pruning, a wilaya's notify list fills with dead
   * endpoints and every send gets slower for everyone still listening.
   */
  failure_count int not null default 0
);

create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

/**
 * Your own subscriptions, and nobody else's.
 *
 * An endpoint plus its keys is a capability: anyone holding them can push to
 * that browser. So this is not merely private data, it is a credential, and it
 * is readable only by the person it belongs to. The sender runs as the service
 * role, which bypasses RLS entirely and is the only thing that ever reads
 * across users.
 */
create policy "push subscriptions readable by their owner" on push_subscriptions
  for select to authenticated using (user_id = auth.uid());

create policy "push subscriptions insertable by their owner" on push_subscriptions
  for insert to authenticated with check (user_id = auth.uid());

create policy "push subscriptions updatable by their owner" on push_subscriptions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

/**
 * Deletable, unlike consent records and reveal logs.
 *
 * Those two are evidence about processing that happened and must survive. This
 * is a delivery address: turning notifications off should actually remove the
 * way to reach you, not leave a tombstone that still resolves.
 */
create policy "push subscriptions deletable by their owner" on push_subscriptions
  for delete to authenticated using (user_id = auth.uid());

/**
 * Who should be told about a request, and where to reach them.
 *
 * The matching rule, kept in one place so the notifier and any future digest
 * agree. Four conditions, each with a reason:
 *
 *   - same wilaya, because a donor two provinces away cannot help today;
 *   - blood type compatible, using the same red-cell table as the app;
 *   - not the person who posted it, who does not need telling;
 *   - eligible now, because someone inside the 90-day cooldown cannot donate
 *     and telling them is a notification they can do nothing with.
 *
 * Someone who never completed donor registration is NOT notified. Their type
 * is unknown — donor_profiles.blood_type is NOT NULL, so "unknown" means the
 * row is absent, and the join simply excludes them. A deliberate silence: we
 * cannot say they match, and guessing in this direction is how someone drives
 * across a wilaya to be turned away.
 *
 * SECURITY DEFINER because it reads profiles and subscriptions across users.
 * It is callable only by the service role — see the revoke below — so no
 * client can enumerate donors or, worse, their push credentials.
 */
create or replace function push_targets_for_request(p_request_id uuid)
returns table (
  user_id uuid,
  endpoint text,
  p256dh text,
  auth text,
  blood_type text,
  wilaya text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with req as (
    select r.id, r.blood_type, r.wilaya, p.created_by as poster
    from blood_requests r
    left join patients p on p.id = r.patient_record_id
    where r.id = p_request_id and r.status = 'open'
  )
  select s.user_id, s.endpoint, s.p256dh, s.auth, d.blood_type, pr.wilaya
  from req
  join profiles pr on pr.wilaya = req.wilaya
  join donor_profiles d on d.id = pr.id
  join push_subscriptions s on s.user_id = pr.id
  where s.failure_count < 5
    and pr.id is distinct from req.poster
    and (d.last_donation_at is null or now() - d.last_donation_at > interval '90 days')
    -- The red-cell table, written the same way round as compatibility.ts:
    -- which donor types this recipient can receive from.
    and d.blood_type = any (
      case req.blood_type
        when 'O-'  then array['O-']
        when 'O+'  then array['O-','O+']
        when 'A-'  then array['O-','A-']
        when 'A+'  then array['O-','O+','A-','A+']
        when 'B-'  then array['O-','B-']
        when 'B+'  then array['O-','O+','B-','B+']
        when 'AB-' then array['O-','A-','B-','AB-']
        when 'AB+' then array['O-','O+','A-','A+','B-','B+','AB-','AB+']
        else array[]::text[]
      end
    );
$$;

revoke all on function push_targets_for_request(uuid) from public, authenticated, anon;

comment on function push_targets_for_request(uuid) is
  'Push endpoints of eligible, compatible donors in the request wilaya, excluding its author. Service role only: the result contains push credentials.';

/**
 * Where to reach the family who posted a request, for "someone is coming".
 *
 * Separate from the above because it answers a different question and carries
 * a different risk: this one is about a single known person, so it needs no
 * compatibility rules and no eligibility filter.
 */
create or replace function push_targets_for_family(p_request_id uuid)
returns table (
  user_id uuid,
  endpoint text,
  p256dh text,
  auth text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select s.user_id, s.endpoint, s.p256dh, s.auth
  from blood_requests r
  join patients p on p.id = r.patient_record_id
  join push_subscriptions s on s.user_id = p.created_by
  where r.id = p_request_id and s.failure_count < 5;
$$;

revoke all on function push_targets_for_family(uuid) from public, authenticated, anon;

comment on function push_targets_for_family(uuid) is
  'Push endpoints of whoever posted this request. Service role only.';
