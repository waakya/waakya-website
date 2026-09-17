# Agent B — Product UX / Customer Journey audit (production, 2026-09-17)

Evidence: `/private/tmp/wk-build/docs/audit/before/` (screenshots + aria snapshots). Personas: visitor, newowner (Anil Mehta / Mehta Facility Services, empty), owner (Priya Sharma / Sharma Interiors), member (Rahul Verma). Test-data suffix `mu5kz8y9` is ignored in judgments.

## P0

### New owner lands on an empty dashboard with no first-run guidance
- PAGE: Setup → Profile → Today (`/aaj`), Team (`/staff`), Conversations (`/baat`)
- PERSONA: newowner
- PROBLEM: After "Create business" and "Tell us about your business" the owner arrives on Today with six zero counters, "0 staff active", and a primary "New task" button. There is no checklist or ordered next step (invite staff → start a conversation → send the first task). The only hint about ordering ("Invite your staff first, then send work.") is on the Team page, which the owner has no reason to open. Conversations says "Pick somebody and start talking." when nobody else exists. "New task" is the main action even though there is no one to assign it to.
- WHY IT MATTERS: The product only works once at least one staff member has joined. If an owner's first click is New task or New conversation and it goes nowhere, they are likely to give up in the first session. Nothing tells them that inviting staff comes first.
- SCREENSHOT/OBSERVATION: newowner-desktop-today-empty.jpg ("Hello, Anil Mehta", "0 staff active", "No work yet", "Press below to send new work."); newowner-desktop-team-empty.jpg ("No staff yet", "Invite your staff first, then send work."); newowner-desktop-conversations-empty.jpg ("No conversations yet", "Pick somebody and start talking."); newowner-desktop-profile.jpg ("Step 2 of 3"). Step 3 is not visible in any capture.
- PROPOSED FIX: While the business has no staff, replace the Today empty state with a 3-step "Get started" card: (1) Invite your team (primary button, opens the invite sheet directly), (2) Start a conversation, (3) Send your first task (both disabled with "Invite someone first" until step 1 is done). Tick steps off as they are completed and hide the card after step 3. On Conversations and New task, when there is no staff, show "Invite a team member to start" with an Invite button instead of a dead-end picker. Make the last onboarding step ("Step 3 of 3") the invite step itself.

### Message → Task is hidden, one-sided and leaves no trail
- PAGE: Conversation thread (`/baat/:id`), Task detail (`/kaam/:id`)
- PERSONA: owner, member
- PROBLEM: This is the product's core promise (the landing page says "Any message can become a task"), but in the app it is a small text link, "Create task", shown only under messages from *other* people. The owner, who normally assigns work, sees no Create task under the message they sent in the same group. The resulting task has no link back to the source message. Task detail shows "Messages: Nothing said yet" even though the task came from "Please send the revised quotation". The thread also doesn't show that a task was made from the message.
- WHY IT MATTERS: The chain Conversation → Commitment → Execution → Proof → Record is the product's differentiator, and it cannot be seen in the UI. Owners will keep creating tasks by hand from Today, and later nobody can trace a task back to what was agreed.
- SCREENSHOT/OBSERVATION: owner-desktop-conversation-thread.jpg (own message "Shared site-plan-mu5kz8y9.pdf", no task action; the aria has only "Attach a file", "Write a message", "Send"). member-desktop-conversation-thread.jpg ("Create task" link under Priya's message). owner-desktop-task-detail.jpg and member-desktop-task-detail.jpg ("Messages", "Nothing said yet", no "From conversation" link). visitor-desktop-landing.aria.txt ("Nothing yet. Any message can become a task.", "Linked work").
- PROPOSED FIX: Give every message (your own included) a hover/long-press action menu with "Make task" as the first item. Keep a visible "Make task" chip on messages that contain a deadline or request. Once a task exists, show a "Linked work" chip on the message: task title, assignee and live status. On Task detail, add a "From conversation: <thread> · <quoted message>" link above the title. Mirror the "Linked work" panel from the landing page in the thread header.

### A verified task still counts down, schedules a reminder and offers edits
- PAGE: Task detail (`/kaam/:id`)
- PERSONA: owner, member
- PROBLEM: A task at the final step, "Verified", still shows "by tomorrow 6:00 pm · 22 h 42 min left" in the highlighted deadline banner. It also shows "Complete 0% gone · reminder tomorrow 8:00 am" and keeps "Change time" enabled. The screen contradicts itself: the work is closed, yet it still looks due and a reminder is still scheduled.
- WHY IT MATTERS: The Proof → Record step is meant to create trust. If a closed task says a reminder is coming, owners will doubt the lifecycle and staff may think they still owe work.
- SCREENSHOT/OBSERVATION: owner-desktop-task-detail.jpg ("by tomorrow 6:00 pm", "22 h 42 min left", "Verified 7:14 pm", "0% gone · reminder tomorrow 8:00 am", "Change time" enabled; Remind/Reassign/Cancel disabled). member-desktop-task-detail.jpg shows the same. owner-mobile-task-detail.jpg shows the same.
- PROPOSED FIX: When status is Done or Verified, swap the deadline banner for a green "Verified by Priya Sharma · 7:14 pm · finished 22 h early" record banner. Hide the SLA/Complete progress bars and the reminder text, and cancel any pending reminder. Replace the action bar with "Reopen" (owner only) and "Call". Make the action bar and banner come from one status-driven configuration.

## P1

### Approval and leave notifications stay "needs action" after they are decided
- PAGE: Updates (`/khabar`), Approvals, Attendance
- PERSONA: owner
- PROBLEM: The owner's Updates list still shows "Rahul Verma needs approval: Approve extra spend", unread and linking to /approvals, even though Approvals lists it as "Rejected · Decided by Priya Sharma". Leave works the same way: "Rahul Verma asked for leave from 01 Oct" links to Attendance, where "Leave requests" reads "Nothing waiting." The owner has no list of decided leave (only the member sees "1 Oct Rejected / 24 Sept Approved").
- WHY IT MATTERS: The notification inbox becomes a to-do list that is out of date, and the owner has no record of which leave was granted or refused.
- SCREENSHOT/OBSERVATION: owner-desktop-notifications.jpg ("7 new", "needs approval: Approve extra spend", "asked for leave from 01 Oct"); owner-desktop-approvals.jpg ("Decided 2", "Rejected", "Approved"); owner-desktop-attendance.jpg ("Leave requests", "Nothing waiting."); member-desktop-attendance.jpg ("1 Oct 1 day Rejected", "24 Sept half day Approved").
- PROPOSED FIX: Show the outcome inline on notifications ("… · Rejected by you"), auto-mark request notifications read once decided, and add a status pill. On owner Attendance, add a "Decided" collapsible under Leave requests with date, type, decision and decider.

### Two separate approval inboxes (Approvals vs leave in Attendance)
- PAGE: Approvals (`/approvals`), Attendance (`/hazri`)
- PERSONA: owner
- PROBLEM: Approvals describes itself as "Decisions that hold work up", but leave requests (also approvals) are only in the middle of Attendance, below personal punch-in. The owner has to check two places, and neither Today nor the sidebar shows a pending-approvals count.
- WHY IT MATTERS: Pending decisions block staff. Scattering them means slower answers and leave requests that get missed.
- SCREENSHOT/OBSERVATION: owner-desktop-approvals.jpg (only "Approve extra spend", "Approve vendor"); owner-desktop-attendance.jpg (the "Leave requests" section is the 5th block); owner-desktop-today.jpg ("Also waiting on you" lists "1 unread conversation", "You have not punched in today", with no approvals).
- PROPOSED FIX: Make Approvals the single inbox with type filters (All / Spend / Vendor / Leave). Keep a small "Leave requests (n) → Approvals" link in Attendance. Add "n approvals waiting" to Today's "Also waiting on you" and a count badge on the Approvals nav item.

### Approval cards don't link to the work they "hold up" and give no reason
- PAGE: Approvals
- PERSONA: owner, member
- PROBLEM: Each card has only a title, requester, decider and status. It has no link to the task, project or conversation, no amount or attachment, and no rejection reason. On the member's "My requests" page every card repeats "Requested by Rahul Verma".
- WHY IT MATTERS: The owner decides without context, and staff don't learn why a request was rejected. That cuts against the subtitle "kept next to the work".
- SCREENSHOT/OBSERVATION: owner-desktop-approvals.jpg, member-desktop-approvals.jpg ("My requests 2", "Requested by Rahul Verma · Thu, 17 Sept 7:14 pm", "Rejected").
- PROPOSED FIX: Show a "For: <task/project>" link, amount/attachments and a detail view. Require (or at least prompt for) a comment on Reject and show it on the card. Under "My requests", drop "Requested by <me>".

### Today mixes "No work yet" with completed work and points the wrong way
- PAGE: Today (`/aaj`)
- PERSONA: owner, newowner
- PROBLEM: The owner's Today shows "Today's work 0 / No work yet / Press below to send new work." and directly under it "Done 1" with a verified task. On desktop the New task button is at the *top right*, so "Press below" is wrong. The six counters (Sent/Seen/Done/Verified/Late/Not seen) repeat what is in the table.
- WHY IT MATTERS: The daily home screen should answer "what needs me now". Contradictory copy and repeated numbers slow that down.
- SCREENSHOT/OBSERVATION: owner-desktop-today.jpg ("Today's work 0", "No work yet", "Press below to send new work.", "Done 1"); newowner-desktop-today-empty.jpg (same copy, button at top).
- PROPOSED FIX: When there is done work, use "Nothing open for today. 1 finished." with a "New task" button inside the empty card. Make the copy viewport-neutral ("Send new work with New task"). Collapse the counters to Open / Late / Waiting for verification, each linking to the matching Work tab.

### Inconsistent names for the same places ("Team" vs "Staff", "Updates", "Daily routine" vs "checklist", "Today" vs "My tasks")
- PAGE: Global navigation, Team, Today, Daily routine, Updates
- PERSONA: all
- PROBLEM: The nav item "Team" opens a page titled "Staff", with rows tagged "Staff" and a button "Invite staff". The nav says "Daily routine", but the page's empty state and button say "No checklists yet" / "New checklist". For members, the nav says "Today" but the page heading is "My tasks". Notifications are called "Updates" in the nav and the bell has no label. The mobile bottom bar's accessibility name is "More" for the whole navigation.
- WHY IT MATTERS: With mixed Hindi/Hinglish/English users, each extra synonym costs comprehension. Support conversations ("go to Team" / "I only see Staff") get harder.
- SCREENSHOT/OBSERVATION: owner-desktop-team.jpg (nav "Team" active, heading "Staff", "Invite staff"); owner-desktop-checklists.jpg ("Daily routine", "No checklists yet", "New checklist"); member-desktop-today.jpg (nav "Today", heading "My tasks"); owner-mobile-today.aria.txt (`navigation "More"` containing Today/Conversations/Work/Attendance/More).
- PROPOSED FIX: Choose one term per concept and apply it to nav, heading, buttons and badges: "Team" (heading "Team", "Invite to team", role pill "Member"), "Daily routine" ("New routine"), "Today" for both roles (member subheading "Your tasks"), "Updates" (bell tooltip "Updates"). Rename the mobile nav landmark to "Main".

### Hinglish route slugs and tagline leak into the English UI
- PAGE: Global (URLs), Login
- PERSONA: all, visitor
- PROBLEM: With English selected, the URLs the user sees and shares are `/aaj`, `/baat`, `/naya`, `/kaam/:id`, `/hazri`, `/khabar`, alongside English ones (`/work`, `/projects`, `/approvals`, `/staff`, `/checklists`). The login logo alt text reads "Waakya — Bolo. Ho jayega." Mixed slugs make shared links and support instructions inconsistent. `/staff` vs "Team" adds a third name.
- WHY IT MATTERS: English-first owners see a half-translated product. Links sent over WhatsApp look inconsistent, and screen readers read out Hinglish on an English page.
- SCREENSHOT/OBSERVATION: owner-desktop-today.aria.txt (`/url: /aaj`, `/naya`, `/khabar`); owner-desktop-conversations.aria.txt (`/baat/…`); owner-desktop-work.aria.txt (`/kaam/…`); newowner-desktop-attendance-empty.aria.txt (`/hazri`); visitor-desktop-login.aria.txt (`img "Waakya — Bolo. Ho jayega."`).
- PROPOSED FIX: Use English canonical routes (`/today`, `/conversations`, `/tasks/new`, `/tasks/:id`, `/attendance`, `/updates`, `/team`) and keep 301 redirects from the old slugs. Localise the tagline alt text by language, or use plain "Waakya".

### New task screen: no context, no project, unexplained disabled Send
- PAGE: New task (`/naya`)
- PERSONA: owner
- PROBLEM: The screen is a full-page modal with no sidebar, titled "Send this?" (a confirmation question, not a form title). "Who" is silently prefilled with "Rahul Verma". There is no Project field and no attachment/document field, even though tasks are shown under projects and carry attached documents. Send is disabled with no reason given (the required "What" field is not marked).
- WHY IT MATTERS: The main creation form hides why it can't submit and forces a second edit on Task detail to link a project. Wrong-assignee mistakes become likely.
- SCREENSHOT/OBSERVATION: owner-desktop-new-task.jpg ("Send this?", "Who Rahul Verma", "What For example: photos of the Sector 62 flat", Proof "Not needed", "Send" greyed); owner-desktop-task-detail.jpg (Project select and "Attach a document" only after creation).
- PROPOSED FIX: Retitle it "New task". Mark "What" required and show "Add what needs doing" next to the disabled Send. Leave "Who" empty unless the form was opened from a person or conversation context. Add optional "Project" (prefilled when opened from a project) and "Attach" rows. Add a custom date/time chip to By when.

### Project detail omits the people doing the work and has no "add task here"
- PAGE: Project detail (`/projects/:id`)
- PERSONA: owner, member
- PROBLEM: People lists only "Priya Sharma" although Rahul owns the project's task. There is no "New task in this project" action, only a Tasks list. Status appears twice (an "Active" badge plus an "Active" dropdown), and "Add person" is an unlabelled dropdown. The Activity log uses raw state names in an illogical order ("moved … to created" after "to delivered", then "to acknowledged"), which doesn't match the task timeline's "Sent / Seen / Accepted".
- WHY IT MATTERS: Projects are supposed to "keep related work, people and documents together". Missing people, a missing create action and a confusing activity log undermine the Record.
- SCREENSHOT/OBSERVATION: owner-desktop-project-detail.jpg ("People: Priya Sharma"; "Active" badge and "Active" select; "Add person"; "moved … to created", "to delivered", "to acknowledged"); member-desktop-project-detail.jpg (same People list).
- PROPOSED FIX: Automatically include task assignees in People. Add a primary "New task" button that opens the task form with the project prefilled. Show status once, as an editable pill. Label the controls ("Status", "Add person…"). Map event names to the task timeline vocabulary (Sent, Seen, Accepted, In progress, Done, Verified), order chronologically, and group repeated events per task ("Revised quotation: Sent → Verified, 6 steps").

### Quotation template form: duplicate "Project" field, long single column, save far from preview
- PAGE: Template form (`/documents/templates/quotation`)
- PERSONA: owner, member
- PROBLEM: The form has 12 fields in one column. "Project" appears twice: a free-text box under Client address and a "None" dropdown at the bottom. The preview stays mostly blank while typing (only header, date and "QUOTATION"), and "Save as document" sits at the bottom of the left column, about 1,400px down. There are no line items or quantities, only one "Scope" textarea and one "Amount (before GST)".
- WHY IT MATTERS: Quotations are a key workflow for interiors and facility SMBs. The duplicate project field produces inconsistent data, and the length makes the form hard on mobile.
- SCREENSHOT/OBSERVATION: owner-desktop-template-form.jpg ("Client name *", "Project" text field, "Date *", "Reference number", "Scope *", "Amount (before GST) *", "GST %", "Valid until", "Payment terms", "Notes", "Project" select "None", "Save as document"); member-desktop-template-form.jpg (identical).
- PROPOSED FIX: Remove the free-text Project and keep the dropdown near the top ("Link to project"). Group fields into sections: Client, Items (repeatable rows with description, qty, rate and auto GST total), Terms. Make the preview sticky and fill it live, with placeholder values for empty fields. Put a sticky footer with "Save as document" plus "Save & send in conversation".

### Primary action placement differs on every page
- PAGE: Work, Projects, Documents, Conversations, Approvals, Team, Daily routine
- PERSONA: all
- PROBLEM: Each page places its main create action differently. Work: filled "New task" top-right. Projects: filled "New project" top-left under the subtitle. Documents: "Templates" top-right as secondary, "Upload" filled on the left next to a category dropdown. Conversations: two outline buttons. Approvals: outline "Ask for approval". Team: full-width "Invite staff" stuck at the bottom, far below the list. Daily routine: full-width "New checklist" below the empty state.
- WHY IT MATTERS: Users relearn each page, and the most important owner action (Invite) is the hardest to find on desktop.
- SCREENSHOT/OBSERVATION: owner-desktop-work.jpg, owner-desktop-projects.jpg, owner-desktop-documents.jpg, owner-desktop-conversations.jpg, owner-desktop-approvals.jpg, owner-desktop-team.jpg ("Invite staff" at y≈795), owner-desktop-checklists.jpg.
- PROPOSED FIX: Use one page-header pattern: title and subtitle on the left, one filled primary button on the right (New task / New project / Upload / New conversation / Ask for approval / Invite / New routine), secondary actions as outline buttons next to it. On mobile, keep the primary action as the bottom floating button, as Today already does.

### Team page rows are dead ends; invite status is invisible
- PAGE: Team (`/staff`)
- PERSONA: owner
- PROBLEM: Rows are plain text (no link) with name, phone, punch times and "0 open tasks". The owner can't open a person to see their tasks, attendance or leave, call or message them, change their role or remove them. There is no list of pending invites or a way to resend or revoke one. The subtitle reads "1 people".
- WHY IT MATTERS: Managing people is an owner's weekly job. Without drill-down and invite tracking, owners can't tell whether staff ever joined.
- SCREENSHOT/OBSERVATION: owner-desktop-team.aria.txt (listitem with only paragraphs, no links); owner-desktop-team.jpg ("Rahul Verma", "9876511111", "7:14 PM – 7:14 PM · 0 open tasks", "Staff"); newowner-desktop-team-empty.jpg ("Mehta Facility Services · 1 people").
- PROPOSED FIX: Make each row open a person page with open tasks, attendance this month, leave balance, "Message", "Call", "New task for …", role and "Remove". Add a "Pending invites" section with Copy link / Resend / Revoke. Fix pluralisation ("1 person").

### Owner Attendance page mixes personal punch-in with team admin; status labels are ambiguous
- PAGE: Attendance (`/hazri`)
- PERSONA: owner, member
- PROBLEM: The owner's page stacks seven sections in one scroll: Today punch-in, Leave, This month, Team today, Leave requests, Leave balances, Holidays. Holidays appears twice (inside the Leave card and again at the bottom). Leave balance buttons "+ Half" / "+ 1 day" don't say whether they grant or deduct. A member who has punched out gets a green "Done" badge with "Worked 0m", while their Today chip still says "Punched in at 7:14 PM". The "This month" columns have no headers.
- WHY IT MATTERS: The owner can't quickly see who is present, and staff get conflicting status messages.
- SCREENSHOT/OBSERVATION: owner-desktop-attendance.jpg ("Holidays 8 Oct Founders Day" twice; "Rahul Verma 1.5 days + Half + 1 day"); member-desktop-attendance.jpg ("TODAY Done", "Worked 0m", "24 Sept — — — Half day"); member-desktop-today.jpg ("Punched in at 7:14 PM").
- PROPOSED FIX: For owners, split the page into tabs, "My attendance" and "Team" (Team today, Leave balances, Holidays), with requests moved to Approvals. Show holidays once. Relabel the buttons "Grant ½ day" / "Grant 1 day" and add a confirmation toast. Use "Punched out 7:14 PM" instead of "Done", and make the Today chip follow the latest state. Add In / Out / Hours / Status column headers.

### Task detail header changes meaning by role
- PAGE: Task detail
- PERSONA: owner, member
- PROBLEM: In the owner's view the large name is the assignee ("Rahul Verma") with "Priya Sharma sent this at 7:14 pm". In the member's view the large name is the sender ("Priya Sharma") with "sent 7:14 pm". The page header only says "Task", and the task title is an h2 below it.
- WHY IT MATTERS: The page doesn't state "who owns this / who asked" in the same way for everyone, which matters when screenshots are shared as proof.
- SCREENSHOT/OBSERVATION: owner-desktop-task-detail.jpg ("Rahul Verma" / "Priya Sharma sent this at 7:14 pm"); member-desktop-task-detail.jpg ("Priya Sharma" / "sent 7:14 pm").
- PROPOSED FIX: Make the title the h1. Below it, show a fixed two-part line for both roles: "Assigned to Rahul Verma · From Priya Sharma · 7:14 pm", plus the project chip.

### Unread badges appear and disappear across pages
- PAGE: Sidebar navigation
- PERSONA: owner, member
- PROBLEM: The "Updates 7" badge shows on Today, Work, Projects, Documents, Search and Approvals, but not on Conversations, Attendance, Team, Settings or Daily routine for the same owner in the same session. Conversations never shows an unread badge in the nav, even while Today says "1 unread conversation".
- WHY IT MATTERS: Badge counts that flicker by page make people distrust them, so unread messages get missed.
- SCREENSHOT/OBSERVATION: owner-desktop-today.jpg (Updates "7"); owner-desktop-conversations.jpg, owner-desktop-team.jpg, owner-desktop-settings.jpg, owner-desktop-checklists.jpg (no badge); owner-desktop-conversations.jpg (a row badge "1" but no nav badge).
- PROPOSED FIX: Load the counts in the shared layout (not per page) so they persist across routes. Add an unread count to the Conversations nav item and the mobile tab, plus Approvals pending.

### Group conversation header gives no context (members, project)
- PAGE: Conversation thread
- PERSONA: owner, member
- PROBLEM: The group thread header shows only the back arrow and "Site team". There are no member avatars or count, no link to a project, and no thread menu (add people, files, linked tasks). Shared files aren't gathered anywhere in the thread.
- WHY IT MATTERS: Site teams change often, so people need to know who will see a message before assigning work in the group.
- SCREENSHOT/OBSERVATION: owner-desktop-conversation-thread.jpg and member-desktop-conversation-thread.jpg (header "Site team mu5kz8y9" only); owner-desktop-conversation-thread.aria.txt (`link "Back"`, heading, no other controls).
- PROPOSED FIX: Add a header subline ("Priya, Rahul · 2 members") and an info panel with members, linked project, files and linked tasks, plus an "Add people" action.

### Document upload order is backwards (category before file, defaults to "Other")
- PAGE: Documents, Project detail, Task detail
- PERSONA: owner, member
- PROBLEM: Upload is a category dropdown preset to "Other" followed by an "Upload" / "Attach a document" button. Users will usually upload first and forget the category, so most files end up as "Other" (2 of 3 already are). The same pattern repeats in three places.
- WHY IT MATTERS: The category filters (All / Quotation / Other) become useless, and search by type fails.
- SCREENSHOT/OBSERVATION: owner-desktop-documents.jpg ("Other" select + "Upload"; list "Other · 45 B" ×2); owner-desktop-project-detail.jpg and owner-desktop-task-detail.jpg ("Other" + "Attach a document").
- PROPOSED FIX: Pick the file first, then show a small sheet with the file name, a category chosen from the file name ("quotation" → Quotation, "invoice" → Invoice) and a link to project/task, then Save. Show a toast with "View" afterwards.

## P2

### Onboarding steps look inconsistent (step 1 unnumbered, different layout)
- PAGE: Setup, Profile
- PERSONA: newowner
- PROBLEM: "Create your business" has no step indicator and a full-width, left-aligned layout with only the icon. "Tell us about your business" is centred with the wordmark, an illustration and "Step 2 of 3". Setup asks for "Staff language", while Settings has a plain "Language" without saying whether it applies to the owner, staff or everyone.
- WHY IT MATTERS: Onboarding feels stitched together, and the language choice is ambiguous.
- SCREENSHOT/OBSERVATION: newowner-desktop-setup.jpg ("Create your business", "Staff language", "Create business"); newowner-desktop-profile.jpg ("Step 2 of 3"); owner-desktop-settings.jpg ("Language").
- PROPOSED FIX: Use the centred Profile layout for all steps, with "Step 1 of 3" on Setup. In Settings, split into "My language" and "Default language for new staff" (owner only), each with a short explanation.

### Desktop "More" page duplicates the sidebar
- PAGE: More
- PERSONA: owner, member
- PROBLEM: On desktop, /more repeats the sidebar links under a business-name heading and adds nothing. It is a mobile pattern shown on desktop.
- WHY IT MATTERS: It's a redundant page and a possible confusing landing spot from shared links.
- SCREENSHOT/OBSERVATION: owner-desktop-more.jpg ("Sharma Interiors" → Projects, Documents, Approvals, Team, Search, Updates 7, Daily routine, Settings, the same as the sidebar).
- PROPOSED FIX: On desktop widths, redirect /more to /today (or show the business profile summary). Keep the page for mobile only.

### Settings: two save buttons, a nav duplicate, and no team or business controls for owners
- PAGE: Settings
- PERSONA: owner
- PROBLEM: "Save name" (full-width, disabled) and "Save" (small, business card) look and behave differently on the same page. There is a "Daily routine" card that only links to the nav page. The page has no invite or team-management entry, and no GSTIN hint even though GSTIN fills invoices.
- WHY IT MATTERS: Minor friction and unclear save state.
- SCREENSHOT/OBSERVATION: owner-desktop-settings.jpg ("Save name", "Save", "Daily routine" card, empty "GSTIN").
- PROPOSED FIX: Save each section with one consistent button style (or autosave with a "Saved" toast). Replace the Daily routine card with "Team & invites". Add GSTIN format validation and helper text ("Shown on invoices and quotations").

### Work list is sparse and its empty state has no action
- PAGE: Work (`/work`)
- PERSONA: owner, member, newowner
- PROBLEM: Tabs (Team / Mine / Open / Late / Done) have no counts. The empty state is a single grey line, "Nothing here right now.", with no action. In the member's "Mine" tab every row repeats his own name ("Rahul Verma · Due …").
- WHY IT MATTERS: The tabs give no overview, and the empty state doesn't help the user move on.
- SCREENSHOT/OBSERVATION: newowner-desktop-work-empty.jpg ("Nothing here right now."); member-desktop-work.jpg ("Mine", "Rahul Verma · Due Fri, 18 Sept 6:00 pm").
- PROPOSED FIX: Add counts to tabs ("Late 2"). Use a real empty state with an icon, one line and a primary action. On Mine, show "From Priya Sharma" instead of your own name.

### Member Today header has a stray logo and avatar
- PAGE: Today
- PERSONA: member
- PROBLEM: The member's desktop Today header shows bell, Waakya logo mark and an "R" avatar side by side, next to the sidebar that already has logo and user card. The owner's Today doesn't have this, and the avatar leads nowhere visible.
- WHY IT MATTERS: Visual noise and an inconsistent layout between roles.
- SCREENSHOT/OBSERVATION: member-desktop-today.jpg (top right: bell "8", logo mark, "R" circle).
- PROPOSED FIX: Remove the logo and avatar from the desktop header (keep them for mobile only) and use the owner's header layout.

### Mobile task detail: stacked action tray and tab bar cover content
- PAGE: Task detail (mobile)
- PERSONA: owner
- PROBLEM: A fixed action tray (Call / Remind / Reassign / Change time / Cancel) sits above the fixed bottom tab bar, together about 180px of an 844px screen. In the capture it covers the proof photo. On a verified task three of the five buttons are disabled.
- WHY IT MATTERS: Proof, the most important part of a finished task, is partly hidden on the device staff and owners use most.
- SCREENSHOT/OBSERVATION: owner-mobile-task-detail.jpg (tray over the "Proof" image; "Remind", "Reassign", "Cancel" greyed).
- PROPOSED FIX: On task detail, hide the bottom tab bar, or collapse the tray into a single "Actions" button. Show only the actions that apply to the current state. Add bottom padding equal to the fixed UI height.

### Inconsistent date/time formatting
- PAGE: Global
- PERSONA: all
- PROBLEM: The same session mixes "7:14 PM" and "7:14 pm", "24 Sept", "24 Sep" and "01 Oct", and "Thu, 17 Sept · 7:14 pm" versus "Thu, 17 Sept 7:14 pm".
- WHY IT MATTERS: The product looks unpolished and dates are harder to scan.
- SCREENSHOT/OBSERVATION: owner-desktop-conversations.jpg ("7:14 PM"); owner-desktop-work.jpg ("6:00 pm"); owner-desktop-notifications.jpg ("leave from 01 Oct", "24 Sep"); member-desktop-attendance.jpg ("24 Sept", "7:14 PM").
- PROPOSED FIX: Use one locale-aware formatter (e.g. `d MMM`, `h:mm a` lower-case) everywhere, including notification templates.

### Updates list has no type cues or grouping
- PAGE: Updates
- PERSONA: owner, member
- PROBLEM: All updates are identical lavender cards with no icon for type (task, approval, leave, message, document), no grouping by day, and no filter. The owner's version has a bare refresh icon ("Check now") that the member's version doesn't.
- WHY IT MATTERS: With real volume, owners won't be able to pick out the updates that need action.
- SCREENSHOT/OBSERVATION: owner-desktop-notifications.jpg (7 identical cards, refresh icon); member-desktop-notifications.jpg (8 identical cards, no refresh).
- PROPOSED FIX: Add a type icon and a "Needs action" filter, group cards under Today / Earlier, and give every role the same header controls.

## Journey notes

### Visitor
The landing page and demo tell the story well ("Every conversation. A clear next step.", Talk → Assign → Execute → Prove, and a sample thread showing "Linked work"). Login is clear, and "Staff need the link their owner sent" correctly sends staff to their invite link. An invalid invite says "This link no longer works. Ask the owner for a new one." That is fine, but it offers no Sign in or Home link. The Hinglish tagline alt text ("Bolo. Ho jayega.") appears on the English login page. The app, however, doesn't deliver what the landing page promises, "Linked work" / "Any message can become a task" (see P0 Message → Task).

### New owner
Setup → Profile (Step 2 of 3) → Today works, but ends at a dashboard of zeros with "New task" as the main action and no ordered guidance. Inviting staff, the essential first step, is only mentioned on the Team page, and its button is at the bottom of an empty screen. Conversations, Work and Approvals empty states don't explain that nothing works until someone joins. Projects and Documents empty states are the most helpful (illustration plus a one-line explanation plus a CTA).

### Daily owner
Today gives a quick status view (counters, "Also waiting on you", Staff today, 100% on time), but approvals are missing from "waiting on you", decided requests still sit in Updates as "needs approval", and leave decisions have no history. Creating work means going to the New task page rather than working from the conversation. Afterwards the task, project and conversation aren't linked back to each other. Project detail's activity log is raw and out of order. Documents and templates work, but the quotation form is long and has a duplicate Project field.

### Employee
Rahul's nav is a trimmed version of the owner's (no Team or Daily routine; Work tabs without "Team"; no New task on Work), which is a sensible split. Today, headed "My tasks", clearly says "Everything for today is done". Attendance is good for staff: punch times, leave balance, and leave history with Approved/Rejected. Gaps: the "Punched in at 7:14 PM" chip stays after punch-out; a verified task still says "22 h 41 min left"; approval rejections have no reason; the task header shows the sender where the owner sees the assignee. Members *can* make tasks from others' messages, which is the right idea but easy to miss.

### Mobile
The bottom tab bar (Today, Conversations, Work, Attendance, More) and the floating "New task" / "Invite staff" buttons are good thumb-friendly patterns. The Today header condenses counters well. Problems I noticed: on Task detail the action tray stacks on the tab bar and covers proof; the mobile navigation's accessibility name is "More"; Team, Approvals and Documents are two taps deep under More, which matters for owners who approve and invite from their phone.
