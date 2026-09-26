-- 0032 — Configurable records.
--
-- One capability that models a property unit for a developer and a work
-- package for an interior firm without a table per customer (spec §5). A
-- record type declares its statuses and fields; a record carries a title, a
-- status, structured links (project, customer, vendor, assignee) as real
-- columns, and everything else as validated JSON in `values`.
--
-- What the database enforces: the type and the record share a business;
-- linked rows share the business; the status is one the type declares;
-- values is an object; a status change writes history. Field typing is
-- validated by the server (lib/records/schema.ts) and mirrored here for the
-- shapes JSON can check (required keys present when the field is required).

create table if not exists record_types (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null references orgs(id) on delete cascade,
  key                      text not null,
  name                     text not null,
  name_plural              text not null,
  icon                     text,
  description              text,
  statuses                 jsonb not null default '[]'::jsonb,
  default_status           text,
  customer_visible_default boolean not null default false,
  template_key             text,
  created_by               uuid references auth.users(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  archived_at              timestamptz,
  constraint record_type_key      check (key ~ '^[a-z][a-z0-9_]{1,39}$'),
  constraint record_type_name     check (length(btrim(name)) between 1 and 60 and length(btrim(name_plural)) between 1 and 60),
  constraint record_type_statuses check (jsonb_typeof(statuses) = 'array'),
  unique (org_id, key)
);
create index if not exists idx_record_types_org on record_types(org_id, archived_at);

drop trigger if exists trg_record_types_updated on record_types;
create trigger trg_record_types_updated before update on record_types
  for each row execute function set_updated_at();

create table if not exists record_fields (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references orgs(id) on delete cascade,
  record_type_id   uuid not null references record_types(id) on delete cascade,
  key              text not null,
  label            text not null,
  field_type       text not null,
  options          jsonb not null default '{}'::jsonb,
  required         boolean not null default false,
  position         integer not null default 0,
  show_in_list     boolean not null default true,
  customer_visible boolean not null default false,
  unit             text,
  created_at       timestamptz not null default now(),
  archived_at      timestamptz,
  constraint record_field_key   check (key ~ '^[a-z][a-z0-9_]{0,39}$'),
  constraint record_field_label check (length(btrim(label)) between 1 and 60),
  constraint record_field_type  check (field_type in ('text','long_text','number','money','date','boolean','select','multi_select','phone','email','url','member','contact','project','vendor','record')),
  constraint record_field_opts  check (jsonb_typeof(options) = 'object'),
  unique (record_type_id, key)
);
create index if not exists idx_record_fields_type on record_fields(record_type_id, position);

create table if not exists records (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references orgs(id) on delete cascade,
  record_type_id   uuid not null references record_types(id) on delete restrict,
  title            text not null,
  status_key       text,
  values           jsonb not null default '{}'::jsonb,
  project_id       uuid references projects(id) on delete set null,
  contact_id       uuid references crm_contacts(id) on delete set null,
  vendor_id        uuid,
  assignee_id      uuid references auth.users(id) on delete set null,
  customer_visible boolean not null default false,
  sort_key         numeric,
  created_by       uuid references auth.users(id) on delete set null,
  updated_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  archived_at      timestamptz,
  constraint record_title  check (length(btrim(title)) between 1 and 200),
  constraint record_values check (jsonb_typeof(values) = 'object')
);
create index if not exists idx_records_type_status on records(org_id, record_type_id, status_key) where archived_at is null;
create index if not exists idx_records_project     on records(project_id) where project_id is not null;
create index if not exists idx_records_contact     on records(contact_id) where contact_id is not null;
create index if not exists idx_records_vendor      on records(vendor_id) where vendor_id is not null;
create index if not exists idx_records_assignee    on records(assignee_id) where assignee_id is not null;
create index if not exists idx_records_updated     on records(org_id, updated_at desc);
create index if not exists idx_records_title       on records(org_id, lower(title));
create index if not exists idx_records_values      on records using gin(values jsonb_path_ops);
create index if not exists idx_records_customer    on records(project_id) where customer_visible and archived_at is null;

drop trigger if exists trg_records_updated on records;
create trigger trg_records_updated before update on records
  for each row execute function set_updated_at();

-- Tasks and deals can point at a record (a unit, a work package).
alter table tasks add column if not exists record_id uuid references records(id) on delete set null;
create index if not exists idx_tasks_record on tasks(record_id) where record_id is not null;
do $$ begin
  alter table crm_opportunities add constraint crm_opps_record_fk foreign key (record_id) references records(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------ RLS --

alter table record_types  enable row level security;
alter table record_fields enable row level security;
alter table records       enable row level security;

drop policy if exists "record types read"   on record_types;
drop policy if exists "record types write"  on record_types;
drop policy if exists "record types update" on record_types;
create policy "record types read"   on record_types for select using (is_org_member(org_id));
create policy "record types write"  on record_types for insert with check (is_org_owner_admin(org_id) and org_module_enabled(org_id, 'records') and created_by = auth.uid());
create policy "record types update" on record_types for update using (is_org_owner_admin(org_id)) with check (is_org_owner_admin(org_id));
-- Types are archived, never deleted: records keep their shape.

drop policy if exists "record fields read"   on record_fields;
drop policy if exists "record fields write"  on record_fields;
drop policy if exists "record fields update" on record_fields;
drop policy if exists "record fields delete" on record_fields;
create policy "record fields read"   on record_fields for select using (is_org_member(org_id));
create policy "record fields write"  on record_fields for insert with check (
  is_org_owner_admin(org_id) and org_module_enabled(org_id, 'records')
  and exists (select 1 from record_types t where t.id = record_type_id and t.org_id = record_fields.org_id)
);
create policy "record fields update" on record_fields for update using (is_org_owner_admin(org_id)) with check (is_org_owner_admin(org_id));
create policy "record fields delete" on record_fields for delete using (
  is_org_owner_admin(org_id)
  and not exists (select 1 from records r where r.record_type_id = record_fields.record_type_id and r.values ? record_fields.key)
);

drop policy if exists "records read"   on records;
drop policy if exists "records write"  on records;
drop policy if exists "records update" on records;
create policy "records read"   on records for select using (is_org_member(org_id));
create policy "records write"  on records for insert with check (
  is_org_member(org_id) and org_module_enabled(org_id, 'records') and created_by = auth.uid()
  and exists (select 1 from record_types t where t.id = record_type_id and t.org_id = records.org_id and t.archived_at is null)
  and (project_id is null or exists (select 1 from projects p where p.id = project_id and p.org_id = records.org_id))
  and (contact_id is null or exists (select 1 from crm_contacts c where c.id = contact_id and c.org_id = records.org_id))
  and (assignee_id is null or exists (select 1 from memberships m where m.org_id = records.org_id and m.user_id = assignee_id))
);
create policy "records update" on records for update
  using (is_org_member(org_id) and org_module_enabled(org_id, 'records'))
  with check (
    is_org_member(org_id)
    and (project_id is null or exists (select 1 from projects p where p.id = project_id and p.org_id = records.org_id))
    and (contact_id is null or exists (select 1 from crm_contacts c where c.id = contact_id and c.org_id = records.org_id))
    and (assignee_id is null or exists (select 1 from memberships m where m.org_id = records.org_id and m.user_id = assignee_id))
  );
-- Records are archived, never deleted.

-- --------------------------------------------------------------- guards --

-- The status must be one the type declares; the business never changes;
-- archiving is a manager's call; required fields are present.
create or replace function guard_record_write() returns trigger as $$
declare
  actor uuid := auth.uid();
  rtype record_types;
  f record;
begin
  select * into rtype from record_types t where t.id = new.record_type_id;
  if rtype.id is null or rtype.org_id <> new.org_id then
    raise exception 'that record type is not in this business' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    if new.org_id is distinct from old.org_id or new.record_type_id is distinct from old.record_type_id then
      raise exception 'a record keeps its business and its type' using errcode = '42501';
    end if;
    if actor is not null and new.archived_at is distinct from old.archived_at and not is_org_admin(old.org_id) then
      raise exception 'only an owner, admin or manager can archive a record' using errcode = '42501';
    end if;
  end if;
  if new.status_key is null then
    new.status_key := rtype.default_status;
  end if;
  if new.status_key is not null and not exists (
    select 1 from jsonb_array_elements(rtype.statuses) s where s ->> 'key' = new.status_key
  ) then
    raise exception 'that status is not one this type uses' using errcode = '22023';
  end if;
  for f in select key, label from record_fields rf where rf.record_type_id = rtype.id and rf.required and rf.archived_at is null loop
    if new.values -> f.key is null or new.values -> f.key = 'null'::jsonb or new.values ->> f.key = '' then
      raise exception '% is required', f.label using errcode = '22023';
    end if;
  end loop;
  new.updated_by := coalesce(actor, new.updated_by);
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function guard_record_write() from public, anon, authenticated;

drop trigger if exists trg_guard_record_write on records;
create trigger trg_guard_record_write before insert or update on records
  for each row execute function guard_record_write();

-- --------------------------------------------------------------- events --

create or replace function events_on_record() returns trigger as $$
declare
  actor uuid := auth.uid();
  v_kind text := case when actor is null then 'system' else 'user' end;
  type_key text;
  type_name text;
  from_label text;
  to_label text;
begin
  select t.key, t.name into type_key, type_name from record_types t where t.id = new.record_type_id;
  if tg_op = 'INSERT' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'record.created', 'record', new.id, v_kind, coalesce(actor, new.created_by),
      jsonb_build_object('title', new.title, 'type_key', type_key, 'type_name', type_name, 'status', new.status_key,
                         'project_id', new.project_id, 'contact_id', new.contact_id, 'vendor_id', new.vendor_id));
    return new;
  end if;
  if new.status_key is distinct from old.status_key then
    select s ->> 'label' into from_label from record_types t, jsonb_array_elements(t.statuses) s where t.id = new.record_type_id and s ->> 'key' = old.status_key;
    select s ->> 'label' into to_label   from record_types t, jsonb_array_elements(t.statuses) s where t.id = new.record_type_id and s ->> 'key' = new.status_key;
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'record.status_changed', 'record', new.id, v_kind, actor,
      jsonb_build_object('title', new.title, 'type_key', type_key, 'type_name', type_name,
                         'from', coalesce(from_label, old.status_key), 'to', coalesce(to_label, new.status_key),
                         'from_key', old.status_key, 'to_key', new.status_key,
                         'project_id', new.project_id, 'contact_id', new.contact_id, 'vendor_id', new.vendor_id,
                         'customer_visible', new.customer_visible));
  elsif new.values is distinct from old.values or new.title is distinct from old.title
     or new.project_id is distinct from old.project_id or new.contact_id is distinct from old.contact_id
     or new.assignee_id is distinct from old.assignee_id or new.customer_visible is distinct from old.customer_visible then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'record.updated', 'record', new.id, v_kind, actor,
      jsonb_build_object('title', new.title, 'type_key', type_key, 'type_name', type_name, 'project_id', new.project_id));
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_record() from public, anon, authenticated;

drop trigger if exists trg_events_record on records;
create trigger trg_events_record after insert or update on records
  for each row execute function events_on_record();

-- ------------------------------------------------------------ functions --

-- Install a record type with its fields in one transaction (a template or a
-- hand-made one). Idempotent by key: re-running updates names and adds any
-- missing fields, never removes one.
create or replace function install_record_type(
  p_org uuid,
  p_key text,
  p_name text,
  p_name_plural text,
  p_icon text,
  p_description text,
  p_statuses jsonb,
  p_default_status text,
  p_customer_visible_default boolean,
  p_template_key text,
  p_fields jsonb
) returns uuid as $$
declare
  actor uuid := auth.uid();
  type_id uuid;
  f jsonb;
  i integer := 0;
begin
  if actor is not null and not is_org_owner_admin(p_org) then
    raise exception 'only an owner or admin can define record types' using errcode = '42501';
  end if;
  if not org_module_enabled(p_org, 'records') then
    raise exception 'records are not switched on for this business' using errcode = '42501';
  end if;
  if jsonb_typeof(p_statuses) <> 'array' or jsonb_typeof(p_fields) <> 'array' then
    raise exception 'statuses and fields are lists' using errcode = '22023';
  end if;

  insert into record_types (org_id, key, name, name_plural, icon, description, statuses, default_status, customer_visible_default, template_key, created_by)
  values (p_org, p_key, btrim(p_name), btrim(p_name_plural), p_icon, p_description, p_statuses, p_default_status, coalesce(p_customer_visible_default, false), p_template_key, actor)
  on conflict (org_id, key) do update set
    name = excluded.name, name_plural = excluded.name_plural, icon = excluded.icon, description = excluded.description,
    statuses = excluded.statuses, default_status = excluded.default_status, archived_at = null
  returning id into type_id;

  for f in select * from jsonb_array_elements(p_fields) loop
    insert into record_fields (org_id, record_type_id, key, label, field_type, options, required, position, show_in_list, customer_visible, unit)
    values (p_org, type_id, f ->> 'key', f ->> 'label', f ->> 'field_type', coalesce(f -> 'options', '{}'::jsonb),
            coalesce((f ->> 'required')::boolean, false), coalesce((f ->> 'position')::integer, i),
            coalesce((f ->> 'show_in_list')::boolean, true), coalesce((f ->> 'customer_visible')::boolean, false), f ->> 'unit')
    on conflict (record_type_id, key) do update set
      label = excluded.label, field_type = excluded.field_type, options = excluded.options, required = excluded.required,
      position = excluded.position, show_in_list = excluded.show_in_list, customer_visible = excluded.customer_visible,
      unit = excluded.unit, archived_at = null;
    i := i + 1;
  end loop;
  return type_id;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;
revoke all on function install_record_type(uuid, text, text, text, text, text, jsonb, text, boolean, text, jsonb) from public, anon;
grant execute on function install_record_type(uuid, text, text, text, text, text, jsonb, text, boolean, text, jsonb) to authenticated, service_role;

-- Change a record's status with a reason: the trigger validates, the history
-- carries the note, the caller's module and membership are checked here.
create or replace function set_record_status(p_record uuid, p_status text, p_note text default null) returns records as $$
declare
  row_out records;
begin
  update records set status_key = p_status where id = p_record returning * into row_out;
  if row_out.id is null then
    raise exception 'record not found' using errcode = 'P0002';
  end if;
  if nullif(btrim(coalesce(p_note, '')), '') is not null then
    update domain_events e set payload = e.payload || jsonb_build_object('note', left(btrim(p_note), 500))
     where e.id = (select id from domain_events d where d.entity_id = p_record and d.event_type = 'record.status_changed' order by d.occurred_at desc limit 1);
  end if;
  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;
revoke all on function set_record_status(uuid, text, text) from public, anon;
grant execute on function set_record_status(uuid, text, text) to authenticated, service_role;

-- set_record_status runs as definer, so the membership and module checks the
-- update policy would have applied are repeated by a before trigger on the
-- same path: a non-member simply cannot see the record to name it, and the
-- guard below refuses a member of another business.
create or replace function guard_record_member() returns trigger as $$
begin
  if auth.uid() is not null and not is_org_member(old.org_id) then
    raise exception 'not a member of this business' using errcode = '42501';
  end if;
  if auth.uid() is not null and not org_module_enabled(old.org_id, 'records') then
    raise exception 'records are not switched on for this business' using errcode = '42501';
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function guard_record_member() from public, anon, authenticated;

drop trigger if exists trg_guard_record_member on records;
create trigger trg_guard_record_member before update on records
  for each row execute function guard_record_member();
