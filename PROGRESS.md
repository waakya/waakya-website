# Vaakya — build progress

Slices from `BUILD_STEPS.md §3`, built strictly in order. Each slice must pass
the gate before the next one starts:

`npm run gate` = lint → tsc --noEmit → next build → Vitest → Playwright e2e

...then a self-audit against the matching `vaakya-brand-kit/screens/*.png` and
the CLAUDE.md §7 "not generated" checklist, then a commit.

| # | Slice | State |
|---|---|---|
| 0 | Theme, fonts, design-system primitives | ✅ done |
| 1 | Supabase clients + email-OTP auth + login | ✅ done |
| 2 | Org onboarding, team invite, RLS, i18n | ✅ done |
| 3 | Create task (Confirm card) + task lists | ✅ done |
| 4 | Task detail + state machine + stepper/clock + thread | ✅ done |
| 5 | SLA reminders + escalation + notifications | ⬜ |
| 6 | Proof of completion | ⬜ |
| 7 | Owner dashboard polish + completion rate | ⬜ |
| 8 | Recurring checklists (only if time) | ⬜ |
| 9 | Ship | ⬜ |

## Decisions taken before the build (confirmed by the owner)

1. **Stack:** keep the installed versions — Next 16.3.4, React 19.2, Tailwind v4
   (CSS-first), Base UI, shadcn 4. `tailwind.tokens.ts` is ported into an
   `@theme` block in `app/globals.css`; there is no `tailwind.config.ts`.
   CLAUDE.md §4 updated to match.
2. **Login:** email OTP with an honest email field, in the Login.png layout and
   copy style. Phone-first design stays ready behind the auth abstraction.
3. **Staff default language:** the org's `orgs.language` (default `hi`,
   Devanagari). Every user can switch; Hinglish is a choice, not the default.
4. **Avatars:** all Neel. Haldi keeps exactly one job — the done tick — even
   though the palette line and the staff PNGs show a Haldi avatar. One-line
   revert documented in `components/ui/avatar.tsx`.
5. **Enum states:** `escalated` / `reassigned` / `cancelled` are real
   transitions but not stepper steps; they map to the chip vocabulary.

---

## Slice 0 — Theme, fonts, design-system primitives ✅

**Built**

- `app/globals.css` — the whole kit as Tailwind v4 `@theme` tokens plus hex
  aliases: Neel/Haldi/Paper/Ink/Hara/Amber/Laal, the three families, radii,
  shadows, tap targets (48/56/60), and the only three animations. Hindi gets
  the Devanagari family and line-height ≥ 1.5; focus rings are Neel 600 at 2px;
  reduced-motion turns the animations off.
- `app/fonts.ts` — Inter, Baloo 2, Noto Sans Devanagari via `next/font`,
  self-hosted at build time, exposed as three CSS variables on `<html>`.
- `app/layout.tsx` — `head-snippet.html` as Next `metadata` + `viewport`
  (theme colour Neel 600, manifest, favicons, apple-web-app), `lang` from the
  request locale, `maximumScale: 5` so text scales to 130%.
- `public/` — favicons, PWA icons, `manifest.webmanifest`, `brand/logo/*.svg`,
  the three notification sounds.
- `lib/i18n` — `Locale` (`hi` | `hi-Latn` | `en`), the `Dictionary` interface
  and all three dictionaries (ticks, stepper, chips, actions, time, priority),
  plus `lib/i18n/server.ts` reading the locale cookie.
- `components/ui/` — Button (variants primary/secondary/outline/ghost/danger/
  dangerSolid; sizes sm/owner 48/staff 56/staffPrimary 60/block/icon),
  StateChip (8 tones, icon + word always), Card, Input, Label, InputOTP (6
  boxes), Switch (Hara when on), Checkbox, ToggleGroup, Sheet (bottom drawer,
  radius 24), Toaster with Undo, Avatar (Neel).
- `components/vaakya/` — **`<Ticks state=… />`**, the signature glyph, built to
  the tokens.css spec (viewBox 0 0 28 20, stroke 3.2, round caps; bars and tick
  coloured per state) with the state word as its accessible name; `Mark` (the
  logo, inline SVG); `NayaDot` (the pulsing new-task dot).
- `app/preview` — the style tile: every primitive, all five ticks states in all
  three scripts, the whole chip vocabulary, cards and rows, icons and scale.
- `lib/brand/rules.test.ts` — the brand rules as tests: Haldi appears on
  exactly one ticks state and on no token anywhere else in the tree; bars never
  turn green except on verified; the three dictionaries share one key shape;
  the fixed vocabulary is kept and "completed/closed/resolved" never appear; no
  emoji, no exclamation marks, no Devanagari numerals; the word "AI" is never
  rendered.
- `e2e/smoke.spec.ts` — the style tile renders every ticks state with its state
  word, and the touch targets really measure 60px and 48px in the browser.
- Test harness: `vitest.config.mts`, `playwright.config.ts` (Pixel 7 viewport,
  runs against `next dev`), `npm run gate`.

**Gate:** lint ✅ · typecheck ✅ · build ✅ · Vitest 10/10 ✅ · Playwright 2/2 ✅

**Self-audit vs `screens/StyleTile.png`:** buttons, chips, ticks row, cards and
rows, inputs, icons and the scale table all match. Neel is the only accent;
Haldi appears only as the done tick; every chip has an icon and a word.

**Deviation on purpose:** avatars are Neel, not Haldi (decision 4).

---

## Slice 1 — Supabase clients, email-OTP auth, login ✅

**Built**

- **Migrations.** `0001_init.sql` is `schema.sql` verbatim, applied to the
  `waakya` Supabase project: nine tables, RLS on every one of them, scoped by
  org membership. `0002_auth_rate_limit.sql` adds OTP rate limiting and pins
  `search_path` on the two `security definer` helpers, so a caller cannot
  shadow `memberships` with a temp table and grant themselves membership.
- **OTP rate limit.** `otp_requests` stores a SHA-256 of the identifier, never
  the address itself. RLS is on with *no policies*, so the table is unreachable
  except through `record_otp_request()`, which counts, always inserts (so
  retrying cannot reset the window) and returns whether the caller may proceed.
  Verified live: 5 allowed, the 6th refused, a malformed digest rejected, and
  the table unreadable by `anon`.
- **Clients.** `lib/supabase/client.ts` (browser), `server.ts` (per-render,
  async `cookies()`), `admin.ts` (service role, `server-only`, returns `null`
  when the key is absent). `proxy.ts` — Next 16's rename of `middleware.ts` —
  refreshes the session and copies Supabase's no-cache headers onto the
  response so a CDN can never serve one user's session to another.
- **Auth abstraction.** `lib/auth/provider.ts` defines `OtpProvider` with
  `sendCode`/`verifyCode` over an `OtpChannel`. Email OTP is the only
  implementation; MSG91 phone OTP is a second one plus a change to
  `activeAuthProvider()`, with no caller touched.
- **Login screen** in the layout of `screens/Login.png`: stacked logo, one
  field, consent line, one primary, the language switch and the staff hint.
  Both forms are `noValidate` so the error the reader sees is ours, in their
  language, rather than the browser's untranslatable bubble.
- **Server actions** `requestOtp` / `verifyOtp` / `setLoginLocale`, all
  zod-validated, all returning `ActionResult`. DPDP consent is required to
  proceed. First login upserts the `profiles` row.
- **Session.** `getViewer()` (React-`cache`d, one round trip per render),
  `requireViewer()`, `requireOrg()`. The auth check lives in the `(app)` layout
  render path, not in the proxy, with RLS as the backstop under both.
- `.env.example`, the app shell, and placeholder `/aaj`, `/setup`, `/privacy`
  so no link on the login screen points at nothing.

**Gate:** lint ✅ · typecheck ✅ · build ✅ · Vitest 10/10 ✅ · Playwright 8/8 ✅

Verified against the live project: sign-in issues a session, `/aaj` bounces a
signed-out visitor to `/login` and a signed-in owner without an org to
`/setup`, and a wrong password is refused.

**Deviations on purpose**

- The field is **email**, not the phone field in `Login.png` (owner decision 2).
  The layout, type scale and copy rhythm are unchanged.
- The consent box starts **unticked**, where the PNG shows it ticked.
  Pre-ticked consent is not consent under the DPDP Act.

**Architecture note.** Dictionaries hold formatter functions, which cannot
cross the server/client boundary. Every client component therefore takes a
`locale` and calls `getDictionary()` itself; the dictionary is never a prop.

---

## Slice 2 — Org onboarding, team invite, RLS, i18n ✅

**A security fix, first.** The schema in `0001` let *any* signed-in user insert
a membership for themselves into *any* org id:

```sql
create policy "membership write" on memberships
  for insert with check (is_org_admin(org_id) or user_id = auth.uid());
```

The second half was there so the creator of an org could add their own owner
row, but it also handed every account a way into every business. Migration
`0003` drops it. Joining now happens only through two security-definer
functions, each of which checks a real reason: `create_org()` writes the org
and its owner membership in one transaction, and `accept_invite()` requires an
unused, unexpired invite token. Proved by `e2e/rls.spec.ts` — the self-insert
is refused with `42501`.

**Built**

- **Migration 0003** — `invites`; `profiles.language`; the membership fix;
  `shares_org_with()` plus a `profiles` policy so co-members can see each
  other's names (without it a task row shows a uuid); `create_org()`,
  `invite_preview()`, `accept_invite()`. **0004** adds the org's language to
  `invite_preview` so the invitee's first screen is already in the language
  they are about to inherit.
- **Setup screen** — one field, and one language control with one meaning.
  Picking the language changes the screen too, so the owner sees what their
  staff will see before committing. That choice becomes `orgs.language`.
- **Team screen** (`/staff`) — members with role chips, pending invites with
  their links recoverable, and an empty state that says what to do next. The
  invite sheet takes a name and a phone and returns a link the **owner** sends
  themselves, because staff join when their boss asks, not when an app does.
- **Join screen** (`/join/[token]`) — outside the protected layout so it works
  signed-out. It shows the business name and the invited name, and nothing
  else: `invite_preview` returns no ids and no phone numbers. A dead or used
  link says what to do next rather than silently redirecting.
- **Settings** — language switch stored on the profile, business, account,
  sign out. **Bottom nav** — four items for owners, three for staff.
- **i18n** — the org, settings and nav vocabulary in all three languages.
  `getLocale()` now falls back to `profile.language`, then `orgs.language`,
  when the cookie is missing, and only pays for the query when a Supabase auth
  cookie is actually present.

**Gate:** lint ✅ · typecheck ✅ · build ✅ · Vitest 10/10 ✅ · Playwright 16/16 ✅

`e2e/rls.spec.ts` talks to PostgREST directly with the publishable key, as a
signed-in user who belongs to no org: eight tables all come back empty, the
membership self-insert is refused, a cross-org task insert is refused, the
rate-limit table is unreadable, and `invite_preview` returns exactly four
columns.

**Notes**

- Navigation that navigates is a `<Link>` styled with `buttonVariants`, not a
  `<Button render={<Link/>}>` — Base UI warns about the latter, and a screen
  reader should hear "link".
- `/login?next=` accepts same-site paths only, so an invite link cannot be
  rewritten to point somewhere else.

---

## Slice 3 — Create task (Confirm card) + task lists ✅

**Reordered on purpose.** `BUILD_STEPS` puts the state machine in Slice 4, but
`createTask` has to write `created → delivered` into `task_events` and the
Confirm card has to do deadline maths, so `lib/tasks` was built here in full
and unit-tested. Slice 4 builds the UI on top of it rather than the logic.

**Built**

- **`lib/tasks/state-machine.ts`** — pure. The six-step ladder, plus the three
  exceptions as owner decision 5 specifies: `escalated` is reachable from any
  active state before `done` and can resume (nothing is a dead end, and Late is
  explicitly never one); `reassigned` is recorded as an event but *settles* to
  `delivered` so the clocks restart for the new person; `cancelled` is terminal.
  `transition()` returns both what the row becomes and what the audit trail
  says, which differ only for a reassignment.
- **`lib/tasks/sla.ts`** — two clocks, Neel → Amber at 50% → Laal at 90% or
  breach, with a met clock stopping where it stopped and turning green.
  Reminders are absolute instants, not recomputed percentages, so a job that
  runs late still owes the earlier reminder instead of skipping it.
- **`lib/tasks/time.ts`** — everything in Asia/Kolkata, with the offset
  measured rather than assumed, and Latin digits pinned via `-u-nu-latn`.
- **`lib/tasks/deadlines.ts`** — the three chips. "Aaj 5:00 pm" rolls to
  tomorrow once 5 pm has passed, because a deadline in the past is a trap.
- **`lib/tasks/present.ts`** — the glyph-or-chip decision and the meta line, as
  a pure function. Order: Cancelled, Late, Escalated, Dekha nahi, Verify baaki,
  then the glyph. The meta line always states the state in words.
- **`lib/tasks/create.ts`** — `createTask()`, the single entry point. It takes
  a plain object and is deliberately not wired into a form, so a voice
  transcript can call it unchanged. Writes the task as `delivered`, records
  both `created` and `delivered` events, and notifies the assignee.
- **`lib/notify`** — `notify(message, channels)` with in-app and email
  implementations behind one `NotifyChannel` interface; WhatsApp is a third
  entry and no caller changes. Channels are independent: a failing email never
  loses the in-app record. Copy is the munshi's, name before verb.
- **Migrations** `0005` (proof_required, delivered_at, started_at,
  cancelled_at, two indexes), `0006` (a partial unique index on
  `notifications.dedupe_key`, so a retried reminder cannot double-send), `0007`
  (`org_member_email()` — an RPC rather than a `profiles.email` column, so a
  colleague's address does not fall out of every profile read).
- **Screens** — the Confirm card at `/naya` (six rows, sheets for the two that
  need typing, `Bhejo` the only primary); the owner's day and the staff My
  Tasks list, one route branching on role.

**Gate:** lint ✅ · typecheck ✅ · build ✅ · Vitest **110/110** ✅ · Playwright 20/20 ✅

**Deviation on purpose.** The Confirm card has no "Aapki awaaz" row and no
"Phir se bolo": there is no voice in v1, and a player for audio that does not
exist would be a lie. Both return in the same slot with voice capture. The
mic's place and prominence on the dashboard is held by "Naya kaam" (D-10).

---

## Slice 4 — Task detail, transitions, stepper and thread ✅

**Built**

- **`lib/tasks/authz.ts`** — who may move a task, and where, as a pure function
  separate from the state machine. A transition can be legal for the task and
  still not be this person's to make. The assignee walks their own work down
  the ladder and may decline; the owner verifies, sends back, reassigns and
  cancels, and **cannot acknowledge or accept on the staff member's behalf** —
  the whole product rests on the staff member having said so themselves.
- **`lib/tasks/transition.ts`** — `moveTask()` checks three things in three
  places: legal for the task, this person's to make, and the row is still in
  the state the caller thought (`.eq("state", from)`), so two taps or two
  devices cannot apply the same move twice. Every move writes a `task_events`
  row and notifies the other side. `reassignTask()` restarts both clocks and
  clears the previous person's progress. `changeDeadline()` records the moved
  clock in the trail even though it is not a state change.
- **`components/vaakya/stepper.tsx`** — the six steps and the two clock bars,
  **the same component on both task detail screens** (D-06), with the bars as
  real `progressbar` roles carrying `aria-valuetext`, so the clock is
  announced, not just coloured.
- **Owner task detail** (`screens/TaskOwner.png`): stepper and clocks first,
  then the instruction, then the timeline, then five equal actions with Call
  primary — and Verify promoted above them when the work is waiting on the
  owner, which is the one moment they are the bottleneck.
- **Staff task detail** (`screens/TaskStaff.png`): the owner's name above the
  title, the deadline in a Neel band, **one 60px button**, two quieter ones,
  and the line that says every step is on record.
- **Reply thread** on `task_messages`, both sides timestamped.
- `remindAction()` — "Yaad dilao" sends a real reminder and is deliberately
  *not* a transition: nudging must never move a task or restart a clock.

**Gate:** lint ✅ · typecheck ✅ · build ✅ · Vitest **130/130** ✅ · Playwright **24/24** ✅

`e2e/core-loop.spec.ts` runs the whole path across two real browser contexts —
create → acknowledge → accept → in progress → done → verify — plus a verified
task refusing to move again, a decline landing with the owner rather than
dying, and the thread recording both sides.

**Two design decisions taken during the build**

1. **"Dekh liya, ho jayega" is one tap and two facts.** `screens/TaskOwner.png`
   shows *Dekha 10:05* and *Maana 10:05* at the same timestamp, which is
   exactly what that button means: seen, and committed to. Two buttons with the
   same words would have been a UI wart, so the action writes both events.
   *Shuru kiya* moves to the secondary row, and going straight from accepted to
   done stays legal — staff who just do the thing are not an error.
2. **The bottom action bar is `fixed`, not `sticky`.** A sticky bar inside the
   screen's flex column did not pin reliably under mobile emulation, leaving
   the primary action below the fold. A primary action that can slip off-screen
   is the one thing this screen cannot get wrong.

**Bug found and fixed by the tests:** `created` and `delivered` are written
together and both read "Bheja", so the timeline showed the same line twice.
The trail keeps both rows; the reader sees one.
