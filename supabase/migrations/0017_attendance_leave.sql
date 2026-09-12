-- Phase 1. Attendance, leave and holidays.
--
-- Three rules shape this file.
--
-- 1. The working day is an Asia/Kolkata day. A punch at 00:10 IST belongs to
--    that IST date, not to the UTC date that is still yesterday. `ist_today()`
--    is the single place that decides, so no caller has to remember.
-- 2. Nothing writes these tables directly. Every mutation goes through a
--    security-definer function that establishes the organisation itself from
--    the caller's membership, so a client cannot name somebody else's org.
--    The tables therefore carry SELECT policies only.
-- 3. Approving leave is money. `decide_leave_request()` locks the row, refuses
--    to act twice, and checks the balance before it deducts, so a retried
--    click cannot deduct twice or drive a balance negative.

-- ---------- Enums ----------
do $$ begin
  create type attendance_status as enum ('present','absent','leave','half_day','holiday');
exception when duplicate_object then null; end $$;

do $$ begin
  create type leave_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type leave_kind as enum ('full_day','half_day');
exception when duplicate_object then null; end $$;

do $$ begin
  create type day_half as enum ('first_half','second_half');
exception when duplicate_object then null; end $$;

-- ---------- The working day ----------
create or replace function ist_today() returns date as $$
  select (now() at time zone 'Asia/Kolkata')::date;
$$ language sql stable;

alter function ist_today() set search_path = public, pg_temp;

-- ---------- Tables ----------
create table if not exists leave_balances (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  balance_days numeric(6,1) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, user_id),
  constraint leave_balance_not_negative check (balance_days >= 0),
  -- Half days are the smallest unit the product sells; anything finer is a bug.
  constraint leave_balance_half_steps check ((balance_days * 2) = floor(balance_days * 2))
);
create index if not exists idx_leave_balances_org on leave_balances(org_id);

create table if not exists holidays (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  holiday_date date not null,
  title       text not null,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now(),
  unique (org_id, holiday_date)
);
create index if not exists idx_holidays_org_date on holidays(org_id, holiday_date);

create table if not exists leave_requests (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  start_date    date not null,
  end_date      date not null,
  request_type  leave_kind not null default 'full_day',
  half_day_period day_half,
  days_requested numeric(6,1) not null,
  reason        text,
  status        leave_status not null default 'pending',
  reviewed_by   uuid references auth.users(id),
  reviewed_at   timestamptz,
  review_note   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint leave_range_ordered check (end_date >= start_date),
  constraint leave_days_positive check (days_requested > 0),
  -- A half day is one day, and it is half of it.
  constraint leave_half_day_single check (
    request_type = 'full_day' or (start_date = end_date and days_requested = 0.5)
  )
);
create index if not exists idx_leave_requests_org_status on leave_requests(org_id, status);
create index if not exists idx_leave_requests_user on leave_requests(user_id, start_date desc);

create table if not exists attendance_records (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  work_date     date not null,
  punch_in_at   timestamptz,
  punch_out_at  timestamptz,
  status        attendance_status not null default 'present',
  leave_request_id uuid references leave_requests(id) on delete set null,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (org_id, user_id, work_date),
  constraint punch_out_needs_in check (punch_out_at is null or punch_in_at is not null),
  constraint punch_out_after_in check (punch_out_at is null or punch_out_at >= punch_in_at)
);
create index if not exists idx_attendance_org_date on attendance_records(org_id, work_date);
create index if not exists idx_attendance_user_date on attendance_records(user_id, work_date desc);

-- ---------- updated_at ----------
drop trigger if exists trg_attendance_updated on attendance_records;
create trigger trg_attendance_updated before update on attendance_records
  for each row execute function set_updated_at();

drop trigger if exists trg_leave_requests_updated on leave_requests;
create trigger trg_leave_requests_updated before update on leave_requests
  for each row execute function set_updated_at();

drop trigger if exists trg_leave_balances_updated on leave_balances;
create trigger trg_leave_balances_updated before update on leave_balances
  for each row execute function set_updated_at();

-- ---------- Row level security ----------
-- Read your own row, or anything in an org you administer. No insert/update
-- policies exist on purpose: writes are only possible through the functions
-- below, which decide the org themselves.
alter table attendance_records enable row level security;
alter table leave_requests     enable row level security;
alter table leave_balances     enable row level security;
alter table holidays           enable row level security;

drop policy if exists "attendance read" on attendance_records;
create policy "attendance read" on attendance_records for select
  using (user_id = auth.uid() or is_org_admin(org_id));

drop policy if exists "leave requests read" on leave_requests;
create policy "leave requests read" on leave_requests for select
  using (user_id = auth.uid() or is_org_admin(org_id));

drop policy if exists "leave balances read" on leave_balances;
create policy "leave balances read" on leave_balances for select
  using (user_id = auth.uid() or is_org_admin(org_id));

-- Everyone in the business needs to know when the office is shut.
drop policy if exists "holidays read" on holidays;
create policy "holidays read" on holidays for select using (is_org_member(org_id));

-- ---------- Punching ----------
-- The caller names an org; membership is verified here rather than trusted.
create or replace function punch_in(p_org uuid) returns attendance_records as $$
declare
  today date := ist_today();
  row_out attendance_records;
begin
  if not is_org_member(p_org) then
    raise exception 'not a member of this business' using errcode = '42501';
  end if;

  select * into row_out from attendance_records
   where org_id = p_org and user_id = auth.uid() and work_date = today
   for update;

  if found then
    if row_out.status in ('leave','half_day','holiday') and row_out.punch_in_at is null then
      -- A half day still gets worked; a full leave day does not.
      if row_out.status = 'leave' then
        raise exception 'on leave today' using errcode = '22023';
      end if;
    end if;
    if row_out.punch_out_at is not null then
      raise exception 'already punched out today' using errcode = '22023';
    end if;
    if row_out.punch_in_at is not null then
      raise exception 'already punched in' using errcode = '22023';
    end if;

    update attendance_records set punch_in_at = now()
     where id = row_out.id returning * into row_out;
    return row_out;
  end if;

  insert into attendance_records (org_id, user_id, work_date, punch_in_at, status)
  values (p_org, auth.uid(), today, now(), 'present')
  returning * into row_out;
  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

create or replace function punch_out(p_org uuid) returns attendance_records as $$
declare
  today date := ist_today();
  row_out attendance_records;
begin
  if not is_org_member(p_org) then
    raise exception 'not a member of this business' using errcode = '42501';
  end if;

  select * into row_out from attendance_records
   where org_id = p_org and user_id = auth.uid() and work_date = today
   for update;

  if not found or row_out.punch_in_at is null then
    raise exception 'not punched in' using errcode = '22023';
  end if;
  if row_out.punch_out_at is not null then
    raise exception 'already punched out' using errcode = '22023';
  end if;

  update attendance_records set punch_out_at = now()
   where id = row_out.id returning * into row_out;
  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

-- ---------- Leave ----------
-- Days are counted here rather than on the client, so the number that is
-- deducted is the number the server agreed to. Holidays inside a range are
-- free; a half day is always exactly 0.5.
create or replace function leave_days_between(
  p_org uuid, p_start date, p_end date, p_kind leave_kind
) returns numeric as $$
  select case
    when p_kind = 'half_day' then 0.5
    else greatest(
      0,
      (select count(*) from generate_series(p_start, p_end, interval '1 day') d
        where not exists (
          select 1 from holidays h
           where h.org_id = p_org and h.holiday_date = d::date
        ))
    )::numeric
  end;
$$ language sql stable;

alter function leave_days_between(uuid, date, date, leave_kind)
  set search_path = public, pg_temp;

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
  row_out leave_requests;
begin
  if not is_org_member(p_org) then
    raise exception 'not a member of this business' using errcode = '42501';
  end if;
  if p_end < p_start then
    raise exception 'end date is before the start date' using errcode = '22023';
  end if;
  if p_kind = 'half_day' and p_start <> p_end then
    raise exception 'a half day covers one date' using errcode = '22023';
  end if;

  days := leave_days_between(p_org, p_start, p_end, p_kind);
  if days <= 0 then
    raise exception 'those dates are all holidays' using errcode = '22023';
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

-- Approving or rejecting. Safe to retry: a request that is no longer pending
-- is returned untouched, so a double click cannot deduct twice.
create or replace function decide_leave_request(
  p_request uuid,
  p_approve boolean,
  p_note text default null
) returns leave_requests as $$
declare
  req leave_requests;
  balance numeric;
  d date;
begin
  select * into req from leave_requests where id = p_request for update;
  if not found then
    raise exception 'leave request not found' using errcode = 'P0002';
  end if;
  if not is_org_admin(req.org_id) then
    raise exception 'only an owner or admin can decide leave' using errcode = '42501';
  end if;
  if req.user_id = auth.uid() then
    raise exception 'you cannot decide your own leave' using errcode = '42501';
  end if;

  -- Already decided: hand back what was decided, change nothing.
  if req.status <> 'pending' then
    return req;
  end if;

  if not p_approve then
    update leave_requests
       set status = 'rejected', reviewed_by = auth.uid(),
           reviewed_at = now(), review_note = p_note
     where id = req.id returning * into req;
    return req;
  end if;

  select balance_days into balance from leave_balances
   where org_id = req.org_id and user_id = req.user_id for update;

  if balance is null or balance < req.days_requested then
    raise exception 'not enough leave balance' using errcode = '22023';
  end if;

  update leave_balances
     set balance_days = balance_days - req.days_requested
   where org_id = req.org_id and user_id = req.user_id;

  -- Mark every covered date, leaving holidays alone.
  for d in
    select g::date from generate_series(req.start_date, req.end_date, interval '1 day') g
  loop
    if not exists (
      select 1 from holidays h where h.org_id = req.org_id and h.holiday_date = d
    ) then
      insert into attendance_records (org_id, user_id, work_date, status, leave_request_id)
      values (
        req.org_id, req.user_id, d,
        case when req.request_type = 'half_day' then 'half_day' else 'leave' end,
        req.id
      )
      on conflict (org_id, user_id, work_date) do update
        set status = excluded.status,
            leave_request_id = excluded.leave_request_id;
    end if;
  end loop;

  update leave_requests
     set status = 'approved', reviewed_by = auth.uid(),
         reviewed_at = now(), review_note = p_note
   where id = req.id returning * into req;

  return req;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

create or replace function credit_leave(
  p_org uuid, p_user uuid, p_days numeric
) returns leave_balances as $$
declare
  row_out leave_balances;
begin
  if not is_org_admin(p_org) then
    raise exception 'only an owner or admin can credit leave' using errcode = '42501';
  end if;
  if (p_days * 2) <> floor(p_days * 2) then
    raise exception 'leave moves in half days' using errcode = '22023';
  end if;
  if not exists (select 1 from memberships m where m.org_id = p_org and m.user_id = p_user) then
    raise exception 'that person is not in this business' using errcode = '42501';
  end if;

  insert into leave_balances (org_id, user_id, balance_days)
  values (p_org, p_user, greatest(0, p_days))
  on conflict (org_id, user_id) do update
    set balance_days = greatest(0, leave_balances.balance_days + p_days)
  returning * into row_out;

  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

create or replace function add_holiday(
  p_org uuid, p_date date, p_title text
) returns holidays as $$
declare
  row_out holidays;
begin
  if not is_org_admin(p_org) then
    raise exception 'only an owner or admin can add a holiday' using errcode = '42501';
  end if;

  insert into holidays (org_id, holiday_date, title, created_by)
  values (p_org, p_date, btrim(p_title), auth.uid())
  on conflict (org_id, holiday_date) do update set title = excluded.title
  returning * into row_out;

  -- Anyone already marked present keeps their punches; only untouched days
  -- become holidays, so a holiday declared late never erases worked time.
  insert into attendance_records (org_id, user_id, work_date, status)
  select p_org, m.user_id, p_date, 'holiday'
    from memberships m where m.org_id = p_org
  on conflict (org_id, user_id, work_date) do nothing;

  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

-- ---------- Grants ----------
revoke all on function punch_in(uuid)                              from public;
revoke all on function punch_out(uuid)                             from public;
revoke all on function apply_leave(uuid, date, date, leave_kind, day_half, text) from public;
revoke all on function decide_leave_request(uuid, boolean, text)   from public;
revoke all on function credit_leave(uuid, uuid, numeric)           from public;
revoke all on function add_holiday(uuid, date, text)               from public;
revoke all on function leave_days_between(uuid, date, date, leave_kind) from public;
revoke all on function ist_today()                                 from public;

grant execute on function punch_in(uuid)                              to authenticated;
grant execute on function punch_out(uuid)                             to authenticated;
grant execute on function apply_leave(uuid, date, date, leave_kind, day_half, text) to authenticated;
grant execute on function decide_leave_request(uuid, boolean, text)   to authenticated;
grant execute on function credit_leave(uuid, uuid, numeric)           to authenticated;
grant execute on function add_holiday(uuid, date, text)               to authenticated;
grant execute on function leave_days_between(uuid, date, date, leave_kind) to authenticated;
grant execute on function ist_today()                                 to authenticated;
