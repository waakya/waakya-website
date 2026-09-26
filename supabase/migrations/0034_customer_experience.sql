-- 0034 — Customer experience.
--
-- A customer is a separate principal, never a member with hidden navigation
-- (spec §7). They sign in with the same auth, hold `customer_access` to one
-- or more projects, and see only rows that are both on their project and
-- marked customer-visible. Every policy below is the customer's whole
-- world; nothing else in the schema opens to them.
--
-- A customer decision is a real transaction: one RPC records the choice,
-- closes the decision, unblocks the work, tells the business, writes the
-- customer-visible update and the history line. Deciding twice returns the
-- first answer.

-- ---------------------------------------------------------------- access --

create table if not exists customer_access (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id) on delete cascade,
  contact_id    uuid not null references crm_contacts(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  email         text,
  phone_e164    text,
  status        text not null default 'invited',
  invite_token  text not null unique,
  invited_by    uuid references auth.users(id) on delete set null,
  invited_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  revoked_at    timestamptz,
  last_seen_at  timestamptz,
  constraint customer_access_status check (status in ('invited','active','revoked')),
  constraint customer_access_email  check (email is null or email = lower(email)),
  unique (org_id, contact_id)
);
create index if not exists idx_customer_access_user on customer_access(user_id) where user_id is not null and status = 'active';
create index if not exists idx_customer_access_org  on customer_access(org_id, status);

create table if not exists customer_project_access (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references orgs(id) on delete cascade,
  customer_access_id uuid not null references customer_access(id) on delete cascade,
  project_id         uuid not null references projects(id) on delete cascade,
  granted_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  unique (customer_access_id, project_id)
);
create index if not exists idx_customer_project_access_project on customer_project_access(project_id);

-- ------------------------------------------------------------- decisions --

create table if not exists customer_decisions (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references orgs(id) on delete cascade,
  project_id           uuid not null references projects(id) on delete cascade,
  title                text not null,
  description          text,
  options              jsonb not null,
  status               text not null default 'open',
  decided_option_key   text,
  decided_at           timestamptz,
  decided_by_access_id uuid references customer_access(id) on delete set null,
  decided_by_user_id   uuid references auth.users(id) on delete set null,
  decided_note         text,
  blocks_task_id       uuid references tasks(id) on delete set null,
  blocks_record_id     uuid references records(id) on delete set null,
  unblock_record_status text,
  requested_by         uuid references auth.users(id) on delete set null,
  created_at           timestamptz not null default now(),
  constraint decision_title   check (length(btrim(title)) between 1 and 140),
  constraint decision_status  check (status in ('open','decided','cancelled')),
  constraint decision_options check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 1 and 12)
);
create index if not exists idx_decisions_project on customer_decisions(project_id, status, created_at desc);
create index if not exists idx_decisions_org_open on customer_decisions(org_id, created_at) where status = 'open';

-- -------------------------------------------------------------- messages --

create table if not exists customer_messages (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references orgs(id) on delete cascade,
  project_id         uuid not null references projects(id) on delete cascade,
  customer_access_id uuid references customer_access(id) on delete set null,
  author_kind        text not null,
  author_user_id     uuid references auth.users(id) on delete set null,
  body               text not null,
  read_by_business_at timestamptz,
  created_at         timestamptz not null default now(),
  constraint customer_message_kind check (author_kind in ('customer','business')),
  constraint customer_message_body check (length(btrim(body)) between 1 and 4000)
);
create index if not exists idx_customer_messages_project on customer_messages(project_id, created_at desc);
create index if not exists idx_customer_messages_unread  on customer_messages(org_id, created_at) where author_kind = 'customer' and read_by_business_at is null;

-- Work that waits on the customer.
alter table tasks add column if not exists blocked_by_decision_id uuid references customer_decisions(id) on delete set null;
create index if not exists idx_tasks_blocked on tasks(blocked_by_decision_id) where blocked_by_decision_id is not null;

-- --------------------------------------------------------------- helpers --

create or replace function is_project_customer(p_project uuid) returns boolean as $$
  select exists (
    select 1 from customer_access ca
    join customer_project_access cpa on cpa.customer_access_id = ca.id
    where ca.user_id = auth.uid() and ca.status = 'active' and cpa.project_id = p_project
  );
$$ language sql stable security definer set search_path = public, pg_temp;

create or replace function is_customer_of_org(p_org uuid) returns boolean as $$
  select exists (
    select 1 from customer_access ca where ca.user_id = auth.uid() and ca.status = 'active' and ca.org_id = p_org
  );
$$ language sql stable security definer set search_path = public, pg_temp;
grant execute on function is_project_customer(uuid), is_customer_of_org(uuid) to anon, authenticated;

-- The history recorder learns about customers.
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
  elsif is_org_member(p_org) then
    kind := case
      when p_actor_kind in ('automation','integration','system') and is_org_admin(p_org) then p_actor_kind
      else 'user'
    end;
  elsif is_customer_of_org(p_org) then
    kind := 'customer';
  else
    raise exception 'not a member of this business' using errcode = '42501';
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

-- ------------------------------------------------------------------- RLS --

alter table customer_access         enable row level security;
alter table customer_project_access enable row level security;
alter table customer_decisions      enable row level security;
alter table customer_messages       enable row level security;

-- Business side: managers grant and revoke; every member may see who has access.
drop policy if exists "customer access read"   on customer_access;
drop policy if exists "customer access write"  on customer_access;
drop policy if exists "customer access update" on customer_access;
create policy "customer access read"  on customer_access for select using (is_org_member(org_id) or user_id = auth.uid());
create policy "customer access write" on customer_access for insert with check (
  is_org_admin(org_id) and org_module_enabled(org_id, 'customer_experience') and invited_by = auth.uid()
  and exists (select 1 from crm_contacts c where c.id = contact_id and c.org_id = customer_access.org_id)
);
create policy "customer access update" on customer_access for update using (is_org_admin(org_id)) with check (is_org_admin(org_id));

drop policy if exists "customer project access read"   on customer_project_access;
drop policy if exists "customer project access write"  on customer_project_access;
drop policy if exists "customer project access delete" on customer_project_access;
create policy "customer project access read" on customer_project_access for select using (
  is_org_member(org_id) or exists (select 1 from customer_access ca where ca.id = customer_access_id and ca.user_id = auth.uid())
);
create policy "customer project access write" on customer_project_access for insert with check (
  is_org_admin(org_id) and granted_by = auth.uid()
  and exists (select 1 from customer_access ca where ca.id = customer_access_id and ca.org_id = customer_project_access.org_id)
  and exists (select 1 from projects p where p.id = project_id and p.org_id = customer_project_access.org_id)
);
create policy "customer project access delete" on customer_project_access for delete using (is_org_admin(org_id));

drop policy if exists "decisions read"   on customer_decisions;
drop policy if exists "decisions write"  on customer_decisions;
drop policy if exists "decisions update" on customer_decisions;
create policy "decisions read"  on customer_decisions for select using (is_org_member(org_id) or is_project_customer(project_id));
create policy "decisions write" on customer_decisions for insert with check (
  is_org_admin(org_id) and org_module_enabled(org_id, 'customer_experience') and requested_by = auth.uid()
  and exists (select 1 from projects p where p.id = project_id and p.org_id = customer_decisions.org_id)
  and (blocks_task_id is null or exists (select 1 from tasks t where t.id = blocks_task_id and t.org_id = customer_decisions.org_id))
  and (blocks_record_id is null or exists (select 1 from records r where r.id = blocks_record_id and r.org_id = customer_decisions.org_id))
);
-- The business may cancel an open decision; deciding is the RPC's job.
create policy "decisions update" on customer_decisions for update
  using (is_org_admin(org_id) and status = 'open')
  with check (is_org_admin(org_id) and status in ('open','cancelled'));

drop policy if exists "customer messages read"  on customer_messages;
drop policy if exists "customer messages write" on customer_messages;
drop policy if exists "customer messages update" on customer_messages;
create policy "customer messages read"  on customer_messages for select using (is_org_member(org_id) or is_project_customer(project_id));
create policy "customer messages write" on customer_messages for insert with check (
  is_org_member(org_id) and author_kind = 'business' and author_user_id = auth.uid()
  and exists (select 1 from projects p where p.id = project_id and p.org_id = customer_messages.org_id)
);
create policy "customer messages update" on customer_messages for update using (is_org_member(org_id)) with check (is_org_member(org_id));
revoke update on customer_messages from authenticated;
grant update (read_by_business_at) on customer_messages to authenticated;

-- The customer's windows onto business data: their project, and only rows
-- flagged for them.
drop policy if exists "org read" on orgs;
create policy "org read" on orgs for select using (is_org_member(id) or is_customer_of_org(id));

drop policy if exists "projects customer read" on projects;
create policy "projects customer read" on projects for select using (is_project_customer(id));

drop policy if exists "milestones customer read" on project_milestones;
create policy "milestones customer read" on project_milestones for select using (customer_visible and is_project_customer(project_id));

drop policy if exists "updates customer read" on project_updates;
create policy "updates customer read" on project_updates for select using (customer_visible and is_project_customer(project_id));

drop policy if exists "documents customer read" on documents;
create policy "documents customer read" on documents for select using (customer_visible and project_id is not null and is_project_customer(project_id));

drop policy if exists "proofs customer read" on proofs;
create policy "proofs customer read" on proofs for select using (
  customer_visible and exists (select 1 from tasks t where t.id = proofs.task_id and t.project_id is not null and is_project_customer(t.project_id))
);

drop policy if exists "records customer read" on records;
create policy "records customer read" on records for select using (customer_visible and archived_at is null and project_id is not null and is_project_customer(project_id));

drop policy if exists "record types customer read" on record_types;
create policy "record types customer read" on record_types for select using (is_customer_of_org(org_id));
drop policy if exists "record fields customer read" on record_fields;
create policy "record fields customer read" on record_fields for select using (customer_visible and is_customer_of_org(org_id));

-- Customer-visible proofs live in a private bucket; the portal signs URLs
-- server-side after the checks above. No storage policy opens to customers.

-- ---------------------------------------------------------------- guards --

-- A decision's consequences are written by the customer's own request, but
-- the task and record guards know only members. The decision RPC marks the
-- transaction as a system write (transaction-local, never settable through
-- the API because no exposed function sets it), and those guards step aside
-- for exactly that transaction.
create or replace function is_system_write() returns boolean as $$
  select coalesce(current_setting('waakya.system_write', true), '') = 'on';
$$ language sql stable set search_path = public, pg_temp;
grant execute on function is_system_write() to anon, authenticated;

create or replace function guard_task_update() returns trigger as $$
declare
  actor uuid := auth.uid();
  role member_role;
  manages boolean;
  assignee boolean;
  wanted task_state;
begin
  if actor is null or is_system_write() then
    return new;                      -- service role (the SLA job), or a decision's consequence
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

create or replace function guard_record_member() returns trigger as $$
begin
  if is_system_write() then return new; end if;
  if auth.uid() is not null and not is_org_member(old.org_id) then
    raise exception 'not a member of this business' using errcode = '42501';
  end if;
  if auth.uid() is not null and not org_module_enabled(old.org_id, 'records') then
    raise exception 'records are not switched on for this business' using errcode = '42501';
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;


-- A task that waits on the customer cannot be finished.
create or replace function guard_task_blocked() returns trigger as $$
begin
  if auth.uid() is not null and new.state in ('done','verified') and old.state not in ('done','verified')
     and new.blocked_by_decision_id is not null
     and exists (select 1 from customer_decisions d where d.id = new.blocked_by_decision_id and d.status = 'open') then
    raise exception 'this task is waiting on the customer' using errcode = '22023';
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function guard_task_blocked() from public, anon, authenticated;

drop trigger if exists trg_guard_task_blocked on tasks;
create trigger trg_guard_task_blocked before update on tasks
  for each row execute function guard_task_blocked();

create or replace function events_on_customer_access() returns trigger as $$
declare
  contact_name text;
begin
  select c.full_name into contact_name from crm_contacts c where c.id = new.contact_id;
  if tg_op = 'INSERT' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'customer_access.granted', 'customer_access', new.id, 'user', new.invited_by,
      jsonb_build_object('title', contact_name, 'contact_id', new.contact_id, 'email', new.email));
  elsif new.status = 'revoked' and old.status <> 'revoked' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'customer_access.revoked', 'customer_access', new.id, 'user', auth.uid(),
      jsonb_build_object('title', contact_name, 'contact_id', new.contact_id));
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_customer_access() from public, anon, authenticated;

drop trigger if exists trg_events_customer_access on customer_access;
create trigger trg_events_customer_access after insert or update on customer_access
  for each row execute function events_on_customer_access();

create or replace function events_on_customer_decision() returns trigger as $$
declare
  v_project text;
begin
  select p.name into v_project from projects p where p.id = new.project_id;
  if tg_op = 'INSERT' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'customer_decision.requested', 'customer_decision', new.id, 'user', new.requested_by,
      jsonb_build_object('title', new.title, 'project_id', new.project_id, 'project_name', v_project, 'blocks_task_id', new.blocks_task_id));
    if new.blocks_task_id is not null then
      update tasks set blocked_by_decision_id = new.id where id = new.blocks_task_id and org_id = new.org_id;
    end if;
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_customer_decision() from public, anon, authenticated;

drop trigger if exists trg_events_customer_decision on customer_decisions;
create trigger trg_events_customer_decision after insert on customer_decisions
  for each row execute function events_on_customer_decision();

create or replace function events_on_customer_message() returns trigger as $$
declare
  v_project text;
  v_contact uuid;
  approver uuid;
begin
  select p.name, p.contact_id into v_project, v_contact from projects p where p.id = new.project_id;
  if new.author_kind = 'customer' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'customer_message.received', 'customer_message', new.id, 'customer', new.author_user_id,
      jsonb_build_object('project_id', new.project_id, 'project_name', v_project, 'body', left(new.body, 200), 'contact_id', v_contact));
    if v_contact is not null then
      insert into crm_activities (org_id, contact_id, kind, body, actor_kind, actor_id, metadata)
      values (new.org_id, v_contact, 'message', left(new.body, 4000), 'customer', new.author_user_id, jsonb_build_object('project_id', new.project_id));
    end if;
    for approver in
      select m.user_id from memberships m where m.org_id = new.org_id and m.role in ('owner','admin','manager')
      union select pm.user_id from project_members pm where pm.project_id = new.project_id
    loop
      perform push_notification(new.org_id, approver, 'customer_message',
        coalesce(v_project, 'Project') || ' · ' || left(new.body, 120),
        '/projects/' || new.project_id || '#customer', 'cmsg:' || new.project_id || ':' || approver);
    end loop;
  else
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'customer_message.sent', 'customer_message', new.id, 'user', new.author_user_id,
      jsonb_build_object('project_id', new.project_id, 'project_name', v_project, 'body', left(new.body, 200)));
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_customer_message() from public, anon, authenticated;

drop trigger if exists trg_events_customer_message on customer_messages;
create trigger trg_events_customer_message after insert on customer_messages
  for each row execute function events_on_customer_message();

-- ------------------------------------------------------------- functions --

-- A customer with an invite link signs in and claims it. The link is bound
-- to the address it was sent to when one was recorded.
create or replace function accept_customer_invite(p_token text) returns customer_access as $$
declare
  actor uuid := auth.uid();
  actor_email text;
  row_out customer_access;
begin
  if actor is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  select lower(u.email) into actor_email from auth.users u where u.id = actor;
  select * into row_out from customer_access ca where ca.invite_token = p_token for update;
  if row_out.id is null then
    raise exception 'invite not found' using errcode = 'P0002';
  end if;
  if row_out.status = 'revoked' then
    raise exception 'this access was revoked' using errcode = '42501';
  end if;
  if row_out.user_id is not null and row_out.user_id <> actor then
    raise exception 'this invite was used by someone else' using errcode = '42501';
  end if;
  if row_out.email is not null and actor_email is distinct from row_out.email then
    raise exception 'sign in with the address this invite was sent to' using errcode = '42501';
  end if;
  update customer_access set user_id = actor, status = 'active', accepted_at = coalesce(accepted_at, now()), last_seen_at = now()
   where id = row_out.id returning * into row_out;
  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, auth, pg_temp;
revoke all on function accept_customer_invite(text) from public, anon;
grant execute on function accept_customer_invite(text) to authenticated;

-- What a signed-in customer may enter: the businesses and projects they hold.
create or replace function my_customer_access() returns table (access_id uuid, org_id uuid, org_name text, contact_name text, project_id uuid, project_name text) as $$
  select ca.id, ca.org_id, o.name, c.full_name, cpa.project_id, p.name
    from customer_access ca
    join orgs o on o.id = ca.org_id
    join crm_contacts c on c.id = ca.contact_id
    left join customer_project_access cpa on cpa.customer_access_id = ca.id
    left join projects p on p.id = cpa.project_id
   where ca.user_id = auth.uid() and ca.status = 'active';
$$ language sql stable security definer set search_path = public, pg_temp;
revoke all on function my_customer_access() from public, anon;
grant execute on function my_customer_access() to authenticated;

-- The decision, as one transaction. Idempotent: the second call answers
-- with the first choice and already_decided = true.
create or replace function record_customer_decision(p_decision uuid, p_option text, p_note text default null)
returns table (decision_id uuid, option_key text, already_decided boolean) as $$
declare
  actor uuid := auth.uid();
  d customer_decisions;
  access_row customer_access;
  option_label text;
  v_project text;
  v_contact_name text;
  assignee uuid;
  task_title text;
  notified uuid;
begin
  select * into d from customer_decisions cd where cd.id = p_decision for update;
  if d.id is null then
    raise exception 'decision not found' using errcode = 'P0002';
  end if;
  if actor is not null and not is_project_customer(d.project_id) then
    raise exception 'this decision is not yours to make' using errcode = '42501';
  end if;
  if d.status = 'decided' then
    return query select d.id, d.decided_option_key, true;
    return;
  end if;
  if d.status <> 'open' then
    raise exception 'this decision is closed' using errcode = '22023';
  end if;
  select o ->> 'label' into option_label from jsonb_array_elements(d.options) o where o ->> 'key' = p_option;
  if option_label is null then
    raise exception 'that option is not offered' using errcode = '22023';
  end if;
  select * into access_row from customer_access ca where ca.user_id = actor and ca.org_id = d.org_id and ca.status = 'active';
  select p.name into v_project from projects p where p.id = d.project_id;
  select c.full_name into v_contact_name from crm_contacts c where c.id = access_row.contact_id;

  perform set_config('waakya.system_write', 'on', true);
  update customer_decisions set status = 'decided', decided_option_key = p_option, decided_at = now(),
         decided_by_access_id = access_row.id, decided_by_user_id = actor, decided_note = nullif(btrim(coalesce(p_note, '')), '')
   where id = d.id;

  -- Consequences: the work opens, the record moves, the story is told.
  if d.blocks_task_id is not null then
    update tasks set blocked_by_decision_id = null where id = d.blocks_task_id returning assigned_to, title into assignee, task_title;
    insert into task_events (task_id, org_id, from_state, to_state, actor_id, note)
    select t.id, t.org_id, t.state, t.state, null, 'decision:' || option_label from tasks t where t.id = d.blocks_task_id;
  end if;
  if d.blocks_record_id is not null and d.unblock_record_status is not null then
    update records set status_key = d.unblock_record_status where id = d.blocks_record_id;
  end if;
  insert into project_updates (org_id, project_id, kind, body, customer_visible, actor_kind, created_by)
  values (d.org_id, d.project_id, 'decision', d.title || ': ' || option_label, true, 'customer', actor);

  insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
  values (d.org_id, 'customer_decision.recorded', 'customer_decision', d.id, 'customer', actor,
    jsonb_build_object('title', d.title, 'option_key', p_option, 'option_label', option_label, 'project_id', d.project_id,
                       'project_name', v_project, 'blocks_task_id', d.blocks_task_id, 'blocks_record_id', d.blocks_record_id,
                       'contact_name', v_contact_name, 'note', p_note));
  if access_row.contact_id is not null then
    insert into crm_activities (org_id, contact_id, kind, body, actor_kind, actor_id, metadata)
    values (d.org_id, access_row.contact_id, 'decision', d.title || ': ' || option_label, 'customer', actor, jsonb_build_object('decision_id', d.id));
  end if;

  for notified in
    select d.requested_by where d.requested_by is not null
    union select assignee where assignee is not null
  loop
    perform push_notification(d.org_id, notified, 'customer_decision',
      coalesce(v_project, 'Project') || ' · ' || d.title || ': ' || option_label,
      '/projects/' || d.project_id || '#decisions', 'cdec:' || d.id || ':' || notified);
  end loop;

  return query select d.id, p_option, false;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;
revoke all on function record_customer_decision(uuid, text, text) from public, anon;
grant execute on function record_customer_decision(uuid, text, text) to authenticated, service_role;

-- A customer writes to the business about their project.
create or replace function post_customer_message(p_project uuid, p_body text) returns customer_messages as $$
declare
  actor uuid := auth.uid();
  access_row customer_access;
  v_org uuid;
  row_out customer_messages;
begin
  if actor is null or not is_project_customer(p_project) then
    raise exception 'this project is not yours' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_body, ''))) < 1 then
    raise exception 'write something first' using errcode = '22023';
  end if;
  select p.org_id into v_org from projects p where p.id = p_project;
  select * into access_row from customer_access ca where ca.user_id = actor and ca.org_id = v_org and ca.status = 'active';
  insert into customer_messages (org_id, project_id, customer_access_id, author_kind, author_user_id, body)
  values (v_org, p_project, access_row.id, 'customer', actor, left(btrim(p_body), 4000))
  returning * into row_out;
  update customer_access set last_seen_at = now() where id = access_row.id;
  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;
revoke all on function post_customer_message(uuid, text) from public, anon;
grant execute on function post_customer_message(uuid, text) to authenticated;

-- Notifications about customers reach the people running the project; the
-- trigger above uses push_notification, which the 0020 grants keep internal.
