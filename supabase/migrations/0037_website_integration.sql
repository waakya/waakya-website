-- 0037 — Website → Waakya: the integration boundary.
--
-- External websites never write into the database (spec §10). They call
-- one endpoint with a key the business issued; the key is stored as a hash,
-- shown once, revocable, scoped. Every request is a row: its idempotency
-- key (so a retry answers the same way), its status, its answer, and the
-- key it came through — which is also the rate-limit ledger.

create table if not exists integration_keys (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  name         text not null,
  key_prefix   text not null unique,
  key_hash     text not null,
  scopes       text[] not null default '{leads:write}',
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz,
  constraint key_name   check (length(btrim(name)) between 1 and 80),
  constraint key_prefix check (key_prefix ~ '^[0-9a-f]{8}$'),
  constraint key_hash   check (key_hash ~ '^[0-9a-f]{64}$')
);
create index if not exists idx_integration_keys_org on integration_keys(org_id, revoked_at);

create table if not exists integration_requests (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  key_id          uuid not null references integration_keys(id) on delete cascade,
  endpoint        text not null default 'leads',
  idempotency_key text not null,
  request_hash    text not null,
  status          integer not null,
  response        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (key_id, idempotency_key)
);
create index if not exists idx_integration_requests_rate on integration_requests(key_id, created_at desc);
create index if not exists idx_integration_requests_org  on integration_requests(org_id, created_at desc);

alter table integration_keys     enable row level security;
alter table integration_requests enable row level security;

-- The people who own the business see their keys (never the secret: only
-- its hash is stored) and the request ledger. Writes are the app's, with
-- the service role, so a client can never mint a key for another business.
drop policy if exists "integration keys read"   on integration_keys;
drop policy if exists "integration keys write"  on integration_keys;
drop policy if exists "integration keys update" on integration_keys;
create policy "integration keys read"   on integration_keys for select using (is_org_owner_admin(org_id));
create policy "integration keys write"  on integration_keys for insert with check (is_org_owner_admin(org_id) and org_module_enabled(org_id, 'website_integration') and created_by = auth.uid());
create policy "integration keys update" on integration_keys for update using (is_org_owner_admin(org_id)) with check (is_org_owner_admin(org_id));

drop policy if exists "integration requests read" on integration_requests;
create policy "integration requests read" on integration_requests for select using (is_org_owner_admin(org_id));
-- Requests are written by the endpoint (service role) only.

-- The hash column is the one thing a manager must never read through the
-- API; column grants keep it out of every client select.
revoke select on integration_keys from authenticated;
grant select (id, org_id, name, key_prefix, scopes, created_by, created_at, last_used_at, revoked_at) on integration_keys to authenticated;

-- Requests in the last minute through one key: the rate limit's answer.
create or replace function integration_requests_last_minute(p_key uuid) returns integer as $$
  select count(*)::integer from integration_requests r where r.key_id = p_key and r.created_at > now() - interval '1 minute';
$$ language sql stable security definer set search_path = public, pg_temp;
revoke all on function integration_requests_last_minute(uuid) from public, anon, authenticated;
grant execute on function integration_requests_last_minute(uuid) to service_role;
