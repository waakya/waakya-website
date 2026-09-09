# Waakya

**Bolo. Ho jayega.** — an Indian SMB owner assigns work to their team, and the
work comes back with a record: every task has a deadline, has to be
acknowledged, and escalates to the owner if it is not.

The brand and the screens were designed before the code. `CLAUDE.md` is the
spec, `Waakya_Design_Direction_v1.md` is the reasoning, and
`vaakya-brand-kit/screens/*.png` are the screens this implements.

---

## Running it

```bash
npm install
cp .env.example .env.local     # then fill it in — see below
npm run dev                    # http://localhost:3000
```

### Testing

**Skip login altogether.** Set `DEV_DISABLE_AUTH=true` in `.env.local` and the
proxy signs you in as a seeded user, so every screen is reachable without an
inbox or a password. A small **Owner / Staff** switcher appears in the corner
so both sides of the product can be looked at.

It is refused when `NODE_ENV=production`, exactly like `ALLOW_TEST_LOGIN`, and
nothing in `app/` or `lib/auth/session.ts` knows it exists — it is a
short-circuit in front of the real path. Setting the flag to anything else, or
deleting it, restores normal login with **no code change**. The Playwright
config pins it off, so the suite always exercises the real login.

**Guest login.** Set `ALLOW_GUEST_LOGIN=true` in `.env.local` and the login
screen shows a **Continue as guest** button under *Send code*. It signs you in
as `guest@waakya.test` with no OTP, so every feature can be tried. The first
click on a project creates that user, which needs `SUPABASE_SERVICE_ROLE_KEY`;
after that the key is not needed. A guest starts with no business, so the
first screen is setup. With the flag off, the button does not render and the
action refuses, so the normal login is untouched. Never set it in production.

**Signing in without an inbox.** The MVP mails a six-digit code, which is no
use against a test address. With `SUPABASE_SERVICE_ROLE_KEY` set:

```bash
npm run dev:login                       # owner@waakya.test
npm run dev:login -- staff@waakya.test
```

It prints a single-use link. It is a script, so nothing in `app/` or `lib/`
imports it and it can never be bundled; it also refuses to run when `NODE_ENV`
is production. The link points at the app's own `/auth/confirm` route, which
verifies the token **server-side** so the session lands in cookies — a link
straight to Supabase returns the session in the URL fragment, which never
reaches a server.

`/preview` is the style tile: every primitive, all five ticks states, the whole
chip vocabulary. It is the fastest way to see whether a change broke the kit.

## Environment

| Variable | Needed for | Without it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Everything | The app cannot start |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Everything | The app cannot start |
| `SUPABASE_SERVICE_ROLE_KEY` | The SLA job across every org | An owner can still run a tick for their own business |
| `CRON_SECRET` | The scheduler calling `/api/cron/sla` | Same as above |
| `RESEND_API_KEY`, `RESEND_FROM` | Email notifications | In-app notifications still work; the email is logged, not sent |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Proof photos on Cloudflare R2 | Falls back to a private Supabase Storage bucket (1 GB ceiling) |
| `NEXT_PUBLIC_SITE_URL` | Invite and notification links | Links point at `localhost` |
| `ALLOW_TEST_LOGIN` | The Playwright e2e only | The e2e cannot sign in. **Never set this in production** |
| `ALLOW_GUEST_LOGIN` | The guest button on the login screen | No guest button; normal OTP login only. **Never set this in production** |

`.env.local` is gitignored and must stay that way.

## Database

Every change is a migration in `supabase/migrations`, applied in order. Never
edit the schema by hand.

```
0001_init                    tables, RLS on all of them, scoped by org membership
0002_auth_rate_limit         OTP rate limiting; search_path pinned on the helpers
0003_orgs_invites            invites, create_org(), accept_invite(), and the
                             membership policy fix (see below)
0004_invite_preview_language the invitee's first screen speaks the org's language
0005_task_fields             proof_required, delivered_at, started_at, cancelled_at
0006_notification_dedupe     a unique key so a retried reminder cannot double-send
0007_member_email            org_member_email(), an RPC rather than a column
0008_sla_idempotency         one escalation per task per reason, ever
0009_realtime_notifications  the inbox over Supabase Realtime
0010_proof_storage           the private `proofs` bucket and its policies
0011_checklists              daily routines
```

> **0003 fixes a real hole.** The policy shipped in `0001` allowed
> `insert into memberships … with check (… or user_id = auth.uid())`, which let
> any signed-in user add themselves to any org and read its work. Joining now
> only happens through `create_org()` or `accept_invite()`. `e2e/rls.spec.ts`
> proves it against the live database.

For a fresh project: run each migration in order, then `supabase/seed-e2e.sql`
if you want the test users.

## Testing

```bash
npm run lint        # eslint (next lint was removed in Next 16)
npm run typecheck   # tsc --noEmit
npm run build
npm run test        # Vitest — the pure logic
npm run e2e         # Playwright — the real app against the real database
npm run gate        # all five, in order
```

**Vitest** covers what must never quietly drift: the task state machine, the
SLA maths, Asia/Kolkata's edge cases, the notify fan-out, the checklist
planner, and the brand rules themselves — Haldi appears on exactly one ticks
state and on no other token in the tree, the three dictionaries share one key
shape, and the fixed vocabulary admits no synonyms.

**Playwright** runs against `next dev` and a real Supabase project, including
the whole core path across two browser contexts: create → acknowledge → done →
verify. It signs in through `/api/test-login`, which 404s unless `NODE_ENV` is
not production **and** `ALLOW_TEST_LOGIN` is exactly `"true"`.

`node --env-file=.env.local scripts/reset-demo.mjs` clears the e2e debris and
seeds one realistic day. It only deletes tasks whose title ends in an epoch
timestamp — the shape every generated title has.

## The SLA job

The differentiator. Reminders reach the assignee at 50% and 90% of each window;
a breached clock escalates to the owner.

- `lib/sla/engine.ts` decides *what* should be sent. It is pure: no database,
  no network, no `Date.now()`, so every rule is a test.
- `lib/sla/run.ts` does it, idempotently. Escalations are unique per task per
  reason; every notification carries a key that never changes.
- `POST /api/cron/sla` with `Authorization: Bearer $CRON_SECRET` runs every org
  through the service-role client. A signed-in **owner** hitting the same route
  runs their own org through their own session, which is how the e2e exercises
  it and how the inbox's "Abhi jaanchein" button works. Staff and strangers get
  a 404.
- `supabase/functions/sla-tick` is the scheduler. It holds no logic — the rule
  that decides whether somebody is late should exist once.

```bash
supabase functions deploy sla-tick --no-verify-jwt
supabase secrets set WAAKYA_APP_URL=https://waakya.com CRON_SECRET=<secret>
# then schedule it every 5 minutes
```

## Responsive

One component tree serves every width; a Tailwind breakpoint chooses the
layout, and there is no separate desktop app.

- **Below `lg`** it is the phone product the brand kit designed: a centred
  column, the Neel header, and the bottom nav.
- **From `lg`** `AppShell` swaps the bottom nav for a Neel sidebar, the
  dashboard's counters become their own cards, "Aapke liye" goes two across,
  the day's work becomes a table with named columns, and a right rail carries
  the week's completion and who is on today.
- **`/`** is a marketing landing page for logged-out visitors. A signed-in
  visitor is redirected to their day rather than sold to.

Both layouts are in the DOM at once, hidden by CSS. That is the ordinary cost
of a responsive tree, and it is why the e2e scopes text selectors with
`onScreen()` — a plain selector matches the layout you can see *and* the one
you cannot.

## Structure

```
app/(auth)/          login
app/(app)/           the signed-in app: aaj, kaam/[id], naya, staff, hafta,
                     pehle, khabar, checklists, settings, setup
app/join/[token]     the invite screen — outside (app), so it works signed out
app/api/cron/sla     one tick of the SLA job
components/ui/       primitives, themed to the kit (not shadcn defaults)
components/waakya/   Ticks, Stepper, ClockBars, BottomNav, Bell, TaskRow, Mark
lib/tasks/           the state machine, SLA maths, presentation — all pure
lib/sla/             the reminder and escalation engine
lib/notify/          in-app and email behind one channel interface
lib/checklists/      daily routines
lib/i18n/            हिंदी · Hinglish · English
supabase/migrations/ every schema change, in order
```

## Things worth knowing before changing anything

- **Language defaults.** A signed-out visitor (landing, login, privacy) reads
  English (`VISITOR_LOCALE`) until they use the switch, which sets the
  `waakya_lang` cookie. A signed-in account without a cookie falls back to its
  profile language, then its org's (`orgs.language` defaults to `hi`). The
  page also declares `notranslate`, because Chrome's translator was turning
  the brand name into a dictionary word.

- **Haldi has exactly one job**: the tick that means done and waiting for the
  owner. It is never a button, a chip or a highlight. `lib/brand/rules.test.ts`
  fails the build if that changes.
- **A row shows the ticks glyph or an exception chip, never both**, and always
  states its state in words as well, so nothing depends on colour alone.
- **The dictionary holds formatter functions**, which cannot cross the
  server/client boundary. Client components take a `locale` and call
  `getDictionary()` themselves; the dictionary is never a prop.
- **The brand name is never in the dictionary.** *Waakya* means "sentence" in
  Hindi, so a translated brand name turns the consent line into "I agree to the
  sentence's Privacy Policy". It lives in `lib/i18n/brand.ts` and is
  interpolated; `lib/brand/rules.test.ts` fails the build if it reappears in a
  translated string.
- **The owner cannot acknowledge or accept on a staff member's behalf.** The
  whole product rests on the staff member having said so themselves.
- **There is no voice input in v1.** `createTask()` takes a plain object and is
  deliberately not wired into a form, so a transcript can call it unchanged.
- Next 16: `params`/`searchParams`/`cookies()`/`headers()` are async,
  `middleware.ts` is `proxy.ts`, and `next lint` is gone. When training data
  and `node_modules/next/dist/docs/` disagree, the installed docs win.

## Deploying

Vercel, with the environment above; the step-by-step is in `GOLIVE.md`.
Vercel **Hobby forbids commercial use** — move to Pro before charging anyone
(STACK.md). Point `waakya.com` at it and set `NEXT_PUBLIC_SITE_URL` to the
real origin. Never set `ALLOW_TEST_LOGIN` or `DEV_DISABLE_AUTH` there; both
are refused in production anyway.

**The SLA job** is scheduled from Supabase, not Vercel: migration
`0014_sla_schedule.sql` enables pg_cron and pg_net and posts to
`/api/cron/sla` every five minutes with `Authorization: Bearer $CRON_SECRET`.
The URL and the secret live in Supabase Vault (`sla_tick_url`, `cron_secret`,
see the migration's header), so `CRON_SECRET` must be the same value in the
Vercel project. Vercel Hobby only runs its own crons once a day; on Pro the
same route can be scheduled from `vercel.json` instead. The route also
accepts GET for that case.

See `BLOCKERS.md` for what is still waiting on an account or a key.
