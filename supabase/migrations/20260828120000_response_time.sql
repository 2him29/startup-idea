-- How long a plea waits before somebody answers it.
--
-- This is the number that decides whether the product works, and it is the one
-- number no competitor in this market can report. A directory has no concept of
-- an answer: it lists people who might give blood and finds out nothing about
-- whether anyone did. Qatra records the post, the notification, the response
-- and the count, so the interval between the first two of those is already
-- sitting in the database waiting to be subtracted.
--
-- Nothing is added to the schema for it. blood_requests.created_at and
-- request_responses.created_at have both existed since the beginning; this
-- migration only asks them a question.
--
-- TWO NUMBERS, NOT ONE
--
-- Reporting the median time to first response on its own would be a lie of
-- omission, and a comfortable one: it is computed only over the requests that
-- got an answer, so a wilaya where nine pleas in ten go unanswered and the
-- tenth is answered in four minutes would report "four minutes". The failures
-- would be invisible precisely because they failed.
--
-- So the function returns how many requests there were alongside how many were
-- answered, and the caller is expected to show both. A response rate of 40% is
-- the more important half of that sentence.

create or replace function wilaya_response_stats(p_wilaya text, p_days int default 90)
returns table (
  requests int,
  answered int,
  median_minutes numeric,
  fastest_minutes numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with scoped as (
    select r.id, r.created_at
    from blood_requests r
    where r.wilaya = p_wilaya
      and r.created_at >= now() - make_interval(days => greatest(coalesce(p_days, 90), 1))
      -- Membership is checked here rather than raised above, so a caller with
      -- no standing in this wilaya gets an empty result instead of an error.
      -- The same shape as association_invite_counts.
      and is_association_in_wilaya(p_wilaya)
  ),
  firsts as (
    select
      s.id,
      s.created_at,
      -- Only a response that actually stands. A donor who withdrew did answer,
      -- but reporting them as an answer would tell a committee help arrived
      -- when it left again.
      min(resp.created_at) filter (where resp.status in ('confirmed', 'completed')) as first_at
    from scoped s
    left join request_responses resp on resp.request_id = s.id
    group by s.id, s.created_at
  )
  select
    count(*)::int,
    count(first_at)::int,
    round(
      percentile_cont(0.5) within group (
        order by extract(epoch from (first_at - created_at)) / 60.0
      ) filter (where first_at is not null)::numeric,
      1
    ),
    round(
      min(extract(epoch from (first_at - created_at)) / 60.0)
        filter (where first_at is not null)::numeric,
      1
    )
  from firsts;
$$;

comment on function wilaya_response_stats(text, int) is
  'Requests, how many were answered, and how quickly, for one wilaya. Aggregates only: no request, donor or patient is identifiable from the result.';

-- PUBLIC first, then the role: revoking the role alone leaves anon inheriting
-- the grant, which is the trap 20260821160000 exists to close.
revoke all on function wilaya_response_stats(text, int) from public, anon;
grant execute on function wilaya_response_stats(text, int) to authenticated;
