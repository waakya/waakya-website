# Rollback — Platform V1

The release is two things that roll back separately: the Vercel deployment
(the application) and migrations 0030–0040 (the schema). Roll the application
back first; that alone restores the previous behaviour for every user. The
schema is additive and can stay.

## 1. The application (minutes)

Vercel keeps every deployment. Promote the previous production deployment:

```
npx vercel ls --scope team_Um3La59sNDmURuG1DZVbS4Y3           # find the last Phase-1 deployment
npx vercel promote <deployment-url> --scope team_Um3La59sNDmURuG1DZVbS4Y3
```

Or in the dashboard: Deployments → the previous production deployment →
"Promote to Production". DNS and environment variables do not change.

The Phase-1 build (`f7c819e`) runs unchanged against the upgraded schema
with one exception, below.

## 2. The one schema change the old build feels

Migration 0030 removes the `notifications insert` policy: the platform build
writes in-app notifications through `push_user_notification()` instead. The
Phase-1 build inserts into `notifications` directly, so after an application
rollback that insert is refused and in-app notifications stop (email still
goes out; nothing else is affected). Restore the policy from 0022:

```sql
create policy "notifications insert" on notifications for insert with check (
  is_org_member(org_id)
  and exists (
    select 1 from memberships m
     where m.org_id = notifications.org_id and m.user_id = notifications.user_id
  )
);
```

Run it in the SQL editor of `krdmzjjmbrphzcuotfgz` as the service role. Drop
it again (`drop policy "notifications insert" on notifications;`) before the
platform build is re-promoted.

Everything else 0030 tightens (`org update` to owners and admins, invite
reads, task message and escalation inserts, anon revokes) only refuses
things the Phase-1 build never did from the client.

## 3. The schema (only if it must go)

Migrations are forward-only; nothing here is undone by hand. If the schema
itself must be reverted, restore the backup taken before `db push`
(Supabase dashboard → Database → Backups → the point-in-time or daily backup
from before the release), then re-point the migration ledger:

```
npx supabase migration repair --status reverted 0030 0031 0032 0033 0034 0035 0036 0037 0038 0039 0040 --project-ref krdmzjjmbrphzcuotfgz
```

A restore loses every row written after the backup, in every table, so it is
the last resort and needs the owner's decision.

## 4. The scheduler

The SLA tick (`/api/cron/sla`) is unchanged in shape; the platform build also
runs the automation engine inside it. Rolling the application back simply
stops automation rules from running. Nothing to change in pg_cron or Vault.

## 5. Verifying a rollback

1. https://waakya.com/ answers 200 and shows the sign-in door.
2. Sign in as the owner of a real business; Today loads with the right counts.
3. Create a task, acknowledge it as staff, and see the in-app notification
   arrive (this is the check for §2).
