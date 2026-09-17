# Agent D: marketing and copy audit, waakya.com (logged out)

Audited on 2026-09-17 with Playwright at 1440x900 and 390x844. I did not sign in, tick consent boxes or submit forms.
Pages: `/` (every section, the nav anchors, all 4 walkthrough tabs plus "Next step", "See how it works" and "Get started"), `/login`, `/demo` (all 11 slides, "Start your pilot", "Jump into the product"), `/privacy`. I also checked `robots.txt`, `sitemap.xml`, `manifest.webmanifest` and the head tags with curl.
Screenshots are in `/Users/chitranshu/Desktop/waakya/.playwright-mcp/`:
`D-desktop-hero.png`, `D-desktop-landing-full.jpg`, `D-desktop-walkthrough-2-assign.png`, `D-desktop-walkthrough-3-proof.png`, `D-desktop-walkthrough-4-verify.png`, `D-desktop-nav-for-businesses.png`, `D-desktop-login.png`, `D-desktop-demo-full.jpg`, `D-desktop-demo-slide4-home.png`, `D-desktop-demo-slide11-close.png`, `D-desktop-privacy.png`, `D-mobile-hero.png`, `D-mobile-landing-full.jpg`, `D-mobile-walkthrough-tabs.png`, `D-mobile-demo.png`, `D-mobile-login.png`.
Earlier captures are in `/private/tmp/wk-build/docs/audit/before/visitor-*.jpg|.aria.txt`.

---

## P0

### The homepage never states the required positioning, but the hidden /demo page does
- PAGE: `/` (hero, H1, title tag). Compare with `/demo` slide 1.
- PERSONA: A first-time visitor, such as the owner of a 15-person interiors firm arriving from a referral link.
- PROBLEM: The founder's positioning lines, "The new era of business communication." and "All your business work. One workspace.", do not appear anywhere on the public homepage. They appear only on `/demo`, which is `noindex, nofollow` and not linked from the site. The homepage leads with a generic line that could belong to any chat or task tool. So the strategic story is locked inside a sales-meeting deck, while the page the public actually sees says something weaker.
- WHY IT MATTERS: This fails the 5-second test. The hero words are "conversation" and "next step", so a visitor reads Waakya as another messaging app or to-do tool. They do not see a single workspace that runs the business. The phrase meant to set the category, "new era of business communication", is lost.
- SCREENSHOT/OBSERVATION: `D-desktop-hero.png`, `D-mobile-hero.png`: H1 "Every conversation. A clear next step." Subhead: "Bring your team's conversations and everyday work together. From the first message to the final review." Eyebrow labels: "CONVERSATIONS PEOPLE WORK PROGRESS". Title tag: "Waakya — Every conversation. A clear next step. · Waakya". Compare `D-desktop-demo-full.jpg`: "The new era of business communication." / "All your business work. One workspace."
- PROPOSED FIX: Replace the hero.
  - Eyebrow: "THE NEW ERA OF BUSINESS COMMUNICATION"
  - H1: "All your business work. One workspace."
  - Subhead: "Your team talks all day. Waakya turns what gets agreed into work with an owner, a deadline, proof that it was done, and a record your business keeps."
  - Loop strip directly under the CTAs: "Talk → Assign → Execute → Prove"
  - Title tag: "Waakya: All your business work. One workspace."
  - Remove the "CONVERSATIONS PEOPLE WORK PROGRESS" eyebrow row. It is decoration that does not explain anything.

### Phase-1 capabilities are missing or mentioned only in passing: Projects, Templates, Leave, Holidays, Team, Search, Notifications
- PAGE: `/`
- PERSONA: An SMB owner deciding whether Waakya can replace their current mix of WhatsApp groups, Excel sheets, a leave register and Drive.
- PROBLEM: The homepage names only Conversations, Work/tasks, Documents, Attendance and Approvals, and mostly inside mock UI. Leave appears only as a status chip ("On leave", "Leave approved · Neha"). The page never names or shows Projects, Business Templates, Holidays, Team management, Search or Notifications. There is also no section showing how the modules connect: attendance next to a task, a template producing a document inside a project, an approval closing the work. The "ONE WORKSPACE" section is a 2x2 grid of four unrelated mini-cards.
- WHY IT MATTERS: The main value of Phase 1 is the ecosystem: one place for work, people and paperwork. A visitor who sees only chat plus tasks will compare Waakya with free tools and leave. Owners who mainly care about attendance, leave and paperwork get no reason to sign up.
- SCREENSHOT/OBSERVATION: `D-desktop-landing-full.jpg`: "Conversations, tasks, documents, attendance and approvals stay together, so nobody has to ask where anything is." The meta description lists "tasks, proof, documents, attendance and approvals". The page text contains no "project", "template", "holiday", "search" or "notification".
- PROPOSED FIX: Add a section called "One business, one workspace". Show a single business (UrbanNest Interiors) in one connected illustration, and label each connection:
  - Conversations → a Task
  - The Task belongs to a Project
  - The Project holds Documents made from Business Templates (Quotation, Work order, Delivery challan)
  - The Task needs an Approval
  - Team shows who is In, On leave, or off on a Holiday today
  - Notifications tell the right person what needs them
  - Search finds anything
  
  Put a short line under the visual:
  - "Conversations and Work: every agreement gets an owner and a due time."
  - "Projects: every client job in one place."
  - "Documents and Templates: quotations, work orders and challans, ready to fill."
  - "Attendance, Leave and Holidays: who is in today, without a register."
  - "Approvals: decide once, and keep the decision with the work."
  - "Team, Search and Notifications: everyone and everything, findable."

### /demo is publicly reachable and shows internal sales-script text and a placeholder
- PAGE: `/demo` slide 11 ("Close"), slide 1
- PERSONA: A prospect who was sent the link, or who opens it after a sales visit.
- PROBLEM: The close slide shows a placeholder meant for staff: "Add your name and contact details in the file this card comes from, before the visit." Its buttons read "Reset for the next meeting" and "Start your pilot". "Start your pilot" is a button with no destination: clicking it only resets the deck to slide 1. It does not open /login or a contact form. The page has no way back to the homepage and no sign-in.
- WHY IT MATTERS: Anyone who sees this learns that the page is an unfinished internal sales tool. The main CTA looks broken, and a prospect who is ready to start has nowhere to go.
- SCREENSHOT/OBSERVATION: `D-desktop-demo-slide11-close.png`: "Your business already runs on conversations. / Now let those conversations run the work." Buttons: "Start your pilot", "Reset for the next meeting". Footer text: "Add your name and contact details in the file this card comes from, before the visit." Clicking "Start your pilot" leaves the URL at `/demo` and returns to slide 1.
- PROPOSED FIX: Remove the placeholder. Either put a real contact card there ("Talk to us: hello@waakya.com") or hide the card when no contact is configured. Make "Start your pilot" a link to `/login?intent=create` labelled "Set up your business, free". Show "Reset for the next meeting" only in presenter mode, for example behind `?presenter=1`. Add a small "waakya.com" home link in the deck chrome.

### /demo contradicts the scope rules: client workspaces, clients as participants, invoices sent to clients
- PAGE: `/demo` slides 2, 4, 6, 10, 11
- PERSONA: A prospect who watched the demo in a meeting and then signs up expecting to see the same things.
- PROBLEM: The demo presents cross-business and client-facing features that are out of Phase 1 (no B2B or cross-business, no CRM). It also uses nav names that do not match the homepage.
- WHY IT MATTERS: The demo promises a client portal and cross-company workflow that the product does not have. After sign-up that becomes a trust problem and a support burden. The inconsistent labels (Messages vs Conversations, Tasks vs Work, People vs Team) also make the two pages feel like different products.
- SCREENSHOT/OBSERVATION: `D-desktop-demo-slide4-home.png`: "CLIENT WORKSPACES: Greenwood Builders, Skyline Developers, Mr. & Mrs. Nair", "1 Client response", "Priya Kapoor sent Invoice INV-2291 to Greenwood Builders", conversation "Greenwood Builders: Rohan: Please send the revised BOQ", "Rohan Kapoor approved Greenwood BOQ v4". Slide 6: "Send to the client workspace once approved internally." Slide 2: "Has the client approved it?" Slide 10: "Team / Clients / Communication…". Slide 11: "Keep client work in one place". Demo sidebar: "Home, Messages, Tasks, Projects, Documents, Approvals, People". Homepage mock: "Today, Conversations, Work, Documents, Attendance".
- PROPOSED FIX: Replace "Client workspaces" with "Projects" (Greenwood Residence, Tower B; Skyline Apartment, Sector 76; Oakwood Villa) with open-task counts. Make every approver and message sender an internal team member, for example "Rohan (Site lead) approved BOQ v4". Change the activity line to "Priya created Invoice INV-2291 for Greenwood Residence". Change "Send to the client workspace" to "Share with the client once approved internally". Change "Keep client work in one place" to "Keep every project in one place". Use the same nav names everywhere: Today, Conversations, Work, Projects, Documents, Approvals, Team (plus Attendance and Leave). Add the missing Attendance, Leave and Holidays slide to the demo.

### "Get started" leads to a bare "Sign in" page with no sign-up context, price or next step
- PAGE: `/` (all 3 "Get started" CTAs) → `/login`
- PERSONA: A new owner who wants to create a business account.
- PROBLEM: All three "Get started" buttons and "Sign in" go to the same `/login` page. That page's H1 is "Sign in". Nothing tells a new visitor that this is also where they create an account, what happens after sign-in (create a business, invite the team), whether it is free, or how long setup takes. The only line for staff is a sentence fragment: "Staff need the link their owner sent". The homepage never mentions price or a free plan either.
- WHY IT MATTERS: An owner who clicked "Get started" and lands on "Sign in" assumes they need an existing account and leaves. Indian SMB owners are price-sensitive, so with no word about free or paid, many will not hand over their Google account.
- SCREENSHOT/OBSERVATION: `D-desktop-login.png`, `D-mobile-login.png`: "Sign in / With Google, or with a code by email. / I agree to Waakya's Privacy Policy. / Continue with Google / or with email / Send code / … Staff need the link their owner sent".
- PROPOSED FIX: On `/login`:
  - H1: "Start with Waakya"
  - Subhead: "New or returning, use Google or get a 6-digit code by email. No password needed."
  - Below the buttons, add 3 steps: "1. Sign in → 2. Name your business → 3. Invite your team with a link".
  - Staff line: "Joining your team? Open the invite link your owner shared with you."
  
  On the homepage, next to the hero CTA, add microcopy: "Free to start · Set up in 2 minutes · Works in your browser". Only claim "free" if that is true; otherwise say "Free during early access". Rename the header CTA to "Start free", or "Set up your business".

### Privacy policy mentions "voice notes" and misses DPDP essentials
- PAGE: `/privacy`
- PERSONA: A cautious owner, or an employee whose attendance and leave will be tracked.
- PROBLEM: (a) The policy lists "voice notes" as proof, which implies a voice feature that Waakya must not claim. (b) It does not mention the data that Phase 1 actually collects: attendance times, leave records, holidays, documents and templates, and Google sign-in profile data. (c) It names no legal entity, grievance officer or address, which DPDP 2023 notices need. (d) The only way out of the page is a back arrow that goes to `/login`, even for visitors who came from the homepage footer.
- WHY IT MATTERS: Employees whose attendance is tracked are exactly the people who read privacy notices. The "voice" wording is a claim the brief does not allow, and the missing sections weaken credibility with the owners buying the product.
- SCREENSHOT/OBSERVATION: `D-desktop-privacy.png`: "Proof: the photos, voice notes or text you send." "What we keep" lists only name/email/phone, business name, work and proof. The only link on the page is `/login`. The meta description is Hinglish: "Kaam bhejo, dekha jaaye, ho jaaye…".
- PROPOSED FIX: Change the proof line to "Proof: the photos, files or notes you attach." Add "Attendance and leave: check-in and check-out times, leave requests and approvals, holiday calendar." Add "Documents you create or upload, including from templates." Add "If you sign in with Google: your name, email and profile photo." Add a "Grievance officer / Contact" block with the legal entity name and a postal address. Send the back arrow to `/`, and add a header link to Waakya home. Set an English meta description.

## P1

### "Product" nav link goes back to the hero, and mobile has no nav at all
- PAGE: `/` header
- PERSONA: A visitor who wants to scan what the product includes.
- PROBLEM: "Product" links to `#product`, which is the hero section itself, so clicking it just scrolls to the top. There is no product or capabilities section. On 390px the nav links are hidden and no menu replaces them. Only "Sign in" and "Get started" are visible.
- WHY IT MATTERS: The nav promises a product overview that does not exist. On mobile, where most Indian SMB owners will arrive, visitors cannot jump to "How it works" or "For businesses".
- SCREENSHOT/OBSERVATION: `#product` = the SECTION starting "Every conversation. A clear next step." `D-mobile-hero.png`: visible header items are "Waakya, Sign in, Get started".
- PROPOSED FIX: Point "Product" at the new "One business, one workspace" section described in P0. Rename the nav to "How it works · Everything inside · Who it's for · FAQ". Add a mobile menu button, or a horizontal scroll of those anchor chips under the header.

### The four walkthrough tabs are clipped on mobile, and "Next step" on the last tab loops back without saying so
- PAGE: `/` "See the work move forward" section
- PERSONA: A mobile visitor.
- PROBLEM: At 390px the tab list is 403px wide inside a 358px container. The labels render as "versation" and a cut-off "V", with no scroll hint. On desktop, "Next step" on tab 04/04 silently jumps back to tab 1 instead of ending with a CTA. The tab header says "Kitchen quotation", but the notes describe an office ("Workstations, two variants", "Conference room"), and the hero says "Office renovation".
- WHY IT MATTERS: This walkthrough is the only place on the page that tells the TALK → ASSIGN → EXECUTE → PROVE story. Clipped labels and a pointless loop weaken it, and the kitchen/office mismatch looks careless.
- SCREENSHOT/OBSERVATION: `D-mobile-walkthrough-tabs.png` (tab text "versation … Assign a task … Submit proof … V"). `D-desktop-walkthrough-4-verify.png`: "04 / 04 … Next step", followed by a return to "Conversation". "UrbanNest Interiors · Kitchen quotation" alongside "Workstations, two variants / Conference room".
- PROPOSED FIX: Number the tabs and use the loop words: "1 Talk · 2 Assign · 3 Execute · 4 Prove". On mobile, use a 2x2 grid or a scroll-snap row with a fade. On step 4, replace "Next step" with "Start free →" and a short "Replay" link. Make the example consistent: "Office renovation · Revised quotation" everywhere.

### Hero mock hides the document name, and the four headings repeat the same idea
- PAGE: `/` hero mock, H2s
- PERSONA: A visitor skimming the page.
- PROBLEM: In the hero's "Linked work" card the "Awaiting approval" badge covers the file name. The card reads "PDF · 1.8 MB" with "Quotation v2" not visible. The headings are all variations on one theme: "A clear next step" / "See the work move forward" / "One place to move work forward" / "Less chasing. More moving forward" / footer "Conversations to progress" / "Conversations into progress for growing businesses" / "Ideas to progress together". "Move forward" or "progress" appears 7 times.
- WHY IT MATTERS: Repeating the same abstract phrase uses up space that should name concrete outcomes and modules. Nothing on the page says "attendance", "leave" or "quotation template" as a benefit.
- SCREENSHOT/OBSERVATION: `D-desktop-hero.png` (the badge overlapping "PDF · 1.8 MB"). Full text of `D-desktop-landing-full.jpg` as quoted above.
- PROPOSED FIX: Fix the badge layout so the file name "Quotation-v2.pdf" shows. Give each section heading its own concrete job (see the narrative below). Remove the handwritten "Ideas to progress together." Change the footer tagline to "All your business work. One workspace."

### The login page brand line and metadata are Hinglish, and "Bolo. Ho jayega." suggests voice
- PAGE: `/login`, `/privacy`, `manifest.webmanifest`, default meta
- PERSONA: An English-reading visitor; also the search and share preview.
- PROBLEM: The site is English, but the login logo carries "Bolo. Ho jayega." ("Just say it, it'll get done"). The meta description on `/login` and `/privacy` is "Kaam bhejo, dekha jaaye, ho jaaye. Har kaam ka deadline, acknowledgement aur record." The manifest has `lang: hi-IN` and `description: "Bolo. Ho jayega."`. The server fallback title is "Waakya — Bolo. Ho jayega." The login page also offers हिंदी/Hinglish/English switching that the marketing site does not. "Bolo" (speak) also hints at voice commands, which Waakya must not claim.
- WHY IT MATTERS: The brand voice is inconsistent between marketing and product. Link previews and search snippets show a line that does not match the positioning, and "Bolo" suggests a voice feature.
- SCREENSHOT/OBSERVATION: `D-desktop-login.png` (logo lockup "Waakya / Bolo. Ho jayega."). The curl of `/robots.txt` (404 page) shows the fallback `<title>Waakya — Bolo. Ho jayega.</title>`. Manifest `"description": "Bolo. Ho jayega."`.
- PROPOSED FIX: Use the plain "Waakya" wordmark on /login. Set the default description to "All your business work. One workspace. Conversations, work, projects, documents, attendance, leave and approvals for growing Indian businesses." Set the manifest `description` to the same line and `lang` to `en-IN`. Keep the in-app language switcher, but do not use Hinglish in metadata.

### No pricing, FAQ or credibility signals
- PAGE: `/`
- PERSONA: An owner comparing Waakya with WhatsApp plus Excel, which cost nothing.
- PROBLEM: The page has no pricing or "free" statement, no FAQ, no customer logos or quotes, no "Made in India" or data-location statement, no contact email, no company name and no terms link. "Sample business data" is the only trust signal.
- WHY IT MATTERS: SMB owners need answers to "Is it free? Does my staff need to install an app? Does it work on phones? Where is my data? Who is behind this?" before they give sign-in access.
- SCREENSHOT/OBSERVATION: `D-desktop-landing-full.jpg`. Footer: "Waakya · Conversations to progress. · Product · How it works · For businesses · Privacy · Sign in".
- PROPOSED FIX: Add an FAQ section above the final CTA (copy is in the narrative below). Add a trust row: "Built in India · Data protected under India's DPDP Act · Works on any phone browser · No app to install". Footer: company legal name, city, hello@waakya.com, Privacy, Terms, and "© 2026".

### Use-case section is generic and does not connect to the modules
- PAGE: `/` "Made for the way your business works."
- PERSONA: An agency owner or a facilities contractor.
- PROBLEM: Each audience gets one vague line: "Coordinate everyday field and office work." / "Manage conversations, deliverables and approvals." / "Keep teams, documents and work organised." There is no example scenario, and nothing ties an audience to specific modules such as site attendance, work orders or client approvals.
- WHY IT MATTERS: The visitor cannot picture their own day in Waakya.
- SCREENSHOT/OBSERVATION: `D-desktop-nav-for-businesses.png`.
- PROPOSED FIX: Turn each into a mini story built on the loop, for example:
  - **Service teams:** "Site supervisor marks attendance → gets 'Measure Tower B' in the project chat → uploads site photos as proof → you verify from the office."
  - **Agencies:** "Client feedback discussed in the team conversation → designer assigned the revision → final file submitted → account lead approves."
  - **Small businesses:** "Dispatch agreed in chat → delivery challan from a template → signed copy attached → record kept against the order."

### SEO basics are missing
- PAGE: site-wide
- PERSONA: A search engine, or a WhatsApp or LinkedIn link preview.
- PROBLEM: `/robots.txt` and `/sitemap.xml` return 404. There are no Open Graph or Twitter tags, no canonical and no JSON-LD. The title template doubles the brand: "Waakya — Every conversation. A clear next step. · Waakya". The page `<title>` on /login is "Login · Waakya", while its H1 says "Sign in".
- WHY IT MATTERS: Links shared on WhatsApp, which is how Indian SMB owners share things, show no image or positioning. Search ranking suffers.
- SCREENSHOT/OBSERVATION: curl results: robots 404, sitemap 404, 0 `ld+json`, no `og:` tags.
- PROPOSED FIX: Title "Waakya: All your business work. One workspace." Description (155 chars): "The new era of business communication. Conversations, tasks, projects, documents, attendance, leave and approvals in one workspace for Indian teams." Add og:title, og:description and og:image (a 1200x630 image of the loop), twitter:card, canonical, robots.txt allowing `/` and disallowing app routes, a sitemap, and `SoftwareApplication` JSON-LD.

## P2

### Jargon and tone
- PAGE: `/`, `/demo`
- PERSONA: A non-technical SMB owner.
- PROBLEM: Abstract phrases such as "Linked work", "Clear closure", "Conversations into progress", "Communication is the entry point, not the product", and "are the same object, seen from different sides" (demo slide 3) read like internal strategy language.
- WHY IT MATTERS: Owners respond to concrete, everyday outcomes like "Who is late today?" or "Did the quotation go?"
- SCREENSHOT/OBSERVATION: `D-desktop-demo-full.jpg`, demo slide 3 text.
- PROPOSED FIX: "Linked work" → "Tasks from this chat". "CLEAR CLOSURE" → "PROOF, NOT PROMISES". Remove "same object, seen from different sides". Use "Every task shows the chat it came from, the file it produced and who approved it."

### "In messages and on calls" can suggest call capture
- PAGE: `/demo` slide 1 and slide 2 ("Calls: Agreed on a call")
- PERSONA: A prospect.
- PROBLEM: "Your team already agrees things all day, in messages and on calls. Waakya keeps what was agreed…" can be read as Waakya recording or capturing calls, which is voice and out of scope.
- WHY IT MATTERS: It sets an expectation that the product cannot meet.
- SCREENSHOT/OBSERVATION: `D-mobile-demo.png`.
- PROPOSED FIX: "Your team agrees things all day, in chats, calls and meetings. In Waakya, write it down once and it becomes work with an owner, a deadline and proof."

### Mobile hero eyebrow wraps, and the loop strip loses its arrows
- PAGE: `/` at 390px
- PERSONA: A mobile visitor.
- PROBLEM: "CONVERSATIONS PEOPLE WORK" wraps with "PROGRESS" alone on the next line. The Talk/Assign/Execute/Prove strip stacks vertically without arrows, so the sequence is lost.
- WHY IT MATTERS: The main TALK → ASSIGN → EXECUTE → PROVE story is weakest on the most common device.
- SCREENSHOT/OBSERVATION: `D-mobile-hero.png`, `D-mobile-landing-full.jpg`.
- PROPOSED FIX: Remove the eyebrow row. Render the loop as a single horizontal line: "Talk → Assign → Execute → Prove", with a down-arrow connector per step when stacked.

### Final CTA band and footer
- PAGE: `/` bottom
- PERSONA: A visitor who scrolled the whole page and is nearly convinced.
- PROBLEM: "Less chasing. More moving forward." / "Conversations into progress for growing businesses." does not restate the offer or say what happens next. The footer repeats the nav and adds no company information.
- WHY IT MATTERS: The final CTA is the last chance to convert.
- SCREENSHOT/OBSERVATION: `D-desktop-nav-for-businesses.png`.
- PROPOSED FIX: Headline "Bring your business into one workspace." Subhead "Sign in with Google or email, name your business, and invite your team with a link. Free to start." Button "Set up your business". Secondary link "Already on Waakya? Sign in".

---

## Proposed website narrative

The page follows CONVERSATION → COMMITMENT → EXECUTION → PROOF → RECORD, then shows the full ecosystem, then gives visitors what they need to act. It uses one example business throughout (UrbanNest Interiors, Office renovation project), in English, with Indian names and ₹.

**0. Header**
- Contents: Logo · How it works · Everything inside · Who it's for · FAQ · Sign in · **Start free** (primary).
- Mobile: a menu button plus the primary CTA.

**1. Hero**
- Eyebrow: THE NEW ERA OF BUSINESS COMMUNICATION
- Headline: **All your business work. One workspace.**
- Subhead: Your team talks all day. Waakya turns what gets agreed into work with an owner, a deadline, proof it was done, and a record your business keeps.
- CTAs: "Start free" · "See how it works"
- Microcopy: Sign in with Google or email · No app to install · Built for Indian teams
- Visual: One app frame with the sidebar Today / Conversations / Work / Projects / Documents / Approvals / Attendance / Team. The centre shows a chat message; a task card pops out of it; a PDF proof attaches with a "Verified" stamp. Under the frame is the loop strip: **Talk → Assign → Execute → Prove**.

**2. The problem**
- Headline: **Your business talks everywhere. Where is the work?**
- Subhead: Instructions are lost in chats, trackers in Excel, files in Drive, leave in a register. When you ask "Who is doing this? Is it done? Where is the file?", the answer is on someone's phone.
- Visual: Scattered tiles, "Chat: 'send it by 5'", "tracker_final_v6.xlsx", "Leave register", "Quotation_v2 (1).pdf", fading into question bubbles.

**3. How it works: the loop** (tabs 1–4, with step 5 as an end state)
- Headline: **From conversation to record, in four steps.**
- Subhead: One quotation, from the first message to a verified record.
- Tabs and visual (the same frame animates between them):
  1. **Talk:** "Agree it in the team conversation." Priya: "Rahul, send the revised quotation by 5 PM."
  2. **Assign:** "Turn the message into a task, with an owner and a due time." Task card: Rahul · Today 5 PM · Accepted 11:33.
  3. **Execute and Prove:** "Do the work, attach the proof." Quotation-v2.pdf submitted 4:40 PM.
  4. **Verify:** "Check it and close it." Verified by Priya 4:52 PM.
  - End state, **Record:** a timeline showing Created → Seen → Accepted → Proof submitted → Verified, with the line "Every step is stamped automatically. Nobody updates a status."
- End CTA: "Start free →" · "Replay"

**4. Everything inside, working together** (the ecosystem section, anchor for "Everything inside")
- Headline: **One business. One connected workspace.**
- Subhead: Every part of Waakya knows about the others, so a task knows its project, its documents, its approver and who is in today.
- Visual: A single connected diagram centred on the "Office renovation" project, with labelled links:
  - **Conversations** → create **Work / Tasks**
  - Tasks belong to a **Project**
  - The Project holds **Documents** made from **Business Templates** (Quotation, Work order, Delivery challan, Meeting minutes)
  - Tasks and documents go to **Approvals**
  - **Team** shows roles; **Attendance** shows who is in; **Leave** and **Holidays** show who is away, so you don't assign work to someone on leave
  - **Notifications** alert the right person; **Search** finds any message, task or file
- Tiles below, one line each:
  - Conversations: talk as a team, by project.
  - Work: every agreement gets an owner, a due time and proof.
  - Projects: every job, its tasks and files in one place.
  - Documents and Templates: quotations, work orders and challans in minutes.
  - Approvals: decide once; the decision stays with the work.
  - Attendance: check-in and check-out, without a register.
  - Leave and Holidays: request, approve and plan around them.
  - Team: invite with a link; roles for owner, manager and staff.
  - Search: find any chat, task or file.
  - Notifications: know what needs you, not everything.

**5. Your day in Waakya** (the owner's Today view)
- Headline: **Open Waakya. See what needs you.**
- Subhead: Overdue work, approvals waiting, who is in today, all on one screen.
- Visual: A Today screen with "2 overdue · 2 approvals waiting · 12 of 14 in today · Neha on leave · Holiday Friday: Diwali", plus a recent-activity list.

**6. Proof, not promises**
- Headline: **Done means you can see it.**
- Subhead: Tasks close with a photo, file or note, and you verify or send them back. The record stays with your business even when people change.
- Visual: A proof card (site photo + PDF) with "Verify completion" and "Request changes", and the activity timeline beside it.

**7. Who it's for** (a mini story per audience, each following the loop)
- Headline: **Made for teams that get real work done.**
- **Service teams** (interiors, construction, facilities): "Supervisor checks in at site → gets 'Measure Tower B' → uploads photos → you verify from the office."
- **Agencies** (design, marketing, events): "Client feedback agreed in team chat → designer assigned the revision → final file submitted → lead approves."
- **Small businesses** (professional services, distribution, retail): "Dispatch agreed → challan from a template → signed copy attached → record kept."
- Visual: A small illustrated strip per card, showing its four steps.

**8. Trust row**
- Headline: none (a quiet band).
- Items: Built in India · Protected under India's DPDP Act 2023 · Works in any browser, on phone or laptop · Your data is only visible to your business.

**9. FAQ**
- Headline: **Questions owners ask.**
- Is Waakya free? *(Use the real answer, e.g. "Free to start during early access.")*
- How do I sign up? "Click Start free, continue with Google or get a code by email, name your business, then share an invite link with your team."
- Does my staff need to install an app? "No. Waakya works in the phone browser. They open the link you send."
- Can I track attendance and leave? "Yes. Check-in and check-out, leave requests, approvals and your holiday list are built in."
- Does it replace our chat groups? "It keeps your team's work conversations next to the tasks, files and approvals they create."
- Who can see our data? "Only people you invite to your business."
- *(Do not mention AI, voice, WhatsApp integration, payroll, payments, CRM or client portals.)*

**10. Final CTA**
- Headline: **Bring your business into one workspace.**
- Subhead: Sign in with Google or email, name your business, invite your team. It takes about two minutes.
- CTA: "Set up your business" · "Already using Waakya? Sign in"
- Visual: The loop strip again, Talk → Assign → Execute → Prove → Record, ending in a check mark.

**11. Footer**
- Tagline: "Waakya · The new era of business communication."
- Links: How it works · Everything inside · Who it's for · FAQ · Privacy · Terms · Sign in
- Company: legal name · city, India · hello@waakya.com · © 2026

**Supporting pages**
- `/login`: H1 "Start with Waakya", subhead "New or returning, use Google or a 6-digit email code. No password.", then 3 steps, and "Joining your team? Open the invite link your owner shared."
- `/demo`: Make it match the homepage's module names. Remove the client workspaces, the placeholder and presenter-only buttons. Add an Attendance/Leave/Holidays slide. The final CTA links to `/login`.
- `/privacy`: Cover the actual Phase-1 data. Remove voice notes. Add a grievance contact and a home link.
