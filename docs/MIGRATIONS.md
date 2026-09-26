# Migrations — numbering and release procedure

## Numbering

| Range | Owner | State |
|---|---|---|
| 0001–0022 | Phase 1 | Applied to production (`krdmzjjmbrphzcuotfgz`); ledger verified 2026-09-26 |
| 0023–0029 | Reserved: `feature/ai-voice-local` (frozen, local-only 0023–0025) | Never applied to production; never merge without renumbering |
| 0030–0040 | Platform V1 | 0030 foundation, 0031 CRM, 0032 records, 0033 projects container, 0034 customer experience, 0035 vendors, 0036 automation, 0037 website integration, 0038 campaigns, 0039 custom domains, 0040 exact counts |

Rules:
- Four-digit sequential prefix, snake_case name, one concern per file.
- Every file re-runnable where the objects allow it: `if not exists`, `drop … if exists` before `create policy`/`create trigger`, `create or replace function`, enum guards.
- Every new function: `security definer set search_path = public, pg_temp`, then `revoke all … from public, anon` and an explicit grant. Supabase grants EXECUTE on new public functions to `anon` by default; 0030 closes that for Phase 1.
- Every tenant table: `org_id`, RLS enabled, read/write policies that agree with the server action.
- Regenerate `lib/supabase/types.ts` with `scripts/gen-types.sh` after every migration.

## Verifying before production

1. `npx supabase db reset` (clean database, every migration, the seed) — green.
2. Upgrade path: dump the production schema (`supabase db dump --linked -s public`), load it into a scratch database, apply only the new files, compare with the clean result.
3. `npx supabase migration list --project-ref krdmzjjmbrphzcuotfgz` shows exactly 0001–0022 before pushing.

### Verified 2026-09-26 (Platform V1 release)

- Clean database: `supabase db reset` applies 0001–0040 and the e2e seed; unit (292), integration (55) and e2e suites green on it.
- Upgrade path: `supabase db reset --version 0022` then `supabase migration up` (0030–0040) dumps a `public` schema identical to the clean build (0 diff lines).
- Production drift: `supabase db dump --project-ref krdmzjjmbrphzcuotfgz -s public` diffed against a local build of 0001–0022 differs only in platform-managed extension lines and the realtime publication. No hand edits in production.
- Backup before push: schema, data and roles dumped to `~/waakya-backups/2026-09-26-pre-platform-v1/` (the project has no automated backups on its plan; PITR is off).
- Ledger before push: production reports exactly 0001–0022; `db push --dry-run` lists exactly 0030–0040.

## Applying to production

```
export SUPABASE_ACCESS_TOKEN=…   # from ~/Desktop/waakya/.env.tokens, never echoed
npx supabase db push --project-ref krdmzjjmbrphzcuotfgz --dry-run
npx supabase db push --project-ref krdmzjjmbrphzcuotfgz
```

## Rollback

Migrations are forward-only. Before pushing, take a backup (Supabase dashboard → Database → Backups, or `supabase db dump --linked`). The application release is rolled back by re-promoting the previous Vercel deployment; the new tables are additive and unused by the old build, so the schema can stay while the app is rolled back. Only 0030's policy tightening and the `notifications` insert policy removal touch Phase-1 paths; the old build's in-app channel insert would fail under the new policy, so if the app is rolled back the compensating SQL in `docs/ROLLBACK.md` restores that one policy.
