# Waakya V3 — Information architecture

Three genuinely different ways to organise the same capability, each shown in
the Design Lab (`/design-lab`) at desktop, mobile web and app. One is chosen on
evidence, not looks.

The constraint for all three: **every Phase-1 capability, rule and record
stays** — conversations, message → task, the task lifecycle, proof,
verification, projects, documents and templates, attendance, leave, holidays,
approvals, team, notifications, search, settings, roles, tenant isolation.
What changes is *where and when* each appears.

## How often each role needs each thing (the input)

| Capability | Employee | Manager | Owner |
|---|---|---|---|
| My next task / what's due | hourly | daily | — |
| Talk to the team | hourly | hourly | daily |
| Decide: verify, approve, leave | — | daily | daily |
| See exceptions (late, not seen) | — | daily | daily |
| Punch in/out | daily | daily | rarely |
| Create a task | — | daily | daily |
| All work (browse/filter) | weekly | daily | weekly |
| Projects | weekly (as context) | weekly | weekly |
| Documents / templates | monthly | weekly | weekly |
| Attendance history, balances, holidays | monthly | weekly | monthly |
| Team: invite, roles | never | monthly | monthly |
| Settings | rarely | rarely | monthly |

Rule adopted from the research: **a top-level place must be used most days by
that role.** Everything else lives in context or behind More.

---

## Architecture A — "Attention queue" (Today is the product)

**Idea.** One queue answers "what needs me?" and every item can be finished
from the queue. Other places exist but are rarely visited.

- **Nav:** Today · Chats · More (3). Search as a command.
- **Today:** a single ordered queue — decisions (verify, approve, leave),
  exceptions (late, not seen), then *my* work — each row with one inline action;
  finished rows leave. A quiet summary line replaces counters.
- **Work:** only via "All work" at the end of the queue or search.
- **Desktop:** queue left, the selected item's detail right (master–detail).
- **Mobile:** one list; tapping opens a sheet with the item's action.
- **Strength:** lowest navigation; owners see exceptions without reading.
- **Weakness:** browsing work (filters, "everything Neha has") becomes hard;
  managers who coordinate lose a place for the whole picture; the queue can
  grow long on a busy day.

## Architecture B — "Conversation spine" (Chats are the product)

**Idea.** Work is born in conversations, so conversations are home; structure
is a layer on top of talk.

- **Nav:** Chats · Work · Me (3).
- **Home = chat list**, with a pinned "Your day" row at the top (the day's
  attention items as a system thread); approvals and leave requests arrive as
  cards in that thread.
- **Desktop:** three panes — chats | thread | context panel (tasks from this
  chat, people, files).
- **Mobile:** WhatsApp-like list; tasks show inline in threads.
- **Strength:** the most familiar mental model; Message → Task is central.
- **Weakness:** owners must read to find exceptions; approvals and verification
  get lost among messages; it drifts toward a WhatsApp clone, which the brief
  forbids; employees without chat history see little.

## Architecture C — "People & places workspace"

**Idea.** Businesses think in people and sites; organise everything by *who*
and *where*.

- **Nav:** Today · People · Places (projects) · Chats (4).
- A person page holds their work, attendance, leave and chat; a project page
  holds its work, chat and documents.
- **Desktop:** directory left, person/place workspace right.
- **Mobile:** tabs with lists of people and places.
- **Strength:** great for managers coordinating people; projects become
  meaningful containers.
- **Weakness:** the most navigation decisions ("is this a person thing or a
  place thing?"); employees gain nothing; overlaps Team and Projects.

## Selected — "A, with the spine kept": **Attention-first, conversation kept first-class**

| Criterion | A | B | C | Chosen |
|---|---|---|---|---|
| First-5-seconds comprehension | ●●● | ●● | ● | ●●● |
| Employee: do today's work | ●●● | ●● | ● | ●●● |
| Owner: find exceptions | ●●● | ● | ●● | ●●● |
| Manager: coordinate people | ●● | ● | ●●● | ●●● (people section on Today) |
| Conversation → work | ●● | ●●● | ●● | ●●● (Chats stays a tab) |
| Navigation decisions | ●●● | ●●● | ● | ●●● |
| Scales to many items | ●● | ●● | ●●● | ●●● (Work remains for managers) |
| Distinct from WhatsApp/Trello | ●●● | ● | ●● | ●●● |

**Why:** A wins on the two journeys the product exists for (employee does the
work; owner handles exceptions), and on navigation. Its two weaknesses are
fixed with the strongest parts of B and C: **Chats stays a top-level place**
(B's spine — talking is hourly for everyone), and **managers keep Work** plus a
compact **"Your team today"** section (C's people view, without a separate
directory).

### The chosen map

| Role | Phone bottom bar | Desktop sidebar (main) | Behind More / in context |
|---|---|---|---|
| **Employee** | Today · Chats · More | Today · Chats | Work (All my work), Projects, Documents, Attendance history & leave, Approvals (ask), Search, Updates, Settings |
| **Manager** | Today · Chats · Work · More | Today · Chats · Work | Projects, Documents, Attendance (team), Approvals, Team, Search, Updates, Settings |
| **Owner** | Today · Chats · Work · More | Today · Chats · Work | same as manager + Routines |

- **Today** absorbs: the approvals and leave decisions (decided in place), the
  punch in/out action (one line), unread-chat attention, and — for managers —
  who is on and who is behind.
- **Updates** stays (history of what happened) but is no longer an attention
  source; its bell shows only a dot.
- **Search** becomes a command on desktop (⌘K / "/") and the first row of More
  on the phone.
- **Projects** appear as context on tasks and conversations and as a place
  under More.
- **Documents** are made and attached from tasks, conversations and projects;
  the library stays under More.
- **Attendance** is a line on Today; the full page (history, balances,
  holidays, team) is under More.

Top-level choices: **13 → 3 (employee) / 4 (manager, owner)** on desktop,
**5 → 3 / 4** on the phone. No capability removed.

---

## The architectures against every person, not just the average one

| Person | A · Attention queue | B · Conversation spine | C · People & places | Selected |
|---|---|---|---|---|
| **Owner** | Exceptions first, decided in place | Must read the "Your day" thread to find exceptions | Good overview by person and site | Exceptions first; Work and the team one tap away |
| **Manager** | Loses a home for the whole picture | Weak: no view of the team | Best: person pages | Work tab + "Your team today" + person filter |
| **Employee** | Next task, one action | Tasks buried in chats | Two tabs they never use | "Up next", one big button |
| **First-time employee** (no history) | Empty queue explains itself | Empty chat list — nothing to do | Empty people/places | Empty Today explains itself; Chats is there when someone writes |
| **Field employee** (phone, one hand, camera) | Push → row; camera-first proof | Proof posted as chat photos — can drift | Proof also filed to the place | Push → task; camera-first proof sheet; sticky action at the thumb |
| **Busy owner** (hundreds of tasks) | Long queue | Long thread of cards | Scales by person/site | Grouped list with counts; three rows per group, the rest linked exactly |
| **Desktop** | Master–detail | Three panes | Directory + workspace | Sidebar of 3–4 + More; lists, not card walls; ⌘K |
| **Mobile web** | One list + sticky action | Chat list | 4 tabs | 3–4 tabs; one primary at the thumb |
| **Mobile app** (concept) | Swipe to accept | Composer is home | 4-tab bar | Today · Chats · (Work) · More; swipe + long-press as shortcuts; camera-first proof; offline queue |
| **AI/Voice later** | Today brief | Mic in composer | Project summary | All three homes exist without a chatbot panel |

The Figma file (page 2) draws every architecture at desktop, mobile web and
app; page 3 holds the scored comparison. The Design Lab
(`/design-lab/architectures`) shows the same comparison in the browser.

## Today's contract: progressive disclosure, never hidden work

A newly created task was found to be missing from Today in a large seeded
business (it fell past "Waiting on your team", which showed five). Work held
it, but "Work contains everything" is not a design. The rule now:

1. **Every kind of thing that needs the person always shows its count on
   Today** — late, escalated, not seen, to verify, approvals, leave, unread
   chats — in one line under "Needs you", each count a link.
2. **Short days show everything.** Below nine items, every row is listed.
3. **Busy days fold per group, never across groups.** From nine items, each
   group shows its first three (most urgent first) and ends in
   "N more · <group>", linking to exactly those items: `/work?need=late|
   escalated|unseen|verify`, `/approvals`, `/hazri#leave-requests`, `/baat`.
   Work's `need` filter uses the same `needsYou()` rule as Today, so the two
   can never disagree.
4. **Waiting work is summarised, not lost.** "Waiting on your team" shows the
   five nearest deadlines, its total, and "N more · Waiting on your team" to
   Work.
5. **What belongs in Work, not Today:** browsing, filtering by person or
   state, anything not needing this person today, finished work beyond today.

| Scenario | Today shows |
|---|---|
| Empty business | The setup guide (next step only) and "all clear" |
| Normal day (< 9 items) | Every item, grouped, each with its action |
| Busy day | Counts for every group; 3 rows per group; exact links to the rest |
| Extremely busy (hundreds late) | Same — the page length stays bounded (≤ 7 groups × 4 lines) |
| Many categories at once | All categories listed in the summary line, urgency order kept |
