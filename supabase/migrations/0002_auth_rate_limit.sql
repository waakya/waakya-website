-- Slice 1. Two things:
--   1. Rate-limit OTP requests (CLAUDE.md §6, security).
--   2. Pin search_path on the two security-definer helpers, so a caller cannot
--      shadow `memberships` with a temp table and grant themselves membership.

alter function is_org_member(uuid) set search_path = public, pg_temp;
alter function is_org_admin(uuid)  set search_path = public, pg_temp;

-- One row per OTP request. The identifier is stored as a SHA-256 hex digest so
-- the table never holds a list of user email addresses.
create table if not exists otp_requests (
  id              uuid primary key default gen_random_uuid(),
  identifier_hash text not null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_otp_requests_hash
  on otp_requests(identifier_hash, created_at desc);

-- RLS on with no policies: the table is unreachable except through the
-- security-definer function below, which never returns its contents.
alter table otp_requests enable row level security;

/**
 * Records an OTP request and reports whether it is within the window.
 * Returns true when the caller may proceed, false when they are over the limit.
 * The row is always written, so hammering the endpoint cannot reset the count.
 */
create or replace function record_otp_request(
  p_identifier_hash text,
  p_max_requests    int  default 5,
  p_window_minutes  int  default 15
) returns boolean as $$
declare
  recent_count int;
begin
  if p_identifier_hash is null or length(p_identifier_hash) <> 64 then
    raise exception 'identifier_hash must be a sha-256 hex digest';
  end if;

  delete from otp_requests where created_at < now() - interval '1 day';

  select count(*) into recent_count
  from otp_requests
  where identifier_hash = p_identifier_hash
    and created_at > now() - make_interval(mins => p_window_minutes);

  insert into otp_requests (identifier_hash) values (p_identifier_hash);

  return recent_count < p_max_requests;
end;
$$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke all on function record_otp_request(text, int, int) from public;
grant execute on function record_otp_request(text, int, int) to anon, authenticated;
