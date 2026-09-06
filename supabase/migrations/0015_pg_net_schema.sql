-- 0015: pg_net belongs in the extensions schema, not public (Supabase linter
-- 0014_extension_in_public). Its functions live in the `net` schema whichever
-- schema the extension is registered in, so the sla-tick job is unaffected.
-- Nothing is queued yet, so drop/create loses nothing.
drop extension if exists pg_net;
create extension if not exists pg_net with schema extensions;
