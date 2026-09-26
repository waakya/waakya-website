# Platform V1 — QA scenario matrix

What was tested, where the test lives, and what it proves. Every row is
automated and green on the local stack (Supabase `waakya-platform`, ports
5752x) unless marked otherwise. Layers: **U** unit (Vitest), **I** integration
against the database (Vitest, `npm run test:integration`), **E** browser
(Playwright, real Chromium at a Pixel 7 viewport unless a width is named).

## 1. Core loop and Phase 1 (unchanged behaviour, re-verified)

| Scenario | Layer | Where |
|---|---|---|
| create → acknowledge → accept → in progress → done → verify, with events | E | `e2e/core-loop.spec.ts`, `task.spec.ts` |
| state machine transitions, SLA maths, counters, folding, sections | U | `lib/tasks/*.test.ts`, `lib/sla/engine.test.ts` |
| acknowledge and completion clocks run out; escalation reaches the owner | E | `e2e/sla.spec.ts` |
| proof photo through a signed URL; object key never reaches the browser | E | `e2e/proof.spec.ts` |
| org setup, invites, roles; RLS exercised through the app | E | `e2e/org.spec.ts` |
| RLS called directly through PostgREST by a stranger | E | `e2e/rls.spec.ts` |
| documents, templates, projects, approvals, search, isolation | E | `e2e/phase1.spec.ts` |
| daily checklists produce ordinary tasks; gated by the module | E | `e2e/checklist.spec.ts` |
| Today: progressive disclosure, never hidden work, chips say their state | E | `e2e/v3-today.spec.ts`, `dashboard.spec.ts` |
| login: honest email field, three languages, redirects | E | `e2e/auth.spec.ts` |
| day-one truths (manifest, robots, headers, no test doors in prod) | E | `e2e/ship.spec.ts` |

## 2. Platform slices

| Scenario | Layer | Where |
|---|---|---|
| module catalogue equals the database's; dependencies refuse a bad change; presets | U | `lib/modules/catalog.test.ts` |
| capability matrix per role, incl. the customer principal | U | `lib/permissions/index.test.ts` |
| CRM: dedupe by phone/email, owner, pipeline stage moves, task carries the customer, history; member cannot manage pipeline; outsider sees nothing; module off = no door | U+E | `lib/crm/model.test.ts`, `e2e/crm.spec.ts` |
| records: template → type → list → status moves only along declared edges; values validated server-side; member cannot archive | U+E | `lib/records/schema.test.ts`, `e2e/records.spec.ts` |
| customer experience: invite, sign-in as customer, sees only published, one decision transaction unblocks work and notifies; second decision refused; outsider refused; revoke closes the page | E | `e2e/customer.spec.ts` |
| vendors: work on a project with an internal owner and task, submit with proof, verify, payment status, project tells the customer; member cannot verify or see money | E | `e2e/vendors.spec.ts` |
| automation: WHEN→IF→DO; assignment by fewest; follow-up task; run log; non-matching event untouched; loops bounded (depth), idempotent (keyed) | U+E | `lib/automation/engine.test.ts`, `e2e/automation.spec.ts` |
| website endpoint: key mint/revoke, POST → contact + activity, idempotent retry, wrong key, revoked key, flood held back, request ledger | U+E | `lib/integrations/keys.test.ts`, `e2e/integration.spec.ts` |
| campaigns: segment preview, one message per person via mock provider, opt-out and missing address excluded and stated, timeline, signed WhatsApp webhook reply, STOP honoured | U+E | `lib/campaigns/segment.test.ts`, `e2e/campaigns.spec.ts` |
| custom domains: hostname validation, verification record, honest DNS check, unknown host refused at the edge, removal | U+E | `lib/domains/hostname.test.ts`, `e2e/domains.spec.ts` |
| exact counts at scale: 1,500 tasks and 600 contacts; database counts equal a direct count; the row cap alone would have undercounted; paging exact | I | `test/integration/scale.test.ts` |

## 3. Tenant isolation and adversarial (reference tenants Omega Infra and Shelter Xperts)

`test/integration/tenant-isolation.test.ts`, 52 checks, each run as a real
signed-in user through the API:

- reads: Omega's owner sees none of Shelter's rows in any platform table; by id or by list; anonymous sees nothing
- writes: cross-tenant insert and update refused in CRM, records, vendors, campaigns, rules, project updates, decisions, domains
- role ceilings: a member cannot switch modules, define record types, mint keys, manage rules, reassign a lead, verify vendor work or send a campaign
- internal functions: anon cannot call the definer functions; a member cannot run `automation_apply` or push a cross-business notification; a lead cannot be pushed into another business through the CRM door
- customer principal: sees their project and only what was published, nothing of the team; cannot write into the business or decide for another project; owners of one business cannot see another's customers
- storage: nothing listed under another business's prefix, no writes there

## 4. Design and accessibility

| Scenario | Layer | Where |
|---|---|---|
| homepage: real doors, no lab chrome, stories respond, 7 widths (390/430/768/820/1024/1280/1440) with no overflow, no target under 44 px on a phone, axe serious/critical = 0 | E | `e2e/homepage.spec.ts` |
| product screens: axe serious/critical = 0 on 18 front doors; no overflow at 7 widths on 9 screens; login door | E | `e2e/a11y.spec.ts` |
| desktop layouts of Today and task detail | E | `e2e/desktop.spec.ts` |
| brand rules: no forbidden word, Haldi only on the tick, three locales for every dictionary, Latin digits, no exclamation marks | U | `lib/brand/rules.test.ts` |

## 5. Not automated (stated honestly)

- WhatsApp through the real Meta provider: the adapter is written; only the mock has run. First real send needs a business account and a template approval.
- Custom domain hosting: verification is real; attaching the hostname at the host (Vercel) is a manual step documented in Settings → Domains.
- Email delivery on production goes through Resend as in Phase 1; not re-tested with a real inbox in this release.
- The marketing page is English only.
