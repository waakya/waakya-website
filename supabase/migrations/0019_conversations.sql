-- Phase 1. Internal conversations, and the one action that makes Waakya
-- different from a chat app: turning a message into work somebody owns.
--
-- Scope is deliberately one business and its team. Nothing here knows about a
-- second organisation; when external collaborators arrive they join a
-- conversation as participants, which is why membership lives in its own table
-- rather than being implied by the org.
--
-- The same three rules as attendance: the caller's membership decides the org,
-- the tables carry read policies only, and every write goes through a
-- security-definer function.

do $$ begin
  create type conversation_kind as enum ('direct','group');
exception when duplicate_object then null; end $$;

create table if not exists conversations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  kind        conversation_kind not null default 'direct',
  title       text,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now(),
  -- Bumped on every message, so the list sorts by what is actually happening.
  last_message_at timestamptz not null default now(),
  constraint group_needs_title check (kind = 'direct' or btrim(coalesce(title,'')) <> '')
);
create index if not exists idx_conversations_org on conversations(org_id, last_message_at desc);

create table if not exists conversation_participants (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  last_read_at    timestamptz,
  joined_at       timestamptz not null default now(),
  unique (conversation_id, user_id)
);
create index if not exists idx_participants_user on conversation_participants(user_id);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  author_id       uuid not null references auth.users(id),
  body            text not null,
  created_at      timestamptz not null default now(),
  constraint message_not_empty check (btrim(body) <> '')
);
create index if not exists idx_messages_conversation on messages(conversation_id, created_at desc);

-- A task born in a conversation keeps its origin, so the answer to "where was
-- this agreed?" is one click rather than a memory.
alter table tasks add column if not exists source_message_id uuid
  references messages(id) on delete set null;
create index if not exists idx_tasks_source_message on tasks(source_message_id)
  where source_message_id is not null;

-- ---------- Who may see a conversation ----------
create or replace function is_conversation_participant(p_conversation uuid)
returns boolean as $$
  select exists (
    select 1 from conversation_participants p
     where p.conversation_id = p_conversation and p.user_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public, pg_temp;

alter table conversations              enable row level security;
alter table conversation_participants  enable row level security;
alter table messages                   enable row level security;

drop policy if exists "conversations read" on conversations;
create policy "conversations read" on conversations for select
  using (is_conversation_participant(id));

drop policy if exists "participants read" on conversation_participants;
create policy "participants read" on conversation_participants for select
  using (user_id = auth.uid() or is_conversation_participant(conversation_id));

drop policy if exists "messages read" on messages;
create policy "messages read" on messages for select
  using (is_conversation_participant(conversation_id));

-- ---------- Writes ----------
-- One direct conversation per pair, whoever opens it first.
create or replace function start_direct_conversation(p_org uuid, p_other uuid)
returns conversations as $$
declare
  me uuid := auth.uid();
  found_id uuid;
  row_out conversations;
begin
  if not is_org_member(p_org) then
    raise exception 'not a member of this business' using errcode = '42501';
  end if;
  if p_other = me then
    raise exception 'choose somebody else' using errcode = '22023';
  end if;
  if not exists (select 1 from memberships m where m.org_id = p_org and m.user_id = p_other) then
    raise exception 'that person is not in this business' using errcode = '42501';
  end if;

  select c.id into found_id
    from conversations c
    join conversation_participants a on a.conversation_id = c.id and a.user_id = me
    join conversation_participants b on b.conversation_id = c.id and b.user_id = p_other
   where c.org_id = p_org and c.kind = 'direct'
   limit 1;

  if found_id is not null then
    select * into row_out from conversations where id = found_id;
    return row_out;
  end if;

  insert into conversations (org_id, kind, created_by)
  values (p_org, 'direct', me) returning * into row_out;

  insert into conversation_participants (conversation_id, org_id, user_id)
  values (row_out.id, p_org, me), (row_out.id, p_org, p_other);

  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

create or replace function post_message(p_conversation uuid, p_body text)
returns messages as $$
declare
  row_out messages;
  org uuid;
begin
  if not is_conversation_participant(p_conversation) then
    raise exception 'not in this conversation' using errcode = '42501';
  end if;
  if btrim(coalesce(p_body,'')) = '' then
    raise exception 'write something first' using errcode = '22023';
  end if;

  select c.org_id into org from conversations c where c.id = p_conversation;

  insert into messages (conversation_id, org_id, author_id, body)
  values (p_conversation, org, auth.uid(), left(btrim(p_body), 4000))
  returning * into row_out;

  update conversations set last_message_at = now() where id = p_conversation;
  -- Posting counts as reading your own message.
  update conversation_participants set last_read_at = now()
   where conversation_id = p_conversation and user_id = auth.uid();

  return row_out;
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

create or replace function mark_conversation_read(p_conversation uuid)
returns void as $$
begin
  if not is_conversation_participant(p_conversation) then
    raise exception 'not in this conversation' using errcode = '42501';
  end if;
  update conversation_participants set last_read_at = now()
   where conversation_id = p_conversation and user_id = auth.uid();
end $$ language plpgsql volatile security definer set search_path = public, pg_temp;

-- ---------- Grants ----------
revoke all on function is_conversation_participant(uuid)      from public;
revoke all on function start_direct_conversation(uuid, uuid)  from public;
revoke all on function post_message(uuid, text)               from public;
revoke all on function mark_conversation_read(uuid)           from public;

grant execute on function is_conversation_participant(uuid)     to authenticated;
grant execute on function start_direct_conversation(uuid, uuid) to authenticated;
grant execute on function post_message(uuid, text)              to authenticated;
grant execute on function mark_conversation_read(uuid)          to authenticated;
