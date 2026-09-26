# Waakya V3 — Complexity audit of Design V2

**Build audited:** Design V2, `738970e`, local design stack, seeded Sharma
Interiors (busy day), Mehta Traders (first day).
**Instruments:** one script counts what competes for attention on every screen
(`scripts/design/complexity.js` in V3): visible actions (buttons, links, inputs,
tabs outside the navigation), navigation choices, status chips, boxes (cards),
small metadata lines (≤ 13 px text), words, words in the first viewport, filled
Neel buttons ("primaries"), and page length in screens. Run with Playwright for
owner / manager / employee / first-day owner at 1440 and 390 (108 measurements,
`docs/design-v3/v2-complexity.json`), cross-checked on key screens in Chrome
DevTools (MCP). Directional evidence, not science.

## 1. The headline

Design V2 fixed *how things look*. It did not change *how much is shown*.

| Symptom | Evidence |
|---|---|
| Everything is a destination | 13 persistent navigation choices on desktop for every role (8 places + 4 utilities + brand); 11 for staff, who use ~4 |
| Too many "primary" actions | Owner Today desktop: **6 filled Neel buttons** at once (New task + 4 × Verify/Call + …) |
| Attention is split | "What needs me?" is answered in 5 places: Today, Updates (bell), Approvals, Attendance leave requests, unread Conversations |
| Every row tells everything | A task row carries who · state · urgency · proof-needed · deadline; the desktop table adds call and more-actions to every row (45–66 actions per list screen) |
| Detail shows every stage at once | Task detail: stepper + 2 clocks + proof + timeline + thread + project picker + documents on one screen |
| Pages run long | Owner Today: 2.5 screens desktop, **4.4 screens on a phone** with 20 boxes |
| Metadata everywhere | Project detail: 86 small metadata lines, 625 words; manager Attendance: 104 metadata lines |

## 2. Screen by screen

Numbers: owner at 1440 unless stated. "Deferrable" = information that does not
help the decision this screen exists for.

| Screen | Actions | Nav | Chips | Boxes | Meta lines | Words (fold) | Primary task | Why it is heavy | Deferrable |
|---|---|---|---|---|---|---|---|---|---|
| **Today (owner)** | 66 | 13 | 6 | 9 | 43 | 423 (149) | Decide what needs me | Six counters + four attention cells + project links + four Needs-you cards (each with 2–3 buttons) + two task tables (each row: Call + More) + a rail (week rate, 5 people). Four different ways to say "late". | Counters (one sentence says it); project links; Done table (collapse); per-row Call/More |
| **Today (owner, phone)** | 36 | 5 | 6 | 20 | 27 | 403 (63) | Same | Neel header + 4 attention cells + 4 Needs-you cards + 8 task cards + 6 done cards: 4.4 screens | Done list; project links; the second copy of each Needs-you item in the list below |
| **Today (employee)** | 8 | 11 | 1 | 6 | 10 | 103 | Do my next task | Already calm; the next task is not singled out, and the punch-in state is one cell among others | Projects-in-progress links |
| **Conversations list** | 5 | 13 | 0 | 1 | 6 | 43 | Open a chat | Fine | — |
| **Conversation** | 7 (14 phone) | 13 | 0 | 9 | 25 | 180 | Talk; turn a message into work | Mostly fine after V2; the list pane on desktop repeats the navigation's job | — |
| **Work** | 45 | 18 | 5 | 1 | 28 | 264 | Find a task | Five tabs + 13-item sidebar = 18 choices; five columns × 13 rows with two row actions each | Who/when columns for "Mine"; Team vs Mine as tabs; row actions |
| **Task detail (done)** | 3 in main + 5 in bar | 13 | 1 | 4 | 22 | 91 | Verify | Stepper (6 steps × 2 lines) + timeline repeating the stepper + project select + documents block + messages, all visible | Timeline (the record); project/documents (details); stepper times |
| **Projects** | 6 | 13 | 5 | 5 | 20 | 148 | Open a project | OK | — |
| **Project detail** | 19 | 13 | 3 | 2 | **86** | **625** | See where the project stands | 20 activity entries of three lines each, status select + add person + add task controls always open | Activity (show 3); management controls behind "Edit" |
| **Documents** | 35 | 13 | 0 | 5 | 20 | 162 | Find or make a document | Four template tiles + uploader + search + 6 filter chips + 5 rows × 2 actions | Filter chips (search is enough); category select until a file is chosen |
| **Templates** | 11 | 13 | 0 | 10 | 10 | 66 | Pick one | Fine | — |
| **Attendance (manager)** | 22 | 13 | 7 | 9 | **104** | 290 | Punch; decide leave | Own day + leave + holidays + 14-day history table + team + leave requests + balances (6 × 2 buttons) + holidays again | History (link), balances (link), holidays (once) |
| **Approvals** | 10 | 13 | 4 | 4 | 15 | 169 | Decide | Decided items share the page with pending ones | Decided (collapse) |
| **Team** | 3 | 13 | 6 | 2 | 20 | 89 | See people / invite | Fine | — |
| **Search** | 7 | 13 | 0 | 3 | 0 | 55 | Find | A page instead of a command | — |
| **Updates** | 17 | 13 | 0 | 2 | 17 | 205 | Know what happened | Duplicates Today's attention items, plus every message notification | Message notifications (Chats has them) |
| **Settings** | 13 | 13 | 0 | 3 | 6 | 36 | Change a setting | Fine | — |

## 3. Why — the causes, not the symptoms

1. **Module-first architecture.** Navigation mirrors the database (tasks,
   conversations, projects, documents, attendance, approvals, members). A
   first-time owner must learn eight nouns before acting.
2. **The same fact in several places.** A late task appears as a counter,
   an attention cell, a Needs-you card, a table row, and an Update.
3. **Actions attached to every item** rather than to the selected item
   (row Call/More; documents download/delete; leave balance +½/+1).
4. **No staging.** Screens show the information for every stage of an object's
   life at once instead of the stage it is in.
5. **Role-blind prominence.** Staff and owners get the same map; staff Today is
   calm, but their navigation is not.

## 4. Journeys (clicks from opening the app)

| Journey | V2 | Friction |
|---|---|---|
| Employee: do next task (accept → start → done with note) | Today → task (1) → 3 actions + proof sheet 3 = **7** | The next task is not singled out on Today |
| Owner: verify done work | Today → Verify (**1**) | Good — keep |
| Owner: approve a leave request | Today → "2 leave requests" (1) → scroll to requests → Approve (**2**, +scroll past own panel) | Lives in Attendance, below the owner's own day |
| Owner: approve a purchase request | Today → "approvals waiting" (1) → Approve (**2**) | A separate destination |
| Manager: who is overloaded? | Today rail (desktop only) — **not available on phone** | Phone has no team view on Today |
| Conversation → task | Hover/tap Make task (1) → who (1) → when (1) → Create (1) = **4** | Good (V2) |
| Field worker from notification | Push/email → task (1) → Done (1) → photo (1) → Send (1) = **4** | Good; proof sheet is the right pattern |
| New business to first task | Setup (3 screens) → Today guide → Team invite → … | Long; the guide lists 5 steps at once |

## 5. First-click uncertainty (fresh eyes)

- **Owner Today:** six equally loud Neel buttons — which is first? The
  counters strip reads like a report, not a to-do.
- **Employee navigation:** "Work" vs "Today" — where is my work? (Both.)
- **Bell vs Today:** both show "needs you" items.
- **Attendance:** is it "Attendance", "Attendance & leave", or "Leave &
  holidays"? Three names across nav, More and Today.

## 6. Empty states

First-day owner Today is good (the guide). Its sidebar still offers 13 places
that are all empty; the guide competes with a "New task" button that cannot
work yet (no team).
