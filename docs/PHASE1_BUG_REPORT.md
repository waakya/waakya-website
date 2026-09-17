# Phase 1 — Functional QA Bug Report

Found by the full-organization QA run against production (https://waakya.com), acting as four people in one business and an owner of a second business, through the product's own screens and, for security, through the database API directly.

**Fixed in:** commits `27bc49c` and `3742d87` (application, both deployed to production) with database migrations `0021_functional_integrity.sql` and `0022_notification_targets.sql`, both applied to production.
**Evidence:** `docs/PHASE1_FULL_FUNCTIONAL_MATRIX.md` (first run vs final run), suite in `e2e-prod/qa/`.

Severity: **P0** — data or permission integrity, or a core workflow that cannot complete. **P1** — a workflow that misleads or blocks one side. **P2** — polish and validation.

---

## BUG-01 · P0 · A manager could take over the business

- **Workflow:** Organization and roles (T1.9, T20.3).
- **Reproduction:** Sign in as Arjun (Manager). Call the database API directly:
  `PATCH memberships?org_id=eq.<org>&user_id=eq.<arjun> {"role":"owner"}`, and
  `PATCH memberships?user_id=eq.<priya> {"role":"member"}`, and
  `POST memberships {"org_id":<org>,"user_id":<any user>,"role":"owner"}`.
- **Observed:** Arjun became `owner`; the real owner could be demoted; any account could be added to the business.
- **Root cause:** The membership policies from `0001`/`0003` used `is_org_admin()`, which counts managers, and had no restriction on the role being written. Joining a business was also open to a direct insert instead of only the invite path.
- **Fix:** `0021` — update and delete are limited to owners and admins, never touch an `owner` row, never a person's own row, and cannot set the role to `owner`. The insert policy is removed; joining happens only through `create_org` and `accept_invite`.
- **Regression test:** T1.9 (UI + API), T20.3.
- **Production verification:** both scenarios pass on the final run.

## BUG-02 · P0 · A team member could bypass the task rules through the database

- **Workflow:** Task lifecycle (T2.10).
- **Reproduction:** Sign in as Rahul (team member). `PATCH tasks?id=eq.<his own task> {"state":"verified"}`; `PATCH tasks?id=eq.<Neha's task> {"state":"cancelled"}`; `PATCH tasks {"assigned_to":<neha>,"due_at":"2030-01-01"}`; `POST task_events {"actor_id":<priya>,"to_state":"verified"}`; `POST proofs` for a task that is not his.
- **Observed:** All of it succeeded. A member could approve their own work, close someone else's, move deadlines, and write history in the owner's name.
- **Root cause:** `tasks update`, `events insert` and `proofs insert` only checked business membership. The state machine and the actor rules (`lib/tasks/state-machine.ts`, `lib/tasks/authz.ts`) existed only in the app server, which a direct API call skips.
- **Fix:** `0021` — a `before update` trigger on `tasks` mirrors the state machine and the actor rules, keeps `org_id`/`created_by` immutable, blocks non-managers from changing assignee, deadline, title, details, priority, proof or project, and makes verified and cancelled tasks immutable. Events can only be written in your own name, proof only by the assignee or a manager, and a task can only be created by its author for a member of the same business. The service role (the scheduler) is unaffected.
- **Regression test:** T2.10, plus the whole lifecycle T2.1–T2.12 and the golden path T15.1 to prove the legitimate path still works.
- **Production verification:** passes on the final run; local suite (69 e2e) also passes.

## BUG-03 · P1 · A manager could hand out an admin role

- **Workflow:** Invites (T1.9, T1.10).
- **Reproduction:** As Arjun (Manager): the invite sheet offered "Admin"; `createInvite` accepted `role: "admin"`; a direct insert into `invites` with `role: "owner"` succeeded.
- **Root cause:** The server action checked only `canManage`, the invite policy used `is_org_admin`, and the sheet always rendered all three roles.
- **Fix:** Managers may invite staff only, enforced in `lib/actions/org.ts`, in the `invites` insert policy (`0021`), and in the invite sheet, which now shows only the roles the signed-in person may give.
- **Regression test:** T1.9, T1.10.

## BUG-04 · P1 · "Request changes" gave the worker nothing to act on

- **Workflow:** Task proof and verification (T2.5, T15.1).
- **Reproduction:** Rahul submits proof. Priya opens the task and presses "Send back". The task returns to In progress with no reason anywhere; Rahul sees only that it reopened.
- **Root cause:** The button called `moveTaskAction({ to: "in_progress" })` with no note, although the timeline already supported notes.
- **Fix:** "Send back" opens a sheet asking what needs to change; the reason is stored on the timeline event and shown to both people; the server refuses a send-back without one.
- **Regression test:** T2.5 (reason typed by Priya, read by Rahul), T15.1.

## BUG-05 · P1 · Conversations never became "read"

- **Workflow:** Conversations, Today (T3.2, T14.1).
- **Reproduction:** Priya messages Rahul. Rahul opens the conversation, reads it, returns to the list: the unread count stays, and Today keeps saying "1 unread conversation" forever.
- **Root cause:** `mark_conversation_read` existed in the database and in the server actions but nothing ever called it.
- **Fix:** Opening a thread marks it read and marks that conversation's "new message" update read.
- **Regression test:** T3.2, T14.1.

## BUG-06 · P1 · Decided requests kept asking to be decided

- **Workflow:** Approvals, leave, notifications (T11.3, T12.1).
- **Reproduction:** Rahul asks for approval; Priya approves. Priya's and Arjun's Updates still show "Rahul Verma needs approval: …" as unread. Same for leave requests after a decision.
- **Root cause:** The notification triggers only added a new row for the requester; the approvers' original request rows were never resolved.
- **Fix:** `0021` — deciding an approval or a leave request marks the approvers' request updates read and appends the outcome; existing stale rows were repaired by the migration.
- **Regression test:** T11.3 (both approvers, UI and database), T12.1.

## BUG-07 · P1 · Leave could be over-spent and double-booked

- **Workflow:** Leave (T9.4, T9.6).
- **Reproduction:** With 0 days left, Rahul asks for a full day: accepted, and it sits pending. Neha asks twice for the same date: both accepted; approving both deducts twice for one day.
- **Root cause:** `apply_leave` checked neither the balance (minus pending requests) nor overlapping dates; only approval checked the balance.
- **Fix:** `0021` — `apply_leave` refuses a request beyond the remaining balance after pending requests, refuses dates that already have a pending or approved request, and caps a request at 60 days. Messages explain each case.
- **Regression test:** T9.4, T9.6, plus the accounting chain T9.1–T9.3 and idempotency T9.5.

## BUG-08 · P1 · Live updates never arrived

- **Workflow:** Concurrency and notifications (T16.1).
- **Reproduction:** Keep Neha's Today open. Priya assigns her a task. Nothing happens on Neha's screen; the task appears only on reload. A WebSocket probe showed the browser subscribing successfully but never receiving a row.
- **Root cause:** The real-time channel was opened before the session was loaded, so the socket carried only the public key. Row level security applies to real-time, so every notification was filtered out.
- **Fix:** `components/waakya/live-notifications.tsx` loads the session, hands the access token to the real-time client before subscribing, and refreshes the token when the session refreshes.
- **Regression test:** T16.1 (task appears on the receiver's open screen within 30 s, no reload).

## BUG-09 · P2 · Templates accepted nonsense amounts

- **Workflow:** Business templates (T7.3).
- **Reproduction:** Quotation with Amount `abc`, or GST `150`. Saved, producing a document with no total or an absurd one.
- **Root cause:** `saveTemplateDocument` checked only that required fields were non-empty.
- **Fix:** Money must be a positive number, GST between 0 and 100, dates real, all checked on the server before saving.
- **Regression test:** T7.3.

## BUG-10 · P2 · Projects list scrolled sideways on a phone

- **Workflow:** Mobile (T18.5).
- **Reproduction:** Open /projects at 390px with a long project name: the page is 417px wide.
- **Root cause:** The grid had no minimum column width, so a long name widened the page.
- **Fix:** The list uses `minmax(0,1fr)` columns and the rows may shrink.
- **Regression test:** T18.5 (every screen, all four roles).

## BUG-11 · P2 · The task title field had no limit

- **Workflow:** New task (T17.1).
- **Reproduction:** Type 300 characters into "What": all accepted, then the server rejects the task.
- **Fix:** The field stops at 140 characters, the same limit the server enforces; the note field stops at 1000.
- **Regression test:** T17.1.

## BUG-12 · P2 · A notification could be addressed outside the business

- **Workflow:** Data integrity (T20.2).
- **Reproduction:** As Rahul, insert a notification row with `user_id` of the Org B owner: accepted.
- **Root cause:** The insert policy checked only that the sender belonged to the business, not the recipient.
- **Fix:** `0022` — the recipient must be a member of the same business.
- **Regression test:** T20.2.

## BUG-13 · P1 · A message sent on a dropped connection vanished without a word

- **Workflow:** Conversations, and every screen that sends something (T17.3).
- **Reproduction:** Type a message, take the connection down, press Send. The box clears, no error appears, nothing is stored, and turning the connection back on does not recover the text.
- **Root cause:** The send clears the box first and restores it if the action answers `ok: false`. A server action on a dead connection does not answer at all — it rejects, inside a transition with nobody listening — so neither branch ran.
- **Fix:** `lib/actions/attempt.ts` turns a rejection into the same refusal the actions return. Applied to sending a message, making a task from one, creating a task, moving a task, submitting proof, reminding, punching in and out, and applying for leave: each now says "Nothing was sent — check your connection and try again" and gives the words back.
- **Regression test:** T17.3 (send with the network off, then restored).
- **Production verification:** commit `3742d87`, deployed; passes on the final run.

---

## Not bugs (checked and dismissed)

- **The scheduler's writes.** The new task trigger exempts the service role, so overdue escalation still works (local SLA suite passes).
- **Members creating tasks.** A team member can create a task from a message; that is the product's design, and the Work screen correctly offers them no "New task".
- **Managers deciding leave.** Owner, admin and manager can all decide leave. Nobody can decide their own (T9.6).
- **Members reading all business documents.** Intended: documents belong to the business, and only the uploader or a manager can delete one (T6.5).

## Test-harness defects found and corrected

These failed a run but were faults in the tests, not the product. Each was checked against the database and, where the check was ambiguous, reproduced by hand in a browser before being dismissed.

- **Switching to the receiving user too early.** A form sheet closes a moment before its row is committed, so the next person's page was rendered a fraction of a second too soon (leave requests, an approval on a phone, a send-back reason, a task made from a message). The tests now wait for the *sender's own screen* to show the write before anyone else is asked to look at it — which is also the more honest test.
- **Asserting on a label instead of a state.** "Punched out" is the name of a field, visible from the moment someone punches in. The test now waits for the Punch-out button to disappear. Checked by hand afterwards: punching out, reloading, and reading the card gives `Punched in 12:08 AM · Punched out 12:08 AM · Worked 0m` with no button — correct.
- **Asserting a cancelled task vanishes from Today.** It leaves what needs attention and appears under what is settled, which is right; the test now checks both.
- **Clicking or typing before hydration**, selectors matching hidden duplicates, "Approved" matching both a chip and a comment, two audit events written in one statement ordered by timestamp, and test timeouts on the longest journeys.

## Known and accepted

- **Sign-in through the real login screen** (Google, or a six-digit email code) cannot be automated without a real account or inbox: BLOCKED in the matrix. The Google hand-off, the redirect target and the guarded-route redirects are covered.
- **A member can still create an in-business notification** addressed to a colleague through the API (for example a fake "needs approval" line). It cannot cross businesses and cannot change any record. Fixing it properly means moving notification writes to a definer function; recorded as P2, not done in this pass.
- **QA data on production:** removed. All 37 QA businesses and 103 `@waakya.test` accounts created by this pass and the earlier audit were deleted after testing (`e2e-prod/qa/cleanup.js`), along with their stored files. The five real businesses and every real account were untouched; the local test fixture "Waakya Test Co" (`owner@`/`staff@waakya.test`) is kept because the local suite signs in with it.
