-- Notifications worth sending are worth being able to prove you sent.
--
-- The obvious way to wire this is a trigger that calls the push service
-- directly. It is also the wrong way: an HTTP call inside a transaction makes
-- posting a blood request fail when a push service is slow, and a failed send
-- leaves nothing behind to retry or explain.
--
-- So triggers write a row saying what should be told to whom, and a separate
-- worker drains it. Posting a request never waits for Google. A send that fails
-- is still on the table tomorrow, with the error attached, and "did the
-- notification go out?" is a question with an answer.

create table if not exists notification_outbox (
  id          uuid primary key default gen_random_uuid(),

  /*
   * What happened, not what to write. The wording belongs to the worker, which
   * knows the recipient's language; a message rendered here would be frozen in
   * whatever language the trigger happened to use.
   */
  kind        text not null check (kind in ('new_request', 'donor_responded')),
  request_id  uuid not null references blood_requests (id) on delete cascade,

  created_at  timestamptz not null default now(),
  sent_at     timestamptz,
  attempts    int not null default 0,
  last_error  text,

  /*
   * When a worker last took this row.
   *
   * SKIP LOCKED alone only separates workers running at the same instant; once
   * the claiming transaction commits, the row is unlocked and the next worker
   * a second later picks it up again and sends a second time. A visibility
   * timeout is what actually stops a donor's phone buzzing twice — and if a
   * worker dies mid-send, the row becomes claimable again once it expires
   * rather than being stranded.
   */
  claimed_at  timestamptz,

  /** How many endpoints this fanned out to. Null until a worker has tried. */
  delivered   int
);

/*
 * The worker's queue: unsent, oldest first, still worth trying.
 *
 * Partial index because the sent rows are the overwhelming majority within a
 * week and the worker never looks at them.
 */
create index if not exists notification_outbox_pending_idx
  on notification_outbox (created_at)
  where sent_at is null and attempts < 5;

alter table notification_outbox enable row level security;

-- No policies at all: this is the service role's table. A client has no reason
-- to read the notification history of a wilaya, and every reason not to — the
-- rows say which requests were considered urgent enough to interrupt people
-- about.

/**
 * A new open request means the compatible donors nearby should hear about it.
 *
 * AFTER INSERT so a failure here can never block someone posting a plea for
 * blood. The trigger writes one row; who actually receives it is decided later
 * by push_targets_for_request, at send time rather than post time, so a donor
 * who enables notifications thirty seconds after a request appears still gets
 * it.
 */
create or replace function queue_new_request_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'open' then
    insert into notification_outbox (kind, request_id) values ('new_request', new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists blood_requests_notify on blood_requests;
create trigger blood_requests_notify
  after insert on blood_requests
  for each row execute function queue_new_request_notification();

/**
 * Someone said they are coming, and the family should be told.
 *
 * Only on a confirmed response, and only on insert: a donor toggling their
 * mind repeatedly should not ring the family's phone each time. Withdrawal is
 * deliberately silent here — it belongs in the app where the family can see
 * the count, not as a notification that reads like an accusation.
 */
create or replace function queue_response_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'confirmed' then
    insert into notification_outbox (kind, request_id) values ('donor_responded', new.request_id);
  end if;
  return null;
end;
$$;

drop trigger if exists request_responses_notify on request_responses;
create trigger request_responses_notify
  after insert on request_responses
  for each row execute function queue_response_notification();

/**
 * Claim a batch of pending notifications.
 *
 * FOR UPDATE SKIP LOCKED so two workers running at once take different rows
 * rather than both sending the same notification — the failure mode being a
 * donor's phone buzzing twice for one request, which is exactly how an app
 * gets muted.
 *
 * Attempts are incremented on claim, not on success. A row that makes the
 * worker crash is therefore tried five times and then left alone, rather than
 * poisoning the queue forever.
 *
 * claimed_at gives each claim a five-minute lease. Without it, SKIP LOCKED
 * separates only simultaneous workers: a second worker starting a moment later
 * finds the row unlocked and sends it again.
 */
create or replace function claim_notifications(p_limit int default 20)
returns table (id uuid, kind text, request_id uuid)
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with claimed as (
    select o.id
    from notification_outbox o
    where o.sent_at is null
      and o.attempts < 5
      -- Five minutes is longer than any send should take and short enough that
      -- a crashed worker's rows are retried within the same shift.
      and (o.claimed_at is null or o.claimed_at < now() - interval '5 minutes')
    order by o.created_at
    for update skip locked
    limit p_limit
  )
  update notification_outbox o
  set attempts = o.attempts + 1, claimed_at = now()
  from claimed
  where o.id = claimed.id
  returning o.id, o.kind, o.request_id;
end;
$$;

revoke all on function claim_notifications(int) from public, authenticated, anon;

comment on table notification_outbox is
  'What should be pushed, written by triggers and drained by the send-push worker. Service role only.';
