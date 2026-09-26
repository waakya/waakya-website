# Waakya V3 — Desktop web

Desktop does not mean "more visible". The extra width buys calm: lists instead
of card walls, a column for the next step beside the record, and one quiet line
of numbers instead of six tiles.

## Shell
- **Sidebar (V3):** wordmark, business name, search (“Search work, people,
  chats” with ⌘K), then the places this person uses daily — Today,
  Conversations and (for people who run work) Work — then **More**, a
  disclosure holding Projects, Documents, Templates, Attendance, Approvals,
  Team (owner), and the tools Search, Updates, Routines (owner), Settings.
  More opens by itself when you are inside one of its places, so the current
  place is always visible. Person card at the bottom.
- **⌘K / Ctrl+K** opens Search from anywhere except while typing
  (`components/waakya/side-nav.tsx`). Unread updates show as a number, also
  on the closed More.
- 13 → 3 (staff: Today, Conversations) / 4 (Work added) top-level choices;
  nothing removed (`components/waakya/nav-items.ts` is the single map).

## Today (owner/manager, 1440)
- Header: greeting (Baloo 2), date · business, New task (the one filled
  primary), bell.
- One line of the day's numbers (Sent · Seen · Done · Verified · Late · Not
  seen) — words, tabular numerals, red/amber only where they mean it.
- Two columns: **left** — punch line (managers), **Needs you** (grouped, with
  a count summary; actions on the row: Verify, Remind + Call, Reassign,
  Approve — Reject opens the full request with its note; approval rows carry
  their details, document, task and project), **Waiting on your team** (five
  nearest deadlines, state in words + ticks, "N more" → `/work?need=waiting`),
  **Done today** (folded; excludes work still awaiting verification), All
  work.
  **Right** — Your team today (one line per person: presence, “3 of 5 done”,
  “N Late”, links to that person's work) and the completion rate when non-zero.
- Busy days fold per group (see the IA doc's Today contract).

## Work
- Title + New task; tabs **Open · Late · Verify baaki · Done** with counts
  (Verify for people who run work); a quiet **Team /
  Mine** switch (managers); person chip from Today; exact **need** filter chip
  from Today's groups. Desktop uses the table, phones the row list.

## Task detail
- Two columns: the record (title, what to do, stepper and clocks, proof,
  timeline, thread) and a side column with **the next step** and context
  (project, documents). On desktop every record entry shows; on a phone only
  the last three until asked.

## Conversations
- Unchanged in structure from V2 (list + thread), now a top-level place for
  everyone; Make task sits on the message; the task keeps the source message.
  The composer is where the mic will live when Voice arrives (not built here).

## Secondary screens
- **Project:** open work first (late on top), finished folded; activity shows
  the latest three; status / add person / link task behind “Manage project”.
  The future project summary belongs above the work it summarises.
- **Attendance:** own day, leave, then month history folded; managers: leave
  requests first, team, balances folded, holidays once.
- **Approvals:** waiting on you in full; your requests and decided ones show
  the latest five, the rest on request.
- **Documents:** templates first (the drafting entry — the natural home for
  drafting help later); category chips only for libraries over eight.
- **Updates:** what asks for you says so in words; runs of message notices
  from one chat collapse to one line with a count.

## Density rules
- A row states its state in words next to its glyph (D-03).
- One filled Neel button per region; everything else outline or text.
- Dividers before boxes; a box only where a group needs a boundary.
