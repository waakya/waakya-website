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
| 2 | Org onboarding, team invite, RLS, i18n | ⬜ |
| 3 | Create task (Confirm card) + task lists | ⬜ |
| 4 | Task detail + state machine + stepper/clock + thread | ⬜ |
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
