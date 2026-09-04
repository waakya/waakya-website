-- Slice 5. The SLA job runs every few minutes and may be retried, so every
-- effect it has must be keyed. Notifications already are (0006); escalations
-- are not, and a duplicate escalation row would double-count the owner's
-- "needs you" list and make the record dishonest.
--
-- One escalation per task per reason, ever.
delete from escalations a
  using escalations b
 where a.task_id = b.task_id
   and a.reason = b.reason
   and a.ctid > b.ctid;

create unique index if not exists idx_escalations_task_reason
  on escalations(task_id, reason);

-- The job scans for work whose clock may have run out.
create index if not exists idx_tasks_open_due
  on tasks(org_id, state, due_at)
  where state not in ('done', 'verified', 'cancelled');

-- The inbox reads newest-first for one person.
create index if not exists idx_notifications_user_created
  on notifications(user_id, created_at desc);
