-- The SLA job runs every few minutes and may be retried. Without a key, a
-- retry sends the 50% reminder twice, which is exactly the kind of nagging
-- that makes staff mute an app (CLAUDE.md §6, idempotency).
alter table notifications add column if not exists dedupe_key text;

-- Partial, so ordinary notifications without a key are unaffected.
create unique index if not exists idx_notifications_dedupe
  on notifications(dedupe_key) where dedupe_key is not null;
