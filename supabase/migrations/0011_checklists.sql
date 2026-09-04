-- Slice 8. Daily opening and closing routines: the same handful of tasks,
-- every day, without the owner sending them again each morning.
--
-- A checklist is a template. Each day it produces real tasks — one per item —
-- so everything downstream (the clocks, the ticks, escalation, proof, the
-- audit trail) works on them unchanged. There is no second kind of task.
create table if not exists checklists (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  name        text not null,
  assigned_to uuid references auth.users(id),
  run_at      time not null default '09:00',
  window_minutes int not null default 120,
  active      boolean not null default true,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);
create index if not exists idx_checklists_org on checklists(org_id, active);

create table if not exists checklist_items (
  id             uuid primary key default gen_random_uuid(),
  checklist_id   uuid not null references checklists(id) on delete cascade,
  org_id         uuid not null references orgs(id) on delete cascade,
  title          text not null,
  position       int not null default 0,
  proof_required boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists idx_checklist_items on checklist_items(checklist_id, position);

alter table tasks add column if not exists checklist_item_id uuid references checklist_items(id) on delete set null;
alter table tasks add column if not exists checklist_date date;

-- One task per item per day, whatever else happens. This is what makes the
-- generator safe to run every five minutes.
create unique index if not exists idx_tasks_checklist_instance
  on tasks(checklist_item_id, checklist_date)
  where checklist_item_id is not null;

alter table checklists      enable row level security;
alter table checklist_items enable row level security;

drop policy if exists "checklists read"   on checklists;
drop policy if exists "checklists write"  on checklists;
drop policy if exists "checklists update" on checklists;
drop policy if exists "checklists delete" on checklists;
create policy "checklists read"   on checklists for select using (is_org_member(org_id));
create policy "checklists write"  on checklists for insert with check (is_org_admin(org_id));
create policy "checklists update" on checklists for update using (is_org_admin(org_id));
create policy "checklists delete" on checklists for delete using (is_org_admin(org_id));

drop policy if exists "checklist items read"   on checklist_items;
drop policy if exists "checklist items write"  on checklist_items;
drop policy if exists "checklist items update" on checklist_items;
drop policy if exists "checklist items delete" on checklist_items;
create policy "checklist items read"   on checklist_items for select using (is_org_member(org_id));
create policy "checklist items write"  on checklist_items for insert with check (is_org_admin(org_id));
create policy "checklist items update" on checklist_items for update using (is_org_admin(org_id));
create policy "checklist items delete" on checklist_items for delete using (is_org_admin(org_id));
