# Phase-1 night build — 13 September 2026

Attendance, leave and holidays are built and verified end to end. Internal
conversations and message-to-task are built and verified end to end. Everything
runs against the real database; nothing here is mocked.

The one thing not done is deployment. Every Vercel and production-network
command in this session was refused by the permission layer, four times. See
`DEPLOY_TONIGHT.md` for the exact steps.

## What was added

**Attendance** (`/hazri`) — punch in, punch out, worked duration, month
history. Managers additionally see the team's day, approve or reject leave,
credit balances, and add holidays.

**Leave** — balances in days, full-day and half-day requests with the cost
shown before sending, and approval that deducts exactly once. One credited day
funds two half days.

**Holidays** — created by an owner, visible to everybody, and free: a holiday
inside a leave range is not charged.

**Conversations** (`/baat`) — direct conversations with unread counts, and the
action the product exists for: any message somebody else sent can become a task
with an owner and a deadline, without retyping it. The task keeps a link back
to the message it came from, and that link is read from the database so it
survives a refresh.

## Migrations

- `0017_attendance_leave.sql` — attendance_records, leave_balances,
  leave_requests, holidays; the working day is an Asia/Kolkata day decided by
  `ist_today()`; read policies only, with every write through a
  security-definer function that establishes the org from the caller's own
  membership.
- `0018_leave_status_cast.sql` — approving leave failed with 42804 because a
  CASE produced `text` for an enum column. The transaction meant nothing was
  half-applied; balances were untouched until it worked.
- `0019_conversations.sql` — conversations, participants, messages, and
  `tasks.source_message_id`.

## Verified

All five golden paths pass against the real database:

1. Task execution — the repo's own core-loop suite, 4 of 4.
2. Attendance — punch in, reload, punch out, reload, duration, day closed.
3. Leave — 1.0 to 0.5 to 0.0 across two approvals; rejection deducts nothing.
4. Holiday — created, visible to an employee, balance unchanged.
5. Isolation — a team member sees neither the team panel nor approve controls.

Message-to-task passes 8 of 8, including the link surviving a refresh and the
task reaching the owner's day screen.

Gate: lint clean, typecheck clean, 223 unit tests, production build green with
21 pages.

## Bugs found and fixed tonight

- Leave approval aborted on an enum cast (0018). Found by calling the function
  directly rather than trusting the UI.
- The message-to-task link lived in React state and vanished on reload. Now
  derived server-side.
- Holidays were only rendered in the manager panel, so employees could not see
  them. Now shown to everybody.
- Three selector defects in the existing e2e suite, exposed by a fresh
  database. Behaviour was correct in every case.

## Not done

- Deployment (blocked; see `DEPLOY_TONIGHT.md`).
- Projects, documents, approvals, notifications, team and global search.
- The B2B shared-workspace section was removed from the sales demo, as
  deferred. The component remains on disk.

## Before real customers

Delete the test accounts on the new database: `owner@waakya.test`,
`staff@waakya.test`, `noorg@waakya.test`, `third@waakya.test`. Their passwords
are fixed in `supabase/seed-e2e.sql`.
