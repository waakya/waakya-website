# Waakya — build progress

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
| 5 | SLA reminders + escalation + notifications | ✅ done |
| 6 | Proof of completion | ✅ done |
| 7 | Owner dashboard polish + completion rate | ✅ done |
| 8 | Recurring checklists | ✅ done |
| 9 | Ship | ✅ done |

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

---

## Slice 5 — SLA reminders, escalation and the inbox ✅

The differentiator. Everything here is keyed, because a job that runs every
five minutes and nags twice is worse than no job at all.

**Built**

- **`lib/sla/engine.ts`** — pure. Given the tasks, the org and the time, it
  returns what should be sent. Reminders to the assignee at 50% and 90% of each
  window; escalation to the owner when either clock runs out. Reminders are
  compared against absolute instants, so a job that runs late still owes the
  earlier reminder rather than skipping it.
- **Quiet hours** wrap midnight (21:00–08:00 is the night, not a nineteen-hour
  window). During them the escalation **row is still written** — the record has
  to be true at 11pm — and only the message waits until morning, where the
  dedupe key makes it arrive once.
- **`lib/sla/run.ts`** — one tick. Unique `(task_id, reason)` on escalations,
  a stable dedupe key on every notification, and a single up-front query for
  which messages already went out.
- **`/api/cron/sla`** — two ways in. The scheduler with `CRON_SECRET` runs
  every org through the service-role client; a signed-in **owner** runs their
  own org through their own session and therefore through RLS. Staff and
  strangers get a 404. Both paths are idempotent, so an owner tapping twice
  changes nothing.
- **`supabase/functions/sla-tick`** — the Edge Function scheduler. It holds no
  logic on purpose: duplicating the rule that decides whether somebody is late
  into Deno would mean two copies of it.
- **The inbox** (`/khabar`), the **bell** with a counted badge (a number and an
  accessible name, never a bare red dot), and **live notifications** over
  Supabase Realtime — RLS applies to realtime too, so only your own rows
  arrive. Each of the three sounds is bound to one moment; reminders make none,
  which is what keeps the three meaningful.

**Gate:** lint ✅ · typecheck ✅ · build ✅ · Vitest **161/161** ✅ · Playwright **29/29** ✅

**Decision: an SLA breach does not change `task.state`.** `escalated` stays for
an explicit "nahi ho payega", which genuinely needs a person. A breach is a
*condition* derived from the clocks, and the design already has words for it —
*Dekha nahi* and *Late* (§3.3). Writing it into the state would hide how far
the work had actually got, and would replace the precise chip with a vaguer one.

**Two bugs found by running it rather than reading it**

1. *The summary lied.* It counted a deduplicated message as a send, so a tick
   that did nothing looked busy. It now reports `alreadySent` separately —
   which is also how you see idempotency working.
2. *The job got slower every week.* Recorded escalations were re-attempted on
   every tick for ever, so a business with one bad month would carry the cost
   permanently. Retries are now bounded to 24 hours (long enough to outlast a
   quiet-hours hold-back), already-sent keys are fetched in one query rather
   than discovered one failed insert at a time, and addresses are looked up
   once per person per tick. A steady-state tick went from ~15s to ~4s.

---

## Slice 6 — Proof of completion ✅

**Built**

- **`lib/storage`** — one `ProofStorage` interface with two drivers. **R2** is
  the intended home (10 GB, no egress charge) and is used whenever its four
  environment variables are present; otherwise a **private Supabase Storage
  bucket** takes over. Both are private, both hand out only short-lived signed
  URLs, so which one is in use is an environment question and no caller knows.
- **Keys carry the org**: `orgs/<org_id>/tasks/<task_id>/<uuid>.<ext>`, because
  membership of the org in the key *is* the access rule. The storage policies
  read it with `storage_org_id()`, and `orgIdFromKey()` refuses anything not
  shaped that way, so a caller cannot attach a file from another business or
  climb out of the folder with `../`.
- **`requestProofUpload`** — the server picks the key and checks the type
  against an allowlist, so the browser can only put a photo or a voice note,
  only inside its own org's folder, only for 60 seconds. The file goes straight
  from the phone to storage; the app never handles the bytes.
- **The proof sheet** (`screens/Proof.png`): the camera tile first, thumbnails
  with a green tick as they are taken, writing as the alternative, one primary
  *Bhejein · ho gaya*, and the line that says the proof is on record.
- **Finishing asks for the proof first.** "Ho gaya" opens the sheet rather than
  closing the task — a task marked done with the photo still to come is exactly
  the gap this product exists to close. When the owner did not ask for one,
  *Bina proof ke* is offered; when they did, it is not.
- **The proof list** on both task detail screens, so the owner verifies against
  what was actually sent rather than against a claim.

**Gate:** lint ✅ · typecheck ✅ · build ✅ · Vitest **166/166** ✅ · Playwright **32/32** ✅

`e2e/proof.spec.ts` uploads a real PNG through the signed URL, checks the
owner's copy is served through a signed link rather than a public key, and
proves the bucket is closed: somebody in no org can neither list it nor write
into another business's folder.

**Voice note, not voice input.** A recorded file can be *uploaded* as a proof.
There is still no voice capture in v1 — that is a different feature, and it
lands with the Boliye screen.

---

## Slice 7 — Owner dashboard, week and history ✅

**Built**

- **`lib/tasks/counters.ts`** — pure. The four header numbers count *today's*
  work and read as a funnel: a verified task was also done, also seen, also
  sent, so `bheje ≥ dekhe ≥ ho gaye ≥ verified` always holds. A cumulative
  all-time count would only go up and stop meaning anything by week two. The
  two chips deliberately look at **all** open work, because a task that went
  late yesterday is still late.
- **The completion rate** is verified out of sent, and is `null` — shown as
  nothing — before anything has been sent, rather than a flattering 0%.
- **`needsYou()`** — the "Aapke liye" list, most pressing first: late,
  escalated, unseen, then waiting to be verified. Each task appears once, with
  one reason.
- **The Neel 700 header** (D-09) with the greeting, four Baloo counters with
  tabular figures, and Late and Dekha nahi as chips inside it. Staff screens
  still have no coloured header and no counters at all.
- **"Aapke liye" cards** with the actions inline — Call, Yaad dilao, Kisi aur
  ko, or Verify and Dekhein — so the owner acts from the list instead of
  navigating into a task to find a button.
- **The primary floats above a fade** (D-10), holding the mic's place and
  prominence until voice capture ships.
- **`/hafta`** groups the coming week by the day work is due; **`/pehle`** is
  the staff member's record of what they have already done, newest first —
  the thing that makes the app worth keeping rather than only worth obeying.

**Gate:** lint ✅ · typecheck ✅ · build ✅ · Vitest **180/180** ✅ · Playwright **37/37** ✅

**A tooling failure worth recording.** Installing two packages mid-build left
`node_modules` inconsistent: Playwright's runner threw on a `playwright-core`
internal, and then the `next` CLI began exiting 0 with no output at all — no
build, no dev server, no version string. A partial reinstall did not fix it;
`rm -rf node_modules .next && npm ci` did. Nothing in the app was wrong, but it
cost a full gate cycle to find, and it is why `npm ci` is the right command in
CI.

**Note on the lists.** Both owner lists now carry an accessible name — *Aapke
liye*, *Aaj*, *Ho gaya* — because an escalated task legitimately appears both
as a card and as a row, and neither the tests nor a screen reader should have
to guess which one they are looking at.

---

## Slice 8 — Recurring checklists ✅

Built, not cut. It is the retention hook: once the morning routine sends
itself, the app is part of opening the shop rather than something to remember.

**Built**

- **The template is not a second kind of task.** A checklist produces *real*
  tasks, one per item per day, so the clocks, the ticks, escalation, proof and
  the audit trail all work on them unchanged.
- **`lib/checklists/plan.ts`** — pure, and deliberately dull: the interesting
  property is that running it a hundred times a day produces the same handful
  of tasks once. It waits for the checklist's hour (a 9am routine should not be
  in somebody's list at 6am), reckons the day in Asia/Kolkata, and skips a
  paused checklist, one with nobody to send it to, one with no items, and one
  whose hour cannot be read.
- **Generation rides on the SLA tick** rather than having a scheduler of its
  own: both want to run every few minutes, both are idempotent, and one job is
  one thing to keep alive. A unique index on `(checklist_item_id,
  checklist_date)` is the backstop if two ticks ever race.
- **The staff card** (`screens/MyTasks.png`): one card with a Hara progress bar
  and the fraction written beside it, and its member tasks are taken out of the
  loose sections so the routine reads as one thing.
- **The owner's editor** at `/checklists`, reached from Settings so the nav
  stays at four items. Pause, resume, delete. Deleting a template leaves the
  tasks it already produced alone — `on delete set null` — because yesterday's
  record must not disappear because today's template changed.

**Gate:** lint ✅ · typecheck ✅ · build ✅ · Vitest **193/193** ✅ · Playwright **40/40** ✅

The e2e sets a routine up through the UI, runs the job, checks a second run
creates nothing, walks one generated task down the ordinary ladder, and watches
the card's progress move from 0/2 to 1/2.

---

## Slice 9 — Ship ✅

**Built**

- **The DPDP privacy notice**, readable signed-out and in all three languages,
  linked from the consent line it belongs to. It lists what is kept, why, for
  how long, who it is shared with, and the four rights the Act gives.
- **PWA**: manifest, maskable icons, `theme_color` matching the owner's header,
  and a service worker that **deliberately caches almost nothing** — offline
  sync is out of scope, and a worker serving a stale task list would be worse
  than none, because the whole product is whether what is on screen is true.
- **README** — environment, migrations in order, how to test, how the SLA job
  is wired, and the handful of things worth knowing before changing anything.
- **`scripts/reset-demo.mjs`** — seeds one realistic day.
- **Two database-linter findings fixed** (`0012`, `0013`): `search_path` pinned
  on the last two functions; `anon` revoked from `create_org`, `accept_invite`
  and `org_member_email` (Supabase grants EXECUTE to `anon` by default, so the
  earlier `revoke ... from public` had not covered it); `auth.uid()` wrapped in
  a scalar subquery so policies stop re-evaluating it per row; the two
  overlapping `profiles` SELECT policies merged into the one rule they were;
  and covering indexes on the foreign keys that cascade.
- `e2e/rls.spec.ts` now asserts the **pre-auth surface**: exactly two functions
  are callable without a session, and the other three are refused.

**Gate:** lint ✅ · typecheck ✅ · build ✅ · Vitest **193/193** ✅ · Playwright **46/46** ✅

**A bug in my own tooling, worth recording.** `reset-demo.mjs` reported
deletions it had not made: there is no DELETE policy on `tasks` — by design, a
task is *cancelled*, never removed — so PostgREST returned success having
matched no rows. The script now counts the debris and prints the SQL to run
with elevated access instead of claiming to have cleaned it. The same class of
mistake as the SLA summary that counted duplicates as sends.

See **REPORT.md** for what works, what I could not verify, and the go-live
checklist.

---

## Follow-ups after the first hands-on session

**1. `npm run dev:login` — signing in without an inbox.** The MVP mails a
six-digit code, which is no use against `owner@vaakya.test`. The script asks
Supabase's admin API for a magic-link token and prints a URL.

It is dev-only structurally, not by convention: it is a script, so nothing in
`app/` or `lib/` imports it and it cannot be bundled; it refuses to run when
`NODE_ENV` is production; and it needs the service-role key, which is
server-only. It needs **B1** — the key is still not set, and the script says
exactly where to get it.

The URL points at the app's own new `/auth/confirm` route rather than
Supabase's verify endpoint, because Supabase returns the session in the URL
*fragment*, which never reaches a server — cookie-based auth would never see
it. `/auth/confirm` verifies the token hash server-side, creates the profile
row on first sign-in, and only redirects to same-site paths. It is real product
code: it is also how an emailed link works.

**2. The brand name is out of the translation layer.** *Waakya* means
"sentence" in Hindi, so with the name inside translatable copy the consent line
read "I agree to the sentence's Privacy Policy". `lib/i18n/brand.ts` now holds
it, `consentPrefix` takes it as an argument, and a test fails the build if the
name reappears in any dictionary string. It now reads:

- English — *I agree to Waakya's **Privacy Policy**.* (not "the Waakya…", which
  reads as a category rather than a name)
- Hinglish — *Main Waakya ki **Privacy Policy** se sehmat hoon.*
- हिंदी — *मैं वाक्य की **Privacy Policy** से सहमत हूँ।*

The notice's own name stays "Privacy Policy" in all three, so the link and the
page it opens agree. The audit also found the name baked into `privacy.intro`,
`privacy.keep` and an unused `common.appName`; all three are gone.

**3. Errors belong to a step and a field.** The login form kept one `error` for
both steps, and marked the email box invalid for *any* error — so "Too many
codes sent", which is not a problem with the address, ringed it red. An error
now records which step and which field it came from, renders only on that step,
marks only that field, and clears as soon as the reader starts fixing it. The
OTP boxes gained the same invalid state for a wrong or expired code.

**A real bug this uncovered.** Two tests failed for a reason unrelated to what
they tested, which turned out to be a genuine defect: task screens rendered in
the *business's* language while the shell rendered in the *reader's*, so
switching to English in Settings left the Confirm card in Hinglish. Every
screen now resolves the reader's language, and notification copy now uses the
recipient's rather than the sender's. The tests that exposed it were made
language-agnostic — they read `<html lang>` — and the suite pins its own
session language so it no longer inherits whatever was last clicked.

**Gate:** lint ✅ · typecheck ✅ · build ✅ · Vitest **197/197** ✅ · Playwright **50/50** ✅

---

## Follow-ups: the rename, the website, and the dev bypass

**1. Waakya, not Vaakya.** The Roman spelling now matches waakya.com across
every rendered surface, the manifest, metadata, email defaults and the docs.
`lib/i18n/brand.ts` is the one source and a test fails the build if the name
reappears in translatable copy. The Devanagari वाक्य is unchanged — same name,
other script — and so is the mark. The outlined wordmark SVGs still read
"Vaakya" and are listed in REPORT.md for redrawing; everywhere except the login
screen the wordmark is now composed from `Mark` plus the display face, so it
picked up the new name without any art.

**2. A real website, not a phone column.** One tree, one breakpoint:

- `AppShell` swaps the bottom nav for a Neel sidebar from `lg`, and the phone
  layout below it is untouched.
- The desktop dashboard follows `DashboardDesktop.png`: six counter cards, the
  needs-you cards two across, the day's work as a table with named columns, and
  a right rail for the week's completion and who is on today. It reads the same
  `rowStatus` and `stateWord` as the phone rows, so the glyph-or-chip rule
  (D-11) and the state-in-words rule (D-03) hold identically at both widths.
- Task detail spreads into two columns and its action bar leaves the fixed
  strip for normal flow, because on a wide screen there is no fold to fall
  below.
- `/` is a marketing landing page following `LandingDesktop.png`: hero over the
  doodle, the ticks ladder built from the real glyph, the problem, three steps,
  features, the Neel WhatsApp section, who it is for, pricing, FAQ and a final
  card. Its copy is in all three languages and **describes only what v1 does** —
  the two WhatsApp pieces that are not built are labelled *Jald / Coming*
  rather than promised.

**3. `DEV_DISABLE_AUTH`.** Off by default and refused in production, exactly
like `ALLOW_TEST_LOGIN`. It lives in `proxy.ts` rather than the layout, because
that is the only place that can persist the session cookies — signing in during
a render would establish a session for one request and throw it away. Nothing
in `app/` or `lib/auth/session.ts` knows it exists, so turning it off restores
normal login with no code change, and the Playwright config pins it off so the
suite always exercises the real path.

**A bug the brand test caught.** The landing page used Haldi for icons and for
the pricing checkmarks. Haldi has exactly one job. Fixing it also removed a
real duplication: the mark's three strokes had been copied into three files, so
`Wordmark` now composes `Mark` and `SideNav` composes `Wordmark` — one file
draws the logo, and the allowlist has one entry.

**Gate:** lint ✅ · typecheck ✅ · build ✅ · Vitest **197/197** ✅ · Playwright **57/57** ✅
