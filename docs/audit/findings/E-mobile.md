# E — Mobile UX audit (390x844)

Auditor: Agent E (mobile). Evidence: production captures in `docs/audit/before/` (`visitor-mobile-*`, `newowner-mobile-*`, `owner-mobile-*`, `member-mobile-*`, plus `.aria.txt`), compared with `owner-desktop-*` where useful. All pixel sizes below are CSS px estimated from the 390px-wide captures. In full-page captures the fixed bottom nav is drawn at y≈780–844 of the first viewport; content "under" it further down the image is a capture artifact, not a bug, unless noted.

Target sizes used: staff primary actions ≥56px, owner ≥48px, primary actions in the bottom third (y > ~560 of 844).

## P0

### Project detail scrolls sideways on a phone
- PAGE: /projects/:id (project detail)
- PERSONA: Owner, employee
- PROBLEM: The page is wider than the screen. The owner capture is 453px wide and the member capture is 413px wide, while every other mobile capture is 390px. The Documents header row (label + category `<select>` + "Attach a document" button) and the People/Activity rows run past the right edge. `index.json` reports `overflowX: 0` for both, so the automated check misses it (the overflow is probably on an inner container, or the body clips it while the full-page capture does not).
- WHY IT MATTERS: On a budget Android phone a sideways-scrolling page feels broken. Pinch or drag moves the whole layout, the download and delete icons end up off-screen, and it's easy to hit the wrong one. Projects are where owners collect quotations and BOQs.
- SCREENSHOT/OBSERVATION: `owner-mobile-project-detail.jpg` (453px wide): the "Attach a document" button ends at about x=452, the delete icons sit at about x=420, and the bottom nav (fixed, 390px) stops well short of the content edge. `member-mobile-project-detail.jpg` (413px wide): same Documents row. The owner's "Active" / "Add person" selects also sit in a crowded row.
- PROPOSED FIX: Stack the Documents header on narrow screens: title on its own line, then a full-width "Attach a document" button, with the category picked after the file is chosen (see the P1 finding on document upload). Add `min-width:0` / `overflow-wrap:anywhere` to the file-name and activity-text flex children. Change the overflow check to test `document.scrollingElement.scrollWidth` and the widest descendant, not just the body.

### Mobile Today hides the numbers an owner opens the app for (Late, Not seen)
- PAGE: /aaj (Today), owner
- PERSONA: Daily owner
- PROBLEM: The mobile header shows only Sent / Seen / Done / Verified. Desktop Today also shows **Late** and **Not seen**, plus a "Staff today" card. On mobile the blue header takes the top 180px with four "1"s and "Verified work: 100%". Nothing on the first screen says what needs the owner. The Updates screen shows "Rahul Verma needs approval…" and "asked for leave…", but Today doesn't mention approvals or leave.
- WHY IT MATTERS: The owner mostly uses a phone. Their morning question is "who hasn't seen or finished their work, and what's waiting on me?" Right now the phone shows the happy-path counts and drops the exceptions.
- SCREENSHOT/OBSERVATION: `owner-mobile-today.jpg`: the header (0–180px) has four equal stats. Below it: "1 unread conversation" and "You have not punched in today" pills, then a single "Done 1" card. Everything under y≈435 is empty down to the New task button. `owner-desktop-today.jpg` has six stat cards, including "0 Late" and "0 Not seen", plus "Staff today".
- PROPOSED FIX: On mobile, replace the four vanity counts with a 2x2 of **Late · Not seen · Waiting for your check (Done, not verified) · Approvals/leave pending**. Each tile should be ≥48px and link to a filtered list. Tint Late and Not seen when they are above zero. Hide Sent/Seen totals behind a tap. Add "Needs you" rows (approvals, leave requests) above the task list.

### Turning a message into a task is nearly undiscoverable on mobile
- PAGE: /baat/:id (conversation thread)
- PERSONA: Owner, employee
- PROBLEM: The core promise ("Every conversation. A clear next step.") depends on message→task. In the thread, the only way to do it is a small blue "Create task" text link under someone else's message (about 20px tall, left edge). Your own messages have no such control: the owner's thread has no "Create task" button anywhere in the aria tree. There's no long-press or message menu hint.
- WHY IT MATTERS: An owner typing "Rahul, send the revised quotation by 5 PM" in a thread can't turn their own instruction into a tracked task, and that is the most common case. The link that does exist is well below the 48px owner minimum and sits right next to the attachment chip, so it's easy to open the PDF by mistake.
- SCREENSHOT/OBSERVATION: `member-mobile-conversation-thread.jpg`: "Create task" at y≈200–220, text-only, under Priya's message. `owner-mobile-conversation-thread.jpg` plus its aria: the owner's own outgoing bubble has no Create task button (aria lists only the file button, attach, textbox and send).
- PROPOSED FIX: Give every message (incoming and outgoing) a long-press / swipe action sheet with a 56px-row "Make this a task". Also add a persistent "+ Task" chip next to the composer that pre-fills from the last message or selected text. Keep an inline "Make task" pill (≥44px tall hit area) under messages that contain a time or deadline word ("by 5 PM", "kal tak").

### Task detail: sticky bar and bottom nav take a fifth of the screen but give no main action
- PAGE: /kaam/:id (task detail)
- PERSONA: Owner, employee
- PROBLEM: Two fixed bars stack at the bottom: the task action bar (Call / Remind / Reassign / Change time / Cancel, about 110px) and the global bottom nav (64px), about 176px in total. On a Verified task, Remind, Reassign and Cancel show as disabled grey tiles, so the only live controls are Call and Change time. For the employee the same sticky slot shows only a caption, "Every step you take is recorded with its time", with no action at all. The Messages composer is buried mid-page (y≈1150), and about 250px of blank space separates it from the Attached documents card.
- WHY IT MATTERS: The thumb zone is spent on greyed or informational content. The staff's key actions (Accept / Start / Done / Submit proof) and the owner's key action (Verify / Request changes) belong in that slot at ≥56/48px. Two fixed bars also leave only about 670px for content on an 844px phone, and less on 720px budget phones.
- SCREENSHOT/OBSERVATION: `owner-mobile-task-detail.jpg`: the action bar at y≈668–780 has greyed Remind, Reassign and Cancel, and the nav sits below it. `member-mobile-task-detail.jpg`: the sticky slot at y≈730–780 holds only the "Every step you take is recorded…" caption. In the second part of each, the Messages input sits at about y=1130 of 1890, then there's a blank gap, then the documents card.
- PROPOSED FIX: Hide the global bottom nav on detail routes (the back arrow already exists). Make the sticky footer state-driven: one full-width primary button (staff: "Accept" → "Start" → "Mark done / Add proof", 56px; owner: "Verify" + "Ask for changes", 48px) plus an overflow "⋯" for Remind, Reassign, Change time and Cancel. Hide actions that aren't available rather than disabling them. Move the documents card above Timeline and remove the blank spacer.

## P1

### Primary "create" buttons jump between the top and the bottom from page to page
- PAGE: Today, Staff (bottom sticky) vs Work, Projects, Documents, Approvals, Conversations, Daily routine (top or inline)
- PERSONA: Owner (one-handed)
- PROBLEM: "New task" and "Invite staff" are full-width 56px buttons pinned above the nav, which is good. "New task" on Work, "New project", "Upload", "Ask for approval", and "New conversation" / "New group" sit at y≈80–130, top-left, about 46px tall. "New checklist" floats mid-screen at y≈292–348. The same action ("New task") is at the bottom on Today and at the top on Work.
- WHY IT MATTERS: The top-left corner is the hardest place to reach one-handed on a 6.5" phone. The inconsistency breaks muscle memory in a daily-use app.
- SCREENSHOT/OBSERVATION: `owner-mobile-today.jpg` has New task at y 712–768. `owner-mobile-work.jpg` has New task at y 80–128, top-left. `owner-mobile-projects.jpg`, `owner-mobile-approvals.jpg` and `owner-mobile-conversations.jpg` have their create buttons at y≈62–155. `owner-mobile-checklists.jpg` has New checklist at y 292.
- PROPOSED FIX: One pattern: every list page's main create action is a full-width 56px sticky button above the nav, the same component as on Today. Secondary actions like "New group" and "Templates" can stay as small top buttons or go in a menu.

### Bottom nav shows no unread or pending badges
- PAGE: Global bottom nav
- PERSONA: Owner, employee
- PROBLEM: The Conversations tab has no badge even with "1 unread conversation". The More tab has no badge even though Updates has 7 (owner) or 8 (member) new items; the count only appears after opening More, or on the Today bell. The aria label of the whole nav is "More" (`navigation "More"`), which misnames the landmark for screen readers.
- WHY IT MATTERS: The bottom bar is where people look when they switch tasks. With no badge, unread chats and pending approvals or leave go unnoticed unless the user returns to Today.
- SCREENSHOT/OBSERVATION: `owner-mobile-conversations.jpg` has an unread "1" on Rahul's row but a plain Conversations tab. `owner-mobile-more.jpg` shows "Updates 7" inside the page, but the More tab icon has no dot on every other page. The aria files all show `navigation "More"`.
- PROPOSED FIX: Add a count badge to Conversations (unread threads). Add a dot to More when Updates, Approvals (owner: pending decisions) or leave requests need attention. Rename the landmark to "Main" / "Primary navigation".

### Important owner items are two taps deep in More, with no badges or back context
- PAGE: /more and all pages reached from it (Projects, Documents, Approvals, Team, Search, Updates, Daily routine, Settings)
- PERSONA: Owner, employee
- PROBLEM: Approvals (a decision queue), Search and Updates live only in More. Pages opened from More have no back arrow or "More ›" breadcrumb (Projects, Documents, Approvals, Staff, Search, Updates, Settings, Daily routine all start with a bare H1). Only the More tab is highlighted. More rows show no counts for Approvals. Staff don't see Team in More, yet /staff opens a full list for them.
- WHY IT MATTERS: The owner's pending approvals are hidden behind a generic "More" with no count, so decisions sit and staff wait. The lack of a back affordance makes budget-phone users rely on the Android back button and lose their place.
- SCREENSHOT/OBSERVATION: `owner-mobile-more.jpg` shows Projects, Documents, Approvals, Team / Search, Updates 7, Daily routine, Settings, and a count only on Updates. `owner-mobile-approvals.jpg`, `owner-mobile-search.jpg` and `owner-mobile-settings.jpg` have no back control. `member-mobile-more.jpg` has no Team row, but `member-mobile-team.jpg` renders.
- PROPOSED FIX: Show a pending count on the Approvals row and surface pending approvals on Today (see the P0 finding). Put a search icon in the header of Today, Conversations, Work and Documents. Add a small "‹ More" back link on More-child pages. Consider making the owner's 4th tab adapt: when approvals or leave are pending, show a "Needs you" entry point.

### Page names don't match the labels that lead to them
- PAGE: More → Team (/staff), Updates (/khabar), Today (member), Daily routine
- PERSONA: All, especially Hinglish/Hindi-first users
- PROBLEM: More says "Team" but the page title is "Staff". The bottom tab says "Today" but the member's page title is "My tasks". The Today header bell and More both lead to "Updates", but the bell has no text label. Settings repeats a "Daily routine" link that is already in More. Landing and marketing talk about "Conversations · People · Work · Progress".
- WHY IT MATTERS: Users with low tech confidence navigate by matching words. Mismatches make them think they tapped the wrong thing.
- SCREENSHOT/OBSERVATION: `owner-mobile-more.jpg` ("Team") vs `owner-mobile-team.jpg` (H1 "Staff"). `member-mobile-today.jpg` has H1 "My tasks" with the Today tab active. `owner-mobile-settings.jpg` has a "Daily routine" card duplicating More.
- PROPOSED FIX: Pick one term per destination and use it in the nav, the H1 and the notifications ("Team" everywhere, or "Staff" everywhere). Make the member Today H1 "Today" with "My tasks" as a section heading. Remove the duplicate Daily routine link from Settings.

### Staff can't punch in from Today
- PAGE: /aaj (member Today), /hazri
- PERSONA: Employee (and owner)
- PROBLEM: Punching in, the first thing staff do each day, lives only on the Attendance tab. There it's a 56px button at y≈182–238, in the top third. On Today, attendance is a small pill ("You have not punched in today" / "Punched in at 7:14 PM", about 38px tall) that only links to /hazri. On a member Today that is "all done", the first screen is mostly empty space.
- WHY IT MATTERS: The daily punch-in is the most frequent staff action. It should take one tap in the thumb zone, not a tab switch plus a reach to the top of the screen. Missed punches mean payroll disputes.
- SCREENSHOT/OBSERVATION: `member-mobile-today.jpg` has the punch pill at y 152–190 and nothing actionable below y≈340. `newowner-mobile-attendance-empty.jpg` and `owner-mobile-attendance.jpg` have Punch in at y 182–238.
- PROPOSED FIX: On Today, when not punched in (or punched in but not out), show a sticky 56px "Punch in" / "Punch out" button in the bottom slot, above the nav (staff; owners who track their own attendance get it too). On /hazri, move the Punch button into a sticky bottom position as well.

### Owner Attendance mixes personal punch-in, team admin and settings in one long page
- PAGE: /hazri (owner)
- PERSONA: Daily owner
- PROBLEM: One 1386px scroll holds, in order: my punch-in, my leave balance, holidays, this month, Team today, **Leave requests** (actionable), Leave balances with one-tap "+ Half" / "+ 1 day" buttons, and an add-holiday form. The actionable leave requests are below the fold under the team list. Names in Leave balances are truncated ("Priya Shar…", "Rahul V…"). The "+ Half" / "+ 1 day" buttons are about 38px tall, with no visible confirmation, and they change someone's balance.
- WHY IT MATTERS: With 10+ staff, "Team today" pushes leave approvals several screens down. A mis-tap on "+ 1 day" silently changes a leave balance, which is a money and trust issue. Truncated names make it easy to credit the wrong person.
- SCREENSHOT/OBSERVATION: `owner-mobile-attendance.jpg`: Team today at y≈648, Leave requests at y≈850, Leave balances at y≈935–1070 with truncated names, holiday form at y≈1170. The newowner empty version (`newowner-mobile-attendance-empty.jpg`) shows the same order.
- PROPOSED FIX: Split the page into segments: "Me" (punch + my leave) and "Team" (Pending requests first with a count, then Today's status). Move balance adjustments and holidays into a Settings → Leave screen. Make balance changes open a small sheet with a stepper and a "Save" confirm. Give names their own line.

### Template form: 13 fields before Save, then a blank preview
- PAGE: /documents/templates → Quotation form
- PERSONA: Owner (and staff, who can also reach it)
- PROBLEM: The mobile form is about 2200px long: Client name, address, Project (text), Date, Reference, Scope, Amount, GST %, Valid until, Payment terms, Notes, then **a second "Project" select**, then "Save as document". Below Save is a "Preview" box about 640px tall that is completely blank. So the preview comes after the commit and shows nothing. There's no sticky save or progress, and number fields don't show a ₹ prefix or numeric keyboard hint.
- WHY IT MATTERS: Creating a quotation on the go is a headline use case. Users will either save without ever seeing the document, or scroll a blank white rectangle and assume it's broken. The two "Project" fields cause confusion and mismatched data.
- SCREENSHOT/OBSERVATION: `owner-mobile-template-form.jpg` (780x4410 @2x): the first segment shows Project (text input) at y≈367. The second segment shows Notes, then Project (select "None") at y≈205, Save as document at y≈260–316, and the Preview frame at y≈368–1008, empty. `member-mobile-template-form.jpg` is identical.
- PROPOSED FIX: Break the form into 3 short steps (Client → Items & amount → Terms). Drop the duplicate Project text field and keep the select. Make the footer sticky with "Preview" (opens a full-screen rendered preview) and "Save". Use `inputmode="decimal"` with a ₹ prefix for Amount and GST. Don't render an empty preview frame on mobile.

### Conversation thread: composer squeezed above the global nav, and a thin header
- PAGE: /baat/:id
- PERSONA: Owner, employee
- PROBLEM: The bottom nav stays visible inside a chat, so the composer (y≈706–780) sits on top of it. About 140px of permanent chrome is at the bottom, and more once the keyboard opens. The header shows only the back button (about 44px) and the name "Site team mu5kz8y9": no member count, no linked project, no call button. The send button is a grey disabled square that looks the same as the attach area. There's no voice-note or camera shortcut, even though proof is often photos.
- WHY IT MATTERS: WhatsApp is the mental model: full-height thread, composer at the very bottom, mic and camera one tap away. Keeping the nav in threads leaves room for about 8 short messages on small phones and invites mis-taps on "Work" or "Attendance" while aiming for the composer.
- SCREENSHOT/OBSERVATION: `owner-mobile-conversation-thread.jpg` and `member-mobile-conversation-thread.jpg`: composer row at y≈706–780 directly above the nav at 780–844. The header has only the back arrow and title. Attach (paperclip, about 40px hit area) is at the far left.
- PROPOSED FIX: Hide the bottom nav on /baat/:id and pin the composer to the safe-area bottom (`env(safe-area-inset-bottom)`). Add camera and mic buttons, and turn send into a filled brand-colour button once there's text. Tapping the header should open members, linked project and "Tasks from this chat".

### Tap targets below 48px on frequent controls
- PAGE: Work filters, Documents chips, Documents/Project row icons, login consent, demo player, Attendance balance buttons
- PERSONA: Staff (≥56 primary) and owner (≥48)
- PROBLEM: Measured heights (CSS px) from the captures: Work filter chips Team/Mine/Open/Late/Done ≈34px; Documents category chips All/Quotation/Other ≈30px; document download and delete icons ≈32px wide, about 25px apart; the "Create task" link ≈20px; the login "I agree" checkbox ≈24px; the demo progress dots ≈8px; Attendance "+ Half" / "+ 1 day" ≈38px; the Settings business "Save" button ≈44px; "Mark all read" is text-only, ≈20px.
- WHY IT MATTERS: On a budget Android phone with a cracked screen protector, used one-handed on a site visit, 30px targets lead to mis-taps. With download right next to delete, a mis-tap can remove a client document.
- SCREENSHOT/OBSERVATION: `member-mobile-work.jpg` has chips at y 84–118. `owner-mobile-documents.jpg` has chips at y 297–325 and download/delete icons at x≈300/340. `visitor-mobile-login.jpg` has the checkbox at y 282–304. `visitor-mobile-demo.jpg` has dots in the floating bar at y≈800. `owner-mobile-notifications.jpg` has "Mark all read" at the top right.
- PROPOSED FIX: Set a minimum hit area token: 48px (owner) / 56px (staff primary), using padding if the visual stays small. Make chips 44px tall with 8px gaps. Move delete into a row overflow menu (or swipe) with an undo toast. Make the whole consent row tappable, or better, replace the checkbox with "By continuing you agree to…" text.

### Updates list: stale "needs approval" items and only the text is tappable
- PAGE: /khabar (Updates)
- PERSONA: Owner, employee
- PROBLEM: The owner still sees "7 new" including "Rahul Verma needs approval: Approve extra spend" and "…asked for leave", even though both approvals already show as decided on /approvals and Leave requests says "Nothing waiting". Each card is a tinted box, but per the aria only the inner sentence is a link, so taps on the date line or padding do nothing. All items look identical: no icon for approval, leave, task or message, and no grouping by today/earlier.
- WHY IT MATTERS: The owner taps an "action needed" update and finds nothing to do. Repeated a few times, that trains them to ignore Updates, including the real ones.
- SCREENSHOT/OBSERVATION: `owner-mobile-notifications.jpg` (7 identical lavender cards) vs `owner-mobile-approvals.jpg` (both Decided) and `owner-mobile-attendance.jpg` ("Nothing waiting."). The aria shows `paragraph > link` inside each listitem.
- PROPOSED FIX: Resolve or grey out notifications once the underlying item is actioned ("Approved by you"). Make the whole card the link, with a min height of 56px. Add a type icon and a "Today / Earlier" split. Replace the refresh icon with pull-to-refresh.

### New owner's first screen says "send new work" when there is nobody to send it to
- PAGE: /aaj (new owner, empty)
- PERSONA: New owner
- PROBLEM: A fresh workspace shows a 165px blue header with four zeros, a "You have not punched in today" pill, and "No work yet — Press below to send new work" with a sticky "New task" button. The workspace has 0 staff; the Staff page separately says "Invite your staff first, then send work." Setup (step 2 of 3, business details) doesn't lead into inviting staff. There's no checklist of first steps.
- WHY IT MATTERS: The new owner's first action on a phone will be New task → Who → an empty picker. The "aha" moment (staff sees the task, owner sees "Seen") needs an invited staff member first. That's the activation step, and mobile hides it inside More → Team.
- SCREENSHOT/OBSERVATION: `newowner-mobile-today-empty.jpg` / `newowner-mobile-setup.jpg` (both /aaj): zeros header, empty state, New task. `newowner-mobile-team-empty.jpg`: "No staff yet — Invite your staff first, then send work." `newowner-mobile-profile.jpg`: Step 2 of 3 business form.
- PROPOSED FIX: When staff count is 0, swap the Today empty state and the sticky CTA for "Invite your first staff member" (56px, WhatsApp share of the invite link), with a 3-item getting-started checklist (Invite staff → Send first task → See it verified). Hide the zero stats until there's data.

### Document upload makes you choose a category before choosing a file
- PAGE: /documents, task detail and project detail document sections
- PERSONA: Owner, employee
- PROBLEM: Upload appears as a native `<select>` defaulting to "Other", next to an "Upload" / "Attach a document" button. There are 12 categories in the select. Users skip the select, so everything lands as "Other". The documents list already shows chips "All / Quotation / Other" with most files "Other". List metadata truncates ("Priya Sharma · T…", "Thu, 17 …"), and the linked-task line truncates too.
- WHY IT MATTERS: The pattern is backwards for mobile (pick a file first, then label it). It crowds the row, and it's the direct cause of the project-detail overflow. Categories are what make documents findable later.
- SCREENSHOT/OBSERVATION: `owner-mobile-documents.jpg`: select "Other" at y 172–212 beside Upload. Rows truncate at x≈305. `member-mobile-task-detail.jpg` / `owner-mobile-task-detail.jpg`: "Other" select plus "Attach a document" in the documents card. `owner-mobile-project-detail.jpg`: same row overflowing.
- PROPOSED FIX: A single full-width "Upload / Photo" button. After picking a file, show a bottom sheet with the file name, category chips (Quotation, Invoice, Photo, Other…) suggested from the file name, and a link to a project or task, then Save. Show metadata on two lines instead of truncating.

### Invalid invite link is a dead end
- PAGE: /join/:token (invalid)
- PERSONA: Employee (first contact with the product)
- PROBLEM: The page shows only the logo and a pink box, "This link no longer works. Ask the owner for a new one." There's no button: no way to sign in (maybe they already joined), no way to go home, and no easy way to message the owner.
- WHY IT MATTERS: Staff arrive from a WhatsApp link, often an old one. A blank page with no action loses them; many won't know the owner's app flow for regenerating the link.
- SCREENSHOT/OBSERVATION: `visitor-mobile-join-invalid.jpg`: logo at y≈100, error at y 156–228, empty below.
- PROPOSED FIX: Add a 56px "I already have an account — Sign in" button and a secondary "Ask owner on WhatsApp" button that opens WhatsApp share with a prefilled "Please send me a new Waakya link" message. Add a friendly illustration and Hindi/Hinglish text via the language toggle that exists on the login page.

### Login on mobile: consent gate, no redirect context, and a buried staff hint
- PAGE: /login (and /aaj when signed out)
- PERSONA: Visitor, employee, returning owner
- PROBLEM: Before Google or Send code works, the user must tick a 24px checkbox ("I agree to Waakya's Privacy Policy"). Arriving from a protected page (/aaj → /login) gives no "Sign in to continue" message. The line that matters most for staff, "Staff need the link their owner sent", is 12px grey text at the very bottom (y≈815) under the language toggle.
- WHY IT MATTERS: Staff who open waakya.com directly will try to sign up with their own email and create an empty workspace, or get stuck. The tiny checkbox is a common "button doesn't work" complaint on mobile.
- SCREENSHOT/OBSERVATION: `visitor-mobile-login.jpg` and `visitor-mobile-guarded-today.jpg` are identical. The checkbox is at y 282–304. The staff hint is at y≈815 in 12px.
- PROPOSED FIX: Replace the checkbox with implicit consent text under the buttons, or make the whole 48px row the toggle. Add an "Are you staff? Open the link your owner sent on WhatsApp" card above the sign-in options, at 14–16px. Show "Please sign in to continue" when redirected. Move the language toggle to the top.

## P2

### Landing page on mobile: mock UI looks tappable, clipped step tabs, no persistent CTA
- PAGE: / (landing)
- PERSONA: Visitor
- PROBLEM: The page is 5235px long, and "Get started" appears only in the header, the hero (y≈370) and the very end. The hero mockup includes a realistic "Write a message" input and send button. Later mockups include a full-width "Verify completion" button and a "Request changes" link. All of these look real but are static. The "See the work move forward" tab strip is clipped at the left ("versation | Assign a task | Submit proof | V…") with no scroll hint. The hero keyword row "CONVERSATIONS PEOPLE WORK / PROGRESS" wraps with an orphan word. Footer links are about 20px tall.
- WHY IT MATTERS: Visitors on phones tap fake inputs and think the site is broken. The strongest storytelling section (4 steps) looks cut off. Mid-page there's no sign-up path.
- SCREENSHOT/OBSERVATION: `visitor-mobile-landing.jpg` (split): hero composer at y≈778–818. Tabs at y≈1590 show "versation" clipped. "Verify completion" button at y≈4035. Keyword row wraps at y≈457–480. The footer is at the bottom.
- PROPOSED FIX: Make the hero mockup inputs visually inert (no focus ring or caret, `pointer-events:none`, or a subtle "Preview" label). Scroll the active step tab into view with edge fades. Add a slim sticky "Get started" bar after the hero scrolls away. Drop or reflow the keyword row. Use 44px footer links.

### Demo page: floating player bar covers content and the dots are unusable
- PAGE: /demo
- PERSONA: Visitor
- PROBLEM: The floating player (prev, 11 progress dots, next, reset, fullscreen) sits over the story card at y≈778–822, covering "Rahul Sharma · Due today… Accepted 11:10 AM". The dots are about 8px targets. There are two CTAs, "See Waakya in action" and "Jump into the product", and the latter is a ghost button that is hard to see on dark.
- WHY IT MATTERS: The key "message becomes work" beat is hidden behind the controls on the first screen.
- SCREENSHOT/OBSERVATION: `visitor-mobile-demo.jpg`: player bar overlaps the "becomes work" card. The aria lists 11 "Go to …" buttons.
- PROPOSED FIX: Reserve bottom padding equal to the bar height plus safe area. Replace dots with a "3 / 11" label and swipe navigation. Make prev/next 48px.

### New task sheet wastes width on labels; time chips wrap
- PAGE: /naya (New task)
- PERSONA: Owner
- PROBLEM: Good overall: full-screen sheet, sticky Send, no bottom nav. But a fixed label column (Who / What / By when / Priority / Proof / Note) takes about 130px. The "What" placeholder wraps over 3 lines, and "Tomorrow morning 9:00 am" wraps inside its chip. "What", the most important field, isn't first or focused. There's no voice-input affordance for describing the task, even though the brand is "Bolo. Ho jayega."
- WHY IT MATTERS: Speed of sending a task is the core owner loop. Wrapping chips and a 3-line placeholder make the sheet feel cramped at 390px, and worse at 360px.
- SCREENSHOT/OBSERVATION: `owner-mobile-new-task.jpg`: label column x 16–130, What placeholder at y 168–240, "Tomorrow morning 9:00 am" chip on two lines at y 390–436, Send (disabled) at y 772–828.
- PROPOSED FIX: Stack labels above values on mobile. Put "What" first with autofocus and a mic button. Shorten chips to "1 hr · 5 pm today · Tomorrow 9 am · Pick…".

### Settings: small, oddly placed save buttons and a text-only Sign out
- PAGE: /settings
- PERSONA: Owner, employee
- PROBLEM: "Save name" is a full-width disabled grey block that looks like a divider. The business "Save" is a small 68x44px button at the left, below the fold and under the nav. "Sign out" is a 20px text link. Daily routine is duplicated here. The member version is fine but has the same button issues.
- WHY IT MATTERS: Minor, but owners editing GSTIN or address on a phone may not find Save and may leave without saving.
- SCREENSHOT/OBSERVATION: `owner-mobile-settings.jpg`: Save name at y 260–306 (disabled grey), business Save at y≈838–884, Sign out at y≈1150. `member-mobile-settings.jpg`: same.
- PROPOSED FIX: Auto-save fields with a "Saved" toast, or use one sticky "Save changes" button that appears only when something is dirty. Make Sign out a 48px row with an icon at the bottom of a list. Remove the duplicate Daily routine card.

### Member attendance history has no column headers
- PAGE: /hazri (member) "This month"
- PERSONA: Employee
- PROBLEM: Rows show "17 Sept 7:14 PM 7:14 PM 0m Present" and "24 Sept — — — Half day" with no In / Out / Worked headers. The leave history (Rejected / Approved) is mixed into the balance card with no reason shown for a rejection.
- WHY IT MATTERS: Staff check attendance to catch payroll mistakes. Unlabelled times are ambiguous, and a rejection with no reason leads to phone calls to the owner.
- SCREENSHOT/OBSERVATION: `member-mobile-attendance.jpg`: "This month" table at y 548–630 has no headers. "1 Oct 1 day Rejected" is at y≈363.
- PROPOSED FIX: Add small In / Out / Worked headers, or render each day as a card ("In 9:41 · Out 6:07 · 8h 26m"). Show the owner's note on rejected leave.

### Project detail activity log is long and repetitive
- PAGE: /projects/:id
- PERSONA: Owner, employee
- PROBLEM: Activity lists every task state change as a separate line ("moved … to created", "to delivered", "to acknowledged", "to accepted", "to in progress", "to done", "to verified"), and the full task name repeats each time. That's 9+ entries for one task, pushing the page to about 1200px. Internal state names ("delivered", "acknowledged") differ from the task stepper labels (Sent, Seen, Accepted…).
- WHY IT MATTERS: The log is noise on mobile, and the terms clash with the task screen.
- SCREENSHOT/OBSERVATION: `owner-mobile-project-detail.jpg` y≈600–1060. `member-mobile-project-detail.jpg` same, with long lines wrapping to 2 lines each.
- PROPOSED FIX: Collapse state changes per task ("Revised quotation · Verified by Priya · 6 steps"), expandable. Use the stepper vocabulary. Show the latest 5 with "Show all".

### Approval cards: long titles wrap next to the status pill; no pending-first view
- PAGE: /approvals
- PERSONA: Owner, employee
- PROBLEM: Titles like "Approve extra spend mu5kz8y9" wrap beside the "Rejected" pill. Meta lines wrap to 2–3 lines ("Requested by Rahul Verma · Thu, / 17 Sept 7:14 pm"). "Ask for approval" is a top-left outline button (≈46px). There are no Pending / Decided tabs, so on a busy account the pending ones will scroll off.
- WHY IT MATTERS: The owner's decision queue should read in one glance, with Approve/Reject reachable by thumb.
- SCREENSHOT/OBSERVATION: `owner-mobile-approvals.jpg` and `member-mobile-approvals.jpg`: cards at y 208–355 and 363–485 with wrapped title and meta.
- PROPOSED FIX: Put the status pill on its own line under the title and use relative dates ("Today 7:14 pm"). Add Pending (count) / Decided segments with Pending as the default. On pending cards, put 48px Approve / Reject buttons in the card footer.

## Mobile journey notes

**Visitor (phone, from a WhatsApp/Instagram link).** The landing hero is clear ("Every conversation. A clear next step.") and fits above the fold with both CTAs at y≈370–417. The illustrated mockups tell the story well at 390px and nothing overflows. Problems: fake inputs and buttons invite taps, the 4-step tab strip looks clipped, and there's no sign-up CTA for about 4500px between the hero and the footer. /demo is polished but the floating player hides the key "message becomes work" card. Login is clean, but the 24px consent checkbox gates both sign-in methods, and a staff visitor gets no prominent "use your owner's link" guidance. Privacy renders well (1152px, readable 15–16px text, back arrow).

**New owner.** Sign-in → Setup step 2 of 3 (business details: a clean single column with 48px inputs, full-width Continue, Skip) → Today. Today then shows four zeros and "Press below to send new work" even though there's nobody to send it to. The needed step (Invite staff) is two taps away (More → Team) and only there does the app say "Invite your staff first". Empty states elsewhere (Projects, Documents, Approvals, Conversations) are friendly and illustrated, but their create buttons sit top-left, while Today and Staff use a bottom sticky button. Attendance for a new owner opens with admin tools (leave balances, holiday form) before any staff exist.

**Daily owner.** Good: sticky 56px New task on Today, full-screen New task sheet with sticky Send, a 5-tab nav with clear icons and 11px labels (about 78x64px targets each), and bottom padding that keeps content clear of the fixed nav on long pages (Attendance and Templates end about 100px below the last control). Weak: mobile Today drops Late / Not seen and never shows pending approvals or leave, so the owner has to open More → Updates (7 new, some stale) or More → Approvals. No badges on the Conversations or More tabs. In threads, the owner can't turn their own message into a task. Task detail spends about 176px of fixed chrome on mostly disabled buttons. Project detail scrolls sideways. Quotation-from-template is a long form with a blank preview after Save.

**Employee (staff).** Arrives via invite link (a dead end if expired). Today ("My tasks") is calm and readable, but punching in needs a tab switch, and the main punch button sits in the top third. Work filters are 34px chips. Conversations are WhatsApp-like, but the nav stays under the composer and "Create task" is a 20px text link. On task detail, the sticky footer slot holds only a caption; for active tasks the Accept / Done / Proof actions should be a 56px thumb-zone button there (active-task state wasn't in the captures and should be re-captured to confirm). Attendance history lacks column labels. More correctly hides Team and Daily routine for staff, and Settings is short and clear.
