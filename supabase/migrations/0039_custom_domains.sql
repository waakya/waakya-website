-- 0039 — Custom domains: the foundation.
--
-- A business may serve its customer portal on its own hostname
-- (portal.customer.com) or on <slug>.waakya.com (spec §12). Tenancy is
-- never inferred from the Host header alone: a request's host is looked up
-- here and must be verified; the customer still signs in and sees only
-- their own projects. Verification is a DNS TXT record the business adds;
-- attaching the hostname to the hosting platform is a documented manual
-- step this release.

create extension if not exists citext;

create table if not exists organization_domains (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references orgs(id) on delete cascade,
  hostname           citext not null unique,
  kind               text not null default 'portal',
  status             text not null default 'pending',
  verification_token text not null,
  verified_at        timestamptz,
  activated_at       timestamptz,
  removed_at         timestamptz,
  last_checked_at    timestamptz,
  last_error         text,
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  constraint domain_hostname check (hostname ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'),
  constraint domain_kind     check (kind in ('portal')),
  constraint domain_status   check (status in ('pending','verified','active','removed'))
);
create index if not exists idx_domains_org on organization_domains(org_id, status);

alter table organization_domains enable row level security;
drop policy if exists "domains read"   on organization_domains;
drop policy if exists "domains write"  on organization_domains;
drop policy if exists "domains update" on organization_domains;
create policy "domains read"   on organization_domains for select using (is_org_owner_admin(org_id));
create policy "domains write"  on organization_domains for insert with check (is_org_owner_admin(org_id) and org_module_enabled(org_id, 'custom_domains') and created_by = auth.uid() and status = 'pending');
create policy "domains update" on organization_domains for update using (is_org_owner_admin(org_id)) with check (is_org_owner_admin(org_id) and status in ('pending','removed'));
-- 'verified' and 'active' are set by the application after a real DNS check (service role).

-- The public lookup the edge does on every request with an unknown host:
-- which business, if any, and only when verified. Anonymous, read-only,
-- reveals nothing but the mapping the business chose to publish.
create or replace function resolve_portal_host(p_host text) returns table (org_id uuid, org_name text, status text) as $$
  select d.org_id, o.name, d.status from organization_domains d join orgs o on o.id = d.org_id
   where d.hostname = p_host and d.status in ('verified','active') and d.removed_at is null limit 1;
$$ language sql stable security definer set search_path = public, pg_temp;
grant execute on function resolve_portal_host(text) to anon, authenticated, service_role;

create or replace function events_on_domain() returns trigger as $$
begin
  if tg_op = 'UPDATE' and new.status in ('verified','active') and old.status = 'pending' then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'domain.verified', 'organization_domain', new.id, 'system', new.created_by, jsonb_build_object('hostname', new.hostname::text));
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_domain() from public, anon, authenticated;

drop trigger if exists trg_events_domain on organization_domains;
create trigger trg_events_domain after update on organization_domains
  for each row execute function events_on_domain();
