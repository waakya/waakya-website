-- Phase 1 completion: business profile, projects, documents, approvals, group
-- conversations, and notifications that can point somewhere other than a task.
--
-- Same rules as attendance and conversations:
--   * every row belongs to an org, and membership of that org is the access rule;
--   * where a write needs judgement (deciding an approval, creating a group) it
--     goes through a security-definer function that establishes the org itself;
--   * simple owned writes (a project, a document row) use policies whose WITH
--     CHECK verifies the caller really belongs to the org they name, so a forged
--     org id is refused by the database, not by the screen.

-- ---------------------------------------------------------------- helpers --
-- Owner or admin only. `is_org_admin` also admits managers, which is right for
-- day-to-day approvals but not for editing the business itself.
create or replace function is_org_owner_admin(p_org uuid) returns boolean as $$
  select exists (
    select 1 from memberships m
     where m.org_id = p_org and m.user_id = auth.uid()
       and m.role in ('owner','admin')
  );
$$ language sql stable security definer set search_path = public, pg_temp;

revoke all on function is_org_owner_admin(uuid) from public;
grant execute on function is_org_owner_admin(uuid) to authenticated;

-- ------------------------------------------------------- business profile --
alter table orgs add column if not exists address text;
alter table orgs add column if not exists gstin   text;
alter table orgs add column if not exists phone   text;
alter table orgs add column if not exists email   text;

create or replace function update_business_profile(
  p_org uuid,
  p_name text,
  p_address text default null,
  p_gstin text default null,
  p_phone text default null,
  p_email text default null
) returns orgs as $$
declare
  row_out orgs;
begin
  if not is_org_owner_admin(p_org) then
    raise exception 'only an owner or admin can edit the business' using errcode = '42501';
  end if;
  if p_name is null or length(btrim(p_name)) < 2 then
    raise exception 'business name too short' using errcode = '22023';
  end if;
  update orgs
     set name    = btrim(p_name),
         address = nullif(btrim(coalesce(p_address, '')), ''),
         gstin   = nullif(upper(btrim(coalesce(p_gstin, ''))), ''),
         phone   = nullif(btrim(coalesce(p_phone, '')), ''),
         email   = nullif(btrim(coalesce(p_email, '')), '')
   where id = p_org
  returning * into row_out;
  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke all on function update_business_profile(uuid, text, text, text, text, text) from public;
grant execute on function update_business_profile(uuid, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------- notifications --
-- Tasks were the only thing a notification could open. Leave, approvals,
-- messages and documents need somewhere to go too.
alter table notifications add column if not exists href text;

-- Internal only: called from triggers and functions below, never by a client.
create or replace function push_notification(
  p_org uuid, p_user uuid, p_event text, p_body text, p_href text, p_dedupe text default null
) returns void as $$
begin
  if p_user is null then return; end if;
  insert into notifications (org_id, user_id, event, body, href, dedupe_key)
  values (p_org, p_user, p_event, left(p_body, 280), p_href, p_dedupe)
  on conflict (dedupe_key) where dedupe_key is not null do update
    set body = excluded.body, href = excluded.href,
        read_at = null, created_at = now();
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke all on function push_notification(uuid, uuid, text, text, text, text) from public;
revoke all on function push_notification(uuid, uuid, text, text, text, text) from authenticated;

create or replace function display_name(p_user uuid) returns text as $$
  select coalesce(nullif(btrim(p.full_name), ''), 'Someone') from profiles p where p.id = p_user;
$$ language sql stable security definer set search_path = public, pg_temp;

revoke all on function display_name(uuid) from public;
revoke all on function display_name(uuid) from authenticated;

-- ---------------------------------------------------------------- projects --
do $$ begin
  create type project_status as enum ('planned','active','on_hold','completed');
exception when duplicate_object then null; end $$;

create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  name        text not null,
  description text,
  status      project_status not null default 'active',
  start_date  date,
  end_date    date,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint project_name_length check (length(btrim(name)) >= 2),
  constraint project_dates_ordered check (end_date is null or start_date is null or end_date >= start_date)
);
create index if not exists idx_projects_org on projects(org_id, status, updated_at desc);

drop trigger if exists trg_projects_updated on projects;
create trigger trg_projects_updated before update on projects
  for each row execute function set_updated_at();

create table if not exists project_members (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  org_id     uuid not null references orgs(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);
create index if not exists idx_project_members_user on project_members(user_id);

alter table tasks add column if not exists project_id uuid references projects(id) on delete set null;
create index if not exists idx_tasks_org_project on tasks(org_id, project_id) where project_id is not null;
create index if not exists idx_tasks_org_assignee_state on tasks(org_id, assigned_to, state);

alter table projects        enable row level security;
alter table project_members enable row level security;

drop policy if exists "projects read"   on projects;
drop policy if exists "projects insert" on projects;
drop policy if exists "projects update" on projects;
create policy "projects read" on projects for select using (is_org_member(org_id));
create policy "projects insert" on projects for insert
  with check (is_org_admin(org_id) and created_by = auth.uid());
create policy "projects update" on projects for update
  using (is_org_admin(org_id)) with check (is_org_admin(org_id));

drop policy if exists "project members read"   on project_members;
drop policy if exists "project members insert" on project_members;
drop policy if exists "project members delete" on project_members;
create policy "project members read" on project_members for select using (is_org_member(org_id));
create policy "project members insert" on project_members for insert
  with check (
    is_org_admin(org_id)
    and exists (select 1 from projects p where p.id = project_id and p.org_id = project_members.org_id)
    and exists (select 1 from memberships m where m.org_id = project_members.org_id and m.user_id = project_members.user_id)
  );
create policy "project members delete" on project_members for delete using (is_org_admin(org_id));

-- ---------------------------------------------------------------- documents --
do $$ begin
  create type document_category as enum (
    'quotation','proposal','invoice','agreement','nda','purchase_order',
    'work_order','receipt','sow','report','meeting_minutes','other'
  );
exception when duplicate_object then null; end $$;

create table if not exists documents (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id) on delete cascade,
  name          text not null,
  category      document_category not null default 'other',
  mime_type     text,
  size_bytes    bigint,
  storage_key   text not null unique,
  uploaded_by   uuid not null references auth.users(id),
  task_id       uuid references tasks(id) on delete set null,
  project_id    uuid references projects(id) on delete set null,
  message_id    uuid references messages(id) on delete set null,
  source        text not null default 'upload',
  template_key  text,
  template_data jsonb,
  created_at    timestamptz not null default now(),
  constraint document_name_present check (length(btrim(name)) >= 1),
  constraint document_source check (source in ('upload','template')),
  -- The key's first segments name the org; a row may only point inside its own.
  constraint document_key_in_org check (storage_org_id(storage_key) = org_id)
);
create index if not exists idx_documents_org on documents(org_id, created_at desc);
create index if not exists idx_documents_task on documents(task_id) where task_id is not null;
create index if not exists idx_documents_project on documents(project_id) where project_id is not null;
create index if not exists idx_documents_message on documents(message_id) where message_id is not null;

alter table documents enable row level security;

drop policy if exists "documents read"   on documents;
drop policy if exists "documents insert" on documents;
drop policy if exists "documents update" on documents;
drop policy if exists "documents delete" on documents;

-- A file shared inside a private conversation stays inside that conversation.
create policy "documents read" on documents for select using (
  is_org_member(org_id)
  and (
    message_id is null
    or exists (
      select 1 from messages m
       where m.id = documents.message_id
         and is_conversation_participant(m.conversation_id)
    )
  )
);
create policy "documents insert" on documents for insert with check (
  is_org_member(org_id)
  and uploaded_by = auth.uid()
  and (task_id is null or exists (select 1 from tasks t where t.id = task_id and t.org_id = documents.org_id))
  and (project_id is null or exists (select 1 from projects p where p.id = project_id and p.org_id = documents.org_id))
);
create policy "documents update" on documents for update
  using (uploaded_by = auth.uid() or is_org_admin(org_id))
  with check (
    (uploaded_by = auth.uid() or is_org_admin(org_id))
    and (task_id is null or exists (select 1 from tasks t where t.id = task_id and t.org_id = documents.org_id))
    and (project_id is null or exists (select 1 from projects p where p.id = project_id and p.org_id = documents.org_id))
  );
create policy "documents delete" on documents for delete
  using (uploaded_by = auth.uid() or is_org_admin(org_id));

-- Private bucket. Objects live at orgs/<org_id>/documents/<uuid>/<file>, and
-- only a short-lived signed URL ever reaches a browser.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents', 'documents', false, 26214400,
  array[
    'application/pdf',
    'image/jpeg','image/png','image/webp','image/heic',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain','text/csv','text/html'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "documents objects read"   on storage.objects;
drop policy if exists "documents objects write"  on storage.objects;
drop policy if exists "documents objects delete" on storage.objects;

create policy "documents objects read" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and is_org_member(storage_org_id(name)));

create policy "documents objects write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and is_org_member(storage_org_id(name)));

create policy "documents objects delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and (owner_id = (auth.uid())::text or is_org_admin(storage_org_id(name)))
  );

-- --------------------------------------------------------------- approvals --
do $$ begin
  create type approval_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

create table if not exists approvals (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id) on delete cascade,
  title         text not null,
  details       text,
  status        approval_status not null default 'pending',
  requested_by  uuid not null references auth.users(id),
  approver_id   uuid references auth.users(id),
  task_id       uuid references tasks(id) on delete set null,
  project_id    uuid references projects(id) on delete set null,
  document_id   uuid references documents(id) on delete set null,
  decided_by    uuid references auth.users(id),
  decided_at    timestamptz,
  decision_note text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint approval_title_length check (length(btrim(title)) >= 2)
);
create index if not exists idx_approvals_org_status on approvals(org_id, status, created_at desc);

drop trigger if exists trg_approvals_updated on approvals;
create trigger trg_approvals_updated before update on approvals
  for each row execute function set_updated_at();

alter table approvals enable row level security;

drop policy if exists "approvals read" on approvals;
create policy "approvals read" on approvals for select using (
  requested_by = auth.uid() or approver_id = auth.uid() or is_org_admin(org_id)
);

create or replace function request_approval(
  p_org uuid,
  p_title text,
  p_details text default null,
  p_approver uuid default null,
  p_task uuid default null,
  p_project uuid default null,
  p_document uuid default null
) returns approvals as $$
declare
  row_out approvals;
begin
  if not is_org_member(p_org) then
    raise exception 'not a member of this business' using errcode = '42501';
  end if;
  if p_title is null or length(btrim(p_title)) < 2 then
    raise exception 'give the approval a title' using errcode = '22023';
  end if;
  if p_approver is not null then
    if p_approver = auth.uid() then
      raise exception 'choose somebody else to approve' using errcode = '22023';
    end if;
    if not exists (
      select 1 from memberships m
       where m.org_id = p_org and m.user_id = p_approver
         and m.role in ('owner','admin','manager')
    ) then
      raise exception 'that person cannot approve' using errcode = '42501';
    end if;
  end if;
  if p_task is not null and not exists (select 1 from tasks t where t.id = p_task and t.org_id = p_org) then
    raise exception 'that task is not in this business' using errcode = '42501';
  end if;
  if p_project is not null and not exists (select 1 from projects p where p.id = p_project and p.org_id = p_org) then
    raise exception 'that project is not in this business' using errcode = '42501';
  end if;
  if p_document is not null and not exists (select 1 from documents d where d.id = p_document and d.org_id = p_org) then
    raise exception 'that document is not in this business' using errcode = '42501';
  end if;

  insert into approvals (org_id, title, details, requested_by, approver_id, task_id, project_id, document_id)
  values (p_org, btrim(p_title), nullif(btrim(coalesce(p_details, '')), ''), auth.uid(),
          p_approver, p_task, p_project, p_document)
  returning * into row_out;
  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

-- Safe to press twice: an approval that is no longer pending comes back as it is.
create or replace function decide_approval(
  p_approval uuid, p_approve boolean, p_note text default null
) returns approvals as $$
declare
  row_out approvals;
begin
  select * into row_out from approvals where id = p_approval for update;
  if not found then
    raise exception 'approval not found' using errcode = 'P0002';
  end if;
  if row_out.requested_by = auth.uid() then
    raise exception 'you cannot decide your own request' using errcode = '42501';
  end if;
  if not (
    row_out.approver_id = auth.uid()
    or (row_out.approver_id is null and is_org_admin(row_out.org_id))
    or is_org_owner_admin(row_out.org_id)
  ) then
    raise exception 'only the approver can decide this' using errcode = '42501';
  end if;
  if row_out.status <> 'pending' then
    return row_out;
  end if;

  update approvals
     set status = case when p_approve then 'approved'::approval_status else 'rejected'::approval_status end,
         decided_by = auth.uid(), decided_at = now(),
         decision_note = nullif(btrim(coalesce(p_note, '')), '')
   where id = p_approval
  returning * into row_out;
  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke all on function request_approval(uuid, text, text, uuid, uuid, uuid, uuid) from public;
revoke all on function decide_approval(uuid, boolean, text) from public;
grant execute on function request_approval(uuid, text, text, uuid, uuid, uuid, uuid) to authenticated;
grant execute on function decide_approval(uuid, boolean, text) to authenticated;

-- ------------------------------------------------------ group conversations --
create or replace function create_group_conversation(
  p_org uuid, p_title text, p_members uuid[]
) returns conversations as $$
declare
  row_out conversations;
  member uuid;
begin
  if not is_org_member(p_org) then
    raise exception 'not a member of this business' using errcode = '42501';
  end if;
  if p_title is null or length(btrim(p_title)) < 2 then
    raise exception 'give the group a name' using errcode = '22023';
  end if;
  if coalesce(array_length(p_members, 1), 0) = 0 then
    raise exception 'add at least one person' using errcode = '22023';
  end if;

  foreach member in array p_members loop
    if not exists (select 1 from memberships m where m.org_id = p_org and m.user_id = member) then
      raise exception 'that person is not in this business' using errcode = '42501';
    end if;
  end loop;

  insert into conversations (org_id, kind, title, created_by)
  values (p_org, 'group', btrim(p_title), auth.uid())
  returning * into row_out;

  insert into conversation_participants (conversation_id, org_id, user_id)
  select row_out.id, p_org, u
    from (select distinct unnest(p_members || auth.uid()) as u) people
  on conflict (conversation_id, user_id) do nothing;

  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke all on function create_group_conversation(uuid, text, uuid[]) from public;
grant execute on function create_group_conversation(uuid, text, uuid[]) to authenticated;

-- --------------------------------------------------- notification triggers --
-- A new message: everybody else in the conversation, one live row each.
create or replace function notify_new_message() returns trigger as $$
declare
  recipient uuid;
  conv conversations;
begin
  select * into conv from conversations where id = new.conversation_id;
  for recipient in
    select p.user_id from conversation_participants p
     where p.conversation_id = new.conversation_id and p.user_id <> new.author_id
  loop
    perform push_notification(
      new.org_id, recipient, 'message',
      display_name(new.author_id) || ': ' || left(new.body, 140),
      '/baat/' || new.conversation_id,
      'msg:' || new.conversation_id || ':' || recipient
    );
  end loop;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_message on messages;
create trigger trg_notify_message after insert on messages
  for each row execute function notify_new_message();

-- Leave: approvers hear about a request; the requester hears the decision.
create or replace function notify_leave() returns trigger as $$
declare
  approver uuid;
begin
  if tg_op = 'INSERT' then
    for approver in
      select m.user_id from memberships m
       where m.org_id = new.org_id and m.role in ('owner','admin','manager')
         and m.user_id <> new.user_id
    loop
      perform push_notification(
        new.org_id, approver, 'leave_requested',
        display_name(new.user_id) || ' asked for leave from ' || to_char(new.start_date, 'DD Mon'),
        '/hazri', 'leave-req:' || new.id || ':' || approver
      );
    end loop;
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status <> 'pending' then
    perform push_notification(
      new.org_id, new.user_id,
      case when new.status = 'approved' then 'leave_approved' else 'leave_rejected' end,
      'Your leave from ' || to_char(new.start_date, 'DD Mon') || ' was ' || new.status::text,
      '/hazri', 'leave-dec:' || new.id
    );
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_leave on leave_requests;
create trigger trg_notify_leave after insert or update on leave_requests
  for each row execute function notify_leave();

-- Approvals: the approver (or every manager) hears a request; the requester
-- hears the decision.
create or replace function notify_approval() returns trigger as $$
declare
  approver uuid;
begin
  if tg_op = 'INSERT' then
    for approver in
      select m.user_id from memberships m
       where m.org_id = new.org_id and m.user_id <> new.requested_by
         and (
           (new.approver_id is not null and m.user_id = new.approver_id)
           or (new.approver_id is null and m.role in ('owner','admin','manager'))
         )
    loop
      perform push_notification(
        new.org_id, approver, 'approval_requested',
        display_name(new.requested_by) || ' needs approval: ' || new.title,
        '/approvals', 'appr-req:' || new.id || ':' || approver
      );
    end loop;
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status <> 'pending' then
    perform push_notification(
      new.org_id, new.requested_by, 'approval_decided',
      new.title || ' was ' || new.status::text || ' by ' || display_name(new.decided_by),
      '/approvals', 'appr-dec:' || new.id
    );
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_approval on approvals;
create trigger trg_notify_approval after insert or update on approvals
  for each row execute function notify_approval();

-- A document attached to a task reaches the people who own that task.
create or replace function notify_task_document() returns trigger as $$
declare
  t tasks;
  person uuid;
begin
  if new.task_id is null then return new; end if;
  select * into t from tasks where id = new.task_id;
  for person in
    select distinct u from (values (t.created_by), (t.assigned_to)) v(u)
     where u is not null and u <> new.uploaded_by
  loop
    perform push_notification(
      new.org_id, person, 'document_added',
      display_name(new.uploaded_by) || ' attached ' || new.name || ' to ' || t.title,
      '/kaam/' || t.id, 'doc:' || new.id || ':' || person
    );
  end loop;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_task_document on documents;
create trigger trg_notify_task_document after insert or update of task_id on documents
  for each row execute function notify_task_document();

revoke all on function notify_new_message()   from public;
revoke all on function notify_leave()         from public;
revoke all on function notify_approval()      from public;
revoke all on function notify_task_document() from public;
