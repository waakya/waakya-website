# Waakya V3 — Test matrix (final gate)

Environment: local only. Design stack (Supabase `waakya-design`, 5642x) and
V3 `next dev` on :3300, seeded with `scripts/local/seed-design.ts` (Sharma
Interiors busy, Verma Constructions other tenant, Mehta Traders empty) and
`scripts/local/seed-busy.ts` (Gupta Logistics: 26 people, 335 tasks). Run in
a coordinated quiet window (load average ≈ 3–5; the AI/Voice session held
its heavy work). Every suite below passed in one uninterrupted run after the
last code change unless noted.

| Gate | Result | Command / evidence |
|---|---|---|
| Unit (Vitest) | **246 / 246** (19 files) | `npx vitest run` |
| Typecheck | **clean** | `npx tsc --noEmit` |
| Lint | **0 errors** (3 pre-existing warnings in scripts/e2e-prod) | `npx eslint .` |
| Production build | **success**; no `/design-lab` route in the output | `npx next build` (production tsconfig: `tsconfig.build.json`) |
| Main E2E (Playwright, phone) | **72 / 72**, one clean run | `E2E_PORT=3300 npx playwright test e2e/` |
| — incl. V3 Today contract | 3 / 3 (`e2e/v3-today.spec.ts`) | counts lead to exactly that many tasks; folded groups link to the rest; a just-sent task is reachable |
| — incl. core loop | 4 / 4 (`e2e/core-loop.spec.ts`) | create → acknowledge → done → verify, verified is final, decline, reply thread |
| — incl. proof | 3 / 3 (`e2e/proof.spec.ts`) | photo required blocks finishing; signed private URLs; bucket scoped |
| — incl. SLA / escalation | 5 / 5 (`e2e/sla.spec.ts`) | |
| — incl. RLS | `e2e/rls.spec.ts` | tenant isolation at the database |
| Design E2E | **28 / 28**, one clean run | `DESIGN_BASE=http://localhost:3300 npx playwright test -c playwright.design.config.ts` |
| — Auth regression | 8 / 8 (`auth.spec.ts`) | incl. the 738970e fix: an unknown session is signed out, never sent to setup |
| — Security | 3 / 3 (`security.spec.ts`) | other tenant sees nothing; staff cannot verify/reassign/approve others' |
| — Accessibility (axe) | 6 / 6 (`a11y.spec.ts`) | owner, employee, visitor × desktop, phone: no serious/critical violations |
| — Journeys | 3 / 3 (`journeys.spec.ts`) | employee on phone → owner verifies on desk; manager decides; navigation |
| — Busy business (Today discoverability) | 5 / 5 (`busy.spec.ts`) | all 7 categories counted (≥ 60 late); every count equals Work; waiting "N more" equals Work; manager's own leave never offered; fits 390 |
| — Conversations | 6 / 6 (`conversations.spec.ts`) | Make task always visible (≥ 40 px), who/when, live state |
| Responsive × language sweep | **135 screens, 0 problems** (no sideways overflow, no console errors, no failed requests) | `node scripts/design/sweep.mjs` → `docs/design-v3/sweep.json` |
| — widths | 390 × 844, 430 × 932, 768, 820, 1440 (27 screens each) | |
| — languages | English 60, Hinglish 40, Hindi (Devanagari) 35 | |
| — long content | 50-character name (Venkata Satya Sai…), near-duplicate names (Ramesh Yadav / Yaadav), long task titles, 335-task business | |
| Owner journey | pass | E2E journeys + busy.spec + adversarial review (verify, remind, call, approve, reject → full request) |
| Manager journey | pass | journeys.spec (approval decided in place); person filter; own leave excluded |
| Employee journey | pass | core-loop, proof, journeys (phone); "Up next" |
| Keyboard | pass | visible focus ring on every button (fixed: `outline-none` had cancelled it); disclosures are buttons with aria-expanded; ⌘K never fires while typing |
| Console | 0 errors (sweep, 135 screens; DevTools on Today) | |
| Network | 0 failed requests (sweep); DevTools network list reviewed on Today | |
| Chrome DevTools performance | V3 Today desktop LCP **572 ms** (V2 698), phone **528 ms** (V2 1,902); CLS **0** both | traces via Chrome DevTools MCP (warm, dev server) |
| Lighthouse desktop (Today) | V3: **Accessibility 100, Best Practices 100** (V2 100 / 100) | SEO 54 by design: app pages are noindex |
| Lighthouse mobile (Today) | V3: **Accessibility 100, Best Practices 100** (V2 100 / 100) | earlier V3 run was 96 (targets under a stretched link) — fixed |
| Today server benchmark | owner 296 ms (V2 287), employee 124 ms (V2 133), busy owner 386 ms (V2 1,871 and incomplete) | `scripts/design/bench-today.mjs` → `docs/design-v3/bench-today.json` |

## Environment notes (honest)

- Earlier runs under heavy machine contention (load ≈ 30, swapping) timed
  out; they were not counted as passes or failures and every suite was rerun
  in the quiet window.
- One full main run was interrupted by Next's dev server restarting itself
  at its memory threshold after hours of use; the affected specs passed on
  rerun and the gate above is a later, uninterrupted full run on a fresh
  server.
- Browser measurements are from the dev server (production login is
  disabled by design, so authenticated pages cannot be measured on a
  production build locally); both V2 and V3 were measured the same way.
