# Waakya Platform V1 — Technical Specification

Implementation contract for the production platform release that follows the
Phase-1 baseline (`f7c819e`) and the locked V3.5 design (`890c472` in
`feature/design-v3-1-visual-experience`). Written after auditing every
migration (0001–0022), the application layer, the QA tooling and the design
worktree. This document decides; the code follows it.

## 0. Principles that decide ties

1. Tenant isolation before everything else: every tenant-owned row carries
   `org_id`; every read and write is checked in RLS **and** in the server
   action; customers are a separate principal, never a hidden member.
2. Connected flows, not CRUD. A screen only exists if it feeds another screen.
3. Every business action has: trigger → validation → owner → state change →
   consequence → notification → audit record → next action.
4. One platform. Omega Infra and Shelter Xperts are *configurations*
   (modules + record types + pipeline stages), never branches in shared code.
5. Preserve the Phase-1 task lifecycle and the brand rules exactly.
6. Nothing is deployed until every gate in §14 is green.

## 1. Baseline facts (verified)

- Repo: standalone clone `~/waakya-platform` of `ghnew`
  (github.com/waakya/waakya-website), branch `feature/platform-v1`.
- Production: https://waakya.com, Vercel project `waakya`, region `bom1`.
  Supabase `krdmzjjmbrphzcuotfgz` (Mumbai). Remote migration ledger =
  0001–0022, nothing beyond.
- Frozen branch `feature/ai-voice-local` owns local-only `0023`–`0025`.
  **Platform migrations start at `0030`.** 0023–0029 are reserved.
- Baseline gate in the clone: 231 unit tests, lint 0 errors, typecheck OK.
- Local stack: `supabase start` (project `waakya-platform`, API 57521, DB
  57522, Studio 57523, Mailpit 57524), app on port 3400.

## 2. Architecture: multi-tenant modular monolith

```
CORE          auth · orgs · memberships · permissions · Today · conversations
              work/tasks · projects · documents · approvals · notifications
              search · domain events (audit)
MODULES       crm · records · vendors · campaigns · attendance · customer_experience
              automation · website_integration · custom_domains
INTEGRATIONS  /api/integrations/* (inbound) · lib/messaging adapters (outbound)
EXTENSIONS    per-org record types, pipelines, rules — data, never code
```

Runtime stays Next.js 16 (App Router, server actions) on Vercel + Supabase
(Postgres, Auth, Storage, Realtime, pg_cron). No new infrastructure.

### 2.1 Code layout (additions)

```
lib/modules/        catalog.ts (pure, tested) · queries.ts · actions.ts
lib/permissions/    index.ts (pure capability matrix, tested)
lib/events/         types.ts · emit.ts (server) · outbox processing in lib/automation
lib/crm/            model.ts (pure) · queries.ts · actions.ts · identity.ts (pure)
lib/records/        schema.ts (pure field validation) · templates.ts · queries.ts · actions.ts
lib/vendors/        queries.ts · actions.ts
lib/portal/         principal.ts · queries.ts · actions.ts (customer side)
lib/automation/     engine.ts (pure) · run.ts (server) · actions.ts
lib/integrations/   keys.ts (pure hashing) · leads.ts (server)
lib/messaging/      types.ts · email.ts · whatsapp/{mock,meta}.ts · index.ts
lib/campaigns/      segment.ts (pure) · queries.ts · actions.ts · send.ts
lib/domains/        actions.ts · resolve.ts
app/(app)/crm, records, vendors, campaigns, automations, settings/modules,
             settings/integrations, settings/domains
app/portal/         customer experience (own layout, own principal)
app/api/integrations/leads · app/api/integrations/whatsapp
app/(marketing)/    production homepage ported from V3.5
supabase/migrations/0030_*.sql … 0039_*.sql
```

## 3. Foundation (migration 0030)

### 3.1 Organization modules

```sql
organization_modules(id, org_id, module_key text, enabled bool,
  configuration jsonb default '{}', enabled_at, disabled_at,
  enabled_by uuid, updated_at, unique(org_id, module_key))
```
Catalog in `lib/modules/catalog.ts` (code, owned by Waakya):

| key | kind | depends on |
|---|---|---|
| today, conversations, work, projects, documents, approvals, team, search, notifications | core (always on) | — |
| attendance | optional (default on for existing orgs) | — |
| checklists | optional (default on) | work |
| crm | optional | — |
| records | optional | — |
| vendors | optional | records, projects |
| customer_experience | optional | projects |
| automation | optional | — |
| website_integration | optional | crm |
| campaigns | optional | crm |
| custom_domains | optional | customer_experience |

Rules: disabling a module never deletes data; it hides navigation, refuses
server actions (`requireModule`) and RLS write paths via
`org_module_enabled(org, key)`; reads stay allowed so history is visible when
re-enabled. Dependencies are enforced on enable (dependency must be enabled)
and on disable (dependents disabled first, in one transaction via RPC
`set_org_module`). The Omega and Shelter reference configurations are seed
functions in `lib/modules/presets.ts`, applied through the same RPC.

### 3.2 Domain events (audit + outbox)

```sql
domain_events(id, org_id, event_type text, entity_type text, entity_id uuid,
  actor_kind text check in ('user','customer','system','automation','integration'),
  actor_id uuid null, payload jsonb, depth int default 0,
  idempotency_key text null unique, occurred_at, processed_at null,
  processing_attempts int, last_error text)
```
- Written by SECURITY DEFINER `record_domain_event(...)` (membership or
  customer-access check, service role bypass) and by triggers for state changes
  that can happen through PostgREST (tasks state, approvals decided, leave
  decided, membership role changed, record status changed, opportunity stage
  changed, customer decision recorded).
- Event vocabulary (`lib/events/types.ts`): `lead.created`, `contact.updated`,
  `contact.assigned`, `opportunity.stage_changed`, `task.created`,
  `task.state_changed` (with from/to), `task.accepted`, `task.submitted`,
  `task.verified`, `approval.requested`, `approval.decided`,
  `record.created`, `record.status_changed`, `project.progress_changed`,
  `project.update_published`, `proof.submitted`, `proof.verified`,
  `customer_message.received`, `campaign.sent`, `campaign.recipient_replied`,
  `customer_decision.recorded`, `vendor_work.submitted`,
  `vendor_work.verified`, `membership.role_changed`, `module.changed`,
  `integration.lead_received`.
- This table **is** the audit log. Every row carries useful context (previous
  and new values, who, why). Read through `/settings/audit` (owner/admin) and
  inline "History" panels.
- Automation consumes unprocessed rows (§9).

### 3.3 Permissions

`lib/permissions/index.ts` — a pure capability matrix over
`member_role ∪ {customer}` and module capabilities, e.g. `crm.contact.read`,
`crm.contact.assign`, `records.record.write`, `records.type.manage`,
`vendors.payment.record`, `portal.decision.decide`, `automation.rule.manage`,
`integrations.key.manage`, `modules.manage`, `audit.read`. Enforcement:

- UI: `can(viewer, capability)` decides what renders.
- Server actions: `requireCapability(viewer, capability)` → localized refusal.
- DB: RLS uses `org_role()`, `is_org_owner_admin()`, `is_org_admin()` (which
  includes managers) and the new `is_project_customer()`; module writes also
  check `org_module_enabled()`.

Fixes to Phase-1 policies in 0030:
- `orgs update` → owner/admin only, with `with check`.
- `invites read` → owner/admin, or manager for `member` invites only.
- `task_messages insert` → `author_id = auth.uid()` and task in org.
- `escalations insert` → `is_org_admin` and task in org.
- Notifications: client insert policy dropped; in-app channel calls SECURITY
  DEFINER `push_user_notification(...)` which validates sender membership,
  recipient membership, `href` is relative, `task_id` in org, and namespaces the
  dedupe key. Closes the known P2.
- Missing FK/filter indexes listed in the schema audit.
- `profiles` sign-up trigger (`handle_new_user`) so every auth user has a row.

### 3.4 Multi-org viewers

`getViewer()` resolves the active org from cookie `waakya_org` when it names a
membership, else the oldest membership. `/settings` gains an org switcher when
a user holds several memberships. `accept_invite` keeps allowing additional
memberships (now visible).

### 3.5 Task origin tracing

`tasks` gains `origin_kind text` (`manual`, `conversation`, `crm`, `project`,
`approval`, `automation`, `customer_action`, `vendor_action`, `checklist`,
`integration`), `origin_id uuid`, `origin_label text`, `contact_id`,
`opportunity_id`, `record_id`, `vendor_assignment_id`,
`blocked_by_decision_id`. The task detail shows "Why this task exists".

`guard_task_update` extension: `proof_required` enforced at `done` (a proof row
must exist) — the DB now agrees with the UI; a task blocked by an open customer
decision cannot move to `done`.

## 4. CRM (migration 0031)

Tables: `crm_pipelines`, `crm_pipeline_stages` (position, kind
open|won|lost), `crm_contacts` (kind lead|customer, full_name, phone_e164,
email, company_name, source, tags text[], owner_id, project_id, notes,
email_opt_out, whatsapp_opt_out, last_activity_at, next_action_at,
next_action_note, archived_at; unique partial on (org_id, phone_e164) and
(org_id, email)), `crm_opportunities` (contact_id, pipeline_id, stage_id,
title, value numeric(14,2), owner_id, project_id, record_id, status
open|won|lost, expected_close, closed_at, source), `crm_activities`
(contact_id, opportunity_id, kind note|call|meeting|message|email|whatsapp|
stage_change|task|campaign|website|decision, body, actor_kind, actor_id,
task_id, campaign_id, metadata, occurred_at).

Rules (`lib/crm/model.ts`, pure, tested): stage change is legal within one
pipeline; `won`/`lost` stages close the opportunity and stamp `closed_at`;
identity resolution order: phone → email → new contact; assignment always
records an activity and emits `contact.assigned`; a contact with an open
opportunity and no `next_action_at` is "needs follow-up" on Today.

Screens: `/crm` (list with search, filter by kind/stage/owner, paginated with
exact counts), `/crm/[id]` (identity, owner, pipeline card, timeline,
related project/records/tasks, "Next action", buttons: call logged, note,
create task, move stage, convert to customer, link project), `/crm/pipeline`
(stage columns on desktop, stacked on phone), settings → pipeline stages.

Default pipeline installed on module enable: New → Contacted → Interested →
Meeting / Site visit → Proposal → Won · Lost.

## 5. Records engine (migration 0032)

```
record_types(org_id, key, name, name_plural, icon, module_key, description,
  statuses jsonb [{key,label,tone,is_terminal}], default_status,
  customer_visible_default bool, archived_at, unique(org_id,key))
record_fields(org_id, record_type_id, key, label, field_type, options jsonb,
  required, position, show_in_list, customer_visible, unit, archived_at,
  unique(record_type_id,key))
records(org_id, record_type_id, title, status_key, values jsonb,
  project_id, contact_id, vendor_id, assignee_id, customer_visible,
  sort_key numeric, created_by, updated_by, archived_at, created_at, updated_at)
```
Field types: text, long_text, number, money, date, boolean, select,
multi_select, phone, email, url, member, contact, project, vendor, record
(relation to another record type). Values are validated server-side by
`lib/records/schema.ts` (pure, tested) and by a trigger that checks
`record_type.org_id = records.org_id` and relation targets are in the same org.
Structured relations (project, contact, vendor, assignee) are real FK columns;
everything else is `values` with a GIN index and per-type list indexes on
`(org_id, record_type_id, status_key)`.

Templates in `lib/records/templates.ts`: `property_unit` (Project, Tower, Unit
number, Type, Floor, Area, Facing, Price, Availability status, Customer,
Salesperson) and `work_package` (Project, Area, Category, Item, Quantity,
Vendor, Cost, Payment status, Execution status, Customer visibility). Any org
can install either or define its own type from `/records/types`.

Screens: `/records` (type picker), `/records/[type]` (list, filters by status,
project; exact counts; pagination), `/records/[type]/[id]` (detail, status
change with reason, related tasks/vendor/customer), `/records/types` (manage
types and fields; owner/admin).

## 6. Projects as the operational container (migration 0033)

`projects` gains `contact_id` (the customer), `progress_percent int`
(0–100, recomputed from milestones), `customer_summary text`. New tables
`project_milestones(org_id, project_id, name, position, status
planned|in_progress|done, due_date, done_at, customer_visible)` and
`project_updates(org_id, project_id, body, kind progress|milestone|proof|
decision|note, customer_visible, source_event_id, created_by, actor_kind,
created_at)`. Documents and proofs gain `customer_visible bool default false`.

Source of truth: task state lives in `tasks`; vendor execution in
`vendor_assignments`; customer-facing story in `project_updates`; progress in
`projects.progress_percent` (derived, recomputed by `recompute_project_progress`).

## 7. Customer experience (migration 0034)

Principal model: `customer_access(org_id, contact_id, user_id null, email,
phone_e164, status active|revoked, invited_by, invite_token, invited_at,
accepted_at, revoked_at, unique(org_id, contact_id))` and
`customer_project_access(org_id, customer_access_id, project_id, unique)`.
A customer signs in with the same Supabase Auth (email OTP or Google) and
lands in `/portal` when they hold active customer access and no membership;
a person with both sees a chooser. `lib/portal/principal.ts` resolves the
customer principal; `app/portal/layout.tsx` requires it. Customers never pass
through `app/(app)`.

Visibility is enforced in RLS with `is_project_customer(project_id)`:
projects (read), project_milestones and project_updates (`customer_visible`),
documents and proofs (`customer_visible`), records (`customer_visible`),
customer_decisions (own project), customer_messages (own thread). Internal
fields (vendor cost, payment state, internal notes, employee data) are never
selected by portal queries and are not exposed by any customer policy.

Decisions: `customer_decisions(org_id, project_id, title, description,
options jsonb [{key,label,detail?}], status open|decided|cancelled,
decided_option_key, decided_at, decided_by_access_id, decided_by_user_id,
blocks_task_id, blocks_record_id, requested_by, created_at)`. Deciding is the
RPC `record_customer_decision(decision, option)`; it checks access, that the
decision is still open, that the option exists; records the choice; unblocks
the task (`blocked_by_decision_id` cleared) and/or moves the record status if
configured; writes a `project_updates` row (customer-visible); emits
`customer_decision.recorded`; notifies the requester and the blocked task's
assignee. Idempotent: deciding an already decided decision returns the
existing decision with `alreadyDecided`.

Customer messages: `customer_messages(org_id, project_id, customer_access_id,
author_kind customer|business, author_user_id, body, created_at)` → Today
"customer responded", CRM activity (`kind=message`).

Portal screens: `/portal` (projects), `/portal/projects/[id]` (progress,
latest update, next milestone, "Needs you" decisions, approved materials,
photos/proof marked visible, documents, messages).

## 8. Vendors (migration 0035)

`vendors(org_id, name, phone_e164, email, category, gstin, notes, status
active|inactive, created_by)`, `vendor_assignments(org_id, vendor_id,
project_id, record_id, title, amount numeric(14,2), payment_status
unpaid|partial|paid, execution_status assigned|in_progress|submitted|
verified|rejected, task_id (internal owner task), submitted_at, verified_at,
verified_by, rejection_note, customer_visible, created_by)`,
`vendor_payments(org_id, vendor_assignment_id, amount, paid_at, note,
recorded_by)`. Payment status is derived from payments vs amount.

Flow: assign → (execution) submit with proof (proof rows attach to the
assignment's task) → verify (owner/admin/manager) → project update
(customer-visible if flagged) → next work (automation or manual). Vendor delay
= assignment past its task due date → Today.

## 9. Automation (migration 0036)

`automation_rules(org_id, name, trigger_event, conditions jsonb, actions
jsonb, enabled, created_by, run_count, last_run_at)`,
`automation_runs(org_id, rule_id, event_id, status queued|running|succeeded|
failed|skipped, attempts, error, log jsonb, started_at, finished_at,
unique(rule_id, event_id))`.

Engine (`lib/automation/engine.ts`, pure, tested): condition language
`{ all: [{ field, op, value }] }` with ops eq/neq/in/contains/gt/lt/is_set;
fields dotted into the event payload. Actions: `assign_contact`,
`create_task`, `notify_member`, `move_opportunity`, `send_email`,
`send_whatsapp_template`, `publish_customer_update`, `request_verification`,
`set_record_status`. Every action is idempotent under `(rule_id, event_id)`.
Loop guard: events emitted by automation carry `depth+1`; rules ignore events
with `depth >= 3`. Processing runs inside the cron tick (`/api/cron/sla`
becomes `/api/cron/tick`, same secret, both paths kept) and right after an
event is recorded by a server action (`processOrgEvents(orgId)` with the
service role, best effort). Failures are recorded, retried up to 3 times,
never silent.

## 10. Website integration (migration 0037)

`integration_keys(org_id, name, key_prefix, key_hash, scopes text[],
created_by, created_at, last_used_at, revoked_at)`,
`integration_requests(org_id, key_id, idempotency_key, request_hash,
status, response jsonb, created_at, unique(key_id, idempotency_key))`.

`POST /api/integrations/leads` — `Authorization: Bearer wk_live_<prefix>_<secret>`;
key hashed with SHA-256 and compared constant-time; `Idempotency-Key` header
(or body hash) prevents replay; rate limit per key (60/min, table-backed
window); zod-validated payload `{ full_name, phone?, email?, source, message?,
project?, interest?, metadata? }` (phone or email required); identity
resolution; contact + opportunity + activity; event `lead.created` (actor_kind
integration); automations; audit. Responses: 202 with `{ contact_id,
opportunity_id, deduplicated }`, 401/403/409/422/429 with a stable error code.
Keys are shown once at creation; rotate = create new + revoke old.

## 11. Campaigns and messaging (migration 0038)

`message_templates(org_id, channel email|whatsapp, name, subject, body,
provider_template_name, provider_language, status draft|approved|rejected)`,
`campaigns(org_id, name, channel, template_id, segment jsonb, status
draft|scheduled|sending|sent|partially_failed|cancelled, scheduled_at,
started_at, finished_at, counts jsonb, created_by)`, `campaign_recipients(
org_id, campaign_id, contact_id, status queued|sent|delivered|failed|replied|
suppressed, provider_message_id, error, sent_at, replied_at,
unique(campaign_id, contact_id))`, `inbound_messages(org_id, channel,
provider_message_id unique, from_address, body, contact_id, campaign_id,
received_at, raw jsonb)`.

Segment (`lib/campaigns/segment.ts`, pure): filter by kind, tags, source,
owner, project, stage. Suppression: opt-out flags, missing address, archived
contacts, duplicates. Sending goes through `lib/messaging`
(`EmailProvider` = Resend; `WhatsAppProvider` = `mock` by default, `meta`
Cloud API adapter behind `WHATSAPP_PROVIDER=meta`). Automated QA never sends
real messages: the mock records to `inbound_messages`/`campaign_recipients`
only. Inbound WhatsApp webhook `POST /api/integrations/whatsapp` (verify token
+ signature) → `inbound_messages` → contact match → CRM activity → event
`customer_message.received` → notify owner → Today.

## 12. Custom domains (migration 0039)

`organization_domains(org_id, hostname citext unique, kind portal, status
pending|verified|active|removed, verification_token, verified_at,
activated_at, removed_at, created_by)`. Verification = DNS TXT
`_waakya-verify.<hostname>` containing the token (checked server-side with
`dns.promises.resolveTxt`). `proxy.ts` resolves the request host: apex/www →
marketing; `<slug>.waakya.com` or a verified custom host → the org's portal.
Host header is never trusted for tenancy beyond a DB match. TLS/Vercel domain
attachment is documented as a manual step this release (foundation only).

## 13. Today (attention surface)

Owner Today adds "Needs me" sources beyond tasks: approvals waiting, customer
decisions open >48h, customer messages unanswered, vendor work submitted
(verify), vendor delays, CRM follow-ups due, website leads unassigned,
automation failures. Each item links to the action. Counts are exact
(`count: "exact"`), never derived from a capped list; the 200-item cap in
`getOrgTasks` is replaced with server-side counts and paginated lists.

## 14. Release gates

1 clean tree · 2 architecture complete · 3 migrations verified on a clean DB
and on a copy of the current schema · 4 unit green · 5 integration green ·
6 RLS/security green (Org A vs Org B, employee vs customer, storage) ·
7 E2E green · 8 responsive (390/430/768/820/1024/1280/1440) · 9 accessibility
(axe) · 10 production build · 11 migration upgrade test · 12 rollback
documented · 13 backup confirmed · 14 preview smoke · 15 final diff reviewed.

## 15. Implementation order (vertical slices)

1. Foundation: modules, events, permissions, multi-org, notification
   hardening, task origin, `/settings/modules`, audit view. Tests.
2. CRM slice: schema → permissions → actions → screens → Today → tests.
3. Records slice: schema → validation → templates → screens → tests.
4. Projects + customer experience slice: milestones/updates → customer access
   → portal → decisions → task unblock → tests.
5. Vendors slice.
6. Automation slice (engine + runs + UI + cron).
7. Website integration slice.
8. Campaigns + messaging adapters slice.
9. Custom domains foundation.
10. Reference configurations (Omega, Shelter) as presets + seed script.
11. Production homepage from V3.5.
12. Cross-module QA, adversarial QA, security, performance, release.
