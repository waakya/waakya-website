-- Slice 3. Columns the Confirm card and the stepper need.
--
-- The stepper shows a timestamp under every completed step (Design Direction
-- §5.3), and 0001 only records acknowledged/accepted/done/verified. Delivery
-- and start need their own marks, and delivery is also where the acknowledge
-- clock starts — not created_at, which is when the owner opened the card.

alter table tasks add column if not exists proof_required boolean not null default false;
alter table tasks add column if not exists delivered_at  timestamptz;
alter table tasks add column if not exists started_at    timestamptz;
alter table tasks add column if not exists cancelled_at  timestamptz;

-- The staff list is "my open work, soonest first"; the owner list is
-- "this org today". Both read by assignee and due date.
create index if not exists idx_tasks_assignee_due on tasks(assigned_to, due_at);
create index if not exists idx_tasks_org_created  on tasks(org_id, created_at desc);
