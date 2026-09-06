-- 0014: schedule the SLA tick from inside Supabase.
--
-- Vercel Hobby only runs crons once a day, so the five-minute tick is asked
-- for from here instead: pg_cron fires, pg_net POSTs to the app's
-- /api/cron/sla with the scheduler's bearer, and the app does the work with
-- the service role. The job is idempotent on the app side, so an overlapping
-- or retried tick changes nothing.
--
-- The URL and the bearer are NOT in this file. They live in Vault, created
-- once by hand (never committed):
--   select vault.create_secret('https://<host>/api/cron/sla', 'sla_tick_url');
--   select vault.create_secret('<CRON_SECRET>',                'cron_secret');
-- Until both exist the job runs and does nothing.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Re-runnable: replace any earlier schedule of the same name.
select cron.unschedule('sla-tick')
where exists (select 1 from cron.job where jobname = 'sla-tick');

select cron.schedule(
  'sla-tick',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'sla_tick_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  )
  where exists (select 1 from vault.decrypted_secrets where name = 'sla_tick_url')
    and exists (select 1 from vault.decrypted_secrets where name = 'cron_secret')
  $job$
);
