-- 0021 — Functional integrity found by the full-organization QA run.
--
-- The app server already applied these rules, but the database did not, so a
-- signed-in member calling the API directly could bypass them. Every rule here
-- mirrors the app's own (lib/tasks/state-machine.ts, lib/tasks/authz.ts).
-- The service role (the SLA job) has no auth.uid() and is not restricted.

-- ------------------------------------------------------------------ helpers --

create or replace function org_role(p_org uuid) returns member_role as $$
  select m.role from memberships m where m.org_id = p_org and m.user_id = auth.uid();
$$ language sql stable security definer set search_path = public, pg_temp;
revoke all on function org_role(uuid) from public;
grant execute on function org_role(uuid) to authenticated;

-- The state machine, as data.
create or replace function task_transition_allowed(p_from task_state, p_to task_state)
returns boolean as $$
  select case p_from
    when 'created'      then p_to in ('delivered','cancelled')
    when 'delivered'    then p_to in ('acknowledged','escalated','reassigned','cancelled')
    when 'acknowledged' then p_to in ('accepted','escalated','reassigned','cancelled')
    when 'accepted'     then p_to in ('in_progress','done','escalated','reassigned','cancelled')
    when 'in_progress'  then p_to in ('done','escalated','reassigned','cancelled')
    when 'done'         then p_to in ('verified','in_progress','reassigned','cancelled')
    when 'escalated'    then p_to in ('acknowledged','accepted','in_progress','done','reassigned','cancelled')
    when 'reassigned'   then p_to in ('delivered')
    else false
  end;
$$ language sql immutable set search_path = public, pg_temp;

-- ------------------------------------------------------------ task updates --

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

  -- What only the people running the business may change.
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

  -- A closed task is a record.
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
    -- A reassignment is recorded as 'reassigned' and rests as 'delivered'.
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
  elsif not manages and not assignee
    and not (old.created_by = actor and new.source_message_id is distinct from old.source_message_id) then
    -- The one change a non-manager author makes to someone else's task:
    -- remembering the message it was made from.
    raise exception 'this task is not yours' using errcode = '42501';
  end if;

  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_guard_task_update on tasks;
create trigger trg_guard_task_update before update on tasks
  for each row execute function guard_task_update();

-- A task is created by the person creating it, for somebody in the same business.
drop policy if exists "tasks insert" on tasks;
create policy "tasks insert" on tasks for insert with check (
  is_org_member(org_id)
  and created_by = auth.uid()
  and state in ('created','delivered')
  and exists (select 1 from memberships m where m.org_id = tasks.org_id and m.user_id = tasks.assigned_to)
);

-- The record says who did something; nobody writes it in someone else's name.
drop policy if exists "events insert" on task_events;
create policy "events insert" on task_events for insert with check (
  is_org_member(org_id)
  and actor_id = auth.uid()
  and exists (select 1 from tasks t where t.id = task_id and t.org_id = task_events.org_id)
);

-- Proof comes from the person doing the work (or the people running the business).
drop policy if exists "proofs insert" on proofs;
create policy "proofs insert" on proofs for insert with check (
  is_org_member(org_id)
  and created_by = auth.uid()
  and exists (
    select 1 from tasks t
     where t.id = task_id and t.org_id = proofs.org_id
       and (t.assigned_to = auth.uid() or is_org_admin(t.org_id))
  )
);

-- ------------------------------------------------------------- memberships --
-- Joining happens only through create_org and accept_invite (both definer
-- functions). Roles change only by an owner or admin, and never to or from owner.

drop policy if exists "membership write"  on memberships;
drop policy if exists "membership update" on memberships;
drop policy if exists "membership delete" on memberships;

create policy "membership update" on memberships for update
  using (is_org_owner_admin(org_id) and role <> 'owner' and user_id <> auth.uid())
  with check (is_org_owner_admin(org_id) and role <> 'owner');

create policy "membership delete" on memberships for delete
  using (is_org_owner_admin(org_id) and role <> 'owner' and user_id <> auth.uid());

-- Owners and admins invite anyone below owner; managers invite staff.
drop policy if exists "invites insert" on invites;
create policy "invites insert" on invites for insert with check (
  created_by = auth.uid()
  and role <> 'owner'
  and (is_org_owner_admin(org_id) or (is_org_admin(org_id) and role = 'member'))
);

-- ------------------------------------------------------------------- leave --

create or replace function apply_leave(
  p_org uuid,
  p_start date,
  p_end date,
  p_kind leave_kind default 'full_day',
  p_period day_half default null,
  p_reason text default null
) returns leave_requests as $$
declare
  days numeric;
  available numeric;
  row_out leave_requests;
begin
  if not is_org_member(p_org) then
    raise exception 'not a member of this business' using errcode = '42501';
  end if;
  if p_start is null or p_end is null then
    raise exception 'choose the dates' using errcode = '22023';
  end if;
  if p_end < p_start then
    raise exception 'end date is before the start date' using errcode = '22023';
  end if;
  if p_kind = 'half_day' and p_start <> p_end then
    raise exception 'a half day covers one date' using errcode = '22023';
  end if;
  if p_end - p_start > 60 then
    raise exception 'a leave request can cover at most 60 days' using errcode = '22023';
  end if;

  -- The same date cannot be asked for twice while a request for it stands.
  if exists (
    select 1 from leave_requests r
     where r.org_id = p_org and r.user_id = auth.uid()
       and r.status in ('pending','approved')
       and r.start_date <= p_end and r.end_date >= p_start
  ) then
    raise exception 'leave is already requested for those dates' using errcode = '22023';
  end if;

  days := leave_days_between(p_org, p_start, p_end, p_kind);
  if days <= 0 then
    raise exception 'those dates are all holidays' using errcode = '22023';
  end if;

  -- What is left once requests already waiting are counted.
  select coalesce((select balance_days from leave_balances b where b.org_id = p_org and b.user_id = auth.uid()), 0)
         - coalesce((select sum(days_requested) from leave_requests r
                      where r.org_id = p_org and r.user_id = auth.uid() and r.status = 'pending'), 0)
    into available;
  if days > available then
    raise exception 'not enough leave balance' using errcode = '22023';
  end if;

  insert into leave_requests (
    org_id, user_id, start_date, end_date, request_type,
    half_day_period, days_requested, reason
  ) values (
    p_org, auth.uid(), p_start, p_end, p_kind,
    case when p_kind = 'half_day' then coalesce(p_period, 'first_half') else null end,
    days, nullif(btrim(coalesce(p_reason, '')), '')
  ) returning * into row_out;

  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke all on function apply_leave(uuid, date, date, leave_kind, day_half, text) from public;
grant execute on function apply_leave(uuid, date, date, leave_kind, day_half, text) to authenticated;

-- ------------------------------------------------- resolved notifications --
-- Once a request is decided, the "needs approval" / "asked for leave" updates
-- that went to approvers are marked read and say what happened.

create or replace function resolve_request_notifications(p_prefix text, p_outcome text)
returns void as $$
  update notifications
     set read_at = coalesce(read_at, now()),
         body = case when body like '% · ' || p_outcome then body else body || ' · ' || p_outcome end
   where dedupe_key like p_prefix || '%';
$$ language sql volatile security definer set search_path = public, pg_temp;
revoke all on function resolve_request_notifications(text, text) from public;
revoke all on function resolve_request_notifications(text, text) from authenticated;

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
    perform resolve_request_notifications('appr-req:' || new.id || ':', new.status::text);
    perform push_notification(
      new.org_id, new.requested_by, 'approval_decided',
      new.title || ' was ' || new.status::text || ' by ' || display_name(new.decided_by),
      '/approvals', 'appr-dec:' || new.id
    );
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;

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
        '/hazri#leave-requests', 'leave-req:' || new.id || ':' || approver
      );
    end loop;
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status <> 'pending' then
    perform resolve_request_notifications('leave-req:' || new.id || ':', new.status::text);
    perform push_notification(
      new.org_id, new.user_id,
      case when new.status = 'approved' then 'leave_approved' else 'leave_rejected' end,
      'Your leave from ' || to_char(new.start_date, 'DD Mon') || ' was ' || new.status::text,
      '/hazri#leave', 'leave-dec:' || new.id
    );
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;

-- Resolve what is already stale.
update notifications n
   set read_at = coalesce(n.read_at, now()),
       body = n.body || ' · ' || a.status::text
  from approvals a
 where n.dedupe_key like 'appr-req:' || a.id || ':%'
   and a.status <> 'pending'
   and n.body not like '% · ' || a.status::text;

update notifications n
   set read_at = coalesce(n.read_at, now()),
       body = n.body || ' · ' || l.status::text
  from leave_requests l
 where n.dedupe_key like 'leave-req:' || l.id || ':%'
   and l.status <> 'pending'
   and n.body not like '% · ' || l.status::text;
