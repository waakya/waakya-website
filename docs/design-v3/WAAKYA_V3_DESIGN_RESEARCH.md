# Waakya V3 — Design research

**Question:** how do excellent products stay powerful underneath while being
obvious on the surface, and what does that mean for Waakya?

**Method:** understand → abstract the principle → apply to Waakya. The
references below are studied for *how they decide what to show*, not for how
they look. Nothing here is copied UI. Sources are the products as their users
experience them (first-hand product knowledge and their published design
writing); no screenshots were taken of them.

---

## 1. What the references do

| Product | Visible first | Hidden until needed | Primary action | How attention is shown | Top-level choices |
|---|---|---|---|---|---|
| **WhatsApp** | A list of people/groups, newest first, unread in bold with a count | Group info, media, starred, settings — one tap into a chat header | Compose / reply | Bold + a number; the list order itself | Phone: 4 tabs; the Chats tab does 90% of the work |
| **Apple Messages** | Conversations; inside, the composer is always there | Tapbacks, reply, copy — long-press only | The composer | Blue dot | One list |
| **Slack** | Channels you are in, bold when unread; one "Activity" feed for mentions | Threads, huddles, workflows, admin — contextual menus, hover actions | The composer | Bold channel, red mention badge, a single Activity place | Home / DMs / Activity / Later (mobile) |
| **Linear** | "My issues" or the current view — a dense list, one line per issue | Every property sits in the issue's right panel; bulk actions appear only on selection; ⌘K for everything | Create issue (C), change status (S) — keyboard first | Inbox (notifications as a triage queue, cleared by acting) | A small sidebar: Inbox, My issues, the team, views |
| **Notion** | The page you were on | Every block's options behind the ⋮⋮ handle on hover, slash commands | Type | Almost none — calm by default | Sidebar of *your* pages |
| **Gmail / Superhuman** | The inbox as a list, one row per thread; Superhuman shows only what needs a decision (Split Inbox) | Labels, filters, settings; Superhuman hides all chrome, commands via ⌘K | Reply / archive (done) | Unread bold; "Inbox zero" as the goal state | Inbox first; everything else secondary |
| **Basecamp** | "Hey!" (what's new for *you*) and the projects you're in | Every tool of a project lives inside it | Post / reply | "Hey!" menu, one place | Home, Hey!, Activity, My Stuff |
| **Apple Reminders** | Today / Scheduled / Flagged smart lists — counts only | Details (date, location, subtasks) in an "i" panel | Add | A number per smart list | 4 smart lists + your lists |
| **Google Calendar** | Today/this week, time as the structure | Event details in a popover; editing in a full view | Create | Now-line; the next event | Views, not modules |
| **Claude / ChatGPT / Claude Code** | One composer, one conversation | Tools, model settings, history — collapsed or behind a menu | Send | The response itself | New chat + history |
| **Instagram** | One feed; bottom bar | Every account/settings path is 2+ taps deep | Create (+) centre | Dots on tabs, not numbers | 5 tabs |

## 2. Principles abstracted

1. **One attention place, not many inboxes.** Slack's Activity, Basecamp's
   "Hey!", Linear's Inbox, Superhuman's split inbox: each has *one* answer to
   "what needs me?", and acting on an item removes it. Waakya today spreads the
   answer across Today, Updates, Approvals, Attendance requests and unread
   Conversations.
2. **The list is the interface; details are a layer.** Linear and Gmail keep
   rows to one line and push properties into a detail panel. Waakya rows and
   cards carry 3–5 facts each (who, state, deadline, urgency, project).
3. **Primary action is always in the same place and there is one of it.**
   Messages' composer, Instagram's +, Linear's C. Waakya's owner Today shows
   six filled Neel buttons at once.
4. **Navigation = frequency.** WhatsApp and Messages put the daily thing
   first and everything else one level down. A top-level place must be visited
   most days by that role; monthly things live in a menu or in context.
5. **Capabilities live inside the object they act on.** Basecamp puts
   docs, to-dos and chat *inside* a project; Linear puts every property
   inside the issue. Waakya already attaches documents to tasks and projects —
   the separate destination is for the few who manage the paperwork.
6. **Progressive disclosure by stage, not by preference.** A task needs
   different information when it is new (what, by when), running (the clock),
   done (the proof) and closed (the record). Showing all four at once is what
   makes a detail screen feel heavy.
7. **Hover and long-press are accelerators, never the only way.** Slack and
   Notion reveal actions on hover but every action is also in a menu; Messages'
   long-press has a visible equivalent. (Waakya V2 already follows this for
   Make task.)
8. **Typography and space do the grouping.** Linear, Notion and Things use
   almost no boxes: a heading, whitespace and a hairline. Boxes mean "this is
   one thing you can act on".
9. **Calm by default; colour for exceptions.** Reminders and Calendar are
   nearly monochrome until something is due. Waakya's colour-as-meaning rule is
   exactly this — the problem is not colour, it is quantity of chips.
10. **Teach through the empty state and the first object.** Linear and
    Notion onboard by creating a sample, not a tour. Waakya's first-run
    guide is right; it should also be the *only* thing a new owner sees.
11. **Mobile is not small desktop.** WhatsApp and Instagram give a phone a
    bottom bar with ≤ 5 places, sheets instead of side panels, swipe/long-press
    accelerators, and a persistent composer; desktop Slack/Linear use split
    panes and keyboard.
12. **Search is a way to go, not a page.** ⌘K in Linear, Superhuman, Slack,
    Notion: one field that finds people, work, documents and actions.

## 3. What this means for Waakya

| Principle | Waakya today (V2) | Direction for V3 |
|---|---|---|
| One attention place | Today + Updates + Approvals + attendance requests + unread chats, each with its own count | Today *is* the attention place: decisions, late/unseen work, proof to verify, leave and approvals — each item actionable in place and gone when acted on. Updates becomes history, reached from the bell |
| List is the interface | Kit task cards with 3–5 facts; desktop table with 5 columns and 2 row actions | One-line rows: title + one "why it's here" phrase + the glyph. Who/when/project on hover or in the detail |
| One primary | 6 filled buttons on owner Today | One primary per screen (New task on Today; the state's next step on a task) |
| Navigation = frequency | 8 + 4 destinations for everyone; 11 for staff | Per-role: 3–4 places + More. Projects/Documents/Team/Approvals/Attendance history move to More or into context |
| Capability inside the object | Documents, approvals, projects as destinations | Attach/create documents from the task or conversation; approvals decided in Today; projects as context chips that open a project |
| Disclosure by stage | Task detail shows stepper, 2 clocks, proof, timeline, thread, project picker, documents at once | Task leads with *what, by when, next step*; clocks only while running; proof when done; record (timeline) collapsed |
| Typography over boxes | Cards everywhere (9 boxes on Today desktop, 20 on phone) | Sections with headings and hairlines; cards only for items you act on (a decision) |
| Mobile ≠ desktop | Same components restyled | Phone: bottom bar of 4, sheets for actions, persistent composer; app concept adds swipe, long-press, camera-first proof |
| Search as navigation | A Search page | ⌘K / "/" everywhere on desktop; search at the top of More on phone |

## 4. What Waakya must keep that the references do not have

- **Accountability made visible:** the ticks glyph and the stepper are Waakya's
  signature. Simplify *where* they appear (glyph on rows, stepper only on the
  task), never remove them.
- **Three languages and Latin digits** — any shorter label must work in
  हिंदी, Hinglish and English.
- **Proof and verification** are the product's promise; they get a prominent,
  staged place, not a metadata line.
- **Owner-as-sender, staff simplicity** (CLAUDE.md): staff screens keep one big
  button; V3 extends that calm to the owner.

---

## Tool report — what was actually used, and what it changed

| Tool | Installed | Connected | Tested | Actually used for | What it changed |
|---|---|---|---|---|---|
| **Figma** (official MCP, `mcp.figma.com`) | yes (plugin) | yes — OAuth as *digit global* (Starter plan, View seat) | yes | File *Waakya Design V3 — Architecture* (https://www.figma.com/design/OvxH90I8E4hbHthomwTrC2): 3 pages (Starter limit) — read-me + **V2 captured from localhost** (code → canvas, editable frames); **Architectures A · B · C**, each at desktop, mobile web and app (27 editable screens drawn with `use_figma`); **comparison & selection**; **V3 captured back** at 1440 and 390 with an intent-vs-implementation panel | The side-by-side made B's "read to find exceptions" and C's "person thing or place thing?" concrete and fixed the selection; the V3 capture exposed that intent (master–detail) was not built and why; decisions recorded on page 3 |
| Figma limits met | — | — | — | Starter plan: 3 pages per file (`createPage` refused a 4th), ~20 MCP calls/month — **13 used**; capture used the injected-script method so Design V2's source was never edited | Pages became sections; calls batched |
| **Playwright** | yes | yes | yes | Main E2E 72, Design E2E 28, busy-business contract, 135-screen sweep, complexity measurement (V2 & V3), lab screenshots, Figma capture injection | Found: the newest-200 data cap, Hindi fallbacks, guide pushing work below the fold, names cut on phones, just-sent task missing |
| **Chrome DevTools MCP** | yes | yes | yes | Performance traces (V2 and V3 Today, desktop and phone), LCP breakdown and DOM-size insights, console and network review, Lighthouse | Lighthouse found overlapping targets (stretched link under buttons) and a label-in-name mismatch (bell) — both fixed; traces showed V3 not slower (desktop LCP 572 vs 698 ms). Note: DevTools could not write trace files outside its workspace root, so raw traces were not kept |
| **Lighthouse** (via DevTools MCP) | yes | yes | yes | Desktop and mobile on V2 and V3 Today | V3 mobile accessibility 96 → 100 after the fixes above |
| **Impeccable** | yes (`~/.claude/skills/impeccable`) | — | yes | Real-screen critique by an independent agent | Counters say "Today"; progress not red; owner targets 48 px; one Hindi word for late |
| **Taste** | yes (`taste-skill`) | — | yes | Same critique, product-UI parts only | Noted neel shadow / eyebrow labels as tells (kept: they are the brand kit's) |
| **Emil / review-animations** | yes | — | yes | Motion & interaction pass on the running app and the app concept | Confirmed press feedback, the three sanctioned motions, reduced motion; flagged the V2 toast (400 ms) and "Later" without undo as carry-overs |
| **Adversarial reviewers** | — | — | — | Two independent agents: one on the code diff, one on the running product (both viewports, all roles, other tenant) | ~25 fixes: informed approvals, staff attention, Call, own-leave, real disclosures, focus rings, worst-first sorting, Make task visible, invite-first empty state, person picker, ack clock wording, bounded team list |
| **Other MCPs** | none installed | — | — | No capability was missing | — |
