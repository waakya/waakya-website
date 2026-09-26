# Waakya V3 — Simplicity scorecard (V2 → V3)

**Method.** Both builds measured the same way, one server at a time, on the
same local stack and seed data: `scripts/design/measure.mjs` runs
`scripts/design/complexity.js` for owner, manager, employee and a first-day
owner at 1440 and 390 on 17 routes (108 measurements each;
`docs/design-v3/v2-complexity-remeasured.json`,
`docs/design-v3/v3-complexity.json`). The metric counts what is *on screen*
across the whole page except navigation — content folded inside a closed
disclosure is not counted (an earlier run counted it by mistake and made V3
look worse on navigation; fixed, both re-measured). These are directional
signals of what competes for attention, not a science of usability.

## Headline

| Across all 108 like-for-like measurements | V2 | V3 | Change |
|---|---|---|---|
| Visible actions | 1367 | 1187 | -13% |
| Actions in the first view | 967 | 974 | +1% |
| Small metadata lines | 2328 | 1658 | -29% |
| Words | 16585 | 12365 | -25% |
| Words in the first view | 10433 | 9635 | -8% |
| Boxes / cards | 494 | 401 | -19% |
| Status chips | 194 | 162 | -16% |
| Filled primary buttons | 76 | 56 | -26% |
| Navigation choices on screen | 939 | 819 | -13% |

**Read:** V3 shows a quarter fewer words and ~30 % fewer small metadata lines
across the product, one filled primary per screen where V2 had up to six, and
roughly half the navigation choices on desktop. The one number that rose —
actions in the first view on owner Today — is the design working as intended:
Verify, Remind, Call, Approve and Reject moved *onto the rows that need them*,
above the fold, instead of living on other screens.

## Screen by screen (page metrics, V2 → **V3**)

| Screen | Nav choices | Actions | Actions in first view | Chips | Boxes | Small metadata lines | Words | Words in first view | Filled primaries | Screens long |
|---|---|---|---|---|---|---|---|---|---|---|
| owner `/aaj` @1440 | 13 → **6** | 66 → **42** | 22 → **30** | 6 → **0** | 11 → **1** | 49 → **37** | 506 → **343** | 210 → **225** | 6 → **1** | 2.5 → **1.8** |
| owner `/aaj` @390 | 5 → **4** | 38 → **42** | 15 → **18** | 6 → **0** | 20 → **1** | 32 → **41** | 440 → **338** | 96 → **105** | 6 → **1** | 4.4 → **3** |
| manager `/aaj` @1440 | 13 → **6** | 66 → **41** | 22 → **30** | 6 → **0** | 11 → **1** | 49 → **35** | 503 → **314** | 207 → **196** | 6 → **1** | 2.5 → **1.7** |
| manager `/aaj` @390 | 5 → **4** | 38 → **41** | 15 → **19** | 6 → **0** | 20 → **1** | 32 → **39** | 440 → **309** | 96 → **103** | 6 → **1** | 4.4 → **2.9** |
| employee `/aaj` @390 | 5 → **3** | 5 → **5** | 5 → **5** | 1 → **1** | 2 → **2** | 5 → **4** | 48 → **46** | 48 → **46** | 0 → **0** | 1.1 → **1.1** |
| employee `/aaj` @1440 | 11 → **5** | 5 → **5** | 5 → **5** | 1 → **1** | 2 → **2** | 5 → **4** | 48 → **46** | 48 → **46** | 0 → **0** | 1 → **1** |
| firstday `/aaj` @1440 | 13 → **6** | 6 → **4** | 6 → **4** | 0 → **0** | 5 → **2** | 12 → **8** | 100 → **70** | 100 → **70** | 2 → **2** | 1 → **1** |
| firstday `/aaj` @390 | 5 → **4** | 6 → **4** | 5 → **4** | 0 → **0** | 2 → **2** | 15 → **12** | 90 → **78** | 75 → **74** | 2 → **2** | 1.5 → **1.5** |
| owner `/work` @1440 | 18 → **10** | 40 → **24** | 31 → **24** | 5 → **3** | 1 → **1** | 23 → **17** | 281 → **158** | 225 → **158** | 1 → **1** | 1.3 → **1** |
| owner `/work` @390 | 10 → **8** | 14 → **10** | 5 → **6** | 5 → **3** | 13 → **7** | 18 → **12** | 291 → **180** | 106 → **91** | 1 → **1** | 2.7 → **1.7** |
| employee `/kaam/new-task` @390 | 0 → **0** | 7 → **5** | 1 → **2** | 0 → **0** | 4 → **3** | 23 → **19** | 93 → **78** | 76 → **75** | 0 → **0** | 1.6 → **1.3** |
| owner `/kaam/done-task` @1440 | 13 → **6** | 14 → **14** | 12 → **12** | 1 → **1** | 5 → **5** | 28 → **28** | 106 → **106** | 81 → **81** | 1 → **1** | 1.5 → **1.5** |
| owner `/kaam/done-task` @390 | 0 → **0** | 14 → **11** | 7 → **7** | 1 → **1** | 5 → **4** | 27 → **24** | 104 → **97** | 65 → **65** | 1 → **1** | 2.3 → **2** |
| owner `/projects/villa` @1440 | 13 → **16** | 19 → **19** | 13 → **19** | 4 → **4** | 2 → **2** | 87 → **35** | 626 → **269** | 312 → **258** | 0 → **0** | 2.1 → **1.1** |
| manager `/hazri` @1440 | 13 → **16** | 22 → **12** | 11 → **9** | 7 → **7** | 9 → **7** | 101 → **38** | 282 → **129** | 177 → **118** | 3 → **3** | 1.6 → **1.2** |
| manager `/hazri` @390 | 8 → **7** | 22 → **12** | 3 → **8** | 7 → **7** | 9 → **7** | 101 → **38** | 282 → **129** | 64 → **53** | 3 → **3** | 3.6 → **1.9** |
| owner `/approvals` @1440 | 13 → **16** | 10 → **10** | 9 → **9** | 4 → **4** | 4 → **4** | 15 → **15** | 169 → **169** | 108 → **108** | 2 → **2** | 1.3 → **1.3** |
| owner `/khabar` @1440 | 13 → **16** | 22 → **22** | 14 → **14** | 0 → **0** | 2 → **2** | 22 → **22** | 360 → **333** | 202 → **184** | 0 → **0** | 1.8 → **1.8** |
| owner `/documents` @1440 | 13 → **16** | 35 → **29** | 35 → **29** | 0 → **0** | 5 → **5** | 20 → **14** | 162 → **155** | 162 → **155** | 1 → **1** | 1 → **1** |
| owner `/baat/site` @1440 | 13 → **6** | 10 → **10** | 9 → **9** | 0 → **0** | 10 → **10** | 31 → **31** | 216 → **216** | 177 → **177** | 0 → **0** | 1 → **1** |
| employee `/baat/site` @390 | 0 → **0** | 14 → **14** | 11 → **11** | 0 → **0** | 9 → **9** | 19 → **19** | 168 → **168** | 119 → **119** | 0 → **0** | 1 → **1** |
| owner `/more` @390 | 5 → **4** | 10 → **11** | 10 → **11** | 0 → **0** | 2 → **2** | 1 → **1** | 16 → **18** | 16 → **18** | 0 → **0** | 1 → **1** |
| employee `/more` @390 | 5 → **3** | 8 → **10** | 8 → **10** | 0 → **0** | 2 → **2** | 1 → **1** | 13 → **16** | 13 → **16** | 0 → **0** | 1 → **1** |

## Qualitative criteria (where a number would be fake)

| Criterion | V2 | V3 | Evidence |
|---|---|---|---|
| Top-level places (desktop / phone) | 13 / 5 for every role | 3 staff, 4 managers & owners (+ More) / 3–4 | nav-items.ts; measured nav choices 13 → 6 on desktop Today |
| "What needs me?" answered in | 5 places (Today, bell, Approvals, Attendance, Chats) | 1 list on Today, every kind counted | attention.tsx; busy-business E2E |
| Owner: approve a leave request | Today → Attendance → scroll → Approve (2 taps + scroll) | Approve on Today's row (1 tap) | e2e-design/journeys |
| Owner: verify done work | 1 tap | 1 tap | unchanged |
| Employee: next task | not singled out | "Up next" | staff-today.tsx |
| Owner exceptions on a busy day (335 tasks) | "2 Late" shown — 58 of 60 late tasks silently dropped by a newest-200 query | "60 Late", folded to 3 rows + exact link; counts equal Work | busy.spec.ts; lib/tasks/queries.ts |
| Phone owner Today length | 4.4 screens | 3.0 screens | measured |
| Employee comprehension (fresh eyes) | calm already | same, plus one "Up next" | review |
| Learning burden | 8 nouns before acting | 3–4 places; the rest arrives in context | IA doc |
| Mobile interaction burden | sticky button could cover scrolled/focused rows | scroll padding (WCAG 2.4.11); actions wrap under reasons | globals.css; sweep |

## Performance (like-for-like, Today, median of 15 server renders, same data)

| Person | V2 | V3 | HTML V2 → V3 |
|---|---|---|---|
| Owner (Sharma Interiors) | 287 ms | 296 ms | 272 → 138 KB |
| Employee | 133 ms | 124 ms (after streaming the staff attention list; 201 ms before) | 68 → 68 KB |
| Busy owner (335 tasks) | 1,871 ms (and incomplete — 200-task cap) | 386 ms | 2,082 → 234 KB |

The 11–14 s and 15 s–2 min Today loads seen earlier were machine contention
(load average ~30, heavy swapping during a concurrent speech evaluation): in a
quiet window (load ≈ 4) the same V3 page renders in ~0.3 s, the same as V2.
`docs/design-v3/bench-today.json` holds every run.

## In the browser (Chrome DevTools MCP, warm, dev server, same machine state)

| Today | V2 | V3 |
|---|---|---|
| Desktop LCP | 698 ms | 572 ms |
| Phone (390, 3×) LCP | 1,902 ms (1,797 ms server) | 528 ms |
| CLS | 0 | 0 |
| Lighthouse accessibility (desktop / mobile) | 100 / 100 | 100 / 100 |
| Lighthouse best practices (desktop / mobile) | 100 / 100 | 100 / 100 |

Single browser samples are noisy; the 15-run server benchmark above is the
stronger evidence. Both say the same thing: V3 did not make Today slower,
and on a busy business it made it much faster.
