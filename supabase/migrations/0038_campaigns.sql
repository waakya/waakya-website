-- 0038 — Campaigns: approved messages to chosen customers, and what came back.
--
-- Not a blaster (spec §11). A campaign names a segment, a channel and an
-- approved template; sending writes one recipient row per person before a
-- single message leaves, suppresses anyone who opted out or has no address,
-- records each delivery or failure, and files every reply into the CRM.
-- Recipient rows are unique per campaign and contact, so a resumed send
-- never messages anyone twice.

create table if not exists campaigns (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  name         text not null,
  channel      text not null,
  template_id  uuid references message_templates(id) on delete set null,
  subject      text,
  body         text,
  segment      jsonb not null default '{}'::jsonb,
  status       text not null default 'draft',
  scheduled_at timestamptz,
  started_at   timestamptz,
  finished_at  timestamptz,
  counts       jsonb not null default '{}'::jsonb,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint campaign_name    check (length(btrim(name)) between 1 and 120),
  constraint campaign_channel check (channel in ('email','whatsapp')),
  constraint campaign_status  check (status in ('draft','scheduled','sending','sent','partially_failed','cancelled')),
  constraint campaign_segment check (jsonb_typeof(segment) = 'object')
);
create index if not exists idx_campaigns_org on campaigns(org_id, created_at desc);

drop trigger if exists trg_campaigns_updated on campaigns;
create trigger trg_campaigns_updated before update on campaigns
  for each row execute function set_updated_at();

create table if not exists campaign_recipients (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references orgs(id) on delete cascade,
  campaign_id         uuid not null references campaigns(id) on delete cascade,
  contact_id          uuid not null references crm_contacts(id) on delete cascade,
  address             text,
  status              text not null default 'queued',
  provider            text,
  provider_message_id text,
  error               text,
  sent_at             timestamptz,
  delivered_at        timestamptz,
  replied_at          timestamptz,
  created_at          timestamptz not null default now(),
  constraint recipient_status check (status in ('queued','sent','delivered','failed','replied','suppressed')),
  unique (campaign_id, contact_id)
);
create index if not exists idx_recipients_campaign on campaign_recipients(campaign_id, status);
create index if not exists idx_recipients_contact  on campaign_recipients(contact_id, created_at desc);
create index if not exists idx_recipients_provider on campaign_recipients(provider_message_id) where provider_message_id is not null;

create table if not exists inbound_messages (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references orgs(id) on delete cascade,
  channel             text not null,
  provider            text not null,
  provider_message_id text not null,
  from_address        text not null,
  body                text,
  contact_id          uuid references crm_contacts(id) on delete set null,
  campaign_id         uuid references campaigns(id) on delete set null,
  received_at         timestamptz not null default now(),
  raw                 jsonb not null default '{}'::jsonb,
  constraint inbound_channel check (channel in ('email','whatsapp')),
  unique (provider, provider_message_id)
);
create index if not exists idx_inbound_org on inbound_messages(org_id, received_at desc);
create index if not exists idx_inbound_contact on inbound_messages(contact_id) where contact_id is not null;

do $$ begin
  alter table crm_activities add constraint crm_activities_campaign_fk foreign key (campaign_id) references campaigns(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------ RLS --

alter table campaigns           enable row level security;
alter table campaign_recipients enable row level security;
alter table inbound_messages    enable row level security;

drop policy if exists "campaigns read"   on campaigns;
drop policy if exists "campaigns write"  on campaigns;
drop policy if exists "campaigns update" on campaigns;
drop policy if exists "campaigns delete" on campaigns;
create policy "campaigns read"   on campaigns for select using (is_org_member(org_id));
create policy "campaigns write"  on campaigns for insert with check (is_org_admin(org_id) and org_module_enabled(org_id, 'campaigns') and created_by = auth.uid());
create policy "campaigns update" on campaigns for update using (is_org_admin(org_id) and status in ('draft','scheduled')) with check (is_org_admin(org_id));
create policy "campaigns delete" on campaigns for delete using (is_org_admin(org_id) and status = 'draft');

drop policy if exists "recipients read" on campaign_recipients;
create policy "recipients read" on campaign_recipients for select using (is_org_member(org_id));
-- Recipients and inbound rows are written by the sender and the webhook (service role).

drop policy if exists "inbound read" on inbound_messages;
create policy "inbound read" on inbound_messages for select using (is_org_member(org_id));

-- Sending and status changes past 'scheduled' happen only through the
-- application with the service role, so a client cannot mark a campaign
-- sent or rewrite its counts.

create or replace function events_on_campaign() returns trigger as $$
begin
  if tg_op = 'UPDATE' and new.status in ('sent','partially_failed') and old.status not in ('sent','partially_failed') then
    insert into domain_events (org_id, event_type, entity_type, entity_id, actor_kind, actor_id, payload)
    values (new.org_id, 'campaign.sent', 'campaign', new.id, 'system', new.created_by,
      jsonb_build_object('title', new.name, 'channel', new.channel, 'sent', coalesce((new.counts ->> 'sent')::integer, 0), 'failed', coalesce((new.counts ->> 'failed')::integer, 0), 'suppressed', coalesce((new.counts ->> 'suppressed')::integer, 0)));
  end if;
  return new;
end $$ language plpgsql security definer set search_path = public, pg_temp;
revoke all on function events_on_campaign() from public, anon, authenticated;

drop trigger if exists trg_events_campaign on campaigns;
create trigger trg_events_campaign after update on campaigns
  for each row execute function events_on_campaign();
