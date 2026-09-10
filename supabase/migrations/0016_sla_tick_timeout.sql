-- 0016: give the SLA tick two minutes instead of thirty seconds.
--
-- A tick that scans several businesses from a function on another continent
-- ran past pg_net's 30 s and was logged as timed out even though the app
-- finished the work. The job is idempotent, so a slow tick is harmless, but
-- the record should say what actually happened. Same job, same secrets, only
-- the timeout changes.

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
    timeout_milliseconds := 120000
  )
  where exists (select 1 from vault.decrypted_secrets where name = 'sla_tick_url')
    and exists (select 1 from vault.decrypted_secrets where name = 'cron_secret')
  $job$
);
