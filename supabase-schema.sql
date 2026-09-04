-- Vaakya — Postgres / Supabase schema (v1, message-based task management)
-- Run in the Supabase SQL editor (or as a migration). Enables multi-tenant RLS.
-- Assumes Supabase Auth (auth.users) provides identities.

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- ---------- Enums ----------
do $$ begin
  create type member_role as enum ('owner', 'admin', 'manager', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_state as enum
    ('created','delivered','acknowledged','accepted','in_progress','done','verified','escalated','reassigned','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('low','normal','high','urgent');
exception when duplicate_object then null; end $$;

-- ---------- Core tables ----------
create table if not exists orgs (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  language      text not null default 'hi',
  ack_minutes   int  not null default 15,           -- default acknowledge SLA
  quiet_start   time not null default '21:00',       -- no reminders after
  quiet_end     time not null default '08:00',       -- ...until
  created_by    uuid not null references auth.users(id),
  created_at    timestamptz not null default now()
);

-- One row per user profile (mirrors auth.users, holds display fields)
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now()
);

create table if not exists memberships (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references orgs(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index if not exists idx_memberships_user on memberships(user_id);
create index if not exists idx_memberships_org  on memberships(org_id);

create table if not exists tasks (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id) on delete cascade,
  title         text not null,
  details       text,
  created_by    uuid not null references auth.users(id),
  assigned_to   uuid references auth.users(id),
  state         task_state not null default 'created',
  priority      task_priority not null default 'normal',
  ack_minutes   int,                                   -- overrides org default if set
  due_at        timestamptz,                            -- completion SLA
  acknowledged_at timestamptz,
  accepted_at   timestamptz,
  done_at       timestamptz,
  verified_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_tasks_org        on tasks(org_id);
create index if not exists idx_tasks_assignee   on tasks(assigned_to);
create index if not exists idx_tasks_state      on tasks(state);
create index if not exists idx_tasks_due        on tasks(due_at);

-- Audit trail: every state transition
create table if not exists task_events (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references tasks(id) on delete cascade,
  org_id      uuid not null references orgs(id) on delete cascade,
  from_state  task_state,
  to_state    task_state not null,
  actor_id    uuid references auth.users(id),
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_task_events_task on task_events(task_id);

-- Thread on a task (assignee "reverts" on the message)
create table if not exists task_messages (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references tasks(id) on delete cascade,
  org_id      uuid not null references orgs(id) on delete cascade,
  author_id   uuid not null references auth.users(id),
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_task_messages_task on task_messages(task_id);

-- Proof of completion
create table if not exists proofs (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references tasks(id) on delete cascade,
  org_id      uuid not null references orgs(id) on delete cascade,
  kind        text not null default 'photo',            -- photo | text | file
  url         text,                                     -- storage path
  body        text,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

create table if not exists escalations (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references tasks(id) on delete cascade,
  org_id        uuid not null references orgs(id) on delete cascade,
  reason        text not null,                          -- 'ack_sla' | 'completion_sla'
  triggered_at  timestamptz not null default now(),
  notified_user uuid references auth.users(id)
);

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  event       text not null,                            -- task_assigned | ack_reminder | overdue | escalated ...
  task_id     uuid references tasks(id) on delete cascade,
  body        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id, read_at);

-- ---------- updated_at trigger ----------
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;

drop trigger if exists trg_tasks_updated on tasks;
create trigger trg_tasks_updated before update on tasks
  for each row execute function set_updated_at();

-- ---------- Membership helper (used by RLS) ----------
create or replace function is_org_member(p_org uuid) returns boolean as $$
  select exists (
    select 1 from memberships m
    where m.org_id = p_org and m.user_id = auth.uid()
  );
$$ language sql stable security definer;

create or replace function is_org_admin(p_org uuid) returns boolean as $$
  select exists (
    select 1 from memberships m
    where m.org_id = p_org and m.user_id = auth.uid()
      and m.role in ('owner','admin','manager')
  );
$$ language sql stable security definer;

-- ---------- Enable RLS ----------
alter table orgs           enable row level security;
alter table profiles       enable row level security;
alter table memberships    enable row level security;
alter table tasks          enable row level security;
alter table task_events    enable row level security;
alter table task_messages  enable row level security;
alter table proofs         enable row level security;
alter table escalations    enable row level security;
alter table notifications  enable row level security;

-- profiles: a user manages their own profile
create policy "own profile read"   on profiles for select using (id = auth.uid());
create policy "own profile write"  on profiles for insert with check (id = auth.uid());
create policy "own profile update" on profiles for update using (id = auth.uid());

-- orgs: members can read; admins can update; anyone authenticated can create (then becomes owner via app)
create policy "org read"   on orgs for select using (is_org_member(id));
create policy "org insert" on orgs for insert with check (created_by = auth.uid());
create policy "org update" on orgs for update using (is_org_admin(id));

-- memberships: members see their org's memberships; admins manage them
create policy "membership read"   on memberships for select using (is_org_member(org_id));
create policy "membership write"  on memberships for insert with check (is_org_admin(org_id) or user_id = auth.uid());
create policy "membership update" on memberships for update using (is_org_admin(org_id));
create policy "membership delete" on memberships for delete using (is_org_admin(org_id));

-- tasks + children: any org member can read; writes constrained to org membership (refine per role in app)
create policy "tasks read"   on tasks for select using (is_org_member(org_id));
create policy "tasks insert" on tasks for insert with check (is_org_member(org_id));
create policy "tasks update" on tasks for update using (is_org_member(org_id));

create policy "events read"   on task_events   for select using (is_org_member(org_id));
create policy "events insert" on task_events   for insert with check (is_org_member(org_id));

create policy "messages read"   on task_messages for select using (is_org_member(org_id));
create policy "messages insert" on task_messages for insert with check (is_org_member(org_id));

create policy "proofs read"   on proofs for select using (is_org_member(org_id));
create policy "proofs insert" on proofs for insert with check (is_org_member(org_id));

create policy "escalations read"   on escalations for select using (is_org_member(org_id));
create policy "escalations insert" on escalations for insert with check (is_org_member(org_id));

create policy "notifications read"   on notifications for select using (user_id = auth.uid());
create policy "notifications update" on notifications for update using (user_id = auth.uid());
create policy "notifications insert" on notifications for insert with check (is_org_member(org_id));

-- NOTE: the SLA/escalation scheduled job runs with the service role (bypasses RLS) — keep that key server-side only.
