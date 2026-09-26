-- 0040 — Exact counts for the day, computed in the database.
--
-- Today's header numbers used to be counted from a list loaded into the
-- server, which is only right while the list is complete. Past any cap the
-- numbers would drift (the "200-item" class of bug). The database counts
-- exactly, for the business's day in Asia/Kolkata, with the same rules the
-- application uses for Late and "not seen".

create or replace function org_task_counts(p_org uuid)
returns table (
  sent_today integer, seen_today integer, done_today integer, verified_today integer,
  late integer, unseen integer, open_total integer, waiting_verify integer
) as $$
declare
  ack_default integer;
  day_start timestamptz;
begin
  if auth.uid() is not null and not is_org_member(p_org) then
    raise exception 'not a member of this business' using errcode = '42501';
  end if;
  select o.ack_minutes into ack_default from orgs o where o.id = p_org;
  day_start := (ist_today()::timestamp at time zone 'Asia/Kolkata');
  return query
  select
    count(*) filter (where t.delivered_at >= day_start and t.state <> 'cancelled')::integer,
    count(*) filter (where t.delivered_at >= day_start and t.state in ('acknowledged','accepted','in_progress','done','verified','escalated'))::integer,
    count(*) filter (where t.delivered_at >= day_start and t.state in ('done','verified'))::integer,
    count(*) filter (where t.delivered_at >= day_start and t.state = 'verified')::integer,
    count(*) filter (where t.due_at is not null and t.due_at < now() and t.state not in ('done','verified','cancelled'))::integer,
    count(*) filter (where t.state = 'delivered' and t.delivered_at is not null
                       and t.delivered_at + make_interval(mins => coalesce(t.ack_minutes, ack_default)) < now())::integer,
    count(*) filter (where t.state not in ('verified','cancelled'))::integer,
    count(*) filter (where t.state = 'done')::integer
  from tasks t where t.org_id = p_org;
end $$ language plpgsql stable security definer set search_path = public, pg_temp;
revoke all on function org_task_counts(uuid) from public, anon;
grant execute on function org_task_counts(uuid) to authenticated, service_role;
