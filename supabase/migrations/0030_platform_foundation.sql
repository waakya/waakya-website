-- 0030 — Platform foundation.
--
-- Numbering: 0023–0029 are reserved for the frozen, local-only voice branch
-- (feature/ai-voice-local). Production's ledger ends at 0022; platform
-- migrations start here at 0030 so the two lines can never collide.
--
-- What this migration does, in order:
--   1. Closes the function-privilege hole: every mutating or leaking definer
--      function was executable by `anon` (Supabase grants EXECUTE on new
--      public functions to anon by default). resolve_request_notifications('')
--      alone could mark every notification in every business as read.
--   2. Tightens Phase-1 policies found by the schema audit (orgs update by
--      managers, invite tokens readable by every member, unsigned task
--      messages, member-writable escalations).
--   3. Moves in-app notification writes behind a definer function so a member
--      can no longer forge an update for a colleague (the known Phase-1 P2).
--   4. A profile row for every auth user, created by trigger.
--   5. organization_modules — the module system.
--   6. domain_events — the audit trail and the automation outbox.
--   7. Task origin tracing, and proof_required enforced at "done".
--   8. Missing foreign-key and filter indexes.

-- ============================================================ 1. privileges ==

-- Predicates used inside policies stay callable by anon (they answer false for
-- a null auth.uid()); everything that writes or reveals is authenticated-only
-- or internal-only.
revoke execute on function add_holiday(uuid, date, text)                                   from anon;
revoke execute on function apply_leave(uuid, date, date, leave_kind, day_half, text)       from anon;
revoke execute on function create_group_conversation(uuid, text, uuid[])                   from anon;
revoke execute on function credit_leave(uuid, uuid, numeric)                                from anon;
revoke execute on function decide_approval(uuid, boolean, text)                             from anon;
revoke execute on function decide_leave_request(uuid, boolean, text)                        from anon;
revoke execute on function display_name(uuid)                                               from anon;
revoke execute on function mark_conversation_read(uuid)                                     from anon;
revoke execute on function post_message(uuid, text)                                         from anon;
revoke execute on function punch_in(uuid)                                                   from anon;
revoke execute on function punch_out(uuid)                                                  from anon;
revoke execute on function push_notification(uuid, uuid, text, text, text, text)            from anon;
revoke execute on function request_approval(uuid, text, text, uuid, uuid, uuid, uuid)       from anon;
revoke execute on function resolve_request_notifications(text, text)                        from anon;
revoke execute on function start_direct_conversation(uuid, uuid)                            from anon;
revoke execute on function update_business_profile(uuid, text, text, text, text, text)      from anon;
revoke execute on function org_role(uuid)                                                   from anon;
revoke execute on function guard_task_update()                                              from anon, authenticated;
revoke execute on function notify_approval()                                                from anon, authenticated;
revoke execute on function notify_leave()                                                   from anon, authenticated;
revoke execute on function notify_new_message()                                             from anon, authenticated;
revoke execute on function notify_task_document()                                           from anon, authenticated;

-- ======================================================= 2. policy fixes ==

-- Only the people who own the business change its name, tax id or SLA.
drop policy if exists "org update" on orgs;
create policy "org update" on orgs for update
  using (is_org_owner_admin(id))
  with check (is_org_owner_admin(id));

-- An invite token is a key to the business. Owners and admins see every
-- invite; a manager sees only the staff invites they are allowed to make.
drop policy if exists "invites read" on invites;
create policy "invites read" on invites for select using (
  is_org_owner_admin(org_id) or (is_org_admin(org_id) and role = 'member')
);

-- A reply on a task is signed by the person writing it, about a task in the
-- same business.
drop policy if exists "messages insert" on task_messages;
create policy "messages insert" on task_messages for insert with check (
  is_org_member(org_id)
  and author_id = auth.uid()
  and exists (select 1 from tasks t where t.id = task_id and t.org_id = task_messages.org_id)
);

-- Escalations are written by the scheduler (service role) or by a manager
-- running the tick for their own business; never by a member squatting the
-- unique slot so the real escalation is silently skipped.
drop policy if exists "escalations insert" on escalations;
create policy "escalations insert" on escalations for insert with check (
  is_org_admin(org_id)
  and exists (select 1 from tasks t where t.id = task_id and t.org_id = escalations.org_id)
);

-- =============================================== 3. notification writes ==

-- Nobody inserts a notification row directly any more. The app's in-app
-- channel calls push_user_notification, which signs the sender, checks the
-- recipient, keeps links inside the app and namespaces the dedupe key so one
-- member cannot pre-empt another's reminders.
drop policy if exists "notifications insert" on notifications;

create or replace function push_user_notification(
  p_org uuid,
  p_user uuid,
  p_event text,
  p_body text,
  p_task uuid default null,
  p_href text default null,
  p_dedupe text default null
) returns text as $$
declare
  actor uuid := auth.uid();
  key text;
begin
  if actor is null then
    -- The scheduler: trusted, keys are already stable per task and reason.
    key := p_dedupe;
  else
    if not is_org_member(p_org) then
      raise exception 'not a member of this business' using errcode = '42501';
    end if;
    -- A member's key can never look like a scheduler key, so nobody can
    -- pre-empt a reminder. Managers may run the tick for their own business,
    -- so their keys stay as written and match the scheduler's.
    key := case
      when p_dedupe is null then null
      when is_org_admin(p_org) then p_dedupe
      else 'u:' || actor || ':' || p_dedupe
    end;
  end if;

  if p_user is null then return 'no_recipient'; end if;
  if not exists (select 1 from memberships m where m.org_id = p_org and m.user_id = p_user) then
    raise exception 'the recipient is not in this business' using errcode = '42501';
  end if;
  if p_task is not null and not exists (select 1 from tasks t where t.id = p_task and t.org_id = p_org) then
    raise exception 'that task is not in this business' using errcode = '42501';
  end if;
  if p_href is not null and (p_href !~ '^/' or p_href like '//%') then
    raise exception 'links stay inside the app' using errcode = '22023';
  end if;
  if p_event is null or length(p_event) > 40 or p_event !~ '^[a-z_]+$' then
    raise exception 'unknown event' using errcode = '22023';
  end if;

  begin
    insert into notifications (org_id, user_id, event, task_id, body, href, dedupe_key)
    values (p_org, p_user, p_event, p_task, left(p_body, 280), p_href, key);
  exception when unique_violation then
    return 'duplicate';
  end;
  return 'sent';
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke all on function push_user_notification(uuid, uuid, text, text, uuid, text, text) from public, anon;
grant execute on function push_user_notification(uuid, uuid, text, text, uuid, text, text) to authenticated, service_role;

-- A reader may mark their own updates read and nothing else: column grants
-- back the row policy.
revoke update on notifications from authenticated;
grant update (read_at) on notifications to authenticated;

-- The scheduler's escalation keys (service role) stay bare; anything a user
-- wrote so far is already namespaced by the old behaviour being replaced, so
-- nothing to migrate.

-- ================================================= 4. profiles on signup ==

create or replace function handle_new_auth_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), ''))
  on conflict (id) do nothing;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;

revoke all on function handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists trg_handle_new_auth_user on auth.users;
create trigger trg_handle_new_auth_user after insert on auth.users
  for each row execute function handle_new_auth_user();

insert into profiles (id)
select u.id from auth.users u where not exists (select 1 from profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ======================================================== 5. modules ==

create table if not exists organization_modules (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id) on delete cascade,
  module_key    text not null,
  enabled       boolean not null default true,
  configuration jsonb not null default '{}'::jsonb,
  enabled_at    timestamptz,
  disabled_at   timestamptz,
  enabled_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint organization_modules_key check (module_key ~ '^[a-z_]{2,40}$'),
  constraint organization_modules_config check (jsonb_typeof(configuration) = 'object'),
  unique (org_id, module_key)
);
create index if not exists idx_org_modules_org on organization_modules(org_id, enabled);

drop trigger if exists trg_org_modules_updated on organization_modules;
create trigger trg_org_modules_updated before update on organization_modules
  for each row execute function set_updated_at();

alter table organization_modules enable row level security;

drop policy if exists "org modules read" on organization_modules;
create policy "org modules read" on organization_modules for select using (is_org_member(org_id));
-- Writes happen only through set_org_module (below).

-- The catalogue lives in lib/modules/catalog.ts. These two lists are mirrored
-- there and a unit test reads this file to keep them equal.
create or replace function module_is_core(p_key text) returns boolean as $$
  select p_key in ('today','conversations','work','projects','documents','approvals','team','search','notifications');
$$ language sql immutable set search_path = public, pg_temp;

create or replace function module_default_enabled(p_key text) returns boolean as $$
  select p_key in ('attendance','checklists');
$$ language sql immutable set search_path = public, pg_temp;

-- Is this capability switched on for the business? No row means the default.
create or replace function org_module_enabled(p_org uuid, p_key text) returns boolean as $$
  select case
    when module_is_core(p_key) then true
    else coalesce(
      (select m.enabled from organization_modules m where m.org_id = p_org and m.module_key = p_key),
      module_default_enabled(p_key))
  end;
$$ language sql stable security definer set search_path = public, pg_temp;
grant execute on function module_is_core(text), module_default_enabled(text), org_module_enabled(uuid, text) to anon, authenticated;

-- Turning a module on or off. Dependencies are checked by the caller
-- (lib/modules) against the catalogue and re-checked here from the list the
-- caller passes, so the database never records an impossible state.
create or replace function set_org_module(
  p_org uuid,
  p_key text,
  p_enabled boolean,
  p_requires text[] default '{}',
  p_configuration jsonb default null
) returns organization_modules as $$
declare
  actor uuid := auth.uid();
  dep text;
  row_out organization_modules;
begin
  if actor is null or not is_org_owner_admin(p_org) then
    raise exception 'only an owner or admin can change modules' using errcode = '42501';
  end if;
  if module_is_core(p_key) then
    raise exception 'that capability is always on' using errcode = '22023';
  end if;
  if p_enabled then
    foreach dep in array coalesce(p_requires, '{}') loop
      if not org_module_enabled(p_org, dep) then
        raise exception 'turn on % first' , dep using errcode = '22023';
      end if;
    end loop;
  end if;

  insert into organization_modules (org_id, module_key, enabled, configuration, enabled_at, disabled_at, enabled_by)
  values (
    p_org, p_key, p_enabled, coalesce(p_configuration, '{}'::jsonb),
    case when p_enabled then now() end, case when p_enabled then null else now() end, actor
  )
  on conflict (org_id, module_key) do update set
    enabled       = excluded.enabled,
    configuration = coalesce(p_configuration, organization_modules.configuration),
    enabled_at    = case when excluded.enabled and not organization_modules.enabled then now() else organization_modules.enabled_at end,
    disabled_at   = case when not excluded.enabled then now() else null end,
    enabled_by    = actor
  returning * into row_out;

  perform record_domain_event(
    p_org, 'module.changed', 'organization_module', row_out.id,
    jsonb_build_object('module_key', p_key, 'enabled', p_enabled), null
  );
  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke all on function set_org_module(uuid, text, boolean, text[], jsonb) from public, anon;
grant execute on function set_org_module(uuid, text, boolean, text[], jsonb) to authenticated;

-- ================================================== 6. domain events ==

create table if not exists domain_events (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references orgs(id) on delete cascade,
  event_type          text not null,
  entity_type         text not null,
  entity_id           uuid,
  actor_kind          text not null default 'user',
  actor_id            uuid,
  payload             jsonb not null default '{}'::jsonb,
  depth               integer not null default 0,
  idempotency_key     text,
  occurred_at         timestamptz not null default now(),
  processed_at        timestamptz,
  processing_attempts integer not null default 0,
  last_error          text,
  constraint domain_events_type   check (event_type ~ '^[a-z_]+\.[a-z_]+$'),
  constraint domain_events_actor  check (actor_kind in ('user','customer','system','automation','integration')),
  constraint domain_events_payload check (jsonb_typeof(payload) = 'object'),
  constraint domain_events_depth  check (depth between 0 and 10)
);
create unique index if not exists idx_domain_events_idempotency on domain_events(idempotency_key) where idempotency_key is not null;
create index if not exists idx_domain_events_org_time   on domain_events(org_id, occurred_at desc);
create index if not exists idx_domain_events_entity     on domain_events(entity_type, entity_id, occurred_at desc);
create index if not exists idx_domain_events_unprocessed on domain_events(org_id, occurred_at) where processed_at is null;
create index if not exists idx_domain_events_type       on domain_events(org_id, event_type, occurred_at desc);

alter table domain_events enable row level security;

-- History is read by the people running the business; the record itself is
-- written only through record_domain_event and triggers.
drop policy if exists "domain events read" on domain_events;
create policy "domain events read" on domain_events for select using (is_org_admin(org_id));

create or replace function record_domain_event(
  p_org uuid,
  p_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_payload jsonb default '{}'::jsonb,
  p_key text default null,
  p_actor_kind text default null,
  p_depth integer default 0
) returns uuid as $$
declare
  actor uuid := auth.uid();
  kind text;
  new_id uuid;
begin
  if actor is null then
    kind := coalesce(p_actor_kind, 'system');
  else
    -- Customers get their own path in 0034; here only members record.
    if not is_org_member(p_org) then
      raise exception 'not a member of this business' using errcode = '42501';
    end if;
    kind := case
      when p_actor_kind in ('automation','integration','system') and is_org_admin(p_org) then p_actor_kind
      else 'user'
    end;
  end if;

  insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload, depth, idempotency_key)
  values (p_org, p_type, p_entity_type, p_entity_id, kind, actor, coalesce(p_payload, '{}'::jsonb), coalesce(p_depth, 0), p_key)
  on conflict (idempotency_key) where idempotency_key is not null do nothing
  returning id into new_id;

  if new_id is null and p_key is not null then
    select id into new_id from domain_events where idempotency_key = p_key;
  end if;
  return new_id;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke all on function record_domain_event(uuid, text, text, uuid, jsonb, text, text, integer) from public, anon;
grant execute on function record_domain_event(uuid, text, text, uuid, jsonb, text, text, integer) to authenticated, service_role;

-- The events that can happen through the API without the app: recorded by
-- trigger so the history can never be skipped.

create or replace function events_on_task_change() returns trigger as $$
declare
  actor uuid := auth.uid();
  kind text := case when actor is null then 'system' else 'user' end;
begin
  if tg_op = 'INSERT' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'task.created', 'task', new.id, kind, coalesce(actor, new.created_by),
      jsonb_build_object('title', new.title, 'assigned_to', new.assigned_to, 'state', new.state,
                         'origin_kind', new.origin_kind, 'origin_id', new.origin_id, 'project_id', new.project_id,
                         'due_at', new.due_at, 'priority', new.priority));
    return new;
  end if;

  if new.state is distinct from old.state then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'task.state_changed', 'task', new.id, kind, actor,
      jsonb_build_object('from', old.state, 'to', new.state, 'title', new.title,
                         'assigned_to', new.assigned_to, 'created_by', new.created_by, 'project_id', new.project_id,
                         'origin_kind', new.origin_kind, 'origin_id', new.origin_id));
    if new.state = 'accepted' then
      insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
      values (new.org_id, 'task.accepted', 'task', new.id, kind, actor, jsonb_build_object('title', new.title, 'assigned_to', new.assigned_to));
    elsif new.state = 'done' then
      insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
      values (new.org_id, 'task.submitted', 'task', new.id, kind, actor, jsonb_build_object('title', new.title, 'assigned_to', new.assigned_to, 'created_by', new.created_by, 'project_id', new.project_id));
    elsif new.state = 'verified' then
      insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
      values (new.org_id, 'task.verified', 'task', new.id, kind, actor, jsonb_build_object('title', new.title, 'assigned_to', new.assigned_to, 'project_id', new.project_id, 'origin_kind', new.origin_kind, 'origin_id', new.origin_id));
    end if;
  end if;
  if new.assigned_to is distinct from old.assigned_to then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'task.reassigned', 'task', new.id, kind, actor,
      jsonb_build_object('from', old.assigned_to, 'to', new.assigned_to, 'title', new.title));
  end if;
  if new.due_at is distinct from old.due_at then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'task.deadline_changed', 'task', new.id, kind, actor,
      jsonb_build_object('from', old.due_at, 'to', new.due_at, 'title', new.title));
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_task_change() from public, anon, authenticated;

drop trigger if exists trg_events_task on tasks;
create trigger trg_events_task after insert or update on tasks
  for each row execute function events_on_task_change();

create or replace function events_on_proof() returns trigger as $$
begin
  insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
  select new.org_id, 'proof.submitted', 'proof', new.id,
         case when auth.uid() is null then 'system' else 'user' end, coalesce(auth.uid(), new.created_by),
         jsonb_build_object('task_id', new.task_id, 'kind', new.kind, 'project_id', t.project_id, 'title', t.title)
    from tasks t where t.id = new.task_id;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_proof() from public, anon, authenticated;

drop trigger if exists trg_events_proof on proofs;
create trigger trg_events_proof after insert on proofs
  for each row execute function events_on_proof();

create or replace function events_on_approval() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'approval.requested', 'approval', new.id, 'user', new.requested_by,
      jsonb_build_object('title', new.title, 'approver_id', new.approver_id, 'task_id', new.task_id, 'project_id', new.project_id, 'document_id', new.document_id));
  elsif old.status = 'pending' and new.status <> 'pending' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'approval.decided', 'approval', new.id, 'user', new.decided_by,
      jsonb_build_object('title', new.title, 'status', new.status, 'note', new.decision_note, 'requested_by', new.requested_by,
                         'task_id', new.task_id, 'project_id', new.project_id, 'document_id', new.document_id));
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_approval() from public, anon, authenticated;

drop trigger if exists trg_events_approval on approvals;
create trigger trg_events_approval after insert or update on approvals
  for each row execute function events_on_approval();

create or replace function events_on_leave() returns trigger as $$
begin
  if tg_op = 'UPDATE' and old.status = 'pending' and new.status <> 'pending' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'leave.decided', 'leave_request', new.id, 'user', new.reviewed_by,
      jsonb_build_object('user_id', new.user_id, 'status', new.status, 'start_date', new.start_date, 'end_date', new.end_date, 'days', new.days_requested));
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_leave() from public, anon, authenticated;

drop trigger if exists trg_events_leave on leave_requests;
create trigger trg_events_leave after update on leave_requests
  for each row execute function events_on_leave();

create or replace function events_on_membership() returns trigger as $$
declare
  actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'membership.created', 'membership', new.id,
      case when actor is null then 'system' else 'user' end, actor,
      jsonb_build_object('user_id', new.user_id, 'role', new.role));
    return new;
  elsif tg_op = 'UPDATE' and new.role is distinct from old.role then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'membership.role_changed', 'membership', new.id, 'user', actor,
      jsonb_build_object('user_id', new.user_id, 'from', old.role, 'to', new.role));
    return new;
  elsif tg_op = 'DELETE' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (old.org_id, 'membership.removed', 'membership', old.id, 'user', actor,
      jsonb_build_object('user_id', old.user_id, 'role', old.role));
    return old;
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_membership() from public, anon, authenticated;

drop trigger if exists trg_events_membership on memberships;
create trigger trg_events_membership after insert or update or delete on memberships
  for each row execute function events_on_membership();

-- Removing somebody from the business also removes them from its
-- conversations and projects, so a former colleague keeps no doors.
create or replace function offboard_membership() returns trigger as $$
begin
  delete from conversation_participants cp
   where cp.org_id = old.org_id and cp.user_id = old.user_id;
  delete from project_members pm
   where pm.org_id = old.org_id and pm.user_id = old.user_id;
  return old;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function offboard_membership() from public, anon, authenticated;

drop trigger if exists trg_offboard_membership on memberships;
create trigger trg_offboard_membership after delete on memberships
  for each row execute function offboard_membership();

-- ============================================== 7. task origin + proof ==

alter table tasks add column if not exists origin_kind  text not null default 'manual';
alter table tasks add column if not exists origin_id    uuid;
alter table tasks add column if not exists origin_label text;

do $$ begin
  alter table tasks add constraint tasks_origin_kind check (
    origin_kind in ('manual','conversation','checklist','crm','project','approval','automation','customer_action','vendor_action','integration')
  );
exception when duplicate_object then null; end $$;

update tasks set origin_kind = 'conversation', origin_id = source_message_id
 where origin_kind = 'manual' and source_message_id is not null;
update tasks set origin_kind = 'checklist', origin_id = checklist_item_id
 where origin_kind = 'manual' and checklist_item_id is not null;

create index if not exists idx_tasks_origin on tasks(org_id, origin_kind, origin_id) where origin_id is not null;

-- The task guard, extended: proof that was promised must exist before "done".
create or replace function guard_task_update() returns trigger as $$
declare
  actor uuid := auth.uid();
  role member_role;
  manages boolean;
  assignee boolean;
  wanted task_state;
begin
  if actor is null then
    return new;                      -- service role: the SLA job
  end if;

  role := org_role(old.org_id);
  if role is null then
    raise exception 'not a member of this business' using errcode = '42501';
  end if;
  manages := role in ('owner','admin','manager');
  assignee := old.assigned_to = actor;

  if new.org_id is distinct from old.org_id or new.created_by is distinct from old.created_by then
    raise exception 'a task cannot move between businesses or authors' using errcode = '42501';
  end if;
  if new.origin_kind is distinct from old.origin_kind or new.origin_id is distinct from old.origin_id then
    raise exception 'where a task came from is a record' using errcode = '42501';
  end if;

  if not manages and (
       new.assigned_to   is distinct from old.assigned_to
    or new.due_at        is distinct from old.due_at
    or new.title         is distinct from old.title
    or new.details       is distinct from old.details
    or new.priority      is distinct from old.priority
    or new.proof_required is distinct from old.proof_required
    or new.project_id    is distinct from old.project_id
  ) then
    raise exception 'only an owner, admin or manager can change that' using errcode = '42501';
  end if;

  if old.state in ('verified','cancelled') and (
       new.state is distinct from old.state
    or new.assigned_to is distinct from old.assigned_to
    or new.due_at is distinct from old.due_at
  ) then
    raise exception 'this task is closed' using errcode = '22023';
  end if;
  if old.state = 'done' and new.due_at is distinct from old.due_at then
    raise exception 'the deadline of finished work cannot change' using errcode = '22023';
  end if;

  if new.state is distinct from old.state then
    wanted := case
      when new.state = 'delivered' and old.state not in ('created','reassigned') then 'reassigned'::task_state
      else new.state
    end;

    if not task_transition_allowed(old.state, wanted) then
      raise exception 'that step is not possible from here' using errcode = '22023';
    end if;

    if not (
      (assignee and wanted in ('acknowledged','accepted','in_progress','done','escalated'))
      or (manages and wanted in ('verified','cancelled','reassigned','escalated','in_progress'))
      or (old.state = 'created' and wanted = 'delivered' and old.created_by = actor)
    ) then
      raise exception 'that step is not yours to take' using errcode = '42501';
    end if;

    if wanted = 'done' and old.proof_required
       and not exists (select 1 from proofs p where p.task_id = old.id) then
      raise exception 'this task needs proof before it is done' using errcode = '22023';
    end if;
  elsif not manages and not assignee
    and not (old.created_by = actor and new.source_message_id is distinct from old.source_message_id) then
    raise exception 'this task is not yours' using errcode = '42501';
  end if;

  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;

-- =================================================== 8. indexes ==

create index if not exists idx_approvals_requested_by on approvals(requested_by);
create index if not exists idx_approvals_approver     on approvals(approver_id) where approver_id is not null;
create index if not exists idx_approvals_task         on approvals(task_id) where task_id is not null;
create index if not exists idx_approvals_project      on approvals(project_id) where project_id is not null;
create index if not exists idx_approvals_document     on approvals(document_id) where document_id is not null;
create index if not exists idx_messages_org           on messages(org_id);
create index if not exists idx_messages_author        on messages(author_id);
create index if not exists idx_participants_org       on conversation_participants(org_id);
create index if not exists idx_conversations_creator  on conversations(created_by);
create index if not exists idx_project_members_org    on project_members(org_id);
create index if not exists idx_projects_creator       on projects(created_by);
create index if not exists idx_documents_uploader     on documents(uploaded_by);
create index if not exists idx_tasks_project          on tasks(project_id) where project_id is not null;
create index if not exists idx_leave_requests_reviewer on leave_requests(reviewed_by) where reviewed_by is not null;
create index if not exists idx_attendance_leave       on attendance_records(leave_request_id) where leave_request_id is not null;
create index if not exists idx_holidays_creator       on holidays(created_by);
create index if not exists idx_invites_acceptor       on invites(accepted_by) where accepted_by is not null;
create index if not exists idx_escalations_notified   on escalations(notified_user) where notified_user is not null;
create index if not exists idx_task_events_task_time  on task_events(task_id, created_at);
create index if not exists idx_task_events_org_time   on task_events(org_id, created_at desc);
create index if not exists idx_notifications_unread   on notifications(user_id) where read_at is null;
