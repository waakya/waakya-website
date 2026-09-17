# Agent A: Business Owner Positioning Audit

Lens: owner of a 15-person interiors / facility-services firm in India who has never heard of Waakya. Evidence: `/private/tmp/wk-build/docs/audit/before/` (production captures, 2026-09-17) plus `landing-fold-desktop.jpg`.

## P0

### The landing page does not carry the required positioning at all
- PAGE: `/` desktop + mobile
- PERSONA: visitor
- PROBLEM: The H1 is "Every conversation. A clear next step." and the sub is "Bring your team's conversations and everyday work together. From the first message to the final review." Neither "The new era of business communication." nor "All your business work. One workspace." appears anywhere on `/` (checked the aria snapshot, 0 hits). The only place with that positioning is `/demo`, and the landing page never links to it.
- WHY IT MATTERS: In the first 10 seconds I read this as "a team chat app that turns messages into to-dos", like a Slack/Asana hybrid. I do not see it as the one place that runs my business day (attendance, leave, approvals, documents). The strategic message is sitting on a page visitors never reach.
- SCREENSHOT/OBSERVATION: `landing-fold-desktop.jpg` shows the fold with H1 "Every conversation. A clear next step." and eyebrow chips "CONVERSATIONS PEOPLE WORK PROGRESS". `visitor-desktop-demo.jpg` shows H1 "The new era of business communication." and sub "All your business work. One workspace." `visitor-desktop-landing.aria.txt` has no link to `/demo`.
- PROPOSED FIX: Make the hero H1 "The new era of business communication." with the H2 "All your business work. One workspace." Use the demo's body line as the support copy: "Your team agrees things all day, in messages and on calls. Waakya keeps what was agreed, who owns it, when it is due, and the proof it was done." Change the secondary CTA from "See how it works" (#how anchor) to "See Waakya in action" and point it at `/demo`.

### The hero mock sells only chat plus a task; the "one workspace" ecosystem is not visible above the fold
- PAGE: `/` desktop, first viewport
- PERSONA: visitor
- PROBLEM: The hero product frame shows a single chat thread, a "Revised quotation" task and a PDF. Its sidebar lists only Today, Conversations, Work, Documents and Attendance. Projects, Approvals, Team, Leave/Holidays, Templates, Search and Notifications are missing. The 4 eyebrow words "CONVERSATIONS PEOPLE WORK PROGRESS" are abstract and don't name anything I recognise.
- WHY IT MATTERS: My 3 daily headaches are "who came to site today", "where is that BOQ" and "what is waiting for my OK". None of them shows in the first viewport, so the product looks like a task/proof tool and I would compare it to free WhatsApp plus Google Sheets.
- SCREENSHOT/OBSERVATION: `landing-fold-desktop.jpg`: the sidebar mock has 5 items. The eyebrow row reads "CONVERSATIONS  PEOPLE  WORK  PROGRESS". The ecosystem grid (Conversations/Work/Attendance/Approvals) only appears in the third section, around 1,400 px down in `visitor-desktop-landing.jpg`.
- PROPOSED FIX: Replace the hero mock with an owner "Today" view showing 4 connected tiles: "In today 11/14 · 2 on leave", "Waiting for your OK: 3 (vendor quote, leave, extra spend)", "Due today: 6 tasks · 1 late" and "Latest document: BOQ-v3.pdf · Office fit-out". Draw a thin connector so it reads as one system. Replace the eyebrow row with plain owner outcomes: "Less chasing · Know who is in · Find any document · Decide faster".

### The owner's Today screen hides the decisions, attendance and documents the landing page promised
- PAGE: `/aaj` desktop + mobile
- PERSONA: owner
- PROBLEM: Today shows 6 task counters (Sent/Seen/Done/Verified/Late/Not seen), an "unread conversation" chip, a punch-in nag, a project link and a task table. It shows no pending approvals, no leave requests, nothing on who is present or absent (the "Staff today" card shows task counts "Rahul Verma 1 task 1/1", not attendance), and no recent documents.
- WHY IT MATTERS: The landing page says "Conversations, tasks, documents, attendance and approvals stay together". After sign-in, my home screen is a task tracker. The "what needs my decision" and "who is in" promises are not delivered where I look first, so I would stop trusting the pitch within a day.
- SCREENSHOT/OBSERVATION: `owner-desktop-today.jpg`: counters "1 Sent / 1 Seen / 1 Done / 1 Verified / 0 Late / 0 Not seen", chips "1 unread conversation" and "You have not punched in today", the "Staff today" card with "Rahul Verma 1 task 1/1", and "This week 100% on time". `owner-mobile-today.jpg` is the same, with no approvals or attendance.
- PROPOSED FIX: Restructure Today into 4 owner blocks in priority order. (1) "Needs your decision": pending approvals and leave requests with inline Approve/Reject. (2) "Team today": In / Late / On leave / Not in, with names. (3) "Work due today", with late items first. (4) "Recent documents and conversations". Collapse the 6 counters into one line ("6 due · 1 late · 3 waiting verification"). Rename the "Staff today" card to "Who's in today" and show attendance, not tasks.

### The empty state for a new owner gives no path to a working business
- PAGE: `/aaj` desktop (new owner, empty)
- PERSONA: new owner
- PROBLEM: A brand-new owner lands on a wall of zeros ("0 Sent … 0 Not seen"), "This week — on time", "Staff today Nobody" and "No work yet / Press below to send new work." There is nothing below it (the "New task" button is at the top right), and nothing tells me to invite staff first. The Team page itself says "Invite your staff first, then send work."
- WHY IT MATTERS: The first session decides whether I keep the product. I can't assign a task to anyone because I have no staff yet, the copy points to a button that doesn't exist below, and there is no checklist showing how conversations, attendance, documents and approvals fit together. Most owners would close the tab here.
- SCREENSHOT/OBSERVATION: `newowner-desktop-today-empty.jpg` shows six "0" tiles, "This week" with a dash before "on time", "Staff today / Nobody", and "No work yet / Press below to send new work." `newowner-desktop-team-empty.jpg` shows "No staff yet / Invite your staff first, then send work."
- PROPOSED FIX: Replace the zero tiles for empty businesses with a "Set up Mehta Facility Services in 5 steps" checklist: 1) Invite your team (share link) 2) Start your first conversation 3) Turn a message into a task 4) Upload a document or pick a template (Quotation) 5) Set holidays and leave. Tick each step as it's done. Fix the copy to "Use New task above" or remove the directional word.

### Test-data suffix "mu5kz8y9" appears across every owner screen
- PAGE: `/aaj`, `/projects`, `/documents`, `/approvals`, `/hazri` desktop + mobile
- PERSONA: owner
- PROBLEM: Every seeded record carries a random string: "Revised quotation mu5kz8y9", "Office fit-out mu5kz8y9", "Quotation - Client mu5kz8y9.html", "photos-mu5kz8y9.pdf", "Approve vendor mu5kz8y9", "Founders Day mu5kz8y9". File sizes are "45 B".
- WHY IT MATTERS: If this is what I see in a demo or a sales walkthrough, it looks broken and unfinished. A 45-byte PDF and a quotation saved as ".html" undercut the "where documents are" promise.
- SCREENSHOT/OBSERVATION: `owner-desktop-documents.jpg` lists "Quotation - Client mu5kz8y9.html · 3 KB", "photos-mu5kz8y9.pdf · 45 B" and "boq-mu5kz8y9.pdf · 45 B". `owner-desktop-approvals.jpg` has "Approve extra spend mu5kz8y9". `owner-mobile-today.jpg` has "Revised quotation mu5kz8y9".
- PROPOSED FIX: Seed the demo/audit business with realistic Indian SMB data and no run IDs (keep run IDs in metadata, not names). For example: project "Kapoor residence – 3BHK interiors, Gurugram"; documents "BOQ_Kapoor_3BHK_v2.pdf · 1.4 MB" and "Site photos – living room.jpg"; approvals "Vendor quote: Greenply laminates ₹1,84,000" and "Extra spend: false ceiling change"; holiday "Diwali – 20 Oct".

## P1

### No pricing, no "free to start" and no next-step clarity anywhere on the public site
- PAGE: `/` desktop + mobile, `/login`
- PERSONA: visitor
- PROBLEM: The navigation has only Product / How it works / For businesses. Neither the landing nor the login page mentions cost, a trial, team size limits or what happens after "Get started". Both "Get started" and "Sign in" go to the same `/login`.
- WHY IT MATTERS: An Indian SMB owner's first question is "kitna lagega?" (how much?). With no answer, I assume a hidden per-user fee and don't sign up, or I keep WhatsApp.
- SCREENSHOT/OBSERVATION: `visitor-desktop-landing.aria.txt`: nav links "Product", "How it works", "For businesses", and "Get started" → `/login` 3 times. `visitor-desktop-login.jpg` shows only "Sign in / With Google, or with a code by email."
- PROPOSED FIX: Add a "Pricing" nav item and a short section before the final CTA: "Free while you set up your team. Simple monthly price per business, not per message" (use whatever the real terms are). Under each Get started button add microcopy: "Create your business in 2 minutes · Invite your team with a link". Point "Get started" at a sign-up-framed page titled "Create your business account", not "Sign in".

### No trust signals for a product that will hold staff data, GSTIN and client documents
- PAGE: `/` desktop + mobile, `/login`, `/setup/profile`
- PERSONA: visitor / new owner
- PROBLEM: There is no company identity, no "Made in India" or data-location statement, no security note, no testimonials or logos, no contact or support channel. The footer has only Product / How it works / For businesses / Privacy / Sign in. The profile step then asks for GSTIN, address, phone and email with no reason given beyond documents.
- WHY IT MATTERS: I am being asked to put my team's attendance, leave and client quotations into an unknown app. Without a who-we-are, where data lives or who to call, I won't upload a BOQ.
- SCREENSHOT/OBSERVATION: `visitor-desktop-landing.jpg` footer: "Waakya  Conversations to progress.  Product  How it works  For businesses  Privacy  Sign in". `newowner-desktop-profile.jpg` fields: "Business address, GSTIN, Business phone, Business email".
- PROPOSED FIX: Add a trust strip above the footer: "Built in India for Indian teams · Your data stored in India (Mumbai) · Only your team can see your business · Support: WhatsApp/phone/email" (use real facts only). Add Contact and Terms links in the footer. On the profile step, add helper text next to GSTIN: "Optional. Printed on your quotations. Never shared."

### "Talk → Assign → Execute → Prove" stops short of the Record the story needs, and the landing has no Record/Proof visual
- PAGE: `/` desktop + mobile
- PERSONA: visitor
- PROBLEM: The loop strip shows Talk / Assign / Execute / Prove, and "Prove" is subtitled "Keep a clear record". The full story (Conversation → Commitment → Execution → Proof → Record) is never shown. The walkthrough section is titled "See the work move forward." with tabs "Conversation / Assign a task / Submit proof / Verify". Its first tab shows "Linked work: Nothing yet", which is an empty state as the first impression.
- WHY IT MATTERS: The unique idea, that an agreement said in a chat becomes an owned, dated, proven, searchable record, is what separates Waakya from WhatsApp. Here it reads as a generic 4-step task flow.
- SCREENSHOT/OBSERVATION: `landing-fold-desktop.jpg` loop strip: "Talk Bring your team together → Assign Turn messages into work → Execute Get work done → Prove Keep a clear record". `visitor-desktop-landing.jpg` walkthrough: "Nothing yet. Any message can become a task."
- PROPOSED FIX: Keep the 4-verb customer loop but add a one-line story above it: "A message becomes a commitment. The commitment gets done. Proof is attached. The record stays, forever searchable." Add a 5th tab, "Record", to the walkthrough showing the finished item with its timeline ("Asked 11:24 · Accepted 11:26 · Proof 3:44 · Verified by Priya 4:02"). Start the walkthrough on a message that already has a linked task, not an empty panel.

### The ecosystem section shows 4 of the 12 Phase-1 parts and never explains how they connect
- PAGE: `/` desktop + mobile, section "Your team. One place to move work forward."
- PERSONA: visitor
- PROBLEM: The grid shows Conversations, Work, Attendance and Approvals as 4 separate window cards. Projects, Documents (only a PDF chip), Business Templates, Leave, Holidays, Team, Search and Notifications are not shown. There is no line showing that, for example, a leave approval updates attendance or a project holds its documents.
- WHY IT MATTERS: With no connections drawn, it reads as either a partial product or a wall of feature cards. The "works together" message, the reason to replace 4 apps, is lost.
- SCREENSHOT/OBSERVATION: `visitor-desktop-landing.jpg` shows 4 cards: "Conversations (Vikram: Site photos from Sector 76 are up)", "Work (Upload site photos · Verified)", "Attendance (Rahul Sharma In · 9:41 AM, Neha Verma On leave)" and "Approvals (Vendor comparison · Pending, Leave approved · Neha)". `visitor-mobile-landing.jpg` stacks the same 4 cards vertically with no connection.
- PROPOSED FIX: Build a single "project hub" visual centred on one project, "Kapoor 3BHK". Around it show its conversation, tasks, documents (BOQ from a Quotation template), approvals (vendor quote), and the team with attendance/leave. Draw short captions on the links: "Neha's leave approved → marked On leave in Attendance", "Site photos in chat → attached as proof → saved in Documents", "Search 'BOQ' finds it in chat, task and documents". List all 12 parts as small labels, not cards.

### Names in the landing mocks change between sections, so the "sample business" doesn't feel real
- PAGE: `/` desktop + mobile
- PERSONA: visitor
- PROBLEM: The hero uses "Priya" / "Rahul" at "UrbanNest Interiors". The walkthrough uses "Priya Singh" / "Rahul Sharma". The ecosystem grid uses "Priya Kapoor", "Neha Verma" and "Vikram". The demo uses "AM" and "Rahul Sharma". The product seed uses "Priya Sharma" / "Rahul Verma".
- WHY IT MATTERS: The story sells one team moving one job forward. Rotating surnames make it read like stock filler and weaken the "one record" idea.
- SCREENSHOT/OBSERVATION: `visitor-desktop-landing.aria.txt` has "Priya 11:24 AM", then "Priya Singh 11:24 AM", then "Priya Kapoor 9:32 – 6:07 PM", plus "Rahul Sharma In · 9:41 AM". `owner-desktop-today.jpg` has "Priya Sharma", "Rahul Verma".
- PROPOSED FIX: Use one cast and one business across the landing, the demo and the seeded product: UrbanNest Interiors, owner Priya Sharma, site lead Rahul Verma, designer Neha, supervisor Vikram. Use the same quotation job in every section so the reader follows one piece of work from Talk to Record.

### The first-run setup is inconsistent and the first screen looks broken
- PAGE: `/setup` → `/setup/profile` desktop
- PERSONA: new owner
- PROBLEM: `/setup` stretches the form edge to edge (the input and "Create business" button span the full 1440 px width, left-aligned), with no wordmark and no step indicator. `/setup/profile` is a centred 420 px card with "Step 2 of 3", a logo and an illustration. Step 1 asks for "Staff language" before I know what staff will see. The profile subtitle mentions "invoices", which is not a Phase-1 capability.
- WHY IT MATTERS: The very first logged-in screen looks unstyled, which hurts credibility at the moment of commitment. Promising invoices sets up a scope expectation the product can't meet.
- SCREENSHOT/OBSERVATION: `newowner-desktop-setup.jpg` shows "Create your business / Enter the name. You can invite staff afterwards.", a full-width input "For example: Rakesh Properties", "Staff language हिंदी Hinglish English", and a full-width "Create business". `newowner-desktop-profile.jpg` shows "Step 2 of 3 / Tell us about your business / These details fill your quotations, invoices and other documents."
- PROPOSED FIX: Apply the centred card layout from `/setup/profile` to `/setup`, with the wordmark and "Step 1 of 3". Add helper text under Staff language: "What your team sees in Waakya. You can change it later." Change the profile subtitle to "Printed on quotations and other documents you create from templates." Name step 3 up front: "Step 3: Invite your team".

### Attendance leads with the owner's own punch-in, while the team view and leave approvals are buried
- PAGE: `/hazri` desktop
- PERSONA: owner
- PROBLEM: The top card is "TODAY / You have not punched in today / Punch in", followed by the owner's own "Leave balance 0 days" and "This month: Nothing recorded". "Team today", "Leave requests", "Leave balances" and "Holidays" sit below the fold (the page is 1,281 px tall). The seeded row "Rahul Verma 7:14 PM – 7:14 PM · 0m · Done" looks like an error.
- WHY IT MATTERS: As an owner I open Attendance to see who is in and who asked for leave, not to punch myself in. The "know who is in" promise needs scrolling, and "0m Done" makes me doubt the data.
- SCREENSHOT/OBSERVATION: `owner-desktop-attendance.jpg`: the top block has "Punch in" and "Leave balance 0 days". Lower down: "Team today: Priya Sharma Not punched in; Rahul Verma 7:14 PM – 7:14 PM · 0m Done", "Leave requests: Nothing waiting.", "Leave balances … + Half  + 1 day", and "Holidays 8 Oct Founders Day mu5kz8y9".
- PROPOSED FIX: For owners, order the page as: 1) a "Team today" summary ("In 9 · Late 2 · On leave 1 · Not in 2") with the name list, 2) "Leave requests (Approve/Reject)", 3) Holidays, 4) Leave balances. Then "My attendance" as a compact card or a header button. Seed a realistic shift (9:32 AM – 6:07 PM · 8h 35m). Label the "+ Half / + 1 day" buttons as "Add leave balance".

### Navigation names hide the Phase-1 features and don't match the landing language
- PAGE: sidebar on `/aaj`, `/more` desktop + mobile
- PERSONA: owner / new owner
- PROBLEM: The sidebar has "Updates" (not Notifications) and "Daily routine" (not mentioned anywhere on the landing). Leave, Holidays and Business Templates have no entry: Templates is a button inside Documents, and Leave/Holidays are sections inside Attendance. On desktop, `/more` repeats the sidebar exactly.
- WHY IT MATTERS: The features I was sold ("leave", "holidays", "templates", "notifications") are hard to find, so the product feels smaller than the pitch. A duplicate "More" page on desktop feels unfinished.
- SCREENSHOT/OBSERVATION: `owner-desktop-more.jpg` shows "Projects, Documents, Approvals, Team / Search, Updates 7, Daily routine, Settings", the same as the sidebar beside it. `owner-desktop-documents.jpg` has a "Templates" button at the top right. `owner-mobile-today.jpg` bottom bar: "Today, Conversations, Work, Attendance, More".
- PROPOSED FIX: Rename "Updates" to "Notifications". Rename "Attendance" to "Attendance & Leave" and add Holidays as a visible tab inside it. Add "Templates" under Documents in the sidebar as a sub-item. Either explain "Daily routine" on the landing ("Daily checklists for opening, site safety…") or move it under Work. Redirect `/more` to `/aaj` on desktop.

### Approvals shows only decided history, with no way to see what is waiting
- PAGE: `/approvals` desktop
- PERSONA: owner
- PROBLEM: The page shows "Ask for approval" and "Decided 2" (Rejected / Approved). There is no "Waiting for you" section, even an empty one, so I can't tell whether nothing is pending or the list is broken. There are no amounts, attachments or linked project on the cards.
- WHY IT MATTERS: "What needs my decision" is the owner's single highest-value view. A money approval without an amount or quote attached is not something I would act on.
- SCREENSHOT/OBSERVATION: `owner-desktop-approvals.jpg`: "Approvals / Decisions that hold work up, kept next to the work.", "Decided 2", "Approve extra spend mu5kz8y9 · Requested by Rahul Verma · Thu, 17 Sept 7:14 pm · Decided by Priya Sharma … Rejected".
- PROPOSED FIX: Always render "Waiting for you (0) – You're all caught up" above "Decided". On each card show the linked project/task, the attached document chip and the key figure ("₹42,500 · Vendor quote – Greenply.pdf"). Show the same "Waiting for you" count on Today and as a sidebar badge.

## P2

### The landing hero mock has a broken document chip
- PAGE: `/` desktop, hero
- PERSONA: visitor
- PROBLEM: In the hero's "Linked work" column, the document card wraps "PDF · 1.8 MB" onto 4 lines and the "Awaiting approval" badge overflows past the card edge. The filename "Quotation v2" is hidden on desktop (it shows on mobile).
- WHY IT MATTERS: A layout glitch in the first viewport of a product about "clear records" looks careless.
- SCREENSHOT/OBSERVATION: `landing-fold-desktop.jpg`, right column: "PDF / · / 1.8 / MB" stacked, with the "Awaiting approval" pill spilling past the card border. `visitor-mobile-landing.jpg` renders "Quotation v2 · PDF · 1.8 MB · Awaiting approval" correctly.
- PROPOSED FIX: Widen the linked-work column or put the badge on its own row under the filename. Always show the filename.

### Tagline and language signals are split between Hindi-flavoured and neutral English
- PAGE: `/login`, `/` footer, app routes
- PERSONA: visitor / owner
- PROBLEM: The login page shows the tagline "Bolo. Ho jayega." and a हिंदी/Hinglish/English switcher, but the landing is English-only with the footer tagline "Conversations to progress." and no language switch. The login footer "Staff need the link their owner sent" is grammatically awkward. App URLs are Hindi (`/aaj`, `/baat`, `/hazri`, `/khabar`) while the labels are English.
- WHY IT MATTERS: Hindi/Hinglish support is a real differentiator for Indian field teams, but a visitor never learns about it before sign-in. Mixed taglines weaken brand recall.
- SCREENSHOT/OBSERVATION: `visitor-desktop-login.jpg` shows "Bolo. Ho jayega.", "हिंदी Hinglish English" and "Staff need the link their owner sent". `visitor-desktop-landing.jpg` footer: "Conversations to progress."
- PROPOSED FIX: Add a landing proof point: "Your team can use Waakya in English, Hinglish or हिंदी". Pick one tagline system (e.g. the English positioning with "Bolo. Ho jayega." as the sign-off) and use it in both places. Change the login note to "Team member? Open the invite link your owner shared."

### The "For businesses" section is generic and lacks specific outcomes
- PAGE: `/` desktop + mobile, "Made for the way your business works."
- PERSONA: visitor
- PROBLEM: The three columns (Service teams / Agencies / Small businesses) use generic lines such as "Keep teams, documents and work organised." with examples like "distribution, retail". There are no concrete before/after statements for my type of business.
- WHY IT MATTERS: I scan for "is this for an interiors firm like mine". Generic lines don't give me a reason to believe.
- SCREENSHOT/OBSERVATION: `visitor-desktop-landing.jpg`: "Service teams · Coordinate everyday field and office work. e.g. Interiors, construction, facilities", "Small businesses · Keep teams, documents and work organised."
- PROPOSED FIX: Give each column one concrete owner scenario. Interiors: "Site supervisor posts photos → task marked done with proof → BOQ and quotation in the project." Facility services: "See which of your 20 staff reached site by 9:30 and who is on leave." Agencies: "Client feedback in a conversation becomes a deliverable with an approval."

### The final CTA line is vague
- PAGE: `/` desktop + mobile, closing band
- PERSONA: visitor
- PROBLEM: "Less chasing. More moving forward." is followed by "Conversations into progress for growing businesses." and a single "Get started", with no reassurance on effort or cost.
- WHY IT MATTERS: The last push before signup should remove friction ("how long, how much, what do I need").
- SCREENSHOT/OBSERVATION: `visitor-desktop-landing.jpg` bottom band: "Less chasing. More moving forward. / Conversations into progress for growing businesses. / Get started".
- PROPOSED FIX: Change the copy to "All your business work. One workspace." with the sub "Create your business, invite your team with a link, and assign the first task today." Pair the primary "Create your business" button with a secondary "See Waakya in action" linking to `/demo`.

## Owner verdict
Within 10 seconds I'd think Waakya is a team chat that turns messages into tasks with proof. That's neat, but I wouldn't call it "the new era of business communication" or "all my business work in one workspace". That stronger story exists only on `/demo`, which the landing never links to. Without pricing, a trial statement or trust signals (who you are, where my data lives, how to reach support), I would not sign up today. If I did, the empty Today screen of zeros and the full-width setup form would make me doubt it. In the populated product, test IDs ("mu5kz8y9") and 45-byte PDFs make it look like staging. Today is still a task counter rather than my morning view of who is in, what needs my approval and where the latest documents are. The parts (attendance, leave, holidays, approvals, documents, templates) all exist, so the fix is positioning and hierarchy, not new features: bring the demo's message onto the landing, show one connected business story, and rebuild Today around the owner's decisions and attendance.
