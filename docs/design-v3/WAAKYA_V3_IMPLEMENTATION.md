# Waakya V3 — Implementation record

Branch `feature/design-v3-simplification`, from Design V2 `738970e`. Local
only: nothing pushed, merged or deployed; production, main, Design V2 and the
AI/Voice worktree untouched.

## What changed, where

| Area | Change | Files |
|---|---|---|
| Navigation | One map for sidebar, bottom bar and More. Staff: Today · Conversations (+ More). Managers/owners: + Work. More holds Projects, Documents, Templates, Attendance, Approvals, Team, then Search, Updates, Routines, Settings. ⌘K/Ctrl+K → Search (not while typing). Unread updates as a number, also on the closed More. | `components/waakya/nav-items.ts`, `side-nav.tsx`, `bottom-nav.tsx`, `app/(app)/more/page.tsx` |
| Today (owner/manager) | One "Needs you" list: late, escalated, not seen, verify, approvals, leave, unread chats; each row says why + who and carries its action (Remind + Call, Verify, Reassign, Approve; Reject opens the full request). A summary line counts every kind. Busy days fold per group (3 rows + exact link). "Waiting on your team" (five nearest, "N more" → `/work?need=waiting`), "Done today" folded, team as one line per person. Counters labelled "Today". Setup guide becomes one line once the business runs. | `app/(app)/aaj/owner-home.tsx`, `attention.tsx`, `attention-actions.tsx`, `team-today.tsx`, `punch-line.tsx`, `setup-guide.tsx`, `owner-header.tsx`, `page.tsx`; rule in `lib/tasks/fold.ts`, `lib/tasks/counters.ts` (`waitingOnTeam`) |
| Today (employee) | "Up next" (late → new → today), punch line with staff target, approvals and unread chats that wait on them (streamed), kit sections, Done folded. | `app/(app)/aaj/staff-today.tsx`, `page.tsx` |
| Work | Whose (Team/Mine) separate from state (Open/Late/Verify/Done); person filter; exact `need` filters shared with Today. | `app/(app)/work/page.tsx` |
| Task | Record shows last three steps on a phone; project & documents behind one line; accessible disclosures. | `app/(app)/kaam/[id]/task-shell.tsx`, `components/waakya/reveal.tsx` |
| Secondary | Project: open work first, finished folded, activity 3 + more, controls behind "Manage project". Attendance: history & balances folded, holidays once. Approvals: older decided on request, deep-linkable rows. Updates: "Needs you" in words, message runs merged. Documents: category chips only past eight. | `projects/[id]`, `hazri/*`, `approvals`, `khabar`, `documents` |
| Data completeness (bug) | Lists loaded only the newest 200 tasks (58 of 60 late tasks missing in a busy business); approvals newest 200; chats 40. Now all open work (cap 2000) + recent history; all pending approvals; 200 chats. | `lib/tasks/queries.ts`, `lib/approvals/queries.ts`, `lib/conversations/queries.ts` |
| Language | Hindi Today, guide, team and attendance strings in Devanagari (they fell back to Roman Hinglish); one word for "late". | `lib/i18n/phase1.ts`, `lib/i18n/ux.ts`, `lib/i18n/design.ts` |
| Accessibility | Disclosures are buttons with aria-expanded/aria-controls; tap targets (owner 48 px on Today rows, 44 px Work switch); no targets stacked under a stretched link; bell's name includes its visible count; scroll padding keeps focus clear of sticky bars (2.4.11). | as above, `app/globals.css` |
| Motion | `enter-rise` for sheets (220 ms ease-out) alongside `enter-pop`; reduced motion makes both instant. | `app/globals.css` |
| Design Lab | `/design-lab` (What changed, Before/After, A·B·C, Desktop, Mobile web, Mobile app concept). Files are `*.lab.tsx`, compiled only outside production builds; render guard too. | `app/design-lab/**`, `lib/design/lab.ts`, `next.config.ts` |
| Tooling | Complexity metric & runner, lab screenshots, Today benchmark, responsive × language sweep, busy-business seed. | `scripts/design/*`, `scripts/local/seed-busy.ts` |

No migration, RLS policy, permission, state-machine, proof, verification,
attendance or leave rule changed. Server actions are unchanged; the UI calls
the same ones (approve, decide leave, verify, remind, punch).

## Decisions that came from evidence, not taste

1. **Folding per group, not a single cap** — the busy-business contract showed
   a single "top 5" hid a just-sent task; folding per group keeps every
   category visible and bounded.
2. **Reject leaves Today** — the adversarial review: a one-tap reject beside
   Approve on a phone, with no note, was too easy.
3. **Actions wrap under the reason on a phone** — the first screenshots cut
   the late person's name to fit Remind and Call.
4. **Staff attention streams** — the benchmark showed employee Today at
   +68 ms; streaming brought it below V2.
5. **The 200-task cap** — found only because the design contract was tested
   with realistic data. It exists in V2 and therefore in production; the fix
   is read-only query shape and should be considered for production
   separately.

## Commits

See `git log 738970e..HEAD` — each commit message states what changed and why.
