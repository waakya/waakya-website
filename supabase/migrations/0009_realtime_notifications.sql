-- Realtime for the inbox, so a staff phone pings when work arrives rather than
-- when the screen next happens to be refreshed. RLS still applies to realtime,
-- so a subscriber only ever receives their own rows.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;
