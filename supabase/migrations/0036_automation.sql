-- 0036 — Automation foundation: WHEN → IF → DO.
--
-- The smallest reliable engine (spec §9). A rule names the event it listens
-- for, the conditions on that event's payload, and the actions to take.
-- Every run is a row: which rule, which event, what happened, why it
-- failed. Runs are unique per (rule, event), so a retry never repeats a
-- business action. Every action runs inside automation_apply, which stamps
-- the transaction so the events those actions cause carry the depth and the
-- actor kind; a rule never fires on an event deeper than three steps, so a
-- loop dies on its own.

create table if not exists automation_rules (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id) on delete cascade,
  name          text not null,
  trigger_event text not null,
  conditions    jsonb not null default '{"all":[]}'::jsonb,
  actions       jsonb not null default '[]'::jsonb,
  enabled       boolean not null default true,
  run_count     integer not null default 0,
  fail_count    integer not null default 0,
  last_run_at   timestamptz,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint rule_name    check (length(btrim(name)) between 1 and 120),
  constraint rule_trigger check (trigger_event ~ '^[a-z_]+\.[a-z_]+$'),
  constraint rule_conds   check (jsonb_typeof(conditions) = 'object'),
  constraint rule_actions check (jsonb_typeof(actions) = 'array' and jsonb_array_length(actions) between 0 and 10)
);
create index if not exists idx_rules_org_trigger on automation_rules(org_id, trigger_event) where enabled;

drop trigger if exists trg_rules_updated on automation_rules;
create trigger trg_rules_updated before update on automation_rules
  for each row execute function set_updated_at();

create table if not exists automation_runs (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  rule_id     uuid not null references automation_rules(id) on delete cascade,
  event_id    uuid not null references domain_events(id) on delete cascade,
  status      text not null default 'queued',
  attempts    integer not null default 0,
  error       text,
  log         jsonb not null default '[]'::jsonb,
  started_at  timestamptz,
  finished_at timestamptz,
  created_at  timestamptz not null default now(),
  constraint run_status check (status in ('queued','running','succeeded','failed','skipped')),
  unique (rule_id, event_id)
);
create index if not exists idx_runs_org_time on automation_runs(org_id, created_at desc);
create index if not exists idx_runs_retry on automation_runs(status, attempts) where status in ('queued','failed');

-- ------------------------------------------------------------------ RLS --

alter table automation_rules enable row level security;
alter table automation_runs  enable row level security;

drop policy if exists "rules read"   on automation_rules;
drop policy if exists "rules write"  on automation_rules;
drop policy if exists "rules update" on automation_rules;
drop policy if exists "rules delete" on automation_rules;
create policy "rules read"   on automation_rules for select using (is_org_admin(org_id));
create policy "rules write"  on automation_rules for insert with check (is_org_owner_admin(org_id) and org_module_enabled(org_id, 'automation') and created_by = auth.uid());
create policy "rules update" on automation_rules for update using (is_org_owner_admin(org_id)) with check (is_org_owner_admin(org_id));
create policy "rules delete" on automation_rules for delete using (is_org_owner_admin(org_id));

drop policy if exists "runs read" on automation_runs;
create policy "runs read" on automation_runs for select using (is_org_admin(org_id));
-- Runs are written by the engine (service role) only.

-- ------------------------------------------------- event stamping --------

-- Events caused inside an automation carry its depth and kind. The engine
-- sets the two settings for the transaction; nothing exposed to clients can.
create or replace function stamp_domain_event() returns trigger as $$
declare
  depth_setting text := current_setting('waakya.event_depth', true);
begin
  if coalesce(current_setting('waakya.automation', true), '') = 'on' then
    new.actor_kind := 'automation';
    new.depth := greatest(new.depth, coalesce(nullif(depth_setting, '')::integer, 1));
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function stamp_domain_event() from public, anon, authenticated;

drop trigger if exists trg_stamp_domain_event on domain_events;
create trigger trg_stamp_domain_event before insert on domain_events
  for each row execute function stamp_domain_event();

-- ----------------------------------------------------- automation_apply --

-- One action, one transaction. Called by the engine with the service role;
-- refused to everyone else. Returns what it did so the run log can say.
create or replace function automation_apply(p_org uuid, p_run uuid, p_depth integer, p_action jsonb, p_event jsonb) returns jsonb as $$
declare
  kind text := p_action ->> 'type';
  payload jsonb := coalesce(p_event -> 'payload', '{}'::jsonb);
  entity uuid := nullif(p_event ->> 'entity_id', '')::uuid;
  target uuid;
  new_id uuid;
  v_title text;
  v_body text;
  v_contact uuid;
  v_project uuid;
  v_assignee uuid;
  v_due timestamptz;
  v_stage uuid;
  v_opp uuid;
begin
  if auth.uid() is not null then
    raise exception 'automation runs as the system' using errcode = '42501';
  end if;
  perform set_config('waakya.automation', 'on', true);
  perform set_config('waakya.event_depth', coalesce(p_depth, 1)::text, true);
  perform set_config('waakya.system_write', 'on', true);

  v_contact := coalesce(nullif(p_action ->> 'contact_id', '')::uuid, nullif(payload ->> 'contact_id', '')::uuid,
                        case when p_event ->> 'entity_type' = 'contact' then entity end);
  v_project := coalesce(nullif(p_action ->> 'project_id', '')::uuid, nullif(payload ->> 'project_id', '')::uuid,
                        case when p_event ->> 'entity_type' = 'project' then entity end);

  if kind = 'assign_contact' then
    target := nullif(p_action ->> 'member_id', '')::uuid;
    if v_contact is null then return jsonb_build_object('skipped', 'no contact'); end if;
    if target is null then
      -- Round-robin: the member with the fewest open leads.
      select m.user_id into target from memberships m
        left join crm_contacts c on c.owner_id = m.user_id and c.org_id = p_org and c.kind = 'lead' and c.archived_at is null
       where m.org_id = p_org and m.role in ('owner','admin','manager','member')
       group by m.user_id order by count(c.id) asc, m.user_id limit 1;
    end if;
    if not exists (select 1 from memberships m where m.org_id = p_org and m.user_id = target) then
      return jsonb_build_object('skipped', 'member not in business');
    end if;
    update crm_contacts set owner_id = target where id = v_contact and org_id = p_org and owner_id is null;
    if not found then return jsonb_build_object('skipped', 'already owned'); end if;
    return jsonb_build_object('assigned_to', target);

  elsif kind = 'create_task' then
    v_assignee := coalesce(nullif(p_action ->> 'assignee_id', '')::uuid, (select c.owner_id from crm_contacts c where c.id = v_contact));
    if v_assignee is null or not exists (select 1 from memberships m where m.org_id = p_org and m.user_id = v_assignee) then
      return jsonb_build_object('skipped', 'no assignee in business');
    end if;
    v_title := left(coalesce(nullif(p_action ->> 'title', ''), 'Follow up'), 140);
    v_title := replace(replace(v_title, '{{title}}', coalesce(payload ->> 'title', '')), '{{project}}', coalesce(payload ->> 'project_name', ''));
    v_due := now() + make_interval(mins => coalesce((p_action ->> 'due_in_minutes')::integer, 24 * 60));
    insert into tasks (org_id, title, details, created_by, assigned_to, state, priority, due_at, delivered_at,
                       origin_kind, origin_id, origin_label, contact_id, project_id, record_id)
    values (p_org, v_title, nullif(p_action ->> 'details', ''),
            coalesce((select o.created_by from orgs o where o.id = p_org), v_assignee), v_assignee, 'delivered',
            coalesce(nullif(p_action ->> 'priority', ''), 'normal')::task_priority, v_due, now(),
            'automation', (select r.id from automation_runs r where r.id = p_run), (select ru.name from automation_rules ru join automation_runs r on r.rule_id = ru.id where r.id = p_run),
            v_contact, v_project, case when p_event ->> 'entity_type' = 'record' then entity end)
    returning id into new_id;
    insert into task_events (task_id, org_id, from_state, to_state, actor_id, note) values
      (new_id, p_org, null, 'created', null, 'automation'), (new_id, p_org, 'created', 'delivered', null, 'automation');
    perform push_user_notification(p_org, v_assignee, 'task_assigned', v_title, new_id, '/kaam/' || new_id, new_id || ':task_assigned');
    return jsonb_build_object('task_id', new_id);

  elsif kind = 'notify_member' then
    target := nullif(p_action ->> 'member_id', '')::uuid;
    if target is null and p_action ->> 'role' is not null then
      for target in select m.user_id from memberships m where m.org_id = p_org and m.role::text = p_action ->> 'role' loop
        perform push_user_notification(p_org, target, 'automation_failed', left(coalesce(p_action ->> 'body', payload ->> 'title', ''), 280), null, nullif(p_action ->> 'href', ''), 'auto:' || p_run || ':' || target);
      end loop;
      return jsonb_build_object('notified_role', p_action ->> 'role');
    end if;
    if target is null then return jsonb_build_object('skipped', 'no member'); end if;
    v_body := replace(replace(left(coalesce(p_action ->> 'body', payload ->> 'title', ''), 280), '{{title}}', coalesce(payload ->> 'title', '')), '{{project}}', coalesce(payload ->> 'project_name', ''));
    perform push_user_notification(p_org, target, coalesce(nullif(p_action ->> 'event', ''), 'lead_followup'), v_body, null, nullif(p_action ->> 'href', ''), 'auto:' || p_run || ':' || target);
    return jsonb_build_object('notified', target);

  elsif kind = 'move_opportunity' then
    v_stage := nullif(p_action ->> 'stage_id', '')::uuid;
    v_opp := coalesce(nullif(payload ->> 'opportunity_id', '')::uuid, (select o.id from crm_opportunities o where o.contact_id = v_contact and o.status = 'open' order by o.created_at desc limit 1));
    if v_opp is null or v_stage is null then return jsonb_build_object('skipped', 'no deal or stage'); end if;
    update crm_opportunities set stage_id = v_stage where id = v_opp and org_id = p_org and stage_id <> v_stage;
    return jsonb_build_object('opportunity_id', v_opp, 'moved', found);

  elsif kind = 'set_record_status' then
    target := coalesce(nullif(p_action ->> 'record_id', '')::uuid, nullif(payload ->> 'record_id', '')::uuid, case when p_event ->> 'entity_type' = 'record' then entity end);
    if target is null then return jsonb_build_object('skipped', 'no record'); end if;
    update records set status_key = p_action ->> 'status' where id = target and org_id = p_org and status_key is distinct from (p_action ->> 'status');
    return jsonb_build_object('record_id', target, 'moved', found);

  elsif kind = 'publish_customer_update' then
    if v_project is null then return jsonb_build_object('skipped', 'no project'); end if;
    v_body := replace(replace(left(coalesce(p_action ->> 'body', payload ->> 'title', ''), 2000), '{{title}}', coalesce(payload ->> 'title', '')), '{{project}}', coalesce(payload ->> 'project_name', ''));
    insert into project_updates (org_id, project_id, kind, body, customer_visible, actor_kind, created_by)
    values (p_org, v_project, 'automation', v_body, coalesce((p_action ->> 'customer_visible')::boolean, true), 'automation', null)
    returning id into new_id;
    return jsonb_build_object('update_id', new_id);

  elsif kind = 'request_verification' then
    -- A task for a manager to look at what just happened.
    select m.user_id into v_assignee from memberships m where m.org_id = p_org and m.role in ('owner','admin','manager') order by array_position(array['owner','admin','manager'], m.role::text), m.created_at limit 1;
    if v_assignee is null then return jsonb_build_object('skipped', 'no manager'); end if;
    v_title := left(coalesce(nullif(p_action ->> 'title', ''), 'Verify: ' || coalesce(payload ->> 'title', '')), 140);
    insert into tasks (org_id, title, created_by, assigned_to, state, priority, due_at, delivered_at, origin_kind, origin_id, origin_label, project_id)
    values (p_org, v_title, coalesce((select o.created_by from orgs o where o.id = p_org), v_assignee), v_assignee, 'delivered', 'high', now() + interval '4 hours', now(),
            'automation', p_run, (select ru.name from automation_rules ru join automation_runs r on r.rule_id = ru.id where r.id = p_run), v_project)
    returning id into new_id;
    insert into task_events (task_id, org_id, from_state, to_state, actor_id, note) values
      (new_id, p_org, null, 'created', null, 'automation'), (new_id, p_org, 'created', 'delivered', null, 'automation');
    perform push_user_notification(p_org, v_assignee, 'task_assigned', v_title, new_id, '/kaam/' || new_id, new_id || ':task_assigned');
    return jsonb_build_object('task_id', new_id);

  elsif kind in ('send_email', 'send_whatsapp_template') then
    -- Delivered by the application's messaging adapters after this returns;
    -- the database only records that the action was reached.
    return jsonb_build_object('deferred', kind);
  else
    raise exception 'unknown action %', kind using errcode = '22023';
  end if;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;
revoke all on function automation_apply(uuid, uuid, integer, jsonb, jsonb) from public, anon, authenticated;
grant execute on function automation_apply(uuid, uuid, integer, jsonb, jsonb) to service_role;

-- A failed run tells the owner once; the run row keeps the detail.
create or replace function notify_automation_failure(p_run uuid) returns void as $$
declare
  r automation_runs;
  rule_name text;
  target uuid;
begin
  select * into r from automation_runs where id = p_run;
  select name into rule_name from automation_rules where id = r.rule_id;
  for target in select m.user_id from memberships m where m.org_id = r.org_id and m.role in ('owner','admin') loop
    perform push_notification(r.org_id, target, 'automation_failed', coalesce(rule_name, 'Automation') || ' · ' || left(coalesce(r.error, ''), 160), '/automations/' || r.rule_id, 'autofail:' || r.rule_id);
  end loop;
  insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, payload, depth)
  values (r.org_id, 'automation.run_failed', 'automation_run', r.id, 'system', jsonb_build_object('title', rule_name, 'error', left(coalesce(r.error, ''), 500), 'rule_id', r.rule_id), 10);
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;
revoke all on function notify_automation_failure(uuid) from public, anon, authenticated;
grant execute on function notify_automation_failure(uuid) to service_role;

-- ------------------------------------------------ message templates ------
-- Approved wording for messages to people outside the business. Used by
-- automation (send_whatsapp_template) now and by campaigns (0038). WhatsApp
-- business-initiated messages must be provider-approved templates, so a
-- template carries the provider's name for it and an approval status.

create table if not exists message_templates (
  id                     uuid primary key default gen_random_uuid(),
  org_id                 uuid not null references orgs(id) on delete cascade,
  channel                text not null,
  name                   text not null,
  subject                text,
  body                   text not null,
  provider_template_name text,
  provider_language      text not null default 'en',
  status                 text not null default 'draft',
  created_by             uuid references auth.users(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint template_channel check (channel in ('email','whatsapp')),
  constraint template_name    check (length(btrim(name)) between 1 and 80),
  constraint template_body    check (length(btrim(body)) between 1 and 4000),
  constraint template_status  check (status in ('draft','approved','rejected')),
  unique (org_id, channel, name)
);
create index if not exists idx_templates_org on message_templates(org_id, channel, status);

drop trigger if exists trg_templates_updated on message_templates;
create trigger trg_templates_updated before update on message_templates
  for each row execute function set_updated_at();

alter table message_templates enable row level security;
drop policy if exists "templates read"   on message_templates;
drop policy if exists "templates write"  on message_templates;
drop policy if exists "templates update" on message_templates;
drop policy if exists "templates delete" on message_templates;
create policy "templates read"   on message_templates for select using (is_org_member(org_id));
create policy "templates write"  on message_templates for insert with check (is_org_admin(org_id) and created_by = auth.uid());
create policy "templates update" on message_templates for update using (is_org_admin(org_id)) with check (is_org_admin(org_id));
create policy "templates delete" on message_templates for delete using (is_org_owner_admin(org_id));
