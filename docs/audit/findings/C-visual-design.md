# C — Visual design audit (Waakya, production captures 2026-09-17)

Auditor: Agent C (visual design). Evidence: `/private/tmp/wk-build/docs/audit/before/*.jpg` and `.playwright-mcp/landing-fold-desktop.jpg`. Screenshots only, no source code read. Hex values below marked "approx" are sampled by eye from JPEGs; proposed tokens are recommendations.

Capture caveat: seeded audit data (`mu5kz8y9` suffixes, a flat red square used as "proof" photo) makes some screens look worse than real use. Those data artefacts are not counted as findings.

Overall verdict: the marketing site mostly matches the approved language (ivory, Baloo 2 headings, navy/royal blue, restrained haldi, a few line-art people). The product does not: it switches to a dark-navy app shell, uses Inter for almost every heading, piles up bordered cards and pills, uses native browser form controls, and applies status colour inconsistently. The demo page uses a third look (dark gradient + grid + purple glow). A visitor moving from landing to demo to login to the product sees three different brands.

---

## P0

### Business setup screen renders as an unconstrained mobile layout on desktop
- PAGE: /setup (Create your business)
- PERSONA: New owner (first screen after sign-in)
- PROBLEM: On a 1440px viewport the form has no max-width. The heading and helper text sit flush left at 16px, the logo glyph sits centred above them, and the "Business name" input and "Create business" button stretch about 1408px edge to edge. The language segmented control stays small on the left. Nothing is aligned to anything else, and the Waakya wordmark and illustration are missing.
- WHY IT MATTERS: This is the first product screen a paying owner sees. It looks broken and unfinished right after a polished landing page, and it undercuts trust at the point of commitment.
- SCREENSHOT/OBSERVATION: `newowner-desktop-setup.jpg`: full-bleed 56px-tall blue button across the whole viewport, a centred 36px glyph over a left-aligned H1, and about 400px of empty ivory below.
- PROPOSED FIX: Reuse the login shell: a centred column `max-width: 416px` (same as login), wordmark lockup on top, H1 in Baloo 2 600 at 28/34, helper text in Inter 15/22 muted. Input and button fill the column only. Add a small line-art person with a handwritten "Your team goes here" arrow on the right at ≥1024px, or under the form on mobile.

### Demo page uses a different, generic "AI SaaS" visual language
- PAGE: /demo
- PERSONA: Visitor
- PROBLEM: A near-black indigo background with a purple radial glow, a faint grid overlay, lavender (#a9a6f5 approx) subheadings, letter-spaced "W A A K Y A" eyebrow, a glassy pill "DEMO" badge and a floating dark translucent control bar. None of this is ivory, navy line art or haldi. On mobile, the control bar sits on top of the "Becomes work" card and hides its content.
- WHY IT MATTERS: The approved language explicitly avoids purple gradients, glow and glassmorphism. The demo is the most persuasive page and currently looks like any AI startup template, which breaks brand continuity between landing and product.
- SCREENSHOT/OBSERVATION: `visitor-desktop-demo.jpg` (dark gradient, grid, lavender "All your business work. One workspace."); `visitor-mobile-demo.jpg` (control pill covering the card at y≈800).
- PROPOSED FIX: Rebuild on ivory `#FBFAF6` with navy `#1C2163` Baloo 2 headings and royal blue `#3440C4` accents. Drop the grid and glow. Put the product card on a white surface with a 1px `#E3E6EE` border and `0 8px 24px rgb(28 33 99 / 0.08)` shadow. Replace lavender with navy for the subhead, and use one handwritten annotation ("becomes work ↓") in place of the letter-spaced divider. Make the control bar a solid white bar with a top border, in normal flow on mobile (`position: sticky; bottom: 0` with `padding-bottom: 72px` reserved on the content).

### Hero product mock: squeezed document card and failing-contrast grey text
- PAGE: / (landing, above the fold)
- PERSONA: Visitor
- PROBLEM: In the hero "Linked work" column the document card is too narrow. The file name is hidden, "PDF · 1.8 MB" breaks into four vertical lines ("PDF / · / 1.8 / MB"), and the "Awaiting approval" pill spills over the card's right border. "Revised quotation / Rahul · Today · 5 PM" also wraps into four lines. Grey meta text (#8c877c on #fbfaf6) measures 3.2–3.6:1 and fails WCAG AA. The same grey is used for the letter-spaced "CONVERSATIONS PEOPLE WORK PROGRESS" row.
- WHY IT MATTERS: This is the first product impression on the page, and it shows a broken component. The low-contrast meta text is hard to read on the budget Android screens this audience uses.
- SCREENSHOT/OBSERVATION: `landing-fold-desktop.jpg` and `visitor-desktop-landing.jpg` hero, right column x≈1090–1260, y≈340–455. On mobile (`visitor-mobile-landing.jpg`) the same card renders correctly ("Quotation v2 · PDF · 1.8 MB"), which confirms this is a desktop width constraint.
- PROPOSED FIX: Give the mock grid `grid-template-columns: 150px 1fr 260px` (or hide the mini-nav column below 1280px). Put the document card on two lines: row 1 is file name (Inter 500 13px, ellipsis); row 2 is "PDF · 1.8 MB" (`white-space: nowrap`) with the status pill below or right-aligned inside the padding. Replace muted text token `#8C877C` with `#6B665C` (≈5.3:1 on ivory) everywhere. For the eyebrow row use `#5E5A52` with `letter-spacing: 0.12em`.

### Product shell does not look like the marketing brand
- PAGE: All authenticated pages (desktop sidebar, mobile header)
- PERSONA: Owner, member, new owner
- PROBLEM: Marketing is ivory with a light top nav and navy Baloo headings. The product opens into a heavy 288px saturated navy sidebar (#1C2163 approx) with a lighter-navy active pill and a lighter-navy profile card. Mobile Today instead uses a bright royal-blue header slab with white numbers, and other mobile pages have no header colour at all. So there are three shell treatments: ivory marketing, navy desktop sidebar and blue mobile header. Product H1s are Inter 700 ("Conversations", "Work", "Settings"). Only desktop Today uses Baloo 2 ("Hello, Priya Sharma"), while mobile Today renders the same greeting in Inter.
- WHY IT MATTERS: Users sign up from a warm, human brand and land in a generic dark-sidebar admin panel. Brand recall and the "not an ERP" positioning are lost at the handoff.
- SCREENSHOT/OBSERVATION: `owner-desktop-today.jpg` vs `visitor-desktop-landing.jpg`; `owner-mobile-today.jpg` (blue header slab) vs `owner-mobile-documents.jpg` and `member-mobile-today.jpg` (no header colour, Inter "My tasks").
- PROPOSED FIX: Make the sidebar ivory-tinted `#F4F2EA` with a 1px right border `#E3E6EE`. Nav labels use navy `#1C2163` Inter 500 14px; the active item gets a white fill, a 1px `#DDE1EC` border and a 3px royal-blue left bar. Keep the wordmark in navy with the haldi tick. Mobile Today drops the blue slab and uses the same ivory header as other mobile pages. Every page H1 uses Baloo 2 600 28/34 in navy (mobile 24/30), and all other UI text stays Inter.

### Mobile task detail: stacked fixed bars cover content
- PAGE: /task/:id (mobile), also conversation thread (mobile)
- PERSONA: Owner, member (field staff on phones)
- PROBLEM: On the task page a fixed action tray (Call / Remind / Reassign / Change time / Cancel) sits directly on top of the fixed bottom tab bar. Together they take about 175px of an 844px viewport and cut across the Proof photo. On the conversation thread, the message composer sits on top of the tab bar, so two bottom bars are stacked. The task page also has a large empty gap (≈250px) before the Project/Documents card.
- WHY IT MATTERS: Field staff mostly use phones. Losing about 20% of the screen to chrome and hiding proof, the key "done" evidence, damages the core loop.
- SCREENSHOT/OBSERVATION: `owner-mobile-task-detail.jpg` (tray and tab bar at y≈668–845 overlaying the proof image); `owner-mobile-conversation-thread.jpg` (composer at y≈708 above the tab bar at y≈780).
- PROPOSED FIX: Hide the bottom tab bar on detail routes (task, thread, template form) and show a back arrow only. Use one sticky bottom region per screen, at most 72px plus safe-area. Collapse the task actions into one primary button (e.g. "Call Rahul") plus a "More" overflow sheet. Remove the empty spacer before the Project card (use 24px section gap).

---

## P1

### Six bordered KPI cards make Today look like an ERP dashboard
- PAGE: /today (desktop), also new-owner empty state
- PERSONA: Owner, new owner
- PROBLEM: Six equal white cards (Sent, Seen, Done, Verified, Late, Not seen), each with its own border and radius, sit above two more cards in a right rail ("This week", "Staff today") and a bordered table. For a new owner all six read "0", and "This week" shows a grey dash. Numbers are Baloo navy but "Late" is not red and "Not seen" is not amber, so the grid carries no meaning.
- WHY IT MATTERS: This is the "card overuse" and "ERP density" the brand wants to avoid. Six zeros tell a new owner nothing and push the one real action down the page.
- SCREENSHOT/OBSERVATION: `owner-desktop-today.jpg` y≈124–208; `newowner-desktop-today-empty.jpg` (all zeros, a "—" for on-time).
- PROPOSED FIX: Replace the six cards with one inline summary line in Inter 15px: "1 sent · 1 seen · 1 done · **1 verified** · 0 late" on a single hairline-bordered strip (no per-item boxes). Colour a number only when it is non-zero and meaningful: late `#B42318`, not seen >15 min `#B26B00`, verified `#1F7A4A`. Hide the strip entirely when all values are zero, and show the empty-state illustration instead.

### Status colour does not consistently mean one thing
- PAGE: Today, Work, Project detail, Search, Attendance, Team, Projects
- PERSONA: Owner, member
- PROBLEM: "Verified" is a green ticks glyph with label on Today, plain dark text on Work and Project detail, and small grey text in Search. Attendance uses a green "Done" pill for a finished shift, the same green as verified work. The same "not punched in" state is a blue-tinted pill on Today, a neutral white pill on Attendance and plain grey text on Team. "Active" (project) and "Owner" (role) use blue pills, while "Staff" uses a beige pill. Approvals correctly uses red "Rejected" and green "Approved".
- WHY IT MATTERS: The brand rule is that colour equals meaning. When green means both "verified by owner" and "shift ended", and blue means role, project state and a warning, owners stop trusting colour to scan for problems.
- SCREENSHOT/OBSERVATION: `owner-desktop-today.jpg` (green Verified), `owner-desktop-work.jpg` and `owner-desktop-project-detail.jpg` (plain "Verified"), `owner-desktop-search.jpg` (grey), `owner-desktop-attendance.jpg` ("Done" green pill, "Not punched in" white pill), `owner-desktop-team.jpg` ("Owner" blue pill, "Staff" beige pill).
- PROPOSED FIX: Define 4 semantic tokens and use them only for these meanings. Success/verified is text `#1F7A4A` on bg `#E8F4EC`. At-risk (not seen, not punched in after start time, due soon) is `#8A5300` on `#FBF1DE`. Late/rejected is `#B42318` on `#FDECEA`. Neutral/info is `#4A4F63` on `#EEF0F5`. Render task status everywhere with one `<Status>` component (glyph + label, no pill background in lists; pill only in detail headers). Roles ("Owner", "Staff") and project "Active" use plain text, not coloured pills.

### Logo ticks glyph is reused as decoration and recoloured
- PAGE: Today (desktop and mobile), member Today
- PERSONA: Owner, member
- PROBLEM: The logo mark (blue bars + haldi tick) appears as a loose decorative icon in the mobile header next to the bell (owner and member), where it does nothing. The same glyph is recoloured all-green as the "Verified" status icon on Today. In-product haldi should appear only as the done tick of this glyph, but the glyph shows up in three colourways: blue+yellow logo, green status, white+yellow sidebar.
- WHY IT MATTERS: The haldi tick is Waakya's signature. Using it as filler weakens it, and recolouring it green blurs the rule that yellow means Waakya's done tick.
- SCREENSHOT/OBSERVATION: `owner-mobile-today.jpg` (glyph at top-right next to bell), `member-mobile-today.jpg` (glyph between bell and avatar), `owner-desktop-today.jpg` (green glyph in the Status column).
- PROPOSED FIX: Remove the glyph from mobile headers (keep bell + avatar). For status, use the glyph with navy bars and haldi `#F2B01E` tick only for "Verified" (the brand's done moment), placed next to the label "Verified" in `#1F7A4A` text. Use simple 16px line icons in the same stroke family for other states. Never recolour the tick.

### Conversation thread reads as a WhatsApp clone, without the linked-work panel marketing promises
- PAGE: /conversations/:id (desktop and mobile)
- PERSONA: Owner, member
- PROBLEM: The thread is a plain chat: solid royal-blue right-aligned bubbles with white text, a nested translucent attachment chip, a timestamp under the bubble and a beige round disabled send button. On desktop the column is ≈700px with ≈420px of empty ivory to the right. The landing hero and "See the work move forward" section show a three-part layout (thread · Linked work · team notes) with light grey bubbles and navy avatars, but the product has none of it.
- WHY IT MATTERS: The product's differentiator is "conversations become work". Visually it now looks like a generic messenger, and it does not match the screens visitors were sold.
- SCREENSHOT/OBSERVATION: `owner-desktop-conversation-thread.jpg`, `owner-mobile-conversation-thread.jpg` vs `visitor-desktop-landing.jpg` (y≈920–1250 in the full page).
- PROPOSED FIX: Match the marketing mock. Show messages left-aligned with avatar + name + time for everyone, including self. Bubbles use `#F3F4F8` fill with no tail, and own messages get `#EEF0FB` plus a 1px `#D9DDF5` border instead of solid blue. On ≥1024px add a 300px right "Linked work" panel (tasks, documents, approvals from this thread, with the dashed empty state "Any message can become a task"). The send button is royal blue when enabled and `#E3E6EE` with a navy 40% icon when disabled, never beige.

### Inconsistent page grid: fixed 672px column pinned left on wide screens
- PAGE: Conversations, Work, Projects, Documents, Approvals, Team, Updates, Search, Settings, Daily routine
- PERSONA: Owner, member (desktop)
- PROBLEM: Most pages render a single 672px column starting at x=336, which leaves ≈430px of empty ivory on the right at 1440px. Today uses a different grid (768px main + 288px right rail starting at x=320), and Task detail uses a 2-column 390/250 split inside the same 672px. The left edge shifts between 320 and 336 across pages.
- WHY IT MATTERS: Pages look unfinished and lopsided, alignment jumps as users switch tabs, and wide screens are wasted.
- SCREENSHOT/OBSERVATION: `owner-desktop-work.jpg`, `owner-desktop-documents.jpg`, `owner-desktop-approvals.jpg` (column ends at x≈1008) vs `owner-desktop-today.jpg` (content from x=320, rail to x=1408).
- PROPOSED FIX: One layout primitive: content area `padding-inline: 48px`, `max-width: 1080px`, `margin-inline: auto` within the space right of the sidebar. List pages use a 720px main + 300px contextual rail (filters, counts, help illustration) at ≥1280px, and a single column below that. All pages share left edge, H1 baseline (top 40px) and 32px gap between header and content.

### Native, unstyled form controls give an ERP feel
- PAGE: Project detail, Documents, Task detail, Template form, Settings, Attendance (holidays)
- PERSONA: Owner
- PROBLEM: Browser-default `<select>` elements with OS chevrons ("Active", "Add person", "Other", "None"), native date inputs with a black calendar glyph (17/09/2026, dd/mm/yyyy), textarea resize grips, and inconsistent radii (textareas ≈8px, inputs ≈12px, buttons ≈10–12px, pills 999px). Input borders are warm beige (#E6E1D6 approx) while cards use cool grey borders.
- WHY IT MATTERS: Native controls are the fastest way to look like an internal ERP tool. Mixed radii and border temperatures add visual noise on the densest screens.
- SCREENSHOT/OBSERVATION: `owner-desktop-project-detail.jpg` (two native selects under title), `owner-desktop-template-form.jpg` (date inputs, textarea grips, "None" select), `owner-desktop-settings.jpg` (textarea vs input radius), `owner-desktop-attendance.jpg` (holiday date input).
- PROPOSED FIX: Build custom Select, DatePicker and TextArea components. Height 44px, radius 10px, 1px border `#DDE1EC`, focus ring `0 0 0 3px rgb(52 64 196 / 0.18)` with border `#3440C4`, custom 16px chevron and calendar icons from the same line-icon set. `resize: vertical` without the visible grip (use auto-grow). Use a single radius scale: 6 (chips), 10 (inputs/buttons), 14 (cards/sheets).

### Pill and chip overuse, in three different styles on one screen
- PAGE: Today, Work, Documents, New task, Settings, Login, Project detail
- PERSONA: Owner, member
- PROBLEM: Today alone has a white bordered pill ("1 unread conversation"), a blue-tinted pill ("You have not punched in today") and a link with a folder icon styled as a chip. Work and Documents use solid-blue/white-outline filter pills. New task uses large pill chips for "By when" and "Priority". Language selection uses a pill segmented control. Project detail shows the one person as a pill chip. Mobile Today stacks the two status pills vertically, one per line.
- WHY IT MATTERS: The brand wants to avoid excessive pills. When everything is a rounded capsule, nothing stands out, and actions, filters and status all look the same.
- SCREENSHOT/OBSERVATION: `owner-desktop-today.jpg` y≈240–310, `owner-desktop-work.jpg` (Team/Mine/Open/Late/Done), `owner-desktop-new-task.jpg`, `owner-mobile-today.jpg`, `owner-desktop-project-detail.jpg` (People chip).
- PROPOSED FIX: Reserve pills for two uses only: filters (segmented underline tabs preferred: Inter 500 14px, 2px royal-blue underline for active, like the landing "Conversation / Assign a task" tabs) and choice chips inside forms. Render Today notices as one "Needs attention" list with plain rows (16px icon + text + chevron, 1px dividers). People render as avatar + name without a capsule. The "Projects in progress" link becomes plain text.

### Primary actions move around and change style page to page
- PAGE: Today, Work, Projects, Conversations, Approvals, Team, Daily routine, Documents, Settings
- PERSONA: Owner
- PROBLEM: The primary create action appears as a top-right solid button with glow shadow (Today "New task"), a top-right solid button without glow (Work), a solid button below the subtitle on the left (Projects, Documents "Upload"), an outline secondary button (Approvals "Ask for approval", Conversations "New conversation"), a full-width 672px button fixed ≈770px down the viewport and detached from the list (Team "Invite staff"), and a full-width button under an empty state (Daily routine). Settings has a full-width beige disabled "Save name" next to a small blue "Save".
- WHY IT MATTERS: Users must hunt for the main action on every page. Mixed sizes and shadows look unsystematic.
- SCREENSHOT/OBSERVATION: `owner-desktop-today.jpg`, `owner-desktop-work.jpg`, `owner-desktop-projects.jpg`, `owner-desktop-approvals.jpg`, `owner-desktop-team.jpg` (floating Invite staff at y≈768), `owner-desktop-checklists.jpg`, `owner-desktop-settings.jpg`.
- PROPOSED FIX: Standardise a page header of H1 + one-line description on the left and one primary button on the right, aligned to the H1 cap height. Primary is 40px tall, radius 10px, `#3440C4`, Inter 600 14px, with no coloured glow shadow. Secondary actions are ghost/outline to its left. On mobile the primary becomes a single sticky bottom button above safe-area. Disabled buttons use `#E3E6EE` bg + `#8F95A8` text, not beige. One Save per form section, right-aligned, auto-sized.

### Updates list: seven identical tinted cards with no hierarchy
- PAGE: /updates (Notifications)
- PERSONA: Owner, member
- PROBLEM: Every notification is a separate lavender-tinted (#EFF0FB approx) bordered card with the same Inter 15px text and a grey timestamp. There is no icon, no type (approval, leave, task, message), no read/unread difference, no inline action for "needs approval", and all 7 items look equally urgent. The refresh icon and "Mark all read" float at the column's right edge.
- WHY IT MATTERS: The page is a wall of boxes. Owners cannot spot the two approvals that need a decision among routine "has seen" events.
- SCREENSHOT/OBSERVATION: `owner-desktop-notifications.jpg` (7 stacked cards, 79px pitch).
- PROPOSED FIX: Show a single list on a white surface with 1px `#ECEEF3` dividers (no per-row cards). Each row has a 20px type icon (shield for approval, calendar for leave, check for task, bubble for message) in navy, bold person name and a timestamp right-aligned. Unread rows get a 6px royal-blue dot at the left, not a tinted fill. Actionable items (approval, leave) show inline "Approve / Reject" text buttons. Group rows under "Needs you" and "Earlier" headings.

### Task detail: status stepper, SLA bars and action tray are cramped and inconsistent
- PAGE: /task/:id (desktop and mobile)
- PERSONA: Owner
- PROBLEM: The 6-step stepper squeezes into ≈390px, so "In progress" wraps to 3 lines and the step times misalign. Completed steps are green, but the current "Verified" step is a large royal-blue dot, which inverts the meaning (verified is the success state). SLA progress bars are beige tracks with tiny green dots. The Timeline repeats the stepper with black bullet dots. The action tray uses four tile treatments: solid blue Call, beige Remind/Reassign/Cancel, pale-blue Change time. "Cancel" is neutral grey rather than a destructive red-text treatment.
- WHY IT MATTERS: This is where owners confirm work was done. Duplicated, misaligned status plus mixed button styles make the most important screen feel noisy.
- SCREENSHOT/OBSERVATION: `owner-desktop-task-detail.jpg` (stepper y≈300–370, tray y≈890–1000); `owner-mobile-task-detail.jpg`.
- PROPOSED FIX: Replace the stepper plus timeline with one vertical timeline: 12px nodes, done nodes `#1F7A4A` filled, the final Verified node shows the haldi-tick glyph, future nodes are a 1px `#C9CEDB` ring, and a 1px connecting line. Put the times right-aligned in Inter tabular numerals. Move the SLA into a single sentence under the due banner ("Seen in 0 min · reminder tomorrow 8:00 am"). Use a thin progress bar only when at risk, in amber. For actions, one primary button (Call), then text buttons Remind · Reassign · Change time, and "Cancel task" in `#B42318` text inside the overflow.

### Empty states are inconsistent and one gives wrong direction
- PAGE: Today, Projects, Daily routine, Attendance, member Today
- PERSONA: New owner, member
- PROBLEM: Five empty-state styles exist. Today uses a solid white card with a Baloo "No work yet" and the copy "Press below to send new work", but the button is above. Projects uses a dashed card with a line-art illustration and Baloo heading. Daily routine uses a dashed card with a grey icon, an Inter heading and a detached full-width button. Attendance uses a dashed card with grey text only. Member Today shows a bold green Inter sentence with no container or illustration. In the Projects illustration the person's head collides with a node circle on the line.
- WHY IT MATTERS: Empty states are most of what a new owner sees in week one. They should be the most on-brand moments (illustration + handwriting), but they are currently the least consistent.
- SCREENSHOT/OBSERVATION: `newowner-desktop-today-empty.jpg`, `newowner-desktop-projects-empty.jpg` (head overlapping node at x≈632,y≈303), `owner-desktop-checklists.jpg`, `owner-desktop-attendance.jpg`, `member-mobile-today.jpg`.
- PROPOSED FIX: One EmptyState component: no border or container, centred, 120px navy line-art illustration (1.5px stroke `#1C2163`, one royal-blue fill shape, one haldi dot max), Baloo 2 600 20/26 title, Inter 15/22 `#5E5A52` body (max 44ch), one primary button directly underneath, and an optional handwritten annotation (Caveat-style script, royal blue, 18px) with arrow pointing to the button. Fix copy to "Send your first task". Redraw the Projects figure so the head sits clear of the path (≥8px gap).

### Line-art illustrations and handwritten annotations are nearly absent
- PAGE: Landing hero, login, setup, all product pages
- PERSONA: Visitor, new owner, owner, member
- PROBLEM: The approved language calls for blue/navy line-art humans and selective handwritten arrows. On the landing page they appear only in "Made for the way your business works" (three small 80px vignettes) and the final CTA ("Ideas to progress together." + two figures). On mobile the CTA illustration and annotation are dropped. The hero, login, setup and demo have none. In the product, one empty state (Projects) has an illustration.
- WHY IT MATTERS: The illustrations are the most distinctive, human part of Waakya's identity. Without them, both site and app fall back to generic SaaS UI (mock screenshots + cards).
- SCREENSHOT/OBSERVATION: `visitor-desktop-landing.jpg` (illustrations only at y≈2330 and 2560–2820); `visitor-mobile-landing.jpg` (final CTA without figures); `visitor-desktop-login.jpg`, `newowner-desktop-setup.jpg`, `owner-desktop-*.jpg`.
- PROPOSED FIX: Add one illustration moment per key surface. The hero gets a navy figure handing a speech bubble to a colleague, overlapping the mock's bottom-left, with a handwritten "becomes a task →". Login gets a small figure beside the form at ≥1024px. Setup gets a figure with a shop sign. Product empty states, the Today "all done" state (figure with haldi tick) and 404/error pages also get one. Keep mobile CTA figures at 96px. Keep annotations to max 1 per viewport.

### Mobile landing: clipped tab strip and orphaned wrap
- PAGE: / (mobile)
- PERSONA: Visitor
- PROBLEM: The "See the work move forward" tab row overflows. The first tab reads "versation" and the last shows "Ve" at the edge, with no fade or scroll hint. The letter-spaced keyword row wraps so "PROGRESS" sits alone on a second line. In the footer, links wrap with "Sign in" orphaned on its own row, and the tagline sits awkwardly beside the wordmark.
- WHY IT MATTERS: Clipped words look like a bug on the device most Indian SMB owners will use to evaluate Waakya.
- SCREENSHOT/OBSERVATION: `visitor-mobile-landing.jpg`: tabs at y≈1590 ("versation", "Ve"), keywords at y≈457–480, footer at y≈5170–5235.
- PROPOSED FIX: Tabs are `overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding-inline: 16px`, start scrolled to the first tab, with a 24px ivory gradient mask on the right edge only. Alternatively, on <480px replace tabs with a "01 / 04" stepper using the existing Next step control. Keyword row uses `gap: 8px 20px` and a smaller 11px letter-spaced label, or drop it on mobile. The footer uses a 2-column link grid below the wordmark + tagline stack.

---

## P2

### Login page is a generic centred auth form with a tiny, unstyled tagline
- PAGE: /login
- PERSONA: Visitor, member (invited staff)
- PROBLEM: "Sign in" is Inter 700 24px, not Baloo. The stacked logo lockup has a very small (≈11px) black "Bolo. Ho jayega." tagline that appears nowhere else. The language segmented control floats at the bottom of the viewport, far from the form. The helper "Staff need the link their owner sent" is small grey text. The checkbox border is beige while the input border is a different beige. There is no illustration or warmth.
- WHY IT MATTERS: Login is the daily entry point for staff. It is clean but anonymous, and it misses a cheap chance to reinforce the brand.
- SCREENSHOT/OBSERVATION: `visitor-desktop-login.jpg`, `visitor-mobile-login.jpg`.
- PROPOSED FIX: Use a horizontal wordmark (same as landing nav) at 28px height. H1 "Sign in" in Baloo 2 600 28px navy. Tagline in Inter 500 14px `#5E5A52`, or drop it. Move the language control to the top-right (desktop) or directly under the H1 (mobile) as a compact text switch "हिंदी · Hinglish · English". Make the staff helper Inter 14px `#5E5A52` in an info row with an icon, directly under Send code. Add a small line-art figure at ≥1024px.

### Mac window chrome repeated on every marketing mock
- PAGE: / (landing)
- PERSONA: Visitor
- PROBLEM: Every product mock (hero, step demo, four "One workspace" tiles, "Clear closure") carries fake three-dot traffic-light chrome and a grey title bar, 7 instances in all. "One workspace" becomes a 2×2 grid of shadowed window cards, one card per concept.
- WHY IT MATTERS: The traffic-light window is a generic SaaS-template trope. Repeating it adds noise and pushes the section towards "excessive cards".
- SCREENSHOT/OBSERVATION: `visitor-desktop-landing.jpg` y≈156, 922, 1437–1790, 1920; `visitor-mobile-landing.jpg` (4 stacked window cards).
- PROPOSED FIX: Keep window chrome only on the hero mock. For secondary mocks use a borderless white surface with 1px `#E3E6EE` border and 14px radius, a small Inter 500 12px uppercase label above it, and no dots. Merge the four "One workspace" tiles into one composite mock (thread with linked task, approval and attendance line) so it reads as one product, not four widgets.

### Updates badge and sidebar counters use inverted white-on-navy chips
- PAGE: Sidebar (desktop), More page
- PERSONA: Owner, member
- PROBLEM: The unread count in the desktop sidebar is a white capsule with navy text. On the More page the same count is royal-blue with white text. The Today bell uses a third style: a navy dot badge on a pale-blue tile.
- WHY IT MATTERS: This is a small but visible inconsistency repeated on every page.
- SCREENSHOT/OBSERVATION: `owner-desktop-today.jpg` (sidebar "Updates 7" and bell badge), `owner-desktop-more.jpg` ("Updates 7" blue).
- PROPOSED FIX: One CountBadge component: min-width 20px, height 20px, radius 10px, Inter 600 12px tabular, bg `#3440C4`, text white, and a 2px ring matching its surface. Only use red `#B42318` when the count represents late items.

### "More" page duplicates the sidebar on desktop
- PAGE: /more (desktop)
- PERSONA: Owner, member
- PROBLEM: On desktop the More page lists Projects, Documents, Approvals, Team, Search, Updates, Daily routine and Settings in two bordered cards, the same items already visible in the sidebar beside it.
- WHY IT MATTERS: Redundant surface. It looks like a mobile screen shown on desktop by accident.
- SCREENSHOT/OBSERVATION: `owner-desktop-more.jpg`.
- PROPOSED FIX: Redirect /more to /today at ≥1024px, or hide the route from desktop entirely. On mobile keep it, but use a single white list with dividers and group labels ("Work", "You") in Inter 600 12px uppercase `#5E5A52`.

### Naming and label styling mismatch between nav and page (Team vs Staff)
- PAGE: /team
- PERSONA: Owner
- PROBLEM: The nav item is "Team", but the page H1 is "Staff" and the button is "Invite staff". Each person is a separate bordered card rather than a list row. Rahul's card shows a raw phone number line and a "7:14 PM – 7:14 PM" line in the same grey, so the row heights differ.
- WHY IT MATTERS: The label mismatch plus per-person cards adds noise and makes the page feel assembled rather than designed.
- SCREENSHOT/OBSERVATION: `owner-desktop-team.jpg`.
- PROPOSED FIX: Use one term in nav and H1 ("Team"). Show people as a single list with dividers and fixed 64px rows: avatar 36px, name Inter 600 15px, one meta line (status in semantic colour · open tasks). Role goes in plain text on the right. The phone number moves to the person detail.

### Document rows over-truncate on mobile
- PAGE: /documents (mobile), project detail
- PERSONA: Owner, member
- PROBLEM: Each row packs name, type · size · uploader · date, and a linked project into three lines beside two icon buttons. On 390px everything truncates ("Quotation - Client mu5kz…", "Priya Sharm…", "T…"). The page also has three stacked control rows above the list (Templates button, select + Upload, search, filter pills), each in a different style.
- WHY IT MATTERS: The meta line becomes unreadable noise, and the controls take about 45% of the first screen.
- SCREENSHOT/OBSERVATION: `owner-mobile-documents.jpg` y≈100–330 (controls) and y≈360–590 (truncated rows).
- PROPOSED FIX: Rows show name (2 lines max, `line-clamp: 2`) plus one meta line "PDF · 3 KB · 17 Sept". Uploader and link move into the detail sheet, and download/delete go into a single overflow "⋯" button. Controls: search field with a filter icon button, and "Upload" as the sticky primary. Templates becomes a list row at the top ("Create from template →").

### New task sheet on desktop floats without context
- PAGE: /new-task (desktop)
- PERSONA: Owner
- PROBLEM: The create-task screen takes over the full viewport with no sidebar and no dimmed backdrop. A 544px form sits at the top, and the disabled beige "Send" button sits ≈200px below the form, pinned near the viewport bottom. The field labels (Who, What, By when) are small grey 13px, while the values are 17–18px bold, so the hierarchy is inverted.
- WHY IT MATTERS: The page feels disconnected from the app, and the send action is visually detached from the form it submits.
- SCREENSHOT/OBSERVATION: `owner-desktop-new-task.jpg`.
- PROPOSED FIX: On desktop, present it as a right-side sheet (480px) over a `rgb(28 33 99 / 0.24)` backdrop, keeping the app visible. Put Send directly under the last field, enabled in royal blue as soon as Who + What are filled. Labels are Inter 500 14px `#4A4F63`, values Inter 400 15px navy.

---

## Design system recommendations

1. **Type:** Baloo 2 (600/700) for marketing headings and exactly one heading per product page (H1 and empty-state titles). Everything else is Inter: body 15/22, UI 14/20, meta 13/18, labels 12/16 600. Never use Inter for a page H1 or Baloo for UI labels.
2. **Colour tokens:** ivory `#FBFAF6` (page), `#F4F2EA` (sidebar/sunken), white (surfaces), navy `#1C2163` (headings/nav), royal `#3440C4` (primary/links), border `#E3E6EE`, text `#1E2233`, muted `#5E5A52` (minimum; retire `#8C877C`). Haldi `#F2B01E` appears only in the logo tick and the Verified tick glyph. No purple, no gradients, no glow.
3. **Semantic colour is exclusive:** green `#1F7A4A` = verified/approved, amber `#8A5300`/`#B26B00` = at risk, red `#B42318` = late/rejected/destructive, neutral slate = informational. Roles, project state and filters never use semantic colours.
4. **Containers:** prefer lists with 1px dividers over stacks of cards. A card is allowed only when content is a distinct object that can be opened. Radius scale 6/10/14. Shadow only on overlays and marketing mocks: `0 8px 24px rgb(28 33 99 / .08)`. No coloured button shadows.
5. **Pills:** only for in-form choice chips and status inside detail headers. Filters use underline tabs, and notices use list rows.
6. **Page frame:** same header on every page (H1 + description left, one primary action right). Content `max-width: 1080px`, 48px side padding, 32px header gap, 24px section gap, 8px base spacing grid.
7. **Controls:** custom Select, DatePicker and TextArea at 44px height, 10px radius, `#DDE1EC` border, royal focus ring. Disabled state is slate (`#E3E6EE`/`#8F95A8`), never beige.
8. **Icons:** one line-icon set, 1.5px stroke, 16/20/24px, navy or muted only. Icon tiles (tinted squares) only for document type thumbnails.
9. **Illustration:** navy 1.5px line-art humans with one royal-blue fill and at most one haldi dot. Use them in every empty state, onboarding step and hero, with at most one handwritten annotation per viewport (royal blue script with a hand-drawn arrow).
10. **Mobile:** one sticky bottom region per screen. Hide the tab bar on detail and compose routes. Headers stay ivory, not coloured slabs. No horizontal clipping without a scroll affordance.
