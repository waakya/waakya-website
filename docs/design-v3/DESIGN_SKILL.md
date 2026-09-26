---
name: waakya-design
description: The Waakya design constitution. Load before building or changing ANY Waakya screen, component, email, marketing page or copy — including future voice and understanding (AI) features. Covers philosophy, colour-as-meaning, the type scale, space, shape, depth, icons, navigation, lists vs cards, forms, sheets, empty/loading/error/success states, mobile, motion, accessibility, copy, and anti-patterns. Waakya's own rules override any generic design skill (Impeccable, Taste, frontend-design).
---

# Waakya design constitution

Waakya turns business conversation into accountable work:
**Conversation → Commitment → Execution → Proof → Record.**
Customer-facing loop: *Talk → Assign → Execute → Prove.*
Tagline: **Bolo. Ho jayega.** — "Say it. It gets done."

The people using it are Indian small-business owners (2–30 staff: brokers,
interiors, stores, offices) and their staff, on a ₹8,000 Android in one hand
or a laptop at the counter. They are busy, not technical, and they are
trusting this app with real business records.

Everything below follows from three sentences:

1. **Every screen answers "what needs me, and what do I do next?"** before anything else.
2. **Colour means something.** If a colour is on screen, it is saying a state.
3. **It is a record.** Calm, precise and trustworthy beats clever.

Source files: tokens `app/globals.css`; reference `docs/WAAKYA_DESIGN_SYSTEM.md`;
brand kit `../vaakya-brand-kit/` (`screens/StyleTile.png` is canonical);
build spec `CLAUDE.md`. When this file and the brand kit disagree, the brand kit
wins; tell the user.

---

## 1. Personality

Warm, human, calm, confident, structured, fast. A good munshi's ledger, not a
startup dashboard. Hindi-first in spirit even when the words are English.

It is **not** Slack, WhatsApp, Trello, Asana, Notion, an ERP, a CRM, an HRMS or
"an AI app". If a screen could be mistaken for one of those with the logo
swapped, it is wrong.

## 2. Colour — meaning, never decoration

| Colour | It means | Allowed on |
|---|---|---|
| **Neel** (indigo `neel-600`) | "You can act" / "selected" / "seen" | Primary button (one per screen), links, active nav, focus ring, selected chips, "mine" message tint (`neel-50`) |
| **Navy** (`neel-900`) | The frame | Desktop sidebar only; owner mobile header |
| **Paper** (ivory `paper-50` canvas, `paper-0` surface, `paper-100` muted) | The ground | Backgrounds and surfaces |
| **Ink** (`ink-900/700/500`) | Text | Primary / secondary / tertiary text |
| **Haldi** (turmeric `haldi-400`) | **Done, waiting for you** — the tick in the ticks glyph and the logo | **Nothing else. Ever.** Not a button, chip, link, highlight, avatar or illustration |
| **Hara** (green) | Done / Verified | Verified chips, the verified tick, completed states |
| **Amber** | A clock past 50%, or an SLA missed ("not seen") | Clock bars, "Not seen", "Late soon" |
| **Laal** (red) | Late, Urgent, Cancel, destructive, errors | Those only |

Rules:
- **Never state by colour alone.** Every chip = icon + word. Every row says its state in words.
- One Neel-filled button per screen. Everything else is outline, soft (`neel-100`) or ghost.
- Waiting requests, counts and "new" are **not** amber — amber is time.
- Semantic tokens for new code: `bg-canvas`, `bg-surface`, `bg-surface-muted`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `border-line`, `border-line-strong`, `bg-brand`, `bg-brand-soft`.
- Contrast: body ≥ 4.5:1 (ink-500 on canvas is 5.38:1 — the lightest text allowed). Never lighter grey than `ink-500` for anything someone must read.

## 3. Typography

- **Inter** (+ Noto Sans Devanagari) for all product UI. **Baloo 2** only for display: wordmark, big counters, marketing headlines, the staff screen's one big heading. Never Baloo for labels, buttons, tables or body.
- Use the scale — never `text-[13px]`:

| Class | Size/line | For |
|---|---|---|
| `text-micro` | 11/14 | Bottom-nav labels, sidebar group labels |
| `text-caption` | 12/16 | Timestamps, table headers, helper text |
| `text-label` | 13/18 | Chips, meta lines, small buttons |
| `text-body-sm` | 14/20 | Dense rows, sidebar items |
| `text-body` | 15/22 | Owner body and row titles |
| `text-body-lg` | 17/24 | Staff body, inputs, lead text |
| `text-title-sm` | 20/26 | Section and card titles |
| `text-title` | 24/30 | Page titles |
| `text-title-lg` | 28/34 | Task title on detail |

- Weight does the hierarchy work: 700 titles, 600 labels/buttons, 400 body. Headings are **sentence case**.
- `.num` (tabular numerals) on every time, count, amount or date that is compared.
- **Three languages**: हिंदी · Hinglish · English. Latin digits in all three (5:00, never ५:००). Hindi line-height ≥ 1.5 (the scale does it for you); never letter-space or uppercase Devanagari. Every new string goes into the dictionaries for **all three** locales (`lib/i18n/*`).
- No eyebrows (small uppercase labels above headings) in product UI; at most one on a marketing page.

## 4. Space, shape, depth

- 4 px grid. Screen padding 16 (phone) / 32 (desktop). Card padding 16 / 20. Section gap 32. Tight inside a group (8–12), generous between groups (≥ 24). More space above a heading than below.
- Radii: `rounded-inner` 10 (things inside a card) · `rounded-card` 12 · `rounded-button` 14 · `rounded-sheet` 24 · `rounded-chip` full. Nothing else.
- Shadows are nearly absent: `shadow-card` (resting), `shadow-float` (menus, sticky bars), `shadow-sheet` (sheets/dialogs). No glow, no coloured halos, no neumorphism.
- Hierarchy comes from space and a 1 px `border-line` hairline — not from boxes.

## 5. Lists, cards and tables

- **Task rows on a phone are individual cards** — that is the approved kit (`screens/Dashboard.png`, `MyTasks.png`): 64/72 px rows, 8 px apart, a tinted row for Late, the glyph or one chip on the right. Do not "fix" this into a divided list.
- **Everything else that is a list is one surface with dividers** (`ListSurface` in `components/waakya/page.tsx`): conversations, documents, updates, people, attention items, desktop tables.
- A **card** is for one self-contained decision or object that the person acts on (a "Needs you" item, an approval, a task row on a phone). Never nest a card in a card.
- A task row always shows: the ticks glyph or an exception chip **and** the state in words, the title (max 2 lines), who, and by when.
- Tables on desktop: `table-fixed`; the title column takes the remaining width; others size to content; titles clamp to two lines. Below `lg`, tables become lists.
- Group by what the person must do (Needs you → Late → Today → Later → Done), not by database order.

### Today — attention first, never hidden work (Design V3, tested with a 335-task business)
- One "Needs you" list: late, escalated, not seen, verify, approvals, leave, unread chats. Each row: the thing, then **why + who** in words, then its one action on the row (Remind + Call, Verify — or *See proof* when a photo was required — Reassign, Approve; **Reject opens the full request with its note**, never a one-tap X).
- **Every kind of waiting thing shows its count** in one line under the heading, each count a link. No category may silently disappear.
- Short days list everything; busy days (≥ 9 items) **fold per group** to the three worst (most overdue, longest unseen, longest waiting) with "N more · <group>" linking to *exactly* those items (`/work?need=…`), chosen by the same rule (`needsYou`, `waitingOnTeam`, `foldGroups`). Counts must equal the list they lead to.
- "Waiting on your team": what you just sent first, then nearest deadlines; five rows and "N more". The team: the eight most behind, then "All N people". Today stays bounded however big the business.
- Lists must load all open work — never "newest N" (that once hid 58 of 60 late tasks).
- The owner's counters say they are **today's**; only lateness is red.
- A setup guide yields to a running business (one line once team, conversation and task exist); an empty business's one primary is "Invite your team".

## 6. Navigation and page structure

- **A place earns the top level only if that role uses it most days** (Design V3, validated). The map lives in one file, `components/waakya/nav-items.ts`, so sidebar, bottom bar and More never disagree.
- Phone: bottom bar **Today · Conversations · More** for staff; **Today · Conversations · Work · More** for managers and owners; a back arrow on detail screens, which hide the bar and bring their own action bar.
- Desktop (`lg`+): navy sidebar — business, search (⌘K/Ctrl+K, never while typing), the same 2–3 places, then **More** (a disclosure that opens itself when you are inside one of its places): Projects, Documents, Templates, Attendance, Approvals, Team (owner) · Search, Updates, Routines (owner), Settings. Counts are numbers, not dots, and show on the closed More.
- Things arrive in context rather than as destinations: approvals and leave on Today, attendance as a line, documents on tasks and projects.
- Every screen starts with a **PageHeader**: title (`text-title`), one line of context in `text-fg-subtle`, and at most one primary action on the right. Use `components/waakya/page.tsx`.
- Desktop width is intentional: lists and tables use the width (`PageBody width="wide"`), reading and forms centre in a column (`width="reading"`). Never a phone column pinned to the left of an empty canvas.
- Detail screens on desktop: two columns — the record on the left, **the next action on the right, in view**.

## 7. The signature components (reuse, never re-draw)

- `<Ticks state="sent|seen|accepted|done|verified" />` — two bars + a tick. Haldi tick = done, waiting; green = verified.
- `<Stepper />` with two clock bars (acknowledge, complete): Neel → Amber at 50% → Laal at 90%/breach. Same component for owner and staff.
- `<StateChip tone icon>` — exceptions only (Late, Urgent, Not seen, Photo needed, Verify pending, Cancelled).
- The Confirm card (`/naya`) is the single entry to create a task by touch; keep it the single entry for voice later.

## 8. Conversations and Message → Task

- Messages are readable text first; bubbles are quiet (surface + hairline; "mine" in `neel-50`). Author once per run, timestamps in `text-caption`, day separators.
- The thread fills the viewport; only the message list scrolls; it opens at the newest message.
- **Message → Task** is the signature interaction:
  - One quiet action per message, **visible at rest** (low emphasis, ≥ 40 px target) — hover-only reveal hid the core loop on desktop (V3). Never a full button under every message.
  - The commitment form shows **who** and **by when** explicitly (deadline choices, sensible default) before anything is created.
  - Once made, the message shows the task's **real state** (ticks + word + owner) and links to it; the task shows "From a conversation" with the quote and a link back. Origin is never lost.

## 9. Forms, sheets and dialogs

- Labels above inputs, always visible; never placeholder-as-label. Errors below the field in `text-laal-700`, in the person's language, saying what to do next.
- Inputs 48 px (owner) / 56 px (staff); `text-body-lg`.
- A **bottom sheet** for a focused sub-task on phone (proof, decline, extension, invite). Centred dialog only on desktop and only when focus must be protected. Prefer inline disclosure over any modal.
- **Never clear what someone typed when an action fails.** Keep it, show the error, offer retry.

## 10. States

Every interactive thing has: default, hover (pointer only), focus-visible (Neel 600, 2 px, offset 2), pressed (`scale(0.97)`), disabled, loading, error.

- **Empty**: what this is, why it helps, the one next step (a button). Role-aware ("Invite your team" for an owner; "Nothing needs you right now" for staff). A small line icon at most — no giant illustrations.
- **Loading**: keep the layout; skeletons shaped like the content only when a wait is visible; buttons show a word ("Sending…") and stay the same width. No full-page spinners.
- **Error**: what failed, in plain words, what to do; input preserved; retry where it makes sense. Never raw technical text.
- **Success**: the change itself is the confirmation (the row moves, the state word changes, the tick draws on Verified). Toasts only for things that happen off-screen.
- **Decided/closed** items look closed: no live countdowns, no stale action buttons.

## 11. Motion

Only three *animations* exist: the pulsing "Naya" dot, the voice waveform, the tick that draws on Verified.

Everything else is a **transition that explains a change**, 120–280 ms, `ease-out` (strong curve from the theme), sheets on `--ease-drawer`:
- press feedback 120–150 ms; hover/colour 150 ms (pointer devices only — `@media (hover: hover)`);
- inline reveals/popovers 180 ms, from `scale(0.97)` + opacity, never from `scale(0)`;
- sheets 280 ms slide; exit faster than enter.

No page-load choreography, no staggered entrances in the product, no bounce, no parallax. `prefers-reduced-motion` removes movement and keeps opacity. Motion never delays an action.

## 12. Mobile (design for 390 px first)

One hand, bottom third for primary actions, 48/56/60 px targets, no horizontal overflow (tables become lists), sticky action bars respect `env(safe-area-inset-bottom)`, text scales to 130% without losing the primary action. A phone screen is designed, not a squashed desktop.

## 13. Accessibility

Semantic HTML first (`main`, `nav` with a label, `h1` per page, lists as lists, buttons as buttons). Every icon-only control has an `aria-label`. Dialog/sheet focus is trapped and returned. State is never colour-only. Contrast AA. Keyboard: everything reachable, visible focus, no keyboard trap.

## 14. Copy

Short, specific, human, action-first. Verbs on buttons ("Verify", "Send back", "Create task"). Name things with Waakya's vocabulary (Bheja/Sent, Dekh liya/Seen, Ho jayega/Accepted, Chal raha/In progress, Ho gaya/Done, Verified; Dikkat, Samay maanga, Photo chahiye). No jargon ("initiate", "resource", "workflow"), no hype ("revolutionize", "AI-powered", "seamless"), no emoji, and the word "AI" never appears in the UI.

## 15. Illustration and icons

Lucide only, 2 px stroke, 16/20/24 px. Icons support a word; they never replace one except universal controls with a label (back, close, send). Illustrations are rare, human, simple line-art from `components/waakya/illustrations.tsx`; no 3D, no robots, no stock people, no decorative blobs.

## 16. Future voice and understanding ("AI") features — MUST look like Waakya

When voice and understanding arrive, the person should feel **"Waakya understood the work"**, never **"I opened an AI assistant"**.

- The **microphone lives in the Conversations composer** (and the Confirm card), as a native control beside Send — same size, same Neel, same shape. No floating orb.
- A **voice message is a message**: same bubble, with a play control and waveform; the transcript is secondary text under it (`text-label text-fg-subtle`), expandable.
- A **task proposal is a review state of the Confirm card / Message → Task form**: the same fields (who, what, by when, priority, proof) pre-filled, each editable, with one primary "Confirm and assign". It never auto-sends.
- **Summaries use normal hierarchy**: a section with a heading, short lists of decisions/actions/open questions, each linked to its source message.
- A **Today brief is part of Today** — a section in the same list style, not a chat panel.
- **Document drafting is part of Documents/Templates** — it fills the same template fields for review.
- Uncertainty is stated plainly in words ("No deadline was said"), not with confidence scores or colour.
- **Banned**: purple/violet gradients, sparkle ✨ icons everywhere, glowing or animated gradient borders, robot/brain icons, chatbot bubbles or a separate chat shell, "AI" labels or badges, typing-dots theatre, streaming text for things that are not conversations. The word "AI" never appears in the UI (enforced by `lib/brand/rules.test.ts` on that branch); the capability is "understanding" in code.

## 17. Anti-patterns (reject on sight)

- A wall of same-size cards; cards inside cards; every section in a rounded box.
- Six big numbers at the top of a dashboard (the hero-metric template).
- Eyebrow labels above headings; section numbers used as decoration.
- Gradient text, glassmorphism, glow, neon, big gradients, decorative blobs, 3D objects.
- Colour used for emphasis without meaning (amber for "new", green for "created", Haldi for anything).
- A "Make task"-style button repeated under every item.
- A primary action below the fold on desktop, or two filled primary buttons on one screen.
- A phone column pinned left on a desktop canvas.
- Placeholder-as-label, clearing input on error, silent failure, raw error text.
- Fake data, fake testimonials, fake customers, fake analytics or claims the product cannot back.
- `transition: all`, animations over 300 ms in the product, animating from `scale(0)`, hover effects on touch.

## 17b. Accessibility lessons from Design V3 (all found in the running product)
- `outline-none` cancels `outline-2`: focus rings need `outline-solid` too. Every button shows focus.
- Never stretch a row link *under* the row's buttons (overlapping targets, WCAG 2.5.8): the title is the row's target.
- Disclosures are buttons with `aria-expanded`/`aria-controls` (`components/waakya/reveal.tsx`) or native `<details>` without headings in the summary — not sr-only checkboxes (read as checkboxes; any `:checked` inside forces them open).
- A control's accessible name contains its visible text (the bell's number).
- Sticky bottom bars: `scroll-padding-bottom` keeps focused/scrolled content clear (2.4.11). On a phone, row actions wrap below the reason so a name is never cut.
- Hindi screens must be Devanagari end to end — a Hindi copy that spreads the Hinglish one leaks Roman text.

## 18. Before calling a screen done

Open it (don't trust the JSX): desktop 1440, tablet 820, phone 390; owner, manager and staff where they differ; empty, dense, long names/titles, error. Check: the next action is obvious in the first viewport; state is words + glyph; no horizontal overflow; focus visible; nothing clipped at 130% text; it still reads well with motion off; it looks like Waakya and nothing else.

Tools: `scripts/design/sweep.mjs` (people × languages × 390/430/768/820/1440: overflow, console, network), `scripts/design/measure.mjs` (what competes for attention, V2 vs V3 like for like), `scripts/design/bench-today.mjs` (server render), `scripts/local/seed-busy.ts` (a 335-task business — test every list with it), `scripts/design/capture.mjs`, `scripts/design/sheet.py`, the Playwright suites (`E2E_PORT=… npx playwright test`, `-c playwright.design.config.ts`), and Chrome DevTools traces + Lighthouse on the real page.
