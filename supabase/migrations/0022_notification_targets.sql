-- 0022 — A notification can only be addressed to someone in the same business.
-- Found by the full-organization QA run: the insert policy checked only that
-- the sender belonged to the business, so a member could address an update
-- to a person in another business.
drop policy if exists "notifications insert" on notifications;
create policy "notifications insert" on notifications for insert with check (
  is_org_member(org_id)
  and exists (
    select 1 from memberships m
     where m.org_id = notifications.org_id and m.user_id = notifications.user_id
  )
);
