# Deploying tonight's build

Everything below is ready and verified locally. I could not run these myself:
every Vercel and production-network command in this session was refused by the
permission layer, four times in a row. They are the only human-only steps.

## What is already true

- Both migrations are applied to the **new** database `krdmzjjmbrphzcuotfgz`
  (Mumbai): attendance, leave, holidays, plus the conversations schema.
- That database is production-ready: row level security on every new table,
  the escalation job active, and both vault secrets present.
- The code is committed on `main` and builds clean.
- The live site still runs on the **old** database `uobhyxelmdissxsdzznq`,
  which does **not** have the attendance tables.

That last point is the whole reason the two steps below go together. Deploying
the code without switching the database would give you an attendance screen
with nothing behind it.

## Step 1 — point production at the new database

Three variables on the project that serves waakya.com. The two public ones must
be added as `config`, not as secrets, or the build cannot inline them.

```bash
cd /private/tmp/wk-build && vercel env ls production --scope team_Um3La59sNDmURuG1DZVbS4Y3
```

Then, for each of `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
and `SUPABASE_SERVICE_ROLE_KEY`, remove the old value and add the new one. The
values are in `app/.env.local`, already pointing at the new database.

```bash
vercel env rm NEXT_PUBLIC_SUPABASE_URL production -y --scope team_Um3La59sNDmURuG1DZVbS4Y3
vercel env add NEXT_PUBLIC_SUPABASE_URL production --type config \
  --value "https://krdmzjjmbrphzcuotfgz.supabase.co" --yes \
  --scope team_Um3La59sNDmURuG1DZVbS4Y3
```

Repeat for the anon key with `--type config`, and for the service role key
without it (that one stays a secret).

## Step 2 — deploy

```bash
cd /private/tmp/wk-build && vercel deploy --prod --yes
```

Deploy from that folder, not from the repo. Builds in the repo folder hang for
tens of minutes because of the disk problem; this copy builds in seconds and
carries the same code.

## Step 3 — check it actually works

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://waakya.com/login
curl -s -o /dev/null -w "%{http_code}\n" https://waakya.com/hazri
```

Login should return 200, and `/hazri` should redirect (307) because you are
signed out. Then sign in and confirm: the day's punch card, the leave balance,
and, as an owner, the team list underneath.

## What you are accepting when you switch

Your existing business on the old database, "Digit Global Services", stays
there. It is not deleted, but the live site stops seeing it, and you sign in to
an empty workspace until you create a business again. The demo business
"UrbanNest Interiors" is already seeded on the new database.

If you would rather not accept that tonight, do **not** run step 1. The site
keeps working exactly as it does now, and tonight's attendance work waits.

## Before real customers

Three demo accounts exist on the new database for testing: `owner@waakya.test`,
`staff@waakya.test`, `noorg@waakya.test`, plus `third@waakya.test`. Their
passwords are fixed in `supabase/seed-e2e.sql`. Delete these before showing the
product to anyone outside the team.
