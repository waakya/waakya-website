-- Slice 2. Org onboarding, staff invites, per-user language, and a security
-- fix to the membership policy shipped in 0001.
--
-- 0001 allowed `insert into memberships ... with check (is_org_admin(org_id)
-- or user_id = auth.uid())`. The second half exists so the creator of an org
-- can insert their own owner row, but it also lets *any* signed-in user insert
-- a membership for themselves into *any* org id and read that org's tasks.
-- Joining is now only possible through the two security-definer functions
-- below, each of which checks a real reason to join.

-- ---------- Per-user language ----------
-- A newly invited member inherits orgs.language; this column records their own
-- later choice, so switching language does not change it for the whole org.
alter table profiles add column if not exists language text;

-- ---------- Invites ----------
create table if not exists invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  full_name   text not null,
  phone       text not null,
  role        member_role not null default 'member',
  token       text not null unique,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '30 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id)
);
create index if not exists idx_invites_org on invites(org_id);

alter table invites enable row level security;

create policy "invites read"   on invites for select using (is_org_member(org_id));
create policy "invites insert" on invites for insert with check (is_org_admin(org_id));
create policy "invites delete" on invites for delete using (is_org_admin(org_id));

-- ---------- Close the membership hole ----------
drop policy if exists "membership write" on memberships;
create policy "membership write" on memberships
  for insert with check (is_org_admin(org_id));

-- ---------- Co-members can see each other's names ----------
-- A task row says "Raju · maana 10:05"; without this the owner sees a uuid.
create or replace function shares_org_with(p_user uuid) returns boolean as $$
  select exists (
    select 1
    from memberships mine
    join memberships theirs on theirs.org_id = mine.org_id
    where mine.user_id = auth.uid() and theirs.user_id = p_user
  );
$$ language sql stable security definer set search_path = public, pg_temp;

create policy "co-member profile read" on profiles
  for select using (shares_org_with(id));

-- ---------- Creating an org ----------
/**
 * Creates the org and the creator's owner membership in one transaction, so
 * there is never a moment where an org exists with nobody in it — and so the
 * membership table needs no self-insert policy.
 */
create or replace function create_org(p_name text, p_language text default 'hi')
returns uuid as $$
declare
  new_org uuid;
  actor   uuid := auth.uid();
begin
  if actor is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_name is null or length(btrim(p_name)) < 2 then
    raise exception 'org name too short' using errcode = '22023';
  end if;
  if p_language not in ('hi', 'hi-Latn', 'en') then
    raise exception 'unsupported language' using errcode = '22023';
  end if;

  insert into orgs (name, language, created_by)
  values (btrim(p_name), p_language, actor)
  returning id into new_org;

  insert into memberships (org_id, user_id, role)
  values (new_org, actor, 'owner');

  return new_org;
end;
$$ language plpgsql volatile security definer set search_path = public, pg_temp;

-- ---------- Looking at an invite before signing in ----------
/**
 * What an invitee may see before they have an account: the business name and
 * the name they were invited under. Never the phone number, never the org id,
 * and nothing at all once the invite is used or expired.
 */
create or replace function invite_preview(p_token text)
returns table (org_name text, full_name text, already_accepted boolean) as $$
  select o.name, i.full_name, i.accepted_at is not null
  from invites i
  join orgs o on o.id = i.org_id
  where i.token = p_token
    and i.expires_at > now();
$$ language sql stable security definer set search_path = public, pg_temp;

-- ---------- Accepting an invite ----------
/**
 * The only other way to gain a membership. Marks the invite used, so a link
 * that leaks cannot be replayed by a second person. Idempotent for the person
 * who already accepted it.
 */
create or replace function accept_invite(p_token text) returns uuid as $$
declare
  inv   invites%rowtype;
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  select * into inv from invites
   where token = p_token and expires_at > now()
   for update;

  if not found then
    raise exception 'invite not found' using errcode = 'P0002';
  end if;

  if inv.accepted_at is not null then
    if inv.accepted_by = actor then
      return inv.org_id;                       -- already joined; no-op
    end if;
    raise exception 'invite already used' using errcode = '22023';
  end if;

  insert into memberships (org_id, user_id, role)
  values (inv.org_id, actor, inv.role)
  on conflict (org_id, user_id) do nothing;

  -- The owner invited a name and a number; carry both onto the profile, but
  -- never overwrite a name the person has already set for themselves.
  insert into profiles (id, full_name, phone)
  values (actor, inv.full_name, inv.phone)
  on conflict (id) do update
    set full_name = coalesce(nullif(btrim(profiles.full_name), ''), excluded.full_name),
        phone     = coalesce(profiles.phone, excluded.phone);

  update invites
     set accepted_at = now(), accepted_by = actor
   where id = inv.id;

  return inv.org_id;
end;
$$ language plpgsql volatile security definer set search_path = public, pg_temp;

revoke all on function create_org(text, text)   from public;
revoke all on function invite_preview(text)     from public;
revoke all on function accept_invite(text)      from public;
revoke all on function shares_org_with(uuid)    from public;
grant execute on function create_org(text, text) to authenticated;
grant execute on function invite_preview(text)   to anon, authenticated;
grant execute on function accept_invite(text)    to authenticated;
grant execute on function shares_org_with(uuid)  to authenticated;
