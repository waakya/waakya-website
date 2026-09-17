# Waakya — Business, UX and Visual Audit

**Audited:** 17 Sep 2026, production https://waakya.com (deployment `waakya-bj3ni5c5u`, commit `3032dcf`).
**Method:** seven specialist audits run from the real production site:

| Agent | Scope | Evidence |
|---|---|---|
| A | Business-owner positioning | Screenshots + accessibility snapshots |
| B | Product UX / journeys | Screenshots + accessibility snapshots |
| C | Visual design | Screenshots |
| D | Marketing / copy | Live Playwright MCP session on the logged-out site (desktop + 390px) |
| E | Mobile (390px) | Screenshots + accessibility snapshots |
| F | Browser quality | Live Chrome DevTools MCP: performance traces, Lighthouse, console, network, headers |
| G | Feature discoverability | Accessibility snapshots, capability matrix |

**Evidence set (`docs/audit/before/`):** 100 production captures: 4 personas × desktop 1440px and mobile 390px × every Phase-1 screen. Each capture has a full-page screenshot (`.jpg`), an accessibility snapshot (`.aria.txt`) and runtime data (`index.json`).

**Personas:**
- **Visitor:** logged out.
- **New owner:** Anil Mehta, a brand-new empty business.
- **Owner:** Priya Sharma, *Sharma Interiors*, a populated business.
- **Member:** Rahul Verma, staff.

The populated business was created on production through the app itself: invite and join, a conversation turned into a task, photo proof and verify, a project, documents, a template, attendance, leave and approvals.

**Per-agent reports:** `docs/audit/findings/A–G`. They hold the full observations, pixel measurements and replacement copy.

## How findings were verified

Every finding below was checked against the screenshots, the accessibility snapshots or live browser behaviour before being accepted. Where evidence conflicted, screenshots and real browser behaviour beat automated checks.

**The overflow detector was wrong, and is fixed.**
- **What it missed:** the automated check (`scrollWidth − innerWidth`) reported 0 px overflow on every capture. The mobile agent noticed the project-detail screenshots were **453 px** (owner) and **413 px** (member) wide on a 390 px viewport.
- **Why:** with mobile emulation the layout viewport grows to fit the overflow, so `innerWidth` also became 453 / 413.
- **Fix:** the check now measures against the real device width and the widest element edge (`e2e/support/overflow.ts`).
- **Proof:** re-run against production, it fails with **+64 px** (owner) and **+24 px** (member).
- **Where it runs now:** the local phone-fit test (both roles, every Phase-1 screen and detail page), the production smoke suite and the audit capture.

### Findings not adopted (and why)

| Finding | Agent | Decision |
|---|---|---|
| "mu5kz8y9" suffixes, 45-byte PDFs, red-square proof photo | A, C | Test-data artefacts from the audit seed, not product issues |
| "Invoices aren't Phase 1" | A | Incorrect: Invoice is one of the ten Phase-1 business templates |
| Voice / mic buttons on New task and threads | E | Voice is outside Phase 1 (scope freeze) |
| Replace the navy desktop sidebar with an ivory one | C | Deep navy is part of the approved palette and the design spec. Kept, but the rest of the shell is made consistent |
| Baloo 2 for every product H1 | C | The approved system reserves Baloo 2 for expressive/display moments. Product UI stays Inter |
| Remove the owner counters | C | The counters are a designed element. Kept, but mobile now shows the exceptions (Late, Not seen) the owner needs |
| Rename Hinglish URLs (`/aaj`, `/baat`, `/kaam`, `/hazri`, `/khabar`) | B, G | Route rename with redirects is an architectural change touching every link and test. Deferred (P2) |
| Merge leave into the Approvals table; auto-resolve notification rows after a decision | B | Needs backend/schema changes. Contextual links and pending counts were added instead |
| Custom select / date-picker component library | C | A large component rewrite. Native controls were restyled to the system instead |
| Line items in the quotation template, "Save & send in conversation" | B | New functionality. Out of scope for this phase |
| WhatsApp share buttons | E | Not claimed or integrated in Phase 1 |
| Content-Security-Policy | F | Needs a nonce strategy with Next.js scripts. The other headers are added; CSP is deferred |

---

## P0 — blocks understanding, sign-up or core use

### P0-1 The homepage does not carry the positioning
- PAGE: `/` (hero, title, meta), desktop + mobile
- PERSONA: Visitor
- PROBLEM:
  - The founder's positioning, *"The new era of business communication."* and *"All your business work. One workspace."*, appears only on `/demo`, which is `noindex` and not linked from the site.
  - The homepage H1 is "Every conversation. A clear next step.", which reads as a chat or to-do tool.
- WHY IT MATTERS: The 5-second test fails. A visitor compares Waakya with free chat apps and leaves before learning that it runs the whole business.
- SCREENSHOT/OBSERVATION: `before/visitor-desktop-landing.jpg`, `.playwright-mcp/landing-fold-desktop.jpg`. Title: "Waakya — Every conversation. A clear next step. · Waakya". The positioning lines are found only in `before/visitor-desktop-demo.jpg`. (A, D)
- PROPOSED FIX:
  - Eyebrow "THE NEW ERA OF BUSINESS COMMUNICATION".
  - H1 "All your business work. One workspace."
  - A subhead naming the chain.
  - A first-viewport product frame that shows the connected workspace, not just a chat.
  - The title, description, OG tags and manifest follow the same positioning.

### P0-2 The Phase-1 ecosystem is invisible on the website
- PAGE: `/`
- PERSONA: Visitor, prospective owner
- PROBLEM:
  - The page never names Projects, Business Templates, Holidays, Team, Search or Notifications. Leave appears only as a status label.
  - The "one workspace" section is four unconnected window cards.
  - Nothing shows how the parts work together, or the story Conversation → Commitment → Execution → Proof → Record.
- WHY IT MATTERS: The value of Phase 1 is one connected workspace. Owners who mainly care about attendance, leave or paperwork get no reason to sign up.
- SCREENSHOT/OBSERVATION: `before/visitor-desktop-landing.aria.txt` contains no "project", "template", "holiday", "search" or "notification". (A, D, G)
- PROPOSED FIX:
  - A dedicated story section with five connected stages (Conversation, Commitment, Execution, Proof, Record), each showing the real capability that carries it.
  - A connected "one workspace" map that places all twelve capabilities around one project in one business, not a feature grid.
  - Owner-day, use-case, FAQ and trust sections.

### P0-3 `/demo` looks like another product and exposes internal sales material
- PAGE: `/demo`, desktop + mobile
- PERSONA: Visitor, prospect after a sales meeting
- PROBLEM:
  - It uses a dark indigo background with a purple glow, a grid and glassy pills, a different brand from the ivory site and product.
  - The closing slide shows a staff placeholder ("Add your name and contact details in the file this card comes from, before the visit.") and a "Reset for the next meeting" button.
  - "Start your pilot" just returns to slide 1.
  - It presents client workspaces and sending invoices to clients, which is B2B and outside Phase 1.
  - A floating player covers content on mobile.
- WHY IT MATTERS: It breaks brand continuity, leaks unfinished internal material, promises features the product doesn't have, and its main CTA looks broken.
- SCREENSHOT/OBSERVATION: `before/visitor-desktop-demo.jpg`, `before/visitor-mobile-demo.jpg`, `.playwright-mcp/D-desktop-demo-slide11-close.png`, `D-desktop-demo-slide4-home.png` ("CLIENT WORKSPACES: Greenwood Builders…"). (C, D, E)
- PROPOSED FIX:
  - Re-skin to the ivory, navy and royal system.
  - Replace client workspaces with Projects and internal team members.
  - Remove the placeholder and presenter-only controls.
  - Make the final CTA link to sign-up.
  - Keep the player bar out of the content area.

### P0-4 Message → Task, the signature interaction, is hidden and one-sided
- PAGE: `/baat/:id`, `/kaam/:id`, desktop + mobile
- PERSONA: Owner, member
- PROBLEM:
  - The only control is a ~20 px "Create task" text link under *other people's* messages. The owner cannot turn their own instruction into a task.
  - The resulting task never shows which conversation it came from.
- WHY IT MATTERS: This is the Conversation → Commitment step the whole product is built on. Hidden, it breaks the chain before it starts.
- SCREENSHOT/OBSERVATION: `before/owner-desktop-conversation-thread.aria.txt` (no task control on the owner's own message); `before/member-mobile-conversation-thread.jpg` (text link ~20 px tall); `before/owner-desktop-task-detail.jpg` (no source link). (B, E, G)
- PROPOSED FIX:
  - A clearly visible "Make task" action on every message, including your own, sized to at least 40 px.
  - The linked-work state shown on the message.
  - "From conversation" with the quoted message and a link on task detail.

### P0-5 A verified task still counts down and offers "Change time"
- PAGE: `/kaam/:id`, desktop + mobile
- PERSONA: Owner, member
- PROBLEM: A task at "Verified" still shows "22 h 42 min left", "reminder tomorrow 8:00 am", SLA bars and an enabled "Change time". On mobile, three disabled tiles sit in the thumb zone.
- WHY IT MATTERS: Proof → Record is where trust is built. A closed record that still looks due makes owners doubt the whole lifecycle.
- SCREENSHOT/OBSERVATION: `before/owner-desktop-task-detail.jpg`, `before/member-desktop-task-detail.jpg`, `before/owner-mobile-task-detail.jpg`. (B, E)
- PROPOSED FIX:
  - On Done, Verified and Cancelled, replace the deadline band with a record band ("Verified · 7:14 pm").
  - Hide the clocks and reminder, and don't compute the next reminder.
  - Offer only the actions that still apply.
  - Make the Verified stepper node green.

### P0-6 Mobile task and conversation screens stack two fixed bars over content
- PAGE: `/kaam/:id`, `/baat/:id` at 390px
- PERSONA: Owner, member
- PROBLEM:
  - The task action tray (~110 px) sits on top of the bottom nav (64 px). Together they cover about 176 px and overlap the proof photo.
  - The chat composer also sits on top of the nav.
- WHY IT MATTERS: Field staff and owners use phones. Proof, the most important evidence, gets covered, and the thumb zone fills with navigation instead of the task.
- SCREENSHOT/OBSERVATION: `before/owner-mobile-task-detail.jpg` (tray y≈668–780 over "Proof"), `before/owner-mobile-conversation-thread.jpg` (composer y≈706–780 above nav). (C, E, B)
- PROPOSED FIX:
  - Hide the bottom nav on detail screens (task, thread), which already have a back arrow.
  - Pin one action region to the safe-area bottom, with matching content padding.
  - A read-only closed task gets no fixed bar.

### P0-7 Project detail overflows a 390px phone
- PAGE: `/projects/:id` at 390px
- PERSONA: Owner, member
- PROBLEM: The page is 453 px (owner) and 413 px (member) wide. The document upload row and the controls run past the edge.
- WHY IT MATTERS: The whole page slides sideways on a phone, and delete/download icons can end up off-screen next to each other.
- SCREENSHOT/OBSERVATION: `before/owner-mobile-project-detail.jpg` (453 px wide), `before/member-mobile-project-detail.jpg` (413 px). Production probe with the fixed detector: +64 / +24 px. (E)
- PROPOSED FIX:
  - Make the uploader row wrap and stack at narrow widths.
  - Allow long names to shrink (`min-w-0`).
  - Let the control selects wrap.
  - Protect with the fixed overflow test on every detail page.

### P0-8 Business setup is a stretched, unintentional layout on desktop
- PAGE: `/setup` at 1440px
- PERSONA: New owner
- PROBLEM: "Business name" and "Create business" stretch about 1,400 px edge to edge under a left-aligned heading, with no structure or brand.
- WHY IT MATTERS: It is the first product screen after sign-up and looks broken right after a polished website.
- SCREENSHOT/OBSERVATION: `before/newowner-desktop-setup.jpg`. (C, B)
- PROPOSED FIX:
  - A composed two-column onboarding frame: a form column of about 440 px, and a line-art illustration with a short explanation of the next steps.
  - Numbered "Step 1 of 3", consistent with step 2.

### P0-9 A new owner is dropped onto an empty dashboard with no path forward
- PAGE: `/aaj` (new owner), `/baat` (empty), desktop + mobile
- PERSONA: New owner
- PROBLEM:
  - Six zero counters and "Press below to send new work." (the button is above on desktop).
  - Nothing says to invite the team first. That hint lives only on the Team page.
  - Conversations says "Pick somebody and start talking." when nobody exists.
- WHY IT MATTERS: Activation needs one team member. Owners who try New task or a conversation first reach an empty picker and give up.
- SCREENSHOT/OBSERVATION: `before/newowner-desktop-today-empty.jpg`, `before/newowner-mobile-today-empty.jpg`, `before/newowner-desktop-conversations-empty.jpg`. (A, B, E, G)
- PROPOSED FIX:
  - A "Get your workspace ready" guide on Today until the business is set up: invite your team → start a conversation → send the first task → punch in → create a document from a template. Each step links to where it happens and ticks off from real data.
  - Empty-state copy that is correct at every width, and that sends the owner to Invite when nobody has joined.

### P0-10 Business Templates are almost impossible to find
- PAGE: `/documents`, `/projects/:id`, `/kaam/:id`, More, Today
- PERSONA: Owner, member
- PROBLEM:
  - The ten templates are reachable only through a small "Templates" link in the Documents header, three taps from Today on mobile.
  - They don't appear from a project, a task, Today, the nav or the website.
- WHY IT MATTERS: Quotations and work orders are the paperwork these businesses produce daily. A capability nobody finds has no value.
- SCREENSHOT/OBSERVATION: matrix row 12 (score 1/5) in `findings/G-discoverability.md`; `before/owner-desktop-documents.aria.txt`. (G, A)
- PROPOSED FIX (contextual, not a new nav item):
  - Documents gets a visible "Create from a template" row showing the most-used templates.
  - Project detail and task detail offer "Create from template", which carries the project.
  - More lists "Templates" next to Documents on mobile.
  - The first-run guide includes it.
  - The website shows it in the Proof stage.

### P0-11 Leave and Holidays are buried
- PAGE: `/hazri`, More, Today, nav
- PERSONA: Owner, member
- PROBLEM:
  - Leave requests, balances and holidays live inside a long Attendance page, below personal punch-in, with no nav or More entry.
  - The owner's pending leave requests sit below the fold under Team today.
  - Balance buttons read only "+ Half" / "+ 1 day".
- WHY IT MATTERS: Leave and holidays are a daily owner job and a staff right. Pending requests that go unseen mean slow answers.
- SCREENSHOT/OBSERVATION: `before/owner-desktop-attendance.jpg` (Leave requests is the 5th block), `before/owner-mobile-attendance.jpg` (y≈850), matrix rows 15–16 (score 2). (G, B, E, A)
- PROPOSED FIX:
  - The nav label becomes "Attendance & leave".
  - The Attendance page opens with a section index (Today · Leave · Holidays · Team), and the owner's pending leave requests come first, with a count.
  - More gets "Leave & holidays".
  - Today's attention strip already links pending leave.
  - Balance buttons say "Add ½ day" / "Add 1 day".

### P0-12 Attendance status is wrong after Punch Out
- PAGE: `/aaj` (member, desktop + mobile)
- PERSONA: Member
- PROBLEM: After punching out, Today still says "Punched in at 7:14 PM", while Attendance says "Done".
- WHY IT MATTERS: Attendance is a record staff rely on. Contradictory statuses cause disputes.
- SCREENSHOT/OBSERVATION: `before/member-mobile-today.jpg` ("Punched in at 7:14 PM") vs `before/member-desktop-attendance.jpg` ("Punched out 7:14 PM"). (B, E)
- PROPOSED FIX: The strip reads the punch-out state ("Punched out at 7:14 PM · 0m"). The Attendance chip says "Punched out" instead of the ambiguous "Done".

### P0-13 Hero product mock truncates the document it is selling, and grey text fails contrast
- PAGE: `/` hero at 1440px
- PERSONA: Visitor
- PROBLEM:
  - The "Linked work" document card is squeezed. The file name is hidden, "PDF · 1.8 MB" stacks vertically, and the "Awaiting approval" pill spills over the border.
  - Muted text `#8c877c` measures 3.2–3.6:1 on ivory and white (Lighthouse `color-contrast` failure).
- WHY IT MATTERS: The first product impression is a broken component, and the meta text is unreadable on budget screens.
- SCREENSHOT/OBSERVATION: `.playwright-mcp/landing-fold-desktop.jpg` (x≈1090–1260, y≈340–455). Lighthouse mobile: 20+ contrast failures at 3.23–3.57:1. (C, D, F)
- PROPOSED FIX:
  - The document card lays out name, meta and status on separate lines with nowrap, in a wider column.
  - Darken the muted ink token to ≥ 4.5:1 everywhere.

---

## P1 — significantly weakens the experience

| ID | Page / persona | Problem | Evidence | Fix |
|---|---|---|---|---|
| P1-1 | Buttons on `/`, `/login` (all) | No visible keyboard focus on primary buttons (WCAG 2.4.7) | F focus sweep: 5 buttons with an identical focused style | `focus-visible` ring on the shared Button |
| P1-2 | Brand mark SVG (all) | `role="img"` with an empty `aria-label` (Lighthouse `svg-img-alt`) | Lighthouse mobile landing | Decorative marks `aria-hidden`; labelled marks get "Waakya" |
| P1-3 | All documents | Only HSTS. No X-Frame-Options, nosniff, Referrer-Policy or Permissions-Policy; `x-powered-by` exposed | F `get_network_request` on `/login` | Add security headers; disable `poweredByHeader` |
| P1-4 | Unknown routes | Unbranded black default 404 with no links | F screenshot, `/does-not-exist` | Branded `not-found` page with Home and Sign-in |
| P1-5 | Sharing | No OG/Twitter tags; `robots.txt` and `sitemap.xml` return 404 | F, D curl | `metadataBase`, OpenGraph, Twitter card, robots, sitemap |
| P1-6 | Every route | 319 KB of fonts preloaded; ~236–269 KB is Devanagari/Baloo not used on English pages | F network waterfall | Stop preloading Devanagari faces (they still load on demand) |
| P1-7 | `/login` | "Get started" lands on a bare "Sign in". Nothing says it also creates an account or what happens next. Staff hint is 12 px at the bottom. Hinglish tagline on the English page | `before/visitor-mobile-login.jpg`, D | "Start with Waakya" heading, the 3-step what-happens-next, a prominent staff line, the English tagline |
| P1-8 | Website nav (mobile) | No navigation on 390px. "Product" scrolls to the hero | D, `before/visitor-mobile-landing.jpg` | Anchor nav with a mobile menu |
| P1-9 | Walkthrough (mobile) | Tabs clipped ("versation", "V") | `before/visitor-mobile-landing.jpg` y≈1590 | Numbered stages in a wrapping grid, no clipping |
| P1-10 | Team (`/staff`) | Nav "Team" opens a page titled "Staff" with "Invite staff" and "1 people"; the invite button sits at the bottom on desktop | `before/owner-desktop-team.jpg` | "Team" everywhere, correct plurals, invite in the page header |
| P1-11 | Mobile Today (owner) | Shows Sent/Seen/Done/Verified but drops Late and Not seen, which desktop shows | `before/owner-mobile-today.jpg` vs desktop | Mobile counters include Late and Not seen |
| P1-12 | Bottom nav | Landmark named "More"; no unread badge on Conversations | E aria snapshots | Name the landmark "Main"; badge Conversations |
| P1-13 | New task (`/naya`) | Titled "Send this?" (a question, not a form title) | `before/owner-desktop-new-task.jpg` | Title "New task" |
| P1-14 | Quotation template form | "Project" asked twice (free text + link select) | `before/owner-desktop-template-form.jpg` | Label the link select "Link to a project" and place it first |
| P1-15 | Today (owner) | "Press below to send new work." while the button is above; "No work yet" next to finished work | `before/owner-desktop-today.jpg` | Width-neutral copy that counts finished work |
| P1-16 | Invalid invite | Dead end: no Sign-in or Home | `before/visitor-mobile-join-invalid.jpg` | Add Sign in / Waakya home actions |
| P1-17 | Attendance history | Columns have no headers; "Done" chip is ambiguous | `before/member-mobile-attendance.jpg` | In / Out / Worked headers; "Punched out" |
| P1-18 | Privacy (`/privacy`) | Mentions "voice notes"; doesn't mention attendance, leave, documents or Google sign-in data; back arrow goes to `/login` | D `D-desktop-privacy.png` | Correct the data list; link home |
| P1-19 | Desktop `/more` | Duplicates the sidebar | `before/owner-desktop-more.jpg` | On desktop, explain that everything is in the sidebar and link Search/Settings; keep the list for phones |
| P1-20 | Website use-cases | Generic one-liners, not tied to the modules | D | A mini-story per audience that follows the chain |
| P1-21 | Website | No FAQ, trust statements or next-step clarity (no pricing is stated anywhere) | D, A | FAQ and trust row with statements that are true today; no price claims |
| P1-22 | Settings | Duplicate "Daily routine" card; "Staff language" vs "Language" | B, G | Keep as is; covered by P2 naming work |
| P1-23 | Approvals, Updates | Decided requests still read "needs approval" in Updates | `before/owner-desktop-notifications.jpg` | Deferred (needs a backend change); Approvals shows the true state |

## P2 — polish

| ID | Area | Problem | Decision |
|---|---|---|---|
| P2-1 | Native selects and date inputs | Native look | Restyled via tokens; custom components deferred |
| P2-2 | Updates list | Identical tinted cards with no type icons | Deferred |
| P2-3 | Hinglish URL slugs | `/aaj`, `/baat`, `/kaam`, `/hazri`, `/khabar` | Deferred (route migration) |
| P2-4 | Project activity log | Raw state names and one line per transition | Deferred |
| P2-5 | Document upload order | Category chosen before the file | Deferred |
| P2-6 | Team rows | No person drill-down | Deferred (new functionality) |
| P2-7 | Date/time format | "7:14 PM" vs "7:14 pm" | Deferred |
| P2-8 | Window chrome repeated on marketing mocks | Card overuse | Addressed by the website rewrite |
| P2-9 | Login language switch placement | Floats at the bottom | Kept |
| P2-10 | `/demo` dots | 6 px tap targets | Addressed by the demo re-skin |

---

## Implementation priority

1. P0 product defects: P0-5, P0-6, P0-7, P0-12, P0-8, P0-4.
2. Positioning and website: P0-1, P0-2, P0-13, P0-3, P1-5, P1-7, P1-8, P1-9, P1-18, P1-20, P1-21.
3. Discoverability: P0-9, P0-10, P0-11, P1-10, P1-11, P1-12, P1-13, P1-14, P1-15.
4. Browser quality: P1-1 to P1-6, P1-16, P1-17.
5. Regression, re-capture of the same 100-screen set, production deploy, re-audit.

The outcome of each item is recorded in the "After" section of `docs/WAAKYA_CUSTOMER_JOURNEY_AUDIT.md`.
