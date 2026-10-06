# Waakya — Visual V2 report

**Status: candidate for owner visual approval. Not merged. Not deployed.**

| | |
|---|---|
| Workspace | `~/waakya-visual` (plain clone; the Desktop checkout and the remediation workspace were not touched) |
| Branch | `feature/visual-experience-production` |
| Base | `367bf16` (Visual V1 candidate), itself on `aaf2ea6` (Platform V1 release) |
| Head | see the final commit on the branch |
| Local review | http://localhost:3500 |
| Database | an isolated local Supabase stack, project `waakya-visual`, ports 5782x, workdir `~/waakya-visual-stack` (links to this clone's migrations). Seeded with the two platform reference tenants (Shelter Xperts, Omega Infra), the 335-task busy business (Gupta Logistics) and the e2e fixtures. The shared platform/QA database was never written to. |

## Logins on :3500 (dev-only test login)

Open `/login`, then POST `{"email","password"}` to `/api/test-login`.

| Who | Email | Password |
|---|---|---|
| Interiors owner (projects, customer portal, vendors) | `priya@shelter.test` | `waakya-platform-pass` |
| Property-sales owner (inventory, campaigns) | `vikram@omega.test` | `waakya-platform-pass` |
| Busy owner (Today under pressure) | `owner@busy.test` | `waakya-design-pass` |
| Customer (portal) — invite at `/portal/join/0c6bc06ee773b8a2b962d332360df688` | `sterling@customer.test` | `waakya-platform-pass` |

## Files changed

About 70 files since `367bf16`. New shared pieces:
`components/waakya/change-line.tsx` (the Line), `state-word.tsx` (status word), `ledger.tsx`, `drawer-action.tsx`, `app/(app)/aaj/today-bands.tsx`, `lib/events/changes.ts`, `app/(app)/records/[type]/new-record.tsx`. The sheet primitive gained a `drawer` side; the button gained a `verb` variant.

## Design system changes

- **The Line** — one connector meaning "this moved that". A 2 px rule with marks: Neel = moved, Neel ring = proof arrived, Hara = verified, square = the customer acted, hollow = waiting. Product: Today's "Changed", record history, project activity and updates, customer timeline. Homepage: the hero record, Monday's bus, the day board's consequences, conversation → commitment, the customer's crossing, the website wires, the close. Five earlier connector styles (dashed bus, dotted wires, grey curves, pill pipeline, cross SVG) are now one solid Line.
- **Status grammar** — normal states are a word with a small diamond (`StateWord`); chips are kept for exceptions only.
- **Attention** — a 3 px left rule plus an underlined verb, used only where the viewer must decide: Today's Needs you, a pending leave notice, a customer decision waiting, project attention lines.
- **Ledger** — a record's fields as ruled label/value lines; empty fields fold under "N empty fields".
- **Drawers** — every create/edit form opens as a right-hand drawer on a desk and a bottom sheet on a phone; records are never replaced by forms.
- **Lists** — the shared list surface and empty state are ruled lines, not boxes.

## Today — before / after

Before: a counter strip contradicting itself (today's 3 sent beside all-time 147 late), "Aapke liye 165" with doubled numbers ("4 4 customer message"), one undifferentiated list with tinted icon tiles and boxed buttons on every row, an empty right column.

After, top to bottom:
1. **The sentence** — "53 things need you." then only what exists: "85 stuck · 3 changed since yesterday · 150 moving on time", and the per-kind counts (each a link to exactly those items, as before).
2. **Needs you** — decisions only the owner can make (escalated, verify, approvals, leave, follow-ups, leads, customer messages, vendor work to verify, chats), grouped with a small title, each row with the attention rule and one verb.
3. **Stuck** — late and unseen work, vendor late, customer decisions waiting; "Who is behind" first (one line per person with late/unseen counts and how long), then the folded rows, each leading with its exception in words.
4. **Changed since yesterday** — the Line, from the event log (proof, verification, customer decisions and messages, leads, vendor work, milestones, approvals), with a link to the full history for those allowed to read it.
5. **Moving normally** — one line ("150 on time · 0 due today · 41 done today"), then the nearest waiting work and done today.

A calm business sees one sentence and collapsed bands. No fabricated metrics: every number comes from the existing counts or the event log.

## Product — before / after

| Screen | Before | After |
|---|---|---|
| Customer detail | label list, boxed stage select, a rail of six outlined buttons, a select and two checkboxes | state band (kind as a word, owner select, next action with lateness colour), one action bar (log, follow-up, task, "Messages and archive"), drawers, deal read-first, tasks with ticks, timeline as the Line, details as a ledger |
| Project detail | left column ending early; right column of eight stacked forms | state band (big %, next milestone, customer, people), attention lines, work, milestones with verbs, documents; customer side read-first with drawer actions; vendor work ruled; activity as the Line |
| Record detail | 13 rows of which 11 were "—"; status select reading "—" | status as the heading word, one self-describing summary line (3 BHK · 1,420 sq ft · ₹85,00,000), action bar with drawers, ledger with empty fields folded, history as the Line |
| Inventory | table scrolled sideways on a phone, status off-screen | desk: status second; phone: a list with status on every row |
| Customers | kind and owner as pills | kind as a word, owner as text, missing owner and late follow-up stay chips |
| Pipeline | equal grey columns | empty stages narrow, stages with deals take the width |
| Vendors | directory only, chips | open vendor work first, directory beside it, status words, ₹ paid/unpaid as a fact |
| Campaigns | channel config field under the list | ruled list with status words; channel setup a quiet row at the foot |
| Automation | trigger shown as `lead.created`; pale pill buttons for ready rules | trigger in words ("When a new enquiry arrives"); ready rules as a ruled list with an "Add" verb |
| Documents | four template cards; tinted icon tiles | templates as four verbs; a small file mark |
| Team, Attendance, Settings | role pills, chip-heavy attendance, boxed settings | roles as words, attendance states as words (only "rejected" stays a chip), settings unboxed |
| Navigation | 14 flat items under More | Sales, Operations, People, Setup; Templates inside Documents; "Customers" not "Customers (CRM)" |

## Homepage — before / after

- **Pass 0 defects, all fixed and screenshot-verified:** white-on-white labels in the customer phone; the ledger rule crossing header text and the phone's button; day-board label collisions; the Walnut chip appearing before the choice; a 14 s customer loop (now ~1.1 s per beat); the broken mobile WHO/WHAT/WHEN/FOR sentence (now underlines plus a legend below); tablet/phone day losing its consequences (now shown under the current beat, with the cross-lane effect in green).
- **Hero:** one record visibly changing state — the Line across it fills from Enquiry to Her page, the state word and ticks follow, and one panel shows what each step produced (the quote, the owner, the accepted visit with its clock, the proof photos, the verified tick, her page). Fixed height, all panels present from the first frame.
- **Monday:** kept.
- **One day:** collisions fixed; consequences thicker and Neel; consequences restored below 1024.
- **Conversation → commitment:** the chat sits on the page, a Line carries the reading to the commitment; WHO/WHAT/WHEN/FOR kept.
- **Customers:** chip only after her choice; each consequence written in its waiting state first ("Deccan has no order yet" → "Deccan gets the order"); decorative avatar row removed; vertical Line crossing on phones.
- **Business switch:** kept; the separate "How far it goes" pipeline block removed (the depth line stays).
- **Website:** solid Line wires.
- **Close:** ends on proof → verified → kept, drawn as the Line with the Verified tick.
- Height: 9,300 → 8,466 px at 1440; 13,600 → 12,507 px at 390, from removed repetition, not a target.

## Responsive

Checked at 390, 430, 768, 820, 1024, 1280, 1440. No horizontal overflow on any homepage width or product route captured. Phone-specific recompositions: Today header chips wrap; setup guide action wraps under its text; inventory list; record and customer action bars wrap; drawers become sheets; More grouped with section titles.

## Accessibility

- axe (serious/critical) on the homepage: covered by `homepage.spec`; product pages by `a11y.spec` (results below).
- All new controls are buttons or links with names; drawers are Base UI dialogs with titles; status words keep the word (never colour alone); attention rows keep 44 px targets; reduced motion: the Line and panels change state without animation.

## Test results

- `tsc`: 0 errors. `eslint`: 0 errors and 0 warnings in `app`, `components`, `lib`, `e2e`, `e2e-design` (3 warnings pre-exist in `e2e-prod/` and `scripts/design/`).
- `vitest`: 292 / 292.
- Playwright main suite (142 tests, isolated stack, :3500): 141 passed in the final full run; the one failure (`auth.spec` rate-limit step, on the untouched login page) passed when its spec was re-run alone (14 / 14). Includes the homepage spec (axe on the homepage) and the product `a11y.spec`.
- Playwright design suite (busy Today, journeys, conversations, security, axe for every role at desk and phone): 27 / 28. The remaining failure checks a cookie name that depends on the Design V2 stack's host (`localhost`); this isolated stack uses `127.0.0.1`. Environmental, not a regression.
- The axe runs found two real contrast failures introduced in this pass (sidebar group labels, the day board's time pill); both were fixed and re-verified.
- Tests changed only where the structure intentionally changed (forms in drawers, Today's bands, status words, the hero's Line). The mail-server URL in `e2e-design/auth.spec.ts` is now overridable with `MAILPIT_URL` (same default).
- Environment note: the laptop slept mid-run once (a 7.7 h run with Colima stopped); those failures were the environment and the suite was re-run clean.

## Screenshots reviewed

About 380 captures under `.visual-tmp/v2/` (git-ignored): `pass0/` (each defect at its widths), `today1`–`today5` (calm, busy, e2e owners at 390/820/1024/1440), `records1`, `project1`, `p2`–`p4` (product screens 1440/390), `home1`–`home2` (homepage chapters, before/during/after), `crit/` (self-critique sweep: homepage at six widths, product at 1440/820/390), `refine/`.

## Self-critique findings

1. Lists still came in two languages (ruled vs boxed) — the shared list primitive was still boxed.
2. Today on a calm day repeated "Nothing needs you" and showed empty bands.
3. Pipeline: the one stage with a deal was as narrow as the empty ones.
4. Milestone rows had three text verbs per row — too many underlines.
5. The project progress read "No tasks yet" even with 2 of 5 milestones done.
6. The customer chapter's grey avatar row was decoration.
7. "1 customer decisions open" plural.

## Refinements made after self-critique

All seven above: lists ruled everywhere; calm-day bands collapse to one sentence; populated stages take the width; milestone visibility and delete became quiet icons; progress falls back to milestones; avatars removed; plurals fixed.

## Known visual limitations

- Proof imagery is still drawn (see `docs/visual/ASSET_SLOTS.md` for the five slots and licensing spec). No stock imagery was added.
- Today's "Changed" depends on the event log; a business with no recent proof, decisions or leads sees "Nothing new since yesterday" (the busy seed writes task history, not these events).
- The day board is still a desk-only drawing; phones get the timeline.
- `/demo` keeps its own slide-deck language.
- Homepage copy is English only (unchanged).

## Customer portal work deferred

Not redesigned. Shared primitives it uses (the list surface and empty state) are now ruled — a predictable change. The customer project page from V1 is unchanged. A dedicated portal pass waits for the QA database release; the isolated stack already has a Sterling invite to review it with.

## Owner decisions still required

1. Photography for the five proof slots: licensed or commissioned.
2. Whether "Customers" (not "Customers (CRM)") is the right navigation name for every business.
3. Whether a preview deployment is wanted (previews are SSO-protected and would need non-production env).
4. Approval of the Today band order before it reaches staff and managers in production.
