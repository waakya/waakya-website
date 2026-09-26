-- 0033 — Projects as the operational container.
--
-- A project ties together the customer, the work, the records, the vendors,
-- the documents, the approvals, the proof and the story the customer is
-- told (spec §6). This migration adds what Phase 1 lacked: the customer the
-- project is for, milestones with progress derived from them, a stream of
-- updates the customer may or may not see, and a visibility flag on
-- documents and proofs so "what the customer sees" is data, never CSS.

alter table projects add column if not exists contact_id       uuid references crm_contacts(id) on delete set null;
alter table projects add column if not exists progress_percent integer not null default 0;
alter table projects add column if not exists customer_summary text;
do $$ begin
  alter table projects add constraint project_progress_range check (progress_percent between 0 and 100);
exception when duplicate_object then null; end $$;
create index if not exists idx_projects_contact on projects(contact_id) where contact_id is not null;

alter table documents add column if not exists customer_visible boolean not null default false;
alter table proofs    add column if not exists customer_visible boolean not null default false;
create index if not exists idx_documents_customer on documents(project_id) where customer_visible;
create index if not exists idx_proofs_customer    on proofs(task_id) where customer_visible;

-- ------------------------------------------------------------ milestones --

create table if not exists project_milestones (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references orgs(id) on delete cascade,
  project_id       uuid not null references projects(id) on delete cascade,
  name             text not null,
  position         integer not null default 0,
  status           text not null default 'planned',
  due_date         date,
  done_at          timestamptz,
  customer_visible boolean not null default true,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint milestone_name   check (length(btrim(name)) between 1 and 120),
  constraint milestone_status check (status in ('planned','in_progress','done'))
);
create index if not exists idx_milestones_project on project_milestones(project_id, position);

drop trigger if exists trg_milestones_updated on project_milestones;
create trigger trg_milestones_updated before update on project_milestones
  for each row execute function set_updated_at();

-- --------------------------------------------------------------- updates --

create table if not exists project_updates (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references orgs(id) on delete cascade,
  project_id       uuid not null references projects(id) on delete cascade,
  kind             text not null default 'note',
  body             text not null,
  customer_visible boolean not null default false,
  source_event_id  uuid references domain_events(id) on delete set null,
  actor_kind       text not null default 'user',
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  constraint update_kind  check (kind in ('note','progress','milestone','proof','decision','vendor','automation')),
  constraint update_body  check (length(btrim(body)) between 1 and 2000),
  constraint update_actor check (actor_kind in ('user','customer','system','automation','integration'))
);
create index if not exists idx_updates_project on project_updates(project_id, created_at desc);
create index if not exists idx_updates_customer on project_updates(project_id, created_at desc) where customer_visible;

-- ------------------------------------------------------------------ RLS --

alter table project_milestones enable row level security;
alter table project_updates    enable row level security;

drop policy if exists "milestones read"   on project_milestones;
drop policy if exists "milestones write"  on project_milestones;
drop policy if exists "milestones update" on project_milestones;
drop policy if exists "milestones delete" on project_milestones;
create policy "milestones read"   on project_milestones for select using (is_org_member(org_id));
create policy "milestones write"  on project_milestones for insert with check (
  is_org_admin(org_id) and created_by = auth.uid()
  and exists (select 1 from projects p where p.id = project_id and p.org_id = project_milestones.org_id)
);
create policy "milestones update" on project_milestones for update using (is_org_admin(org_id)) with check (is_org_admin(org_id));
create policy "milestones delete" on project_milestones for delete using (is_org_admin(org_id));

drop policy if exists "updates read"  on project_updates;
drop policy if exists "updates write" on project_updates;
create policy "updates read"  on project_updates for select using (is_org_member(org_id));
create policy "updates write" on project_updates for insert with check (
  is_org_member(org_id) and created_by = auth.uid() and actor_kind = 'user'
  and exists (select 1 from projects p where p.id = project_id and p.org_id = project_updates.org_id)
  -- Only the people who run the business publish to the customer.
  and (not customer_visible or is_org_admin(org_id))
);
-- Updates are a record: no update, no delete.

-- Proofs: the one thing a manager may change afterwards is whether the
-- customer sees it. Everything else on a proof is immutable.
drop policy if exists "proofs update" on proofs;
create policy "proofs update" on proofs for update using (is_org_admin(org_id)) with check (is_org_admin(org_id));

create or replace function guard_proof_update() returns trigger as $$
begin
  if new.task_id is distinct from old.task_id or new.org_id is distinct from old.org_id
     or new.kind is distinct from old.kind or new.url is distinct from old.url
     or new.body is distinct from old.body or new.created_by is distinct from old.created_by then
    raise exception 'proof is a record; only its visibility can change' using errcode = '42501';
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function guard_proof_update() from public, anon, authenticated;

drop trigger if exists trg_guard_proof_update on proofs;
create trigger trg_guard_proof_update before update on proofs
  for each row execute function guard_proof_update();

-- --------------------------------------------------------------- guards --

create or replace function guard_milestone_update() returns trigger as $$
begin
  if new.org_id is distinct from old.org_id or new.project_id is distinct from old.project_id then
    raise exception 'a milestone stays on its project' using errcode = '42501';
  end if;
  if new.status = 'done' and old.status <> 'done' then
    new.done_at := coalesce(new.done_at, now());
  elsif new.status <> 'done' then
    new.done_at := null;
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function guard_milestone_update() from public, anon, authenticated;

drop trigger if exists trg_guard_milestone_update on project_milestones;
create trigger trg_guard_milestone_update before update on project_milestones
  for each row execute function guard_milestone_update();

-- ------------------------------------------------------------- progress --

-- Progress comes from milestones when the project has them, otherwise from
-- its tasks (done or verified over everything not cancelled). One rule, one
-- place; the number is stored so lists never recompute it.
create or replace function recompute_project_progress(p_project uuid) returns integer as $$
declare
  total integer;
  done integer;
  pct integer;
  prev integer;
  v_org uuid;
  v_name text;
begin
  select progress_percent, org_id, name into prev, v_org, v_name from projects where id = p_project;
  if v_org is null then return null; end if;
  select count(*), count(*) filter (where status = 'done') into total, done from project_milestones where project_id = p_project;
  if total = 0 then
    select count(*) filter (where state <> 'cancelled'), count(*) filter (where state in ('done','verified'))
      into total, done from tasks where project_id = p_project;
  end if;
  pct := case when total = 0 then 0 else round(100.0 * done / total)::integer end;
  if pct is distinct from prev then
    update projects set progress_percent = pct where id = p_project;
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (v_org, 'project.progress_changed', 'project', p_project,
      case when auth.uid() is null then 'system' else 'user' end, auth.uid(),
      jsonb_build_object('title', v_name, 'from', prev, 'to', pct));
  end if;
  return pct;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;
revoke all on function recompute_project_progress(uuid) from public, anon;
grant execute on function recompute_project_progress(uuid) to authenticated, service_role;

create or replace function events_on_milestone() returns trigger as $$
declare
  actor uuid := auth.uid();
  v_project uuid := coalesce(new.project_id, old.project_id);
  v_name text;
begin
  if tg_op = 'UPDATE' and new.status = 'done' and old.status <> 'done' then
    select p.name into v_name from projects p where p.id = new.project_id;
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'project.milestone_done', 'milestone', new.id, case when actor is null then 'system' else 'user' end, actor,
      jsonb_build_object('title', new.name, 'project_id', new.project_id, 'project_name', v_name, 'customer_visible', new.customer_visible));
    if new.customer_visible then
      insert into project_updates (org_id, project_id, kind, body, customer_visible, actor_kind, created_by)
      values (new.org_id, new.project_id, 'milestone', new.name, true, case when actor is null then 'system' else 'user' end, actor);
    end if;
  end if;
  perform recompute_project_progress(v_project);
  return coalesce(new, old);
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_milestone() from public, anon, authenticated;

drop trigger if exists trg_events_milestone on project_milestones;
create trigger trg_events_milestone after insert or update or delete on project_milestones
  for each row execute function events_on_milestone();

create or replace function events_on_project_update() returns trigger as $$
declare
  v_name text;
begin
  select p.name into v_name from projects p where p.id = new.project_id;
  insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
  values (new.org_id, 'project.update_published', 'project_update', new.id, new.actor_kind, new.created_by,
    jsonb_build_object('title', v_name, 'project_id', new.project_id, 'body', left(new.body, 200), 'kind', new.kind, 'customer_visible', new.customer_visible));
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_project_update() from public, anon, authenticated;

drop trigger if exists trg_events_project_update on project_updates;
create trigger trg_events_project_update after insert on project_updates
  for each row execute function events_on_project_update();

-- Task progress without milestones: recompute when a task on a project
-- changes state, is attached, or is detached.
create or replace function project_progress_from_task() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.project_id is not null then perform recompute_project_progress(new.project_id); end if;
  elsif new.state is distinct from old.state or new.project_id is distinct from old.project_id then
    if new.project_id is not null then perform recompute_project_progress(new.project_id); end if;
    if old.project_id is not null and old.project_id is distinct from new.project_id then perform recompute_project_progress(old.project_id); end if;
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function project_progress_from_task() from public, anon, authenticated;

drop trigger if exists trg_project_progress_from_task on tasks;
create trigger trg_project_progress_from_task after insert or update on tasks
  for each row execute function project_progress_from_task();

-- Existing projects get a first number.
do $$
declare p record;
begin
  for p in select id from projects loop
    perform recompute_project_progress(p.id);
  end loop;
end $$;
