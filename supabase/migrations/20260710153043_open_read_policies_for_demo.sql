-- The web/mobile apps don't have sign-in UI yet (that's a later phase), so they
-- read via the anon key. Widen SELECT on the two tables the apps actually query
-- today (hospitals, blood_requests) to the public role; writes stay restricted
-- to authenticated owners as before.

drop policy "hospitals readable by authenticated users" on hospitals;
create policy "hospitals readable by anyone" on hospitals
  for select to public using (true);

drop policy "requests readable by authenticated users" on blood_requests;
create policy "requests readable by anyone" on blood_requests
  for select to public using (true);
