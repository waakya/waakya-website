-- 0031 — CRM: contacts, pipelines, opportunities, activities.
--
-- A focused SME CRM (spec §4). It answers: who is this, where did they come
-- from, who owns them, what happened, what happens next, what are they
-- interested in, what project or record relates to them.
--
-- Rules that live in the database, so the API cannot skip them:
--   * a contact belongs to one business; phone and email are unique inside it
--   * only managers assign or reassign an owner
--   * an opportunity moves only between stages of its own pipeline; a won or
--     lost stage closes it and stamps closed_at
--   * every write records a history line (domain_events) by trigger

-- ------------------------------------------------------------- pipelines --

create table if not exists crm_pipelines (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references orgs(id) on delete cascade,
  name       text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  constraint crm_pipeline_name check (length(btrim(name)) between 2 and 60),
  unique (org_id, name)
);
create unique index if not exists idx_crm_pipelines_default on crm_pipelines(org_id) where is_default;

create table if not exists crm_pipeline_stages (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  pipeline_id uuid not null references crm_pipelines(id) on delete cascade,
  key         text not null,
  name        text not null,
  position    integer not null default 0,
  kind        text not null default 'open',
  created_at  timestamptz not null default now(),
  constraint crm_stage_key  check (key ~ '^[a-z0-9_]{2,40}$'),
  constraint crm_stage_name check (length(btrim(name)) between 1 and 40),
  constraint crm_stage_kind check (kind in ('open','won','lost')),
  unique (pipeline_id, key)
);
create index if not exists idx_crm_stages_pipeline on crm_pipeline_stages(pipeline_id, position);

-- -------------------------------------------------------------- contacts --

create table if not exists crm_contacts (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references orgs(id) on delete cascade,
  kind             text not null default 'lead',
  full_name        text not null,
  phone_e164       text,
  email            text,
  company_name     text,
  source           text,
  tags             text[] not null default '{}',
  owner_id         uuid references auth.users(id) on delete set null,
  project_id       uuid references projects(id) on delete set null,
  notes            text,
  email_opt_out    boolean not null default false,
  whatsapp_opt_out boolean not null default false,
  last_activity_at timestamptz,
  next_action_at   timestamptz,
  next_action_note text,
  external_ref     text,
  metadata         jsonb not null default '{}'::jsonb,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  archived_at      timestamptz,
  constraint crm_contact_kind  check (kind in ('lead','customer')),
  constraint crm_contact_name  check (length(btrim(full_name)) between 1 and 120),
  constraint crm_contact_phone check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  constraint crm_contact_email check (email is null or (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  constraint crm_contact_tags  check (array_length(tags, 1) is null or array_length(tags, 1) <= 30),
  constraint crm_contact_meta  check (jsonb_typeof(metadata) = 'object'),
  constraint crm_contact_reach check (phone_e164 is not null or email is not null)
);
create unique index if not exists idx_crm_contacts_phone on crm_contacts(org_id, phone_e164) where phone_e164 is not null and archived_at is null;
create unique index if not exists idx_crm_contacts_email on crm_contacts(org_id, email) where email is not null and archived_at is null;
create index if not exists idx_crm_contacts_org_kind   on crm_contacts(org_id, kind, archived_at, updated_at desc);
create index if not exists idx_crm_contacts_owner      on crm_contacts(org_id, owner_id) where archived_at is null;
create index if not exists idx_crm_contacts_next       on crm_contacts(org_id, next_action_at) where archived_at is null and next_action_at is not null;
create index if not exists idx_crm_contacts_project    on crm_contacts(project_id) where project_id is not null;
create index if not exists idx_crm_contacts_name       on crm_contacts(org_id, lower(full_name));
create index if not exists idx_crm_contacts_tags       on crm_contacts using gin(tags);

drop trigger if exists trg_crm_contacts_updated on crm_contacts;
create trigger trg_crm_contacts_updated before update on crm_contacts
  for each row execute function set_updated_at();

-- --------------------------------------------------------- opportunities --

create table if not exists crm_opportunities (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references orgs(id) on delete cascade,
  contact_id     uuid not null references crm_contacts(id) on delete cascade,
  pipeline_id    uuid not null references crm_pipelines(id) on delete restrict,
  stage_id       uuid not null references crm_pipeline_stages(id) on delete restrict,
  title          text not null,
  value          numeric(14,2),
  owner_id       uuid references auth.users(id) on delete set null,
  project_id     uuid references projects(id) on delete set null,
  record_id      uuid,
  status         text not null default 'open',
  expected_close date,
  closed_at      timestamptz,
  source         text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint crm_opp_title  check (length(btrim(title)) between 1 and 140),
  constraint crm_opp_status check (status in ('open','won','lost')),
  constraint crm_opp_value  check (value is null or value >= 0)
);
create index if not exists idx_crm_opps_contact  on crm_opportunities(contact_id, status);
create index if not exists idx_crm_opps_stage    on crm_opportunities(org_id, stage_id) where status = 'open';
create index if not exists idx_crm_opps_owner    on crm_opportunities(org_id, owner_id) where status = 'open';
create index if not exists idx_crm_opps_project  on crm_opportunities(project_id) where project_id is not null;
create index if not exists idx_crm_opps_record   on crm_opportunities(record_id) where record_id is not null;

drop trigger if exists trg_crm_opps_updated on crm_opportunities;
create trigger trg_crm_opps_updated before update on crm_opportunities
  for each row execute function set_updated_at();

-- ------------------------------------------------------------ activities --

create table if not exists crm_activities (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references orgs(id) on delete cascade,
  contact_id     uuid not null references crm_contacts(id) on delete cascade,
  opportunity_id uuid references crm_opportunities(id) on delete set null,
  kind           text not null,
  body           text,
  actor_kind     text not null default 'user',
  actor_id       uuid,
  task_id        uuid references tasks(id) on delete set null,
  campaign_id    uuid,
  metadata       jsonb not null default '{}'::jsonb,
  occurred_at    timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  constraint crm_activity_kind  check (kind in ('note','call','meeting','message','email','whatsapp','stage_change','task','campaign','website','decision','assignment','created','converted')),
  constraint crm_activity_actor check (actor_kind in ('user','customer','system','automation','integration')),
  constraint crm_activity_body  check (body is null or length(body) <= 4000),
  constraint crm_activity_meta  check (jsonb_typeof(metadata) = 'object')
);
create index if not exists idx_crm_activities_contact on crm_activities(contact_id, occurred_at desc);
create index if not exists idx_crm_activities_org     on crm_activities(org_id, occurred_at desc);
create index if not exists idx_crm_activities_task    on crm_activities(task_id) where task_id is not null;

-- ------------------------------------------------------- tasks ↔ CRM --

alter table tasks add column if not exists contact_id     uuid references crm_contacts(id) on delete set null;
alter table tasks add column if not exists opportunity_id uuid references crm_opportunities(id) on delete set null;
create index if not exists idx_tasks_contact on tasks(contact_id) where contact_id is not null;
create index if not exists idx_tasks_opportunity on tasks(opportunity_id) where opportunity_id is not null;

-- ------------------------------------------------------------------ RLS --

alter table crm_pipelines       enable row level security;
alter table crm_pipeline_stages enable row level security;
alter table crm_contacts        enable row level security;
alter table crm_opportunities   enable row level security;
alter table crm_activities      enable row level security;

drop policy if exists "crm pipelines read"   on crm_pipelines;
drop policy if exists "crm pipelines write"  on crm_pipelines;
drop policy if exists "crm pipelines update" on crm_pipelines;
drop policy if exists "crm pipelines delete" on crm_pipelines;
create policy "crm pipelines read"   on crm_pipelines for select using (is_org_member(org_id));
create policy "crm pipelines write"  on crm_pipelines for insert with check (is_org_owner_admin(org_id) and org_module_enabled(org_id, 'crm'));
create policy "crm pipelines update" on crm_pipelines for update using (is_org_owner_admin(org_id)) with check (is_org_owner_admin(org_id));
create policy "crm pipelines delete" on crm_pipelines for delete using (is_org_owner_admin(org_id) and not is_default);

drop policy if exists "crm stages read"   on crm_pipeline_stages;
drop policy if exists "crm stages write"  on crm_pipeline_stages;
drop policy if exists "crm stages update" on crm_pipeline_stages;
drop policy if exists "crm stages delete" on crm_pipeline_stages;
create policy "crm stages read"   on crm_pipeline_stages for select using (is_org_member(org_id));
create policy "crm stages write"  on crm_pipeline_stages for insert with check (
  is_org_owner_admin(org_id) and org_module_enabled(org_id, 'crm')
  and exists (select 1 from crm_pipelines p where p.id = pipeline_id and p.org_id = crm_pipeline_stages.org_id)
);
create policy "crm stages update" on crm_pipeline_stages for update using (is_org_owner_admin(org_id)) with check (is_org_owner_admin(org_id));
create policy "crm stages delete" on crm_pipeline_stages for delete using (
  is_org_owner_admin(org_id)
  and not exists (select 1 from crm_opportunities o where o.stage_id = crm_pipeline_stages.id)
);

drop policy if exists "crm contacts read"   on crm_contacts;
drop policy if exists "crm contacts write"  on crm_contacts;
drop policy if exists "crm contacts update" on crm_contacts;
create policy "crm contacts read"   on crm_contacts for select using (is_org_member(org_id));
create policy "crm contacts write"  on crm_contacts for insert with check (
  is_org_member(org_id) and org_module_enabled(org_id, 'crm') and created_by = auth.uid()
  and (owner_id is null or is_org_admin(org_id) or owner_id = auth.uid())
  and (project_id is null or exists (select 1 from projects p where p.id = project_id and p.org_id = crm_contacts.org_id))
);
create policy "crm contacts update" on crm_contacts for update
  using (is_org_member(org_id) and org_module_enabled(org_id, 'crm'))
  with check (
    is_org_member(org_id)
    and (project_id is null or exists (select 1 from projects p where p.id = project_id and p.org_id = crm_contacts.org_id))
  );
-- No delete: contacts are archived, never removed, so history keeps its names.

drop policy if exists "crm opps read"   on crm_opportunities;
drop policy if exists "crm opps write"  on crm_opportunities;
drop policy if exists "crm opps update" on crm_opportunities;
create policy "crm opps read"   on crm_opportunities for select using (is_org_member(org_id));
create policy "crm opps write"  on crm_opportunities for insert with check (
  is_org_member(org_id) and org_module_enabled(org_id, 'crm') and created_by = auth.uid()
  and exists (select 1 from crm_contacts c where c.id = contact_id and c.org_id = crm_opportunities.org_id)
  and exists (select 1 from crm_pipeline_stages s where s.id = stage_id and s.pipeline_id = crm_opportunities.pipeline_id and s.org_id = crm_opportunities.org_id)
  and (project_id is null or exists (select 1 from projects p where p.id = project_id and p.org_id = crm_opportunities.org_id))
);
create policy "crm opps update" on crm_opportunities for update
  using (is_org_member(org_id) and org_module_enabled(org_id, 'crm'))
  with check (
    is_org_member(org_id)
    and (project_id is null or exists (select 1 from projects p where p.id = project_id and p.org_id = crm_opportunities.org_id))
  );

drop policy if exists "crm activities read"  on crm_activities;
drop policy if exists "crm activities write" on crm_activities;
create policy "crm activities read"  on crm_activities for select using (is_org_member(org_id));
create policy "crm activities write" on crm_activities for insert with check (
  is_org_member(org_id) and org_module_enabled(org_id, 'crm')
  and actor_kind = 'user' and actor_id = auth.uid()
  and exists (select 1 from crm_contacts c where c.id = contact_id and c.org_id = crm_activities.org_id)
  and (task_id is null or exists (select 1 from tasks t where t.id = task_id and t.org_id = crm_activities.org_id))
);
-- Activities are a record: no update, no delete.

-- --------------------------------------------------------------- guards --

-- Who may change what on a contact: ownership is a manager's call; the
-- business a contact belongs to never changes.
create or replace function guard_crm_contact_update() returns trigger as $$
declare
  actor uuid := auth.uid();
begin
  if new.org_id is distinct from old.org_id then
    raise exception 'a contact cannot move between businesses' using errcode = '42501';
  end if;
  if actor is not null then
    if new.owner_id is distinct from old.owner_id and not is_org_admin(old.org_id) and not (old.owner_id is null and new.owner_id = actor) then
      raise exception 'only an owner, admin or manager can assign a customer' using errcode = '42501';
    end if;
    if new.owner_id is not null and new.owner_id is distinct from old.owner_id
       and not exists (select 1 from memberships m where m.org_id = old.org_id and m.user_id = new.owner_id) then
      raise exception 'the owner must be a member of this business' using errcode = '22023';
    end if;
    if new.archived_at is distinct from old.archived_at and not is_org_admin(old.org_id) then
      raise exception 'only an owner, admin or manager can archive a customer' using errcode = '42501';
    end if;
  end if;
  if new.kind = 'lead' and old.kind = 'customer' and actor is not null and not is_org_admin(old.org_id) then
    raise exception 'a customer stays a customer' using errcode = '22023';
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function guard_crm_contact_update() from public, anon, authenticated;

drop trigger if exists trg_guard_crm_contact_update on crm_contacts;
create trigger trg_guard_crm_contact_update before update on crm_contacts
  for each row execute function guard_crm_contact_update();

-- Stage moves stay inside the pipeline; won and lost close the deal.
create or replace function guard_crm_opportunity_update() returns trigger as $$
declare
  actor uuid := auth.uid();
  stage crm_pipeline_stages;
begin
  if new.org_id is distinct from old.org_id or new.contact_id is distinct from old.contact_id then
    raise exception 'an opportunity stays with its customer and business' using errcode = '42501';
  end if;
  if new.pipeline_id is distinct from old.pipeline_id then
    raise exception 'an opportunity stays in its pipeline' using errcode = '22023';
  end if;
  if old.status <> 'open' and (new.stage_id is distinct from old.stage_id or new.status is distinct from old.status) and actor is not null and not is_org_admin(old.org_id) then
    raise exception 'this deal is closed' using errcode = '22023';
  end if;
  if actor is not null and new.owner_id is distinct from old.owner_id and not is_org_admin(old.org_id) and not (old.owner_id is null and new.owner_id = actor) then
    raise exception 'only an owner, admin or manager can assign a deal' using errcode = '42501';
  end if;

  if new.stage_id is distinct from old.stage_id then
    select * into stage from crm_pipeline_stages s where s.id = new.stage_id;
    if stage.id is null or stage.pipeline_id <> old.pipeline_id then
      raise exception 'that stage is not in this pipeline' using errcode = '22023';
    end if;
    new.status := case stage.kind when 'won' then 'won' when 'lost' then 'lost' else 'open' end;
    new.closed_at := case when stage.kind in ('won','lost') then now() else null end;
  elsif new.status is distinct from old.status and actor is not null then
    raise exception 'move the stage to close a deal' using errcode = '22023';
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function guard_crm_opportunity_update() from public, anon, authenticated;

drop trigger if exists trg_guard_crm_opportunity_update on crm_opportunities;
create trigger trg_guard_crm_opportunity_update before update on crm_opportunities
  for each row execute function guard_crm_opportunity_update();

-- --------------------------------------------------------------- events --

create or replace function events_on_crm_contact() returns trigger as $$
declare
  actor uuid := auth.uid();
  kind text := case when actor is null then 'system' else 'user' end;
begin
  if tg_op = 'INSERT' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, case when new.kind = 'lead' then 'lead.created' else 'contact.updated' end, 'contact', new.id, kind, coalesce(actor, new.created_by),
      jsonb_build_object('title', new.full_name, 'source', new.source, 'owner_id', new.owner_id, 'kind', new.kind, 'phone', new.phone_e164, 'email', new.email, 'project_id', new.project_id, 'tags', to_jsonb(new.tags)));
    insert into crm_activities (org_id, contact_id, kind, body, actor_kind, actor_id)
    values (new.org_id, new.id, 'created', new.source, kind, coalesce(actor, new.created_by));
    return new;
  end if;
  if new.owner_id is distinct from old.owner_id then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'contact.assigned', 'contact', new.id, kind, actor,
      jsonb_build_object('title', new.full_name, 'from', old.owner_id, 'owner_id', new.owner_id, 'kind', new.kind));
    insert into crm_activities (org_id, contact_id, kind, actor_kind, actor_id, metadata)
    values (new.org_id, new.id, 'assignment', kind, actor, jsonb_build_object('from', old.owner_id, 'to', new.owner_id));
    if new.owner_id is not null and new.owner_id is distinct from actor then
      perform push_notification(new.org_id, new.owner_id, 'lead_assigned',
        coalesce(display_name(actor), 'Someone') || ' → ' || new.full_name,
        '/crm/' || new.id, 'crm-assign:' || new.id || ':' || new.owner_id);
    end if;
  end if;
  if new.kind = 'customer' and old.kind = 'lead' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'contact.converted', 'contact', new.id, kind, actor, jsonb_build_object('title', new.full_name, 'owner_id', new.owner_id));
    insert into crm_activities (org_id, contact_id, kind, actor_kind, actor_id)
    values (new.org_id, new.id, 'converted', kind, actor);
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_crm_contact() from public, anon, authenticated;

drop trigger if exists trg_events_crm_contact on crm_contacts;
create trigger trg_events_crm_contact after insert or update on crm_contacts
  for each row execute function events_on_crm_contact();

create or replace function events_on_crm_opportunity() returns trigger as $$
declare
  actor uuid := auth.uid();
  kind text := case when actor is null then 'system' else 'user' end;
  from_stage text;
  to_stage text;
  contact_name text;
begin
  select c.full_name into contact_name from crm_contacts c where c.id = new.contact_id;
  if tg_op = 'INSERT' then
    select s.name into to_stage from crm_pipeline_stages s where s.id = new.stage_id;
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'opportunity.created', 'opportunity', new.id, kind, coalesce(actor, new.created_by),
      jsonb_build_object('title', new.title, 'contact_id', new.contact_id, 'contact_name', contact_name, 'stage', to_stage, 'value', new.value, 'owner_id', new.owner_id));
    update crm_contacts set last_activity_at = now() where id = new.contact_id;
    return new;
  end if;
  if new.stage_id is distinct from old.stage_id then
    select s.name into from_stage from crm_pipeline_stages s where s.id = old.stage_id;
    select s.name into to_stage   from crm_pipeline_stages s where s.id = new.stage_id;
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'opportunity.stage_changed', 'opportunity', new.id, kind, actor,
      jsonb_build_object('title', new.title, 'contact_id', new.contact_id, 'contact_name', contact_name,
                         'from_stage', from_stage, 'to_stage', to_stage, 'status', new.status, 'value', new.value, 'owner_id', new.owner_id));
    insert into crm_activities (org_id, contact_id, opportunity_id, kind, body, actor_kind, actor_id, metadata)
    values (new.org_id, new.contact_id, new.id, 'stage_change', from_stage || ' → ' || to_stage, kind, actor,
      jsonb_build_object('from', from_stage, 'to', to_stage, 'status', new.status));
    update crm_contacts set last_activity_at = now(),
      kind = case when new.status = 'won' then 'customer' else kind end
     where id = new.contact_id;
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_crm_opportunity() from public, anon, authenticated;

drop trigger if exists trg_events_crm_opportunity on crm_opportunities;
create trigger trg_events_crm_opportunity after insert or update on crm_opportunities
  for each row execute function events_on_crm_opportunity();

create or replace function touch_contact_on_activity() returns trigger as $$
begin
  update crm_contacts set last_activity_at = greatest(coalesce(last_activity_at, new.occurred_at), new.occurred_at)
   where id = new.contact_id;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function touch_contact_on_activity() from public, anon, authenticated;

drop trigger if exists trg_touch_contact_on_activity on crm_activities;
create trigger trg_touch_contact_on_activity after insert on crm_activities
  for each row execute function touch_contact_on_activity();

-- ------------------------------------------------------------ functions --

-- The pipeline every business starts with. Idempotent.
create or replace function crm_install_default_pipeline(p_org uuid) returns uuid as $$
declare
  actor uuid := auth.uid();
  pipeline uuid;
begin
  if actor is not null and not is_org_member(p_org) then
    raise exception 'not a member of this business' using errcode = '42501';
  end if;
  select id into pipeline from crm_pipelines where org_id = p_org and is_default;
  if pipeline is not null then return pipeline; end if;

  insert into crm_pipelines (org_id, name, is_default) values (p_org, 'Sales', true)
  on conflict (org_id, name) do update set is_default = true
  returning id into pipeline;

  insert into crm_pipeline_stages (org_id, pipeline_id, key, name, position, kind) values
    (p_org, pipeline, 'new',        'New',                 0, 'open'),
    (p_org, pipeline, 'contacted',  'Contacted',           1, 'open'),
    (p_org, pipeline, 'interested', 'Interested',          2, 'open'),
    (p_org, pipeline, 'meeting',    'Meeting / Site visit', 3, 'open'),
    (p_org, pipeline, 'proposal',   'Proposal',            4, 'open'),
    (p_org, pipeline, 'won',        'Won',                 5, 'won'),
    (p_org, pipeline, 'lost',       'Lost',                6, 'lost')
  on conflict (pipeline_id, key) do nothing;
  return pipeline;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;
revoke all on function crm_install_default_pipeline(uuid) from public, anon;
grant execute on function crm_install_default_pipeline(uuid) to authenticated, service_role;

-- One door for every new enquiry: the form, the website, a campaign reply.
-- Finds the person by phone, then email, then creates them; opens an
-- opportunity in the default pipeline's first stage when none is open; writes
-- the activity. Returns the ids and whether the person already existed.
create or replace function crm_upsert_lead(
  p_org uuid,
  p_full_name text,
  p_phone text default null,
  p_email text default null,
  p_source text default null,
  p_message text default null,
  p_interest text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_actor_kind text default 'user',
  p_owner uuid default null,
  p_idempotency text default null
) returns table (contact_id uuid, opportunity_id uuid, deduplicated boolean) as $$
declare
  actor uuid := auth.uid();
  kind text := case when actor is null then coalesce(p_actor_kind, 'integration') else 'user' end;
  existing crm_contacts;
  contact uuid;
  opp uuid;
  pipeline uuid;
  first_stage uuid;
  dup boolean := false;
  phone text := nullif(btrim(coalesce(p_phone, '')), '');
  email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  name text := btrim(coalesce(p_full_name, ''));
begin
  if actor is not null and not is_org_member(p_org) then
    raise exception 'not a member of this business' using errcode = '42501';
  end if;
  if not org_module_enabled(p_org, 'crm') then
    raise exception 'the CRM is not switched on for this business' using errcode = '42501';
  end if;
  if phone is null and email is null then
    raise exception 'a phone number or an email is needed' using errcode = '22023';
  end if;
  if length(name) < 1 then
    name := coalesce(phone, email);
  end if;

  -- A retried request answers the same way it did the first time.
  if p_idempotency is not null then
    select (e.payload ->> 'contact_id')::uuid, (e.payload ->> 'opportunity_id')::uuid
      into contact, opp
      from domain_events e where e.idempotency_key = p_idempotency;
    if contact is not null then
      return query select contact, opp, true;
      return;
    end if;
  end if;

  -- Lock the business's row so two simultaneous enquiries from the same
  -- person cannot both create a contact.
  perform 1 from orgs o where o.id = p_org for update;

  if phone is not null then
    select * into existing from crm_contacts c where c.org_id = p_org and c.phone_e164 = phone and c.archived_at is null;
  end if;
  if existing.id is null and email is not null then
    select * into existing from crm_contacts c where c.org_id = p_org and c.email = email and c.archived_at is null;
  end if;

  if existing.id is not null then
    contact := existing.id;
    dup := true;
    update crm_contacts set
      email = coalesce(crm_contacts.email, email),
      phone_e164 = coalesce(crm_contacts.phone_e164, phone),
      source = coalesce(crm_contacts.source, p_source),
      metadata = crm_contacts.metadata || coalesce(p_metadata, '{}'::jsonb),
      last_activity_at = now()
     where id = contact;
  else
    insert into crm_contacts (org_id, kind, full_name, phone_e164, email, source, owner_id, metadata, created_by)
    values (p_org, 'lead', left(name, 120), phone, email, p_source, p_owner, coalesce(p_metadata, '{}'::jsonb), actor)
    returning id into contact;
  end if;

  select o.id into opp from crm_opportunities o where o.contact_id = contact and o.status = 'open' order by o.created_at desc limit 1;
  if opp is null then
    pipeline := crm_install_default_pipeline(p_org);
    select s.id into first_stage from crm_pipeline_stages s where s.pipeline_id = pipeline and s.kind = 'open' order by s.position limit 1;
    insert into crm_opportunities (org_id, contact_id, pipeline_id, stage_id, title, owner_id, source, created_by)
    values (p_org, contact, pipeline, first_stage, left(coalesce(nullif(btrim(p_interest), ''), 'Enquiry'), 140), p_owner, p_source, actor)
    returning id into opp;
  end if;

  insert into crm_activities (org_id, contact_id, opportunity_id, kind, body, actor_kind, actor_id, metadata)
  values (p_org, contact, opp, case when kind = 'integration' then 'website' else 'note' end,
          left(coalesce(p_message, p_interest, p_source, 'Enquiry'), 4000), kind, actor, coalesce(p_metadata, '{}'::jsonb));

  if kind = 'integration' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload, idempotency_key)
    values (p_org, 'integration.lead_received', 'contact', contact, 'integration', null,
      jsonb_build_object('title', name, 'source', p_source, 'contact_id', contact, 'opportunity_id', opp, 'deduplicated', dup, 'interest', p_interest),
      p_idempotency)
    on conflict (idempotency_key) where idempotency_key is not null do nothing;
  end if;

  return query select contact, opp, dup;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;
revoke all on function crm_upsert_lead(uuid, text, text, text, text, text, text, jsonb, text, uuid, text) from public, anon;
grant execute on function crm_upsert_lead(uuid, text, text, text, text, text, text, jsonb, text, uuid, text) to authenticated, service_role;

-- Move a deal: the guard trigger checks the pipeline and closes it when the
-- stage says so; this only turns a member's request into one write.
create or replace function crm_move_opportunity(p_opportunity uuid, p_stage uuid, p_note text default null) returns crm_opportunities as $$
declare
  row_out crm_opportunities;
begin
  update crm_opportunities set stage_id = p_stage where id = p_opportunity returning * into row_out;
  if row_out.id is null then
    raise exception 'deal not found' using errcode = 'P0002';
  end if;
  if nullif(btrim(coalesce(p_note, '')), '') is not null then
    insert into crm_activities (org_id, contact_id, opportunity_id, kind, body, actor_kind, actor_id)
    values (row_out.org_id, row_out.contact_id, row_out.id, 'note', left(btrim(p_note), 4000), 'user', auth.uid());
  end if;
  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;
revoke all on function crm_move_opportunity(uuid, uuid, text) from public, anon;
grant execute on function crm_move_opportunity(uuid, uuid, text) to authenticated;
