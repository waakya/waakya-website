-- Slice 9. Performance findings from the database linter.
--
-- 1. `auth.uid()` inside a policy is re-evaluated for every row unless it is
--    wrapped in a scalar subquery, which Postgres hoists out of the loop.
--    On a task list that is one call per row rather than one per query.
--
-- 2. `profiles` had two permissive SELECT policies, so both ran on every row.
--    They are one rule — "me, or somebody I work with" — so they are now one
--    policy.
drop policy if exists "own profile read"        on profiles;
drop policy if exists "co-member profile read"  on profiles;
drop policy if exists "own profile write"       on profiles;
drop policy if exists "own profile update"      on profiles;

create policy "profile read" on profiles
  for select using (id = (select auth.uid()) or shares_org_with(id));
create policy "profile write" on profiles
  for insert with check (id = (select auth.uid()));
create policy "profile update" on profiles
  for update using (id = (select auth.uid()));

drop policy if exists "org insert" on orgs;
create policy "org insert" on orgs
  for insert with check (created_by = (select auth.uid()));

drop policy if exists "notifications read"   on notifications;
drop policy if exists "notifications update" on notifications;
create policy "notifications read" on notifications
  for select using (user_id = (select auth.uid()));
create policy "notifications update" on notifications
  for update using (user_id = (select auth.uid()));

-- 3. Covering indexes for the foreign keys that cascade. Deleting an org has
--    to find every dependent row; without these it is a sequential scan of
--    each child table.
create index if not exists idx_task_events_org    on task_events(org_id);
create index if not exists idx_task_events_actor  on task_events(actor_id);
create index if not exists idx_task_messages_org  on task_messages(org_id);
create index if not exists idx_task_messages_author on task_messages(author_id);
create index if not exists idx_proofs_task        on proofs(task_id);
create index if not exists idx_proofs_org         on proofs(org_id);
create index if not exists idx_proofs_created_by  on proofs(created_by);
create index if not exists idx_escalations_org    on escalations(org_id);
create index if not exists idx_notifications_org  on notifications(org_id);
create index if not exists idx_notifications_task on notifications(task_id);
create index if not exists idx_invites_created_by on invites(created_by);
create index if not exists idx_tasks_created_by   on tasks(created_by);
create index if not exists idx_checklists_assignee on checklists(assigned_to);
create index if not exists idx_checklist_items_org on checklist_items(org_id);

-- Left alone deliberately: idx_tasks_org / idx_tasks_assignee / idx_tasks_state
-- from 0001 report as unused, but that is measured on a development database
-- with a hundred rows. They are cheap, and the composite indexes that cover
-- them today may not cover tomorrow's queries.
