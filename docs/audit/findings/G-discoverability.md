# G — Feature Discoverability Audit (Waakya Phase 1)

Evidence: production captures in `docs/audit/before/` (`.jpg` + `.aria.txt`), personas visitor / newowner / owner / member, desktop (sidebar) and mobile (bottom nav: Today · Conversations · Work · Attendance · More). No source code was read.

Navigation observed:
- Owner desktop sidebar: Today, Conversations, Work, Projects, Documents, Attendance, Approvals, Team | Search, Updates, Daily routine, Settings (`owner-desktop-today.aria.txt`).
- Member desktop sidebar: same, without **Team** and **Daily routine** (`member-desktop-today.aria.txt`).
- Mobile `/more` owner: Projects, Documents, Approvals, Team | Search, Updates, Daily routine, Settings. Member: Projects, Documents, Approvals | Search, Updates, Settings.
- There is **no** nav entry for Templates, Leave or Holidays anywhere.

"Clicks from Today" = taps/clicks from `/aaj` to reach the point where the capability can be used (D = desktop, M = mobile).

## Capability matrix

| # | Capability | Owner: where visible (desktop / mobile) | Member: where visible (desktop / mobile) | Clicks from Today (D / M) | Named consistently? | Score 1–5 | Issue |
|---|---|---|---|---|---|---|---|
| 1 | Conversations: direct | Sidebar "Conversations" / bottom nav; Today pill "1 unread conversation"; landing hero | Same | 2 / 2 ("New conversation") | Mostly. URL `/baat`; inside a task it becomes "Messages" | 4 | The in-task "Messages" box is a second chat surface that can be confused with Conversations |
| 2 | Conversations: group | "New group" button on /baat / same | Same | 2 / 2 | Yes | 3 | Thread header shows only the name ("Site team mu5kz8y9"). No member list, member count or group info |
| 3 | File attachments in conversations | Paperclip "Attach a file" in the composer / same | Same | 3 / 3 | "Attach a file" here, "Attach a document" on task and project, "Upload" on Documents | 3 | Icon only, no text. Chat files never show up in Documents, and nothing says so |
| 4 | Message → Task | "Create task" text link under **other people's** messages only; none under owner's own message (`owner-desktop-conversation-thread`) / same | Visible under the owner's message (`member-desktop-conversation-thread`) | 3 / 3 (open thread, find message, click link) | "Create task", but the landing page says "Turn messages into work" and "Any message can become a task" | 2 | This is the headline promise, but it is a small grey link. Owner can't convert their own instruction. Member sees it but has no "New task" anywhere else |
| 5 | Work / Tasks lifecycle | Sidebar "Work"; Today counters Sent/Seen/Done/Verified/Late/Not seen; "New task" CTA / bottom nav "Work"; FAB "New task" | "Work" (Mine/Open/Late/Done); Today heading "My tasks"; **no New task** | 1 / 1 | No: nav "Work", button "New task", modal "Send this?", page "Task", Today "Today's work", member "My tasks", URLs `/kaam` and `/naya` | 3 | 6 labels for one object. Today counters are not links. Accepted and In progress are missing from the Today counters |
| 6 | Photo proof | New-task switch "Proof Not needed" (off by default); task detail "Proof" section / same | Task detail "Proof" | 2 / 2 (to turn on) | "Proof" | 2 | Off by default and unexplained, so owners may never learn it exists |
| 7 | Projects (link tasks + docs) | Sidebar "Projects"; Today "Projects in progress" link; task detail "Project" dropdown / More > Projects | Sidebar; Today link; task detail plain text (not a link) | 1 / 2 | Yes | 3 | Tasks can't be assigned to a project from New task. Project detail has no "New task". Task → project is not a link |
| 8 | Documents: upload | Sidebar "Documents" > "Upload" / More > Documents | Same | 2 / 3 | "Upload" / "Attach a document" / "Attach a file" | 3 | Upload on Documents has no way to link the file to a task or project |
| 9 | Documents: categories | Category select before upload; filter chips "All/Quotation/Other" / same | Same | 1 / 2 | "NDA" in categories vs "Non-disclosure agreement" in templates; "Report" category has no template | 3 | Category is picked **before** choosing a file, and the default is "Other" |
| 10 | Documents: search | "Search documents" box (hidden when there are 0 docs) / same | Same | 1 / 2 | Global "Search" vs "Search documents" | 3 | Two different search boxes |
| 11 | Link document ↔ task / project | Only by attaching from task detail or project detail; list shows "Project: …" / "Task: …" links / same | Same | 2 / 2 | "Attached documents" | 3 | Only works when starting from the task or project. Can't relink from Documents |
| 12 | Business Templates (10) | **Only** a "Templates" link in the Documents header; empty Documents text says "start from a template" with no button / More > Documents > Templates | Same | 2 / 3 | "Templates"; template form has **two** "Project" fields | 1 | Not in nav, Today, project detail, task detail or landing |
| 13 | Attendance: punch in/out | Sidebar "Attendance"; Today pill "You have not punched in today" / bottom nav | Same; Today pill "Punched in at 7:14 PM" | 1 / 1 | Nav "Attendance", URL `/hazri` | 5 | Good |
| 14 | Attendance: team today | "Team today" on /hazri; "Staff today" card on Today (desktop only) / /hazri | N/A (not shown to member) | 0–1 / 1 | "Team today" vs "Staff today" vs "1 staff active" | 3 | Mobile Today has no staff summary |
| 15 | Leave (full/half, balances) | "Apply leave" inside Attendance; "Leave balances" with "+ Half" / "+ 1 day" / inside Attendance | "Apply leave" inside Attendance; history list | 2 / 2 | "Leave", notifications "asked for leave" | 2 | No nav entry. Balance shows "0 days" and nothing explains how balances get set. Unlabelled grant buttons |
| 16 | Holidays | Sub-row in Leave card + "Holidays" add form at the bottom of /hazri / same | Sub-row in Leave card | 1 + scroll / 1 + long scroll | "Holidays" | 2 | Buried at the bottom of Attendance. No explanation for a new owner |
| 17 | Approvals | Sidebar "Approvals"; Updates "needs approval" → `/approvals` (list, not the item) / More > Approvals | Sidebar; More | 1–2 / 2–3 | Yes | 3 | Can't be asked from a task or project, even though the tagline says "kept next to the work". Not in "Also waiting on you" |
| 18 | Team: invite, roles | Sidebar "Team" → page "Staff" → "Invite staff"; Today only shows "Staff today: Nobody" / More > Team | **Not in nav**; `/staff` still renders a read-only list | 2 / 3 | No: "Team" / "Staff" / "Invite staff" / role "Staff" / URL `/staff` | 2 | New owner is told "You can invite staff afterwards", but Today never shows an invite CTA. Roles are only Owner/Staff, with no visible way to change them |
| 19 | Global search | Sidebar "Search" / More > Search | Same | 1 / 2 | "Search tasks, projects, documents, people" | 2 | Not in the mobile header or Today. No shortcut hint |
| 20 | Updates / Notifications | Sidebar "Updates 7"; Today bell "Updates · 7 new" / bell on Today header; More > Updates | Same (no "Check now") | 1 / 1 | "Updates" (UI) vs "Notifications alt+T" (toast region) vs URL `/khabar` | 4 | Naming mix. Approval updates open the whole list, not the item |
| 21 | Settings: language | Sidebar "Settings" > Language; also setup and login / More > Settings | Same | 1 / 2 | "Staff language" (setup) vs "Language" (settings) | 4 | Setup's "Staff language" implies it applies business-wide; Settings looks personal |
| 22 | Settings: business profile | Setup "Step 2 of 3" + Settings > Business / same | Read-only name | 1 / 2 | Setup step 1 has no step counter | 3 | Nothing tells the owner the profile fills templates, except once during setup |
| 23 | Daily routine checklists (owner) | Sidebar "Daily routine"; Settings > "Daily routine" link / More > Daily routine | Not visible | 1 / 2 | "Daily routine" (nav) vs "New checklist" / "No checklists yet" (page) | 2 | Not in onboarding or Today. "Sent automatically, every day" doesn't say to whom |

## P0

### Business Templates have no entry point outside a small link on Documents
- PAGE: Today, sidebar/More, Documents, Project detail, Task detail, Landing
- PERSONA: newowner, owner, member (desktop + mobile)
- PROBLEM: The 10 templates (Quotation, Proposal, Invoice, Agreement, NDA, Purchase Order, Work Order, Receipt, SOW, Meeting Minutes) are only reachable from a secondary "Templates" link in the Documents header. They are missing from the nav, Today, project detail, task detail and the landing page. On mobile the path is Today → More → Documents → Templates (3 taps). The empty Documents state says "start from a template" but has no button.
- WHY IT MATTERS: Templates are a Phase-1 value driver ("These details fill your quotations, invoices…" is promised during setup). An owner who finished setup will not find them, and the seeded use case ("Revised quotation" task) never offers "Create quotation".
- SCREENSHOT/OBSERVATION: `owner-desktop-today.aria.txt` (no "Templates" in the sidebar list); `owner-mobile-more.jpg` (Projects, Documents, Approvals, Team, Search, Updates, Daily routine, Settings, no Templates); `owner-desktop-documents.aria.txt` `link "Templates"`; `newowner-desktop-documents-empty.aria.txt` "Upload a quotation, an invoice or a report, or start from a template." (no button); `owner-desktop-project-detail.aria.txt` (Documents section only has "Attach a document"); `newowner-desktop-profile.aria.txt` "These details fill your quotations, invoices and other documents."
- PROPOSED FIX: Add a "Create from template" button next to Upload on Documents, inside the empty state, in project detail and task detail "Attached documents" (pre-select project/task), and on Today's "New" menu. Add "Templates" as a sub-item under Documents in the sidebar and More. Follow the setup profile step with a "Make your first quotation" CTA.

### Message → Task is a tiny link, missing on the owner's own messages
- PAGE: Conversation thread (`/baat/:id`)
- PERSONA: owner, member (desktop + mobile)
- PROBLEM: The only affordance is a small grey "Create task" link under messages written by someone else. On the owner's own message in the same thread there is no action at all. The owner has to understand that the instruction they just typed can't be converted, and has to leave the thread for "New task". There is no explanation and no long-press or menu hint.
- WHY IT MATTERS: The landing page sells exactly this flow: "Assign Turn messages into work", "Any message can become a task", with Priya's own message "Rahul, send the revised quotation by 5 PM." becoming a task. The core differentiator is almost invisible, and for the owner's typical case it is missing.
- SCREENSHOT/OBSERVATION: `owner-desktop-conversation-thread.jpg` / `.aria.txt` (owner's message: only `button "site-plan-mu5kz8y9.pdf"`, no "Create task"); `member-desktop-conversation-thread.jpg` (`button "Create task"` in small link style under Priya's message); `visitor-desktop-landing.aria.txt` "Assign Turn messages into work", "Nothing yet. Any message can become a task."
- PROPOSED FIX: Show "Make task" on every message (own messages included) as a visible chip on hover/focus (desktop) and on long-press plus a persistent row action (mobile). Add a one-time coach mark in the first thread ("Any message can become a task"). Add a "+ Task" button in the thread composer that pre-fills from the last message.

### New owner's first Today screen gives no path to invite staff or set up the business
- PAGE: Today (empty), post-setup
- PERSONA: newowner (desktop + mobile)
- PROBLEM: After "Create your business" ("You can invite staff afterwards") and "Step 2 of 3", the owner lands on Today with all counters at 0, "Staff today: Nobody", and "No work yet · Press below to send new work." There is no "Invite staff" CTA, no getting-started checklist, and no pointers to Projects, Templates, Daily routine or Holidays. On desktop, "Press below" is wrong: the only button (New task) is above. New task can't do anything useful with no staff.
- WHY IT MATTERS: Every staff-dependent feature (tasks, attendance team view, approvals, leave) is dead until staff are invited. The only invite button is on the "Team" page, whose heading is "Staff". This is the biggest activation drop-off risk.
- SCREENSHOT/OBSERVATION: `newowner-desktop-setup.aria.txt` "Enter the name. You can invite staff afterwards."; `newowner-desktop-today-empty.jpg` "No work yet / Press below to send new work." with "New task" top-right, "Staff today Nobody", "0 staff active"; `newowner-mobile-today-empty.jpg`; `newowner-desktop-team-empty.jpg` "No staff yet · Invite your staff first, then send work." + "Invite staff".
- PROPOSED FIX: Replace the empty Today with a "Get started" card: 1) Invite staff (primary), 2) Complete business profile, 3) Create your first project, 4) Make a quotation from a template, 5) Set a daily routine, 6) Add holidays. Tick items off as they are done. Make "Staff today · Nobody" a link to Invite. Fix the copy to "Use New task to send work" (no direction).

## P1

### Six different names for a task
- PAGE: Sidebar, Today, Work, New task, Task detail, Search, Project detail, URLs
- PERSONA: all
- PROBLEM: The same object appears as "Work" (nav, page), "New task" (CTA), "Send this?" (modal title), "Task" (detail heading), "Today's work", "My tasks" (member Today heading), "0 open tasks", "Tasks" (search/project), with URLs `/work`, `/kaam`, `/naya`.
- WHY IT MATTERS: Users can't build a mental model or tell others where to look ("check Work" vs "check your tasks"). Translators and support docs inherit the confusion.
- SCREENSHOT/OBSERVATION: `owner-desktop-today.aria.txt` `link "Work"`, `link "New task"`, `heading "Today's work 0"`; `member-desktop-today.aria.txt` `heading "My tasks"`; `owner-desktop-new-task.aria.txt` `heading "Send this?"`; `owner-desktop-task-detail.aria.txt` `heading "Task"`; `owner-desktop-search.aria.txt` `heading "Tasks"`.
- PROPOSED FIX: Pick one noun, "Tasks", for nav, page, heading, counters and empty states. Keep "Work" only as a marketing word. Rename the modal to "New task". Member Today heading: "Today". Alias `/tasks` and `/tasks/new` routes.

### "Team" in nav opens a page called "Staff"
- PAGE: Sidebar/More "Team" → `/staff`; Today; Attendance
- PERSONA: owner, newowner, member
- PROBLEM: Nav says "Team", the page heading is "Staff", the button is "Invite staff", the role badge is "Staff", Today says "Staff today" and "1 staff active", Attendance says "Team today", and the count reads "1 people". Members have no Team nav entry, but `/staff` renders for them.
- WHY IT MATTERS: The word changes after the click, so users doubt they landed in the right place. A member who wants to find a colleague's phone number can't find the page.
- SCREENSHOT/OBSERVATION: `owner-desktop-team.aria.txt` `heading "Staff"`, `button "Invite staff"`; `newowner-desktop-team-empty.jpg` "Staff · Mehta Facility Services · 1 people" with nav "Team" highlighted; `owner-desktop-attendance.aria.txt` `heading "Team today"`; `member-desktop-today.aria.txt` (no Team link) vs `member-desktop-team.aria.txt` (page renders).
- PROPOSED FIX: Use "Team" everywhere (page heading "Team", "Invite to team", "Team today", role "Member"). Fix the plural ("1 person"). Either show "Team" in member nav (read-only directory) or redirect members away from the page.

### Leave and Holidays have no navigation entry and are hidden inside Attendance
- PAGE: Attendance (`/hazri`)
- PERSONA: owner, member, newowner
- PROBLEM: Leave (apply full/half day, balances, requests) and Holidays are sections of the Attendance page. Nothing in the nav, More, Today or Search mentions "Leave" or "Holidays". Owner leave requests, balances and the holiday-add form sit below "Team today", after a long scroll on mobile.
- WHY IT MATTERS: "How do I apply for leave?" is a top staff question. A member won't guess it lives under "Attendance". An owner with a pending request only finds it through Updates.
- SCREENSHOT/OBSERVATION: `owner-desktop-attendance.jpg` (Leave requests, Leave balances and Holidays below the fold); `member-mobile-attendance.aria.txt` `button "Apply leave"` inside Attendance; `owner-desktop-notifications.aria.txt` "Rahul Verma asked for leave from 01 Oct" → `/hazri`; `owner-mobile-more.aria.txt` (no Leave).
- PROPOSED FIX: Rename the nav item "Attendance & Leave" or add tabs on the page (Today · Leave · Holidays) with deep links (`/hazri?tab=leave`). Add "Apply leave" to the member Today "Also waiting on you" area. Show "N leave requests waiting" on owner Today. Leave notifications should open the Leave tab.

### Leave balances start at "0 days" with unlabeled "+ Half / + 1 day" buttons
- PAGE: Attendance → Leave balances
- PERSONA: owner, newowner
- PROBLEM: Every balance starts at "0 days". The only way to change it is anonymous "+ Half" and "+ 1 day" buttons per person, with no heading or help text saying they grant leave. The member sees "Apply leave" against a 0 balance with no explanation.
- WHY IT MATTERS: Owners won't know they have to set up balances, and members will apply with a 0 balance or assume leave isn't allowed. That generates rejections and confusion (the member history already shows "1 day Rejected").
- SCREENSHOT/OBSERVATION: `owner-desktop-attendance.jpg` "Leave balances · Priya Sharma 0 days [+ Half] [+ 1 day]"; `newowner-desktop-attendance-empty.aria.txt` "Leave balance 0 days", `button "Half"`, `button "1 day"`; `member-desktop-attendance.aria.txt` "1 Oct 1 day Rejected".
- PROPOSED FIX: Label the buttons "Add half day" and "Add 1 day" (aria + visible) under the heading "Give leave days". Add a "Set yearly leave for everyone" action. For the member, show helper text like "Your owner sets your leave balance".

### Photo proof is off by default and unexplained
- PAGE: New task modal; Task detail
- PERSONA: owner, newowner
- PROBLEM: The new-task sheet shows "Proof · Not needed" as a switch that is off by default, with no hint that staff will be asked to send a photo. The "Proof" section only appears on task detail after a staff member submits one.
- WHY IT MATTERS: Verified work with photo proof is a core promise ("Submit proof. Review it."). With the default off, most first tasks are sent without it and the owner never sees the proof flow.
- SCREENSHOT/OBSERVATION: `owner-desktop-new-task.aria.txt` `text: Proof Not needed`, `switch "Proof Not needed"`; `owner-desktop-task-detail.jpg` "Proof" card; `visitor-desktop-landing.aria.txt` "Good work deserves a clear finish." "Submit proof."
- PROPOSED FIX: Rename to "Ask for a photo when done" with a one-line explanation. Consider on by default for the first tasks, or remember the last choice. On task detail, when proof wasn't requested, show "No photo requested · Ask for photo".

### Projects can't be chosen when creating a task, and project detail has no "New task"
- PAGE: New task modal; Project detail; Task detail
- PERSONA: owner, member
- PROBLEM: The new-task sheet has Who, What, By when, Priority, Proof and Note, but no Project. Project detail lists tasks but has no "New task" button (and no template or approval action). On task detail the owner gets a bare "Project" dropdown, and the member sees plain text "Project Office fit-out mu5kz8y9" that is not a link.
- WHY IT MATTERS: Linking tasks and documents to projects is the point of Projects, but linking only happens after the fact from a dropdown on the task. Users will leave most tasks unlinked, and the project shows "0 open tasks".
- SCREENSHOT/OBSERVATION: `owner-desktop-new-task.aria.txt` (no Project control); `owner-desktop-project-detail.aria.txt` (headings Tasks/Documents/People/Activity, no "New task"); `member-desktop-task-detail.aria.txt` `text: Project Office fit-out mu5kz8y9` (not a link); `owner-desktop-task-detail.aria.txt` `combobox "Project"`.
- PROPOSED FIX: Add an optional "Project" row to New task, pre-filled when opened from a project. Add "New task", "Create from template" and "Ask for approval" buttons on project detail. On task detail, render the project as a link chip with a separate "Change" action.

### Approvals are not connected to tasks or projects
- PAGE: Approvals; Task detail; Project detail; Updates
- PERSONA: owner, member
- PROBLEM: Approvals can only be created from the Approvals page ("Ask for approval"). Task and project detail have no approval action, and approval items don't show a linked task or project. Updates for approvals open the generic `/approvals` list, not the item. Owner Today's "Also waiting on you" has no pending-approvals entry point.
- WHY IT MATTERS: The page tagline claims "Decisions that hold work up, kept next to the work", but nothing is next to the work. Staff blocked on a task won't think to go to a separate Approvals page.
- SCREENSHOT/OBSERVATION: `owner-desktop-approvals.aria.txt` "Decisions that hold work up, kept next to the work.", items without links; `owner-desktop-notifications.aria.txt` `link "Rahul Verma needs approval: Approve vendor mu5kz8y9"` → `/url: /approvals`; `owner-desktop-task-detail.aria.txt` contentinfo actions Call/Remind/Reassign/Change time/Cancel (no approval).
- PROPOSED FIX: Add "Ask for approval" to task detail and project detail, pre-linked. Show the linked task/project on each approval card. Deep-link notifications to `/approvals/:id`. Add "N approvals waiting" to owner Today's "Also waiting on you".

### Members see "Create task" in chat but have no "New task" anywhere else
- PAGE: Conversation thread; Work; Today
- PERSONA: member
- PROBLEM: The member thread offers "Create task" under the owner's message. The member's Work page has no "New task" and no Team tab, and member Today has no New task CTA. Whether staff can create or assign tasks is inconsistent across surfaces.
- WHY IT MATTERS: Members either don't discover that they can log their own work, or hit a permission dead end after clicking "Create task". Either way they lose trust in the controls.
- SCREENSHOT/OBSERVATION: `member-desktop-conversation-thread.aria.txt` `button "Create task"`; `member-desktop-work.aria.txt` (tabs Mine/Open/Late/Done, no `link "New task"`); `owner-desktop-work.aria.txt` has `link "New task"`; `member-mobile-today.aria.txt` (no New task).
- PROPOSED FIX: Decide the rule. If members can create tasks, give them "New task" on Work and Today. If not, hide "Create task" in chat for members, or relabel it "Ask owner to make a task".

### Documents uploaded from the Documents page can't be linked to a task or project
- PAGE: Documents
- PERSONA: owner, member
- PROBLEM: The Documents upload row is "Category [Other] · Choose File · Upload". There is no Project or Task picker, and existing documents can't be relinked (list items only show a "Project: …" / "Task: …" link if one was set at creation). Category defaults to "Other" and must be picked before the file.
- WHY IT MATTERS: The page promises "kept next to the work it belongs to", but the main upload path produces orphan documents filed as "Other". That weakens project pages and search.
- SCREENSHOT/OBSERVATION: `owner-desktop-documents.aria.txt` `combobox "Category"` (… `option "Other" [selected]`), `button "Choose File"`, `button "Upload"`, list items with `link "Project: Office fit-out mu5kz8y9"` / `link "Task: Revised quotation mu5kz8y9"`; filter chips show only "All / Quotation / Other".
- PROPOSED FIX: Upload flow: choose file first, then a sheet with Category (suggested from the filename), Project and Task. Add a "Link to…" action on each document row.

### Global Search is buried on mobile
- PAGE: Mobile Today, More
- PERSONA: owner, member (mobile)
- PROBLEM: On mobile, Search is the 5th item in More (Today → More → Search). The Today header has the bell and logo but no search icon. On desktop it sits in the lower sidebar group with no keyboard shortcut hint.
- WHY IT MATTERS: With conversations, tasks, documents and people all in one place, search is the fastest way to "find the quotation". Mobile-first field staff won't find it.
- SCREENSHOT/OBSERVATION: `owner-mobile-today.jpg` (header: bell "7", logo; no search); `member-mobile-more.aria.txt` `link "Search"` in the second group; `owner-desktop-search.aria.txt` `textbox "Search tasks, projects, documents, people"`.
- PROPOSED FIX: Add a search icon to the mobile Today and list headers (Work, Documents, Conversations). Add a "Search…" field at the top of the desktop sidebar with a "/" or ⌘K hint.

### Hinglish and route-slug leftovers in the English UI
- PAGE: Login; all app URLs; Project activity
- PERSONA: visitor, owner, member (English)
- PROBLEM: The English login shows image alt "Waakya — Bolo. Ho jayega.". Every shareable URL uses Hindi slugs (`/aaj`, `/baat`, `/kaam`, `/naya`, `/hazri`, `/khabar`) that don't match English labels. The project Activity log shows internal state names ("moved … to acknowledged", "to delivered", "to created") instead of the UI's Seen/Sent, and lists "created" after "delivered".
- WHY IT MATTERS: English-mode users see a mix of words they can't map ("send me the hazri link"). Internal states in Activity contradict the task stepper's Sent → Seen → Accepted labels and make the lifecycle harder to learn.
- SCREENSHOT/OBSERVATION: `visitor-desktop-login.aria.txt` `img "Waakya — Bolo. Ho jayega."`; `owner-desktop-today.aria.txt` `/url: /aaj`, `/baat`, `/hazri`, `/khabar`, `/naya`, `/kaam/…`; `owner-desktop-project-detail.aria.txt` "moved "Revised quotation mu5kz8y9" to acknowledged", "… to created", "… to delivered".
- PROPOSED FIX: Localize the alt text/tagline per language. Add English route aliases (`/today`, `/conversations`, `/tasks`, `/tasks/new`, `/attendance`, `/updates`) and use them in links when the language is English. Map activity states to the same labels as the stepper (Sent, Seen, Accepted, In progress, Done, Verified) and hide "created"/"delivered".

### Daily routine is named two ways and missing from onboarding
- PAGE: Sidebar/More "Daily routine"; Settings; `/checklists`
- PERSONA: owner, newowner
- PROBLEM: Nav and page title say "Daily routine", but the empty state and CTA say "No checklists yet" / "New checklist" and the URL is `/checklists`. "Sent automatically, every day." doesn't say to whom or what gets sent. The feature is absent from Today, onboarding and the landing page. Settings has a duplicate "Daily routine" link.
- WHY IT MATTERS: Owners won't connect "Daily routine" with recurring staff checklists, which are the automation that saves them daily effort.
- SCREENSHOT/OBSERVATION: `owner-desktop-checklists.aria.txt` `heading "Daily routine"`, "Sent automatically, every day.", "No checklists yet", `button "New checklist"`; `owner-desktop-settings.aria.txt` `heading "Daily routine"` + `link "Daily routine"`; not in `visitor-desktop-landing.aria.txt`.
- PROPOSED FIX: Use one term, "Daily checklists" ("New daily checklist"). Rewrite the subtitle: "A list of tasks sent to chosen staff every morning". Add it to the Get-started card and show example routines (Open shop, Site safety check).

### Landing page never shows Projects, Templates, Leave or Daily routine, and doesn't link the demo
- PAGE: Landing (`/`), Demo (`/demo`)
- PERSONA: visitor
- PROBLEM: The landing page covers Conversations, Work, Attendance, Approvals and Documents, but never mentions Projects, business templates (quotation/invoice), leave/holidays, daily routines or search. The mock sidebar in the desktop hero lists only "Today Conversations Work Documents Attendance". The interactive `/demo` ("See Waakya in action") exists but isn't linked from the landing header, hero or footer.
- WHY IT MATTERS: Visitors judge scope from the landing page. Templates and leave are strong reasons for Indian SMBs to switch, and the best explainer (the demo) is orphaned.
- SCREENSHOT/OBSERVATION: `visitor-desktop-landing.aria.txt` `complementary: Today Conversations Work Documents Attendance`; nav `Product / How it works / For businesses`; no "demo" string in `visitor-*-landing.aria.txt`; `visitor-desktop-demo.aria.txt` `button "See Waakya in action"`, sections "Message to task … Documents … Approvals".
- PROPOSED FIX: Add a "What's inside" grid (Conversations, Tasks & proof, Projects, Documents & templates, Attendance & leave, Approvals, Daily checklists, Search). Add a "Watch the demo" link to the hero and header.

## P2

### Template form has two "Project" fields
- PAGE: Templates → Quotation form
- PERSONA: owner, member
- PROBLEM: The Quotation form has a free-text "Project" field near the top and a "Project [None]" dropdown just above "Save as document". Users can't tell which one links the document to a Waakya project.
- WHY IT MATTERS: Documents from templates likely end up unlinked, or with mismatched project names on the printed quotation.
- SCREENSHOT/OBSERVATION: `owner-desktop-template-form.jpg`: "Project" textbox under Client address, and "Project · None" select above "Save as document".
- PROPOSED FIX: Rename the text field to "Project name on document". Pre-fill it from the dropdown, and move the dropdown to the top as "Link to project".

### Group conversations show no members or group info
- PAGE: Conversation thread
- PERSONA: owner, member
- PROBLEM: The thread header shows only the title and a Back arrow. There is no member avatars row, count, or info/edit screen to add or remove people.
- WHY IT MATTERS: Users can't tell who will read a message or whether a new hire was added, and "New group" feels like a one-way action.
- SCREENSHOT/OBSERVATION: `owner-desktop-conversation-thread.jpg` header "Site team mu5kz8y9" only; `owner-desktop-conversations.aria.txt` `button "New group"`.
- PROPOSED FIX: Add a member-count subtitle ("Priya, Rahul + 3") that opens a group info sheet with add/remove people.

### Chat attachments and task "Messages" are separate from Documents and Conversations
- PAGE: Conversation thread; Task detail; Documents
- PERSONA: owner, member
- PROBLEM: Files shared in chat (site-plan-mu5kz8y9.pdf) don't appear in Documents. The paperclip is icon-only ("Attach a file"). Task detail has its own "Messages" box ("Nothing said yet") that is separate from Conversations. Upload verbs vary: "Attach a file", "Attach a document", "Upload".
- WHY IT MATTERS: Users will look for the site plan in Documents and not find it, and won't know whether to discuss a task in its Messages box or in the conversation.
- SCREENSHOT/OBSERVATION: `owner-desktop-conversation-thread.aria.txt` `button "Attach a file"`; `owner-desktop-documents.aria.txt` (only Quotation, photos, boq; no site-plan); `owner-desktop-task-detail.aria.txt` `heading "Messages"`, "Nothing said yet".
- PROPOSED FIX: Offer "Save to Documents" on chat attachments, or list them under Documents › "From conversations". Rename the task box to "Comments on this task" and link to the source conversation. Standardize on "Attach".

### Mobile task detail buries project and documents
- PAGE: Task detail (mobile)
- PERSONA: owner, member (mobile)
- PROBLEM: On mobile, the sticky action bar (Call/Remind/Reassign/Change time/Cancel) plus the bottom nav take about 180px and overlap the Proof card. The "Project" and "Attached documents" block comes last, after Timeline, Messages and a large blank gap. The Back arrow always goes to `/aaj`, even when the task was opened from Work or a project.
- WHY IT MATTERS: The task → project → documents cross-links are the key path for connecting work, and on a phone they are effectively off-screen.
- SCREENSHOT/OBSERVATION: `owner-mobile-task-detail.jpg` (action bar over the Proof photo; Project/Attached documents at the bottom after whitespace); `owner-desktop-task-detail.aria.txt` `link "Back"` → `/url: /aaj`.
- PROPOSED FIX: Move the Project chip and document count under the title ("Office fit-out · 1 document"). Collapse Timeline by default. Make the action bar part of the scroll content or a compact bar. Make Back return to the previous route.

### "Updates" vs "Notifications" and the non-clickable Today counters
- PAGE: Today; Updates
- PERSONA: owner, member
- PROBLEM: The UI calls the feed "Updates" (nav, bell "Updates · 7 new", page), while the live toast region is "Notifications alt+T" and the URL is `/khabar`. The Today counters (Sent, Seen, Done, Verified, Late, Not seen) look like cards but are not links, so the owner can't drill into "Late". Member Updates lacks "Check now".
- WHY IT MATTERS: The counters are the most visible task-lifecycle element on Today. Making them tappable teaches the lifecycle and gives a direct route to filtered Work.
- SCREENSHOT/OBSERVATION: `owner-desktop-today.aria.txt` `list "Today"` listitems (paragraphs, no links), `link "Updates · 7 new"`, `region "Notifications alt+T"`; `member-desktop-notifications.aria.txt` (only "Mark all read").
- PROPOSED FIX: Make each counter a link to `/work?status=…`. Use "Updates" for the toast region label too (and `/updates`). Keep actions the same across roles.

### Setup language choice and business-profile purpose are unclear later
- PAGE: Setup; Settings
- PERSONA: newowner, member
- PROBLEM: Setup asks for "Staff language" (implying a business-wide setting), but Settings shows a personal "Language" radio with no scope. Setup step 1 has no step counter while step 2 shows "Step 2 of 3". Settings › Business doesn't mention that the fields fill templates.
- WHY IT MATTERS: Owners may think they changed staff language when they only changed their own. They won't return to complete GSTIN/address before generating an invoice.
- SCREENSHOT/OBSERVATION: `newowner-desktop-setup.aria.txt` `radiogroup "Staff language"`, no "Step"; `newowner-desktop-profile.aria.txt` "Step 2 of 3"; `owner-desktop-settings.aria.txt` `radiogroup "Language"`, `heading "Business"` (GSTIN empty).
- PROPOSED FIX: Label Settings as "Your language" plus a separate owner-only "Default language for new staff". Show "Step 1 of 3" on setup. Add helper text under Business ("Used on quotations, invoices and receipts") and a "Missing GSTIN" nudge when opening the Invoice template.
