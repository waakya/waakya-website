# CLAUDE.md — Vaakya build spec

Single source of truth for building Vaakya. Read fully before writing code. Follow it exactly; ask
when ambiguous. The **brand and UI are already designed** — implement them, do not reinvent them.

---

## 1. Product
Vaakya lets an Indian SMB owner assign tasks to their team with built-in **accountability**: every
task has deadlines, must be acknowledged, and auto-escalates to the owner if it isn't accepted or
done in time. Tagline: **Bolo. Ho jayega.** ("Say it. It gets done.")

**v1 = message/touch based. NO voice input in v1.** Voice capture (the Neel 900 "Boliye…" screen and
the Confirm card as a voice flow) is fully designed but comes in a later phase. In v1 the owner creates
a task by touch, still reviewing it on the **Confirm card** before it's sent. Keep the "create task"
server action a single clean entry point so a voice transcript can feed it later without a rewrite.

Users: real-estate brokers and small store/office owners (2–30 staff). Launch on **waakya.com**.

## 2. Scope — build exactly these (v1)
1. **Orgs, users, staff invite** — owner creates the business, invites staff (name + phone), roles: owner/admin/manager/member.
2. **Task creation (touch) + lists** — create/assign a task with a **time budget** and **priority**, via the Confirm card; owner task list + staff **My Tasks** view.
3. **Task state machine** — created → delivered → **acknowledged → accepted → in_progress → done → verified**, every transition timestamped in a **task_events** audit trail.
4. **SLA timers + escalation (the differentiator)** — an **acknowledge SLA** and a **completion SLA** per task; auto-reminders to staff at **50% and 90%** of the time budget; **escalation to the owner** on breach.
5. **Proof of completion** — photo / voice note / text uploaded to storage, attached to the task.
6. **Owner dashboard** — today's tasks, **overdue in red**, unacknowledged, and a completion-rate counter.
7. **Notifications** — in-app + email in the MVP, behind a `notify()` abstraction so **WhatsApp** can be added later without touching callers.
8. **Recurring checklists (only if time)** — daily opening/closing SOP tasks; big retention hook.

Out of scope v1: voice input, WhatsApp, CRM/leads, khata/finance, offline sync, extra languages beyond the three below. Keep interfaces clean so these slot in later.

## 3. Brand & UI — use the kit, don't invent
The full system is in `vaakya-brand-kit/` and documented in `Vaakya_Design_Direction_v1.md` and
`Vaakya_Character_and_Website_v1.md`. Hi-fi screens for every flow are in `vaakya-brand-kit/screens/`.
Match them. Setup:
- Copy `vaakya-brand-kit/tokens.css` into `app/globals.css` (replace shadcn `:root`). HSL vars feed shadcn; hex tokens feed custom components.
- Merge `vaakya-brand-kit/tailwind.tokens.ts` into `tailwind.config.ts` `theme.extend`.
- Add `vaakya-brand-kit/fonts.ts` as `app/fonts.ts`; put the three font variables on `<html>`; set `lang` (`hi` | `hi-Latn` for Hinglish | `en`).
- Put `favicon/*`, `icons/*`, `manifest.webmanifest` in `public/`; wire `head-snippet.html` into `metadata`/`viewport` in `app/layout.tsx`.
- Use `logo/mark.svg` inline in the header (24px), `logo/logo-stacked.svg` on login. Never rebuild the wordmark from a font at runtime.

Design rules to honour (from the design doc — do not deviate):
- **Colour = meaning.** Neel is the only working accent. **Haldi only ever = the "done" tick** (logo + ticks glyph), never a button/chip/link. Amber only after a clock passes 50% or an SLA misses; Laal only for Late/Urgent/Cancel; Hara for Done/Verified. Never state-by-colour-alone: every chip has an icon + a word; every row states its state in words.
- **The ticks glyph** (two bars + a tick, coloured by state) is the signature component. Build `<Ticks state="sent|seen|accepted|done|verified" />` with the state word as `aria-label`. Spec in `tokens.css` comment and Character doc §2.1.
- **The stepper + clock bars** (`components/vaakya/`): six steps *Bheja → Dekha → Maana → Chal raha → Ho gaya → Verified*; two thin bars = ack clock + completion clock, fill Neel → Amber at 50% → Laal at 90%/breach. **Same component on owner and staff task detail**; only the actions differ.
- **Three UI languages:** हिंदी (Devanagari, Noto Sans), Hinglish (Roman Hindi — the staff default), English (Inter). Language switch: हिंदी · Hinglish · English. Latin digits in all three (5:00, not ५:००). Hindi line-height ≥ 1.5; never letter-space Devanagari.
- **Typography:** Baloo 2 (display only — counters, wordmark, big "Boliye"), Inter + Noto Sans Devanagari (all working UI). Tabular numerals for anything compared.
- **Touch/one-hand:** owner tap targets 48px, staff 56px, staff primary button 60px; primary actions in the bottom third. Owner header Neel 700 with counters; staff screens have no coloured header, one big button.
- **Motion:** only three — the pulsing "Naya" dot / recording indicator, the voice waveform (later), the tick that draws on Verified. Respect reduced-motion.
- Icons: Lucide, 2px stroke.

Map the DB `task_state` enum to Hindi/Hinglish labels in the UI:
`delivered→Bheja, acknowledged→Dekh liya, accepted→Ho jayega/Maana, in_progress→Chal raha, done→Ho gaya, verified→Verified`; exceptions as chips (Dekha nahi, Late, Urgent, Dikkat, Samay maanga, Photo chahiye, Verify baaki, Cancelled).

## 4. Stack (cost-optimized — see STACK.md for the researched breakdown)
Next.js 14 App Router + TypeScript (strict) · Tailwind + shadcn/ui (themed with the kit) · Supabase
(Postgres, Auth, RLS, pg_cron for the SLA job) · **email-OTP auth for the MVP** (phone OTP via MSG91 +
DLT added before wider launch — start DLT registration on day 0 so it never blocks you) · **Cloudflare
R2 for proof-photo storage** (Supabase Storage only for tiny assets) · server actions + zod · TanStack
Query where needed · date-fns (Asia/Kolkata) · Resend for email (free 3k/mo, 100/day) · Sentry (errors) ·
PWA (manifest + installable). Host on Vercel (Hobby while building; **Pro $20/mo once you charge — Hobby
forbids commercial use**); repo on GitHub.

Structure:
```
app/ (auth)/ (app)/          components/ui/  components/vaakya/ (Ticks, Stepper, ClockBars, VoiceOverlay-later, BottomNav)
lib/supabase  lib/tasks (state machine + SLA math, pure, unit-tested)  lib/notify  lib/i18n  lib/validation
supabase/migrations/  public/ (favicons, icons, manifest)
```

## 5. Data model
Use `schema.sql` (in this folder) verbatim as `supabase/migrations/0001_init.sql`. Tables: orgs,
profiles, memberships, tasks, task_events, task_messages, proofs, escalations, notifications — all
with **RLS scoped by org membership**. Enable RLS day one; the SLA job uses the service role (server-only).

## 6. Engineering standards (proper software development — enforce)
- **Version control:** one feature branch per slice; conventional commits; PR-sized diffs; review each diff before merge to `main`.
- **Types & validation:** TS strict, no `any`; **zod-validate every server action / route input**; typed return results.
- **DB:** all changes via migrations in `supabase/migrations` (never edit prod by hand); RLS on every table; service-role key server-only, never shipped to the client.
- **Tests:** Vitest unit tests for `lib/tasks` (state machine transitions, SLA math) and `lib/notify`; one Playwright e2e for the core path (create → acknowledge → done → verify). Keep them green.
- **CI:** GitHub Actions (or Vercel checks) run lint + typecheck + tests on every PR; block merge on failure.
- **Errors & logs:** never leak internals to users — errors say what to do next, in the user's language; log server errors (Sentry optional).
- **Security:** RLS + input validation; signed/'`private`' Storage URLs; rate-limit OTP; DPDP consent captured at signup; a Privacy page.
- **Idempotency:** the SLA/reminder job and task commits must be idempotent (keyed) so retries don't double-send or double-post.
- **Performance/a11y:** server components by default; self-host fonts via next/font; inline SVG for mark/icons; WCAG-AA contrast (ratios in design doc §3.2); focus rings Neel 600 2px; text scales to 130%.
- **Secrets:** `.env.local` only; document required vars in README; never commit.

## 7. Guardrails
Build one slice at a time (see `BUILD_STEPS.md`); review, test, commit, then next. Don't add features
outside §2. No voice input in v1. If a screen doesn't match `vaakya-brand-kit/screens/`, fix it to match.
