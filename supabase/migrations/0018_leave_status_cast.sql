-- Approving leave failed with 42804: the CASE that chooses between a full day
-- and a half day produces `text`, and Postgres will not coerce that into the
-- `attendance_status` column on its own. The cast is the whole fix; the rest of
-- the function is unchanged from 0017.
--
-- Nothing had to be repaired afterwards: the function is one transaction, so
-- every failed approval left the balance and the request exactly as they were.
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

  for d in
    select g::date from generate_series(req.start_date, req.end_date, interval '1 day') g
  loop
    if not exists (
      select 1 from holidays h where h.org_id = req.org_id and h.holiday_date = d
    ) then
      insert into attendance_records (org_id, user_id, work_date, status, leave_request_id)
      values (
        req.org_id, req.user_id, d,
        (case when req.request_type = 'half_day' then 'half_day' else 'leave' end)::attendance_status,
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

revoke all on function decide_leave_request(uuid, boolean, text) from public;
grant execute on function decide_leave_request(uuid, boolean, text) to authenticated;
