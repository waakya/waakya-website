-- 0035 — Vendors, connected to projects and work.
--
-- A vendor is not a directory entry (spec §8). A vendor assignment is one
-- piece of work on a project: what, how much, who inside the business owns
-- it, whether it is paid, whether it is done, whether the customer may see
-- it. Its life: assigned → in_progress → submitted → verified | rejected.
-- Submitting hands it to a manager; verifying tells the project, the
-- customer (if allowed) and the record it belongs to; payments derive the
-- payment status, never the other way round.

create table if not exists vendors (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  name        text not null,
  phone_e164  text,
  email       text,
  category    text,
  gstin       text,
  notes       text,
  status      text not null default 'active',
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  archived_at timestamptz,
  constraint vendor_name   check (length(btrim(name)) between 1 and 120),
  constraint vendor_status check (status in ('active','inactive')),
  constraint vendor_phone  check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  constraint vendor_email  check (email is null or email = lower(email))
);
create index if not exists idx_vendors_org on vendors(org_id, status, archived_at);
create index if not exists idx_vendors_name on vendors(org_id, lower(name));

drop trigger if exists trg_vendors_updated on vendors;
create trigger trg_vendors_updated before update on vendors
  for each row execute function set_updated_at();

create table if not exists vendor_assignments (
  id                      uuid primary key default gen_random_uuid(),
  org_id                  uuid not null references orgs(id) on delete cascade,
  vendor_id               uuid not null references vendors(id) on delete restrict,
  project_id              uuid references projects(id) on delete set null,
  record_id               uuid references records(id) on delete set null,
  task_id                 uuid references tasks(id) on delete set null,
  title                   text not null,
  details                 text,
  amount                  numeric(14,2),
  payment_status          text not null default 'unpaid',
  execution_status        text not null default 'assigned',
  due_date                date,
  started_at              timestamptz,
  submitted_at            timestamptz,
  submitted_note          text,
  verified_at             timestamptz,
  verified_by             uuid references auth.users(id) on delete set null,
  rejection_note          text,
  customer_visible        boolean not null default false,
  record_status_on_submit text,
  record_status_on_verify text,
  created_by              uuid references auth.users(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint assignment_title   check (length(btrim(title)) between 1 and 140),
  constraint assignment_amount  check (amount is null or amount >= 0),
  constraint assignment_payment check (payment_status in ('unpaid','partial','paid')),
  constraint assignment_status  check (execution_status in ('assigned','in_progress','submitted','verified','rejected'))
);
create index if not exists idx_assignments_org_status on vendor_assignments(org_id, execution_status);
create index if not exists idx_assignments_vendor     on vendor_assignments(vendor_id);
create index if not exists idx_assignments_project    on vendor_assignments(project_id) where project_id is not null;
create index if not exists idx_assignments_record     on vendor_assignments(record_id) where record_id is not null;
create index if not exists idx_assignments_task       on vendor_assignments(task_id) where task_id is not null;
create index if not exists idx_assignments_due        on vendor_assignments(org_id, due_date) where execution_status not in ('verified','rejected');

drop trigger if exists trg_assignments_updated on vendor_assignments;
create trigger trg_assignments_updated before update on vendor_assignments
  for each row execute function set_updated_at();

create table if not exists vendor_payments (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id) on delete cascade,
  assignment_id uuid not null references vendor_assignments(id) on delete cascade,
  amount        numeric(14,2) not null,
  paid_at       date not null default (now() at time zone 'Asia/Kolkata')::date,
  note          text,
  recorded_by   uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint payment_amount check (amount > 0)
);
create index if not exists idx_payments_assignment on vendor_payments(assignment_id);

-- Records and tasks can point back at the vendor doing the work.
do $$ begin
  alter table records add constraint records_vendor_fk foreign key (vendor_id) references vendors(id) on delete set null;
exception when duplicate_object then null; end $$;
alter table tasks add column if not exists vendor_assignment_id uuid references vendor_assignments(id) on delete set null;
create index if not exists idx_tasks_vendor_assignment on tasks(vendor_assignment_id) where vendor_assignment_id is not null;

-- ------------------------------------------------------------------ RLS --

alter table vendors            enable row level security;
alter table vendor_assignments enable row level security;
alter table vendor_payments    enable row level security;

drop policy if exists "vendors read"   on vendors;
drop policy if exists "vendors write"  on vendors;
drop policy if exists "vendors update" on vendors;
create policy "vendors read"   on vendors for select using (is_org_member(org_id));
create policy "vendors write"  on vendors for insert with check (is_org_admin(org_id) and org_module_enabled(org_id, 'vendors') and created_by = auth.uid());
create policy "vendors update" on vendors for update using (is_org_admin(org_id)) with check (is_org_admin(org_id));

drop policy if exists "assignments read"   on vendor_assignments;
drop policy if exists "assignments write"  on vendor_assignments;
drop policy if exists "assignments update" on vendor_assignments;
create policy "assignments read"  on vendor_assignments for select using (is_org_member(org_id));
create policy "assignments write" on vendor_assignments for insert with check (
  is_org_admin(org_id) and org_module_enabled(org_id, 'vendors') and created_by = auth.uid()
  and exists (select 1 from vendors v where v.id = vendor_id and v.org_id = vendor_assignments.org_id)
  and (project_id is null or exists (select 1 from projects p where p.id = project_id and p.org_id = vendor_assignments.org_id))
  and (record_id is null or exists (select 1 from records r where r.id = record_id and r.org_id = vendor_assignments.org_id))
  and (task_id is null or exists (select 1 from tasks t where t.id = task_id and t.org_id = vendor_assignments.org_id))
);
-- Managers change anything; the person who owns the linked task may only
-- move execution forward (the guard below decides what "forward" means).
create policy "assignments update" on vendor_assignments for update
  using (is_org_admin(org_id) or exists (select 1 from tasks t where t.id = vendor_assignments.task_id and t.assigned_to = auth.uid()))
  with check (is_org_member(org_id));

drop policy if exists "payments read"  on vendor_payments;
drop policy if exists "payments write" on vendor_payments;
create policy "payments read"  on vendor_payments for select using (is_org_admin(org_id));
create policy "payments write" on vendor_payments for insert with check (
  is_org_owner_admin(org_id) and recorded_by = auth.uid()
  and exists (select 1 from vendor_assignments a where a.id = assignment_id and a.org_id = vendor_payments.org_id)
);
-- Payments are a record: no update, no delete.

-- --------------------------------------------------------------- guards --

create or replace function guard_vendor_assignment() returns trigger as $$
declare
  actor uuid := auth.uid();
  manages boolean;
begin
  if new.org_id is distinct from old.org_id or new.vendor_id is distinct from old.vendor_id then
    raise exception 'an assignment stays with its vendor and business' using errcode = '42501';
  end if;
  if actor is null or is_system_write() then return new; end if;
  manages := is_org_admin(old.org_id);
  if not manages then
    -- The task owner may report progress, nothing else.
    if new.title is distinct from old.title or new.details is distinct from old.details or new.amount is distinct from old.amount
       or new.project_id is distinct from old.project_id or new.record_id is distinct from old.record_id
       or new.task_id is distinct from old.task_id or new.due_date is distinct from old.due_date
       or new.customer_visible is distinct from old.customer_visible or new.payment_status is distinct from old.payment_status
       or new.record_status_on_submit is distinct from old.record_status_on_submit or new.record_status_on_verify is distinct from old.record_status_on_verify then
      raise exception 'only an owner, admin or manager can change that' using errcode = '42501';
    end if;
    if new.execution_status is distinct from old.execution_status
       and not (old.execution_status in ('assigned','in_progress','rejected') and new.execution_status in ('in_progress','submitted')) then
      raise exception 'that step is not yours to take' using errcode = '42501';
    end if;
  end if;
  if new.execution_status is distinct from old.execution_status then
    if old.execution_status = 'verified' then
      raise exception 'verified work is a record' using errcode = '22023';
    end if;
    if new.execution_status = 'verified' and old.execution_status <> 'submitted' then
      raise exception 'work is verified after it is submitted' using errcode = '22023';
    end if;
    if new.execution_status = 'in_progress' then new.started_at := coalesce(new.started_at, now()); end if;
    if new.execution_status = 'submitted' then new.submitted_at := now(); end if;
    if new.execution_status = 'verified' then new.verified_at := now(); new.verified_by := actor; end if;
  end if;
  -- Payment status is derived; nobody types it.
  new.payment_status := old.payment_status;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function guard_vendor_assignment() from public, anon, authenticated;

drop trigger if exists trg_guard_vendor_assignment on vendor_assignments;
create trigger trg_guard_vendor_assignment before update on vendor_assignments
  for each row execute function guard_vendor_assignment();

create or replace function derive_payment_status() returns trigger as $$
declare
  paid numeric;
  total numeric;
begin
  select coalesce(sum(p.amount), 0) into paid from vendor_payments p where p.assignment_id = new.assignment_id;
  select a.amount into total from vendor_assignments a where a.id = new.assignment_id;
  perform set_config('waakya.system_write', 'on', true);
  update vendor_assignments a set payment_status = case
      when paid <= 0 then 'unpaid'
      when total is not null and paid >= total then 'paid'
      else 'partial' end
   where a.id = new.assignment_id;
  -- The update trigger keeps payment_status; write it directly once more.
  update vendor_assignments a set payment_status = case
      when paid <= 0 then 'unpaid'
      when total is not null and paid >= total then 'paid'
      else 'partial' end
   where a.id = new.assignment_id;
  insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
  select new.org_id, 'vendor_payment.recorded', 'vendor_payment', new.id, 'user', new.recorded_by,
         jsonb_build_object('title', a.title, 'amount', new.amount::text, 'assignment_id', a.id, 'vendor_name', v.name, 'project_id', a.project_id, 'paid_total', paid::text)
    from vendor_assignments a join vendors v on v.id = a.vendor_id where a.id = new.assignment_id;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function derive_payment_status() from public, anon, authenticated;

drop trigger if exists trg_derive_payment_status on vendor_payments;
create trigger trg_derive_payment_status after insert on vendor_payments
  for each row execute function derive_payment_status();

-- The payment guard above resets payment_status on every update; let the
-- derivation through by checking the flag first.
create or replace function guard_vendor_assignment() returns trigger as $$
declare
  actor uuid := auth.uid();
  manages boolean;
begin
  if new.org_id is distinct from old.org_id or new.vendor_id is distinct from old.vendor_id then
    raise exception 'an assignment stays with its vendor and business' using errcode = '42501';
  end if;
  if is_system_write() then return new; end if;
  if actor is null then return new; end if;
  manages := is_org_admin(old.org_id);
  if not manages then
    if new.title is distinct from old.title or new.details is distinct from old.details or new.amount is distinct from old.amount
       or new.project_id is distinct from old.project_id or new.record_id is distinct from old.record_id
       or new.task_id is distinct from old.task_id or new.due_date is distinct from old.due_date
       or new.customer_visible is distinct from old.customer_visible
       or new.record_status_on_submit is distinct from old.record_status_on_submit or new.record_status_on_verify is distinct from old.record_status_on_verify then
      raise exception 'only an owner, admin or manager can change that' using errcode = '42501';
    end if;
    if new.execution_status is distinct from old.execution_status
       and not (old.execution_status in ('assigned','in_progress','rejected') and new.execution_status in ('in_progress','submitted')) then
      raise exception 'that step is not yours to take' using errcode = '42501';
    end if;
  end if;
  if new.execution_status is distinct from old.execution_status then
    if old.execution_status = 'verified' then
      raise exception 'verified work is a record' using errcode = '22023';
    end if;
    if new.execution_status = 'verified' and old.execution_status <> 'submitted' then
      raise exception 'work is verified after it is submitted' using errcode = '22023';
    end if;
    if new.execution_status = 'in_progress' then new.started_at := coalesce(new.started_at, now()); end if;
    if new.execution_status = 'submitted' then new.submitted_at := now(); end if;
    if new.execution_status = 'verified' then new.verified_at := now(); new.verified_by := actor; end if;
  end if;
  new.payment_status := old.payment_status;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;

-- --------------------------------------------------------------- events --

create or replace function events_on_vendor_assignment() returns trigger as $$
declare
  actor uuid := auth.uid();
  v_kind text := case when actor is null then 'system' else 'user' end;
  vendor_name text;
  project_name text;
  approver uuid;
begin
  select v.name into vendor_name from vendors v where v.id = new.vendor_id;
  select p.name into project_name from projects p where p.id = new.project_id;
  if tg_op = 'INSERT' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'vendor_work.assigned', 'vendor_assignment', new.id, v_kind, coalesce(actor, new.created_by),
      jsonb_build_object('title', new.title, 'vendor_name', vendor_name, 'vendor_id', new.vendor_id, 'project_id', new.project_id, 'project_name', project_name, 'amount', new.amount::text, 'due_date', new.due_date));
    if new.record_id is not null then
      update records set vendor_id = new.vendor_id where id = new.record_id and vendor_id is null;
    end if;
    return new;
  end if;

  if new.execution_status is distinct from old.execution_status then
    if new.execution_status = 'submitted' then
      insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
      values (new.org_id, 'vendor_work.submitted', 'vendor_assignment', new.id, v_kind, actor,
        jsonb_build_object('title', new.title, 'vendor_name', vendor_name, 'project_id', new.project_id, 'project_name', project_name, 'note', new.submitted_note, 'record_id', new.record_id));
      for approver in
        select m.user_id from memberships m where m.org_id = new.org_id and m.role in ('owner','admin','manager') and m.user_id is distinct from actor
      loop
        perform push_notification(new.org_id, approver, 'vendor_submitted',
          vendor_name || ' · ' || new.title, '/vendors/assignments/' || new.id, 'vsub:' || new.id || ':' || approver);
      end loop;
      if new.record_id is not null and new.record_status_on_submit is not null then
        perform set_config('waakya.system_write', 'on', true);
        update records set status_key = new.record_status_on_submit where id = new.record_id;
      end if;
    elsif new.execution_status in ('verified','rejected') then
      insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
      values (new.org_id, 'vendor_work.verified', 'vendor_assignment', new.id, v_kind, actor,
        jsonb_build_object('title', new.title, 'vendor_name', vendor_name, 'status', new.execution_status, 'project_id', new.project_id, 'project_name', project_name, 'note', new.rejection_note, 'record_id', new.record_id, 'customer_visible', new.customer_visible));
      if new.created_by is not null and new.created_by is distinct from actor then
        perform push_notification(new.org_id, new.created_by,
          case when new.execution_status = 'verified' then 'vendor_verified' else 'vendor_rejected' end,
          vendor_name || ' · ' || new.title, '/vendors/assignments/' || new.id, 'vver:' || new.id || ':' || new.execution_status);
      end if;
      if new.execution_status = 'verified' then
        if new.project_id is not null and new.customer_visible then
          insert into project_updates (org_id, project_id, kind, body, customer_visible, actor_kind, created_by)
          values (new.org_id, new.project_id, 'vendor', new.title, true, v_kind, actor);
        end if;
        if new.record_id is not null and new.record_status_on_verify is not null then
          perform set_config('waakya.system_write', 'on', true);
          update records set status_key = new.record_status_on_verify where id = new.record_id;
        end if;
      end if;
    end if;
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_vendor_assignment() from public, anon, authenticated;

drop trigger if exists trg_events_vendor_assignment on vendor_assignments;
create trigger trg_events_vendor_assignment after insert or update on vendor_assignments
  for each row execute function events_on_vendor_assignment();
