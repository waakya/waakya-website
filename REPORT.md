# Waakya — build report

Built from `CLAUDE.md`, `BUILD_STEPS.md` and `vaakya-brand-kit/screens/*.png`,
in ten slices, each gated on lint → typecheck → build → Vitest → Playwright
before the next one started. `PROGRESS.md` has the slice-by-slice detail.

**Final state: all ten slices done, including Slice 8, which was optional.**

```
lint       ✅   typecheck  ✅   build      ✅
Vitest     ✅   197 tests
Playwright ✅   57 tests, against the live Supabase project
```

## The wordmark art

The eight logo SVGs in `public/brand/logo/` carry the name as outlined
Baloo 2 ExtraBold paths, regenerated to the current spelling (the mark, the
Devanagari and the tagline art are as supplied). The header wordmark is
composed at runtime from `Mark` plus the display face
(`components/waakya/wordmark.tsx`), so it needs no art at all.

## What works, end to end

Everything in `CLAUDE.md §2`. Each of these is exercised by a Playwright test
against the real database, not just by a unit test.

| # | Scope | State |
|---|---|---|
| 1 | Orgs, users, staff invite, four roles | ✅ |
| 2 | Task creation by touch through the Confirm card, owner list + staff My Tasks | ✅ |
| 3 | The state machine, every transition timestamped in `task_events` | ✅ |
| 4 | **SLA timers + escalation** — reminders at 50% and 90%, breach to the owner | ✅ |
| 5 | Proof of completion — photo, voice note or text, in private storage | ✅ |
| 6 | Owner dashboard — today, overdue in red, unacknowledged, completion rate | ✅ |
| 7 | Notifications — in-app and email behind `notify()`, live over Realtime | ✅ |
| 8 | Recurring checklists | ✅ (built, not cut) |

**The core path**, in one test across two real browser contexts:
create → acknowledge → accept → in progress → done → verify, with the audit
trail asserted at every step.

## The three things I would want reviewed first

**1. A real security hole in the supplied schema, closed.** `0001` shipped

```sql
create policy "membership write" on memberships
  for insert with check (is_org_admin(org_id) or user_id = auth.uid());
```

The second clause exists so an org's creator can insert their own owner row,
but it also let *any* signed-in user insert a membership into *any* org id and
read that business's work. Migration `0003` removes it; joining now happens
only through `create_org()` or `accept_invite()`, each of which checks a real
reason. `e2e/rls.spec.ts` proves it by talking to PostgREST directly as an
outsider: eight tables come back empty, the self-insert is refused with
`42501`, and a cross-org task insert is refused.

**2. An SLA breach does not change `task.state`.** `escalated` is reserved for
an explicit "nahi ho payega", which genuinely needs a person. A breached clock
is a *condition* the clocks already describe, and the design has precise words
for it — *Dekha nahi* and *Late* (§3.3). Writing it into the state would hide
how far the work had actually got and replace a precise chip with a vaguer one.
The escalation is recorded in `escalations` and the owner is told.

**3. "Dekh liya, ho jayega" is one tap and two facts.** `TaskOwner.png` shows
*Dekha 10:05* and *Maana 10:05* at the same timestamp, which is exactly what
that button means. Two buttons with identical words would have been a wart, so
the action writes both events. *Shuru kiya* moved to the secondary row, and
going straight from accepted to done stays legal — staff who just do the thing
are not an error.

## Bugs found by running it, not by reading it

- **The SLA summary lied.** It counted a deduplicated message as a send, so a
  tick that did nothing looked busy. It now reports `alreadySent` separately,
  which is also how you *see* idempotency working.
- **The job got slower every week.** Recorded escalations were re-attempted on
  every tick for ever. Retries are now bounded to 24 hours — long enough to
  outlast a quiet-hours hold-back — already-sent keys come back in one query
  instead of one failed insert at a time, and addresses are looked up once per
  person. A steady-state tick went from **~15s to ~4s**.
- **The bottom action bar could slip below the fold.** A `sticky` bar inside the
  task screen's flex column did not pin reliably under mobile emulation, so the
  primary action was sometimes unreachable. It is `fixed` now.
- **The timeline said "Bheja" twice**, because `created` and `delivered` are
  written together and read the same. The trail keeps both rows; the reader
  sees one.
- **The language switch only half-worked.** Task screens read the *business's*
  language while the shell screens read the *reader's*, so switching to English
  in Settings left the Confirm card in Hinglish. Every screen now uses
  `getLocale()`, which already resolved cookie → profile → business, so the
  business's language stays the default for anyone who has not chosen. Found by
  a test that failed for the "wrong" reason.
- **Notifications spoke the sender's language.** A message is written for its
  reader, so `createTask` now looks up the assignee's own language and falls
  back to the business's.
- **`reset-demo.mjs` reported deletions it had not made.** There is no DELETE
  policy on `tasks` — by design, a task is cancelled, never removed — so
  PostgREST returned success having matched no rows. The script now counts the
  debris and tells you the SQL to run with elevated access, rather than
  claiming to have cleaned it.

## Deviations from the brand kit, all deliberate

| Screen | What differs | Why |
|---|---|---|
| `Login.png` | An **email** field, not phone | v1 signs in with email OTP; a phone box that mails a code is a lie. The layout, type scale and copy rhythm are unchanged, and the phone version returns behind `activeAuthProvider()` |
| `Login.png` | Consent starts **unticked** | Pre-ticked consent is not consent under the DPDP Act |
| `Confirm.png` | No "Aapki awaaz" row, no "Phir se bolo" | There is no voice in v1; a player for audio that does not exist would be a lie. Both return in the same slot |
| `Dashboard.png` | "Naya kaam" holds the mic's place, size and fade | Same reason (D-10) |
| All screens | Avatars are **Neel**, never Haldi | Your decision 4: Haldi keeps exactly one job. One line in `components/ui/avatar.tsx` reverts it |
| `MyTasks.png` | A *Baad mein* section between Aaj and Ho gaya | Work due later than today had nowhere to go, and a list that silently drops tasks is worse than a longer one |

## What I could not verify

| | Why | What exists instead |
|---|---|---|
| **Real OTP email delivery** | No inbox I can read (B4) | The whole flow is built and its failure paths are tested. Supabase's built-in mailer sends the code today; point it at Resend for production |
| **Email notifications actually arriving** | No `RESEND_API_KEY` (B2) | `notify()` writes the in-app record and logs the email it would have sent. Wiring is complete; only delivery is off |
| **The SLA job on a schedule** | No `CRON_SECRET` and no deployed URL (B6) | The job is complete and idempotent. An owner runs a tick for their own business from the inbox, which is how the e2e exercises it |
| **Proof photos on Cloudflare R2** | No R2 credentials (B3) | Working today on a private Supabase bucket scoped by org. Setting three variables switches driver with no code change |
| **Deployment to Vercel and waakya.com** | No Vercel access | `npm run build` is green; README has the environment and the go-live steps |
| **Phone OTP** | DLT registration is a multi-day process (B5) | Out of v1 scope by design. One swap point |
| **Real devices** | Only Chromium at a Pixel 7 viewport | Touch targets are asserted in pixels; text is tested at 130% |

`BLOCKERS.md` has each of these with what to do about it.

## Go-live checklist

1. Set `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `RESEND_API_KEY` and
   `NEXT_PUBLIC_SITE_URL` in Vercel. **Do not set `ALLOW_TEST_LOGIN`.**
2. Point Supabase Auth's SMTP at Resend — the built-in mailer is rate-limited
   to a handful per hour and is not for production.
3. Deploy `supabase/functions/sla-tick` and schedule it every 5 minutes.
4. Move to Vercel **Pro** before charging anyone: Hobby forbids commercial use.
5. Move Supabase to **Pro** before real customer data: the free tier has no
   backups and pauses after 7 days idle.
6. Create the R2 bucket and set its four variables; storage switches by itself.
7. Turn on leaked-password protection in Supabase Auth (the linter flags it;
   it only affects the dev-only password path today, but it costs nothing).
8. Delete the three `@waakya.test` users and the demo org from production.
9. Point `waakya.com` at Vercel and re-run `npm run gate` against it.

## Where to look in the code

- `lib/tasks/state-machine.ts` — the ladder and the three exceptions
- `lib/tasks/authz.ts` — who may move a task, and where
- `lib/sla/engine.ts` — the differentiator, pure and exhaustively tested
- `lib/tasks/present.ts` — the glyph-or-chip rule (D-11) and the meta line (D-03)
- `components/waakya/ticks.tsx` — the signature glyph
- `components/waakya/stepper.tsx` — one component on both task screens (D-06)
- `lib/brand/rules.test.ts` — the brand rules as tests, so they cannot drift
- `/preview` — the style tile, running

## What I would do next

1. **The Team feed** (Character doc §3.2) — the org's `task_events` for the day
   as a read-only chat-shaped view. It is the notifications inbox rendered
   differently, so it is cheap, and it answers "we already have a WhatsApp
   group" better than anything else in the product.
2. **Cap "Aapke liye"** properly. It shows five and reports the true total; at
   103 that gap is uncomfortable. It wants either paging or a tighter rule for
   what counts as needing the owner.
3. **A real device pass** on a low-end Android, in sunlight, one-handed. Every
   measurement here came from an emulator.
