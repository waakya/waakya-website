# Waakya — Customer Journey Audit

**Audited:** 17 Sep 2026 on production https://waakya.com. Companion to `docs/WAAKYA_BUSINESS_UX_AUDIT.md` (issue IDs refer to it).

**Journeys:** each was walked on desktop (1440px) and a phone (390px). Evidence is in `docs/audit/before/<persona>-<viewport>-<page>.jpg|.aria.txt`.

**The story every journey should make obvious:**
- **Conversation → Commitment → Execution → Proof → Record**
- For the customer: **Talk → Assign → Execute → Prove**

---

## 1. Visitor journey

**Path:** `/` → nav → walkthrough → Get started → `/login` (→ `/demo`, `/privacy`)

| Step | What happens today | Friction | Issue |
|---|---|---|---|
| First viewport | "Every conversation. A clear next step." with a chat mock; the document card in the mock is broken | Reads as a chat or to-do tool; "the new era of business communication" is absent | P0-1, P0-13 |
| Scroll | Talk / Assign / Execute / Prove strip → 4-tab walkthrough → four window cards → proof section → use-cases → CTA | Projects, Templates, Leave, Holidays, Team, Search and Notifications are never shown, and nothing connects to anything else. Mobile tabs are clipped | P0-2, P1-9 |
| Navigation | "Product / How it works / For businesses" | "Product" goes back to the hero. No nav at all on mobile | P1-8 |
| Decide | No FAQ, no trust statements, no "what happens next" | An owner can't answer "do my staff need an app? who sees our data?" | P1-21 |
| Get started | Lands on "Sign in" | Looks like it's only for existing accounts; staff guidance is hidden | P1-7 |
| `/demo` (if shared) | A dark purple deck with client workspaces and an internal placeholder | A different brand, B2B promises, and a CTA that goes nowhere | P0-3 |

**Emotional arc:** interest ("tidy, Indian, human") → confusion ("so it's a chat app?") → no reason to act. Browser quality is healthy: LCP 436–747 ms on throttled mobile, 0 CLS, 0 console errors.

## 2. New owner journey

**Path:** sign in → `/setup` → `/setup/profile` → `/staff` → `/aaj` → first attempts

| Step | What happens today | Friction | Issue |
|---|---|---|---|
| Create business | Field and button stretched about 1,400 px on desktop; no step counter | Looks broken at the moment of commitment | P0-8 |
| Business profile | Centred "Step 2 of 3", illustration, GSTIN/phone/email | Good. Inconsistent with step 1 | P0-8 |
| Team (step 3) | "Invite your staff first, then send work." Invite button at the bottom of the page | This correct advice appears only here | P1-10 |
| Today | Six zeros, "Press below to send new work." | No ordered path; the copy is wrong on desktop | P0-9, P1-15 |
| New task / conversation | Empty person picker; "Pick somebody and start talking." | Dead end until someone joins | P0-9 |
| Looking for templates, leave | Hidden in Documents and Attendance | New owners never learn these exist | P0-10, P0-11 |

**Activation risk:** the product only comes alive once one team member joins. Nothing in the first session leads there.

## 3. Daily owner journey

**Path:** `/aaj` → approvals and leave → conversation → task → project and documents → attendance → search and updates

| Step | What happens today | Friction | Issue |
|---|---|---|---|
| Open Today | Desktop: counters, "Also waiting on you", staff today. Mobile: 4 counters, no Late or Not seen | The phone hides the exceptions the owner opens the app for | P1-11 |
| Decide approvals | Approvals page is accurate; Updates still says "needs approval" after deciding | Stale notification text | P1-23 |
| Leave | Pending requests sit in the 5th section of Attendance, below personal punch-in | Slow to find and act on | P0-11 |
| Turn a chat into work | The owner can't make a task from their own message; the task doesn't show its source | The core chain is invisible | P0-4 |
| Verify proof | Verified task still shows "22 h left", a reminder and "Change time" | The record looks unfinished | P0-5 |
| Paperwork | Templates reachable only via Documents → Templates; the form asks "Project" twice | Low use of the most valuable document feature | P0-10, P1-14 |
| Team | Nav "Team" → "Staff" page, "1 people" | Naming mismatch | P1-10 |

## 4. Employee (team member) journey

**Path:** invite link → join → `/aaj` → punch in → conversation → task → proof → leave → approvals

| Step | What happens today | Friction | Issue |
|---|---|---|---|
| Invite link | Valid: works. Expired: dead end with no buttons | Stranded staff | P1-16 |
| Today ("My tasks") | Calm, clear; "Punched in at 7:14 PM" stays after punch-out | Wrong status | P0-12 |
| Punch in/out | 56 px button on Attendance; history has no column headers | Ambiguous history | P1-17 |
| Chat → task | "Create task" is a 20 px link | Hard to hit | P0-4 |
| Task & proof | Sticky footer; proof sheet works; after Done, only a caption sits in a fixed bar above the nav | Chrome covers content | P0-6 |
| Leave | "Apply leave" works; half day costs 0.5 and is shown clearly | Good, but hard to find | P0-11 |
| Approvals | "Ask for approval" works; decisions show on return | Good | — |

## 5. Mobile journey (390px, one hand)

| Surface | Observation | Issue |
|---|---|---|
| Landing | No nav; walkthrough tabs clipped; mock document fine on mobile | P1-8, P1-9 |
| Bottom nav | Today · Conversations · Work · Attendance · More; good 78×64 targets; landmark named "More"; no badges | P1-12 |
| Task detail | Action tray and nav cover 176 px and overlap the proof | P0-6 |
| Conversation | Composer stacked on the nav; tiny "Create task" link | P0-6, P0-4 |
| Project detail | **453 px wide** (owner) / **413 px** (member): the page slides sideways | P0-7 |
| More | Templates, Leave and Holidays are not listed | P0-10, P0-11 |
| Owner Today | No Late or Not seen | P1-11 |

---

## After (re-audit)

**Re-audited:** 17 Sep 2026 on production (commit `1dc5052`, then final polish).

**Method (same as the original audit):**
- The same personas: Priya Sharma (owner), Rahul Verma (team member) and a fresh new owner.
- The same journeys, at the same viewports (1440px and 390px).
- The same 100-capture set, now in `docs/audit/after/`.
- The production smoke suite, Chrome DevTools (Lighthouse, performance trace, console) and a live Playwright MCP check of the first viewport.

### Measured before and after

| Measure | Before | After |
|---|---|---|
| Positioning in the first viewport (desktop and 390px) | Absent ("Every conversation. A clear next step.") | "The new era of business communication" plus the heading "All your business work. One workspace." |
| Phase-1 capabilities named on the website | 5 of 12 | 12 of 12, in one connected map around a project |
| Conversation → Commitment → Execution → Proof → Record | Not shown | Chain under the hero and a 5-step walkthrough |
| Mobile screens wider than 390px (real device width) | 2 (project detail: 453px owner, 413px member) | 0 of 50 |
| Overflow detector | Reported 0 while the pages were 453px | Measures against the real width; fails on the old production page (+64 / +24px) |
| Lighthouse, phone, landing page (Accessibility / Best Practices / SEO / Agentic) | 96 / 100 / 100 / 50 | **100 / 100 / 100 / 100** |
| LCP, phone, 4x CPU, Fast 4G | 747 ms | 472 ms |
| CLS | 0 | 0 |
| Console errors or failed requests (100 captures) | 0 | 0 |
| Median / p90 time to network idle (100 captures) | 1,196 / 1,463 ms | 1,119 / 1,464 ms |
| Security headers | HSTS only; `x-powered-by` exposed | X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS with subdomains; `x-powered-by` removed |
| 404, robots.txt, sitemap.xml, share image | Default black 404; robots and sitemap 404; no OG tags | Branded 404; robots, sitemap and OG image served; OG title and description set |
| Production smoke suite | 10/10 | 10/10 (now also checks the closed-task record and the punch-out status on Today) |
| Local regression | 68 e2e / 231 unit | 69 e2e / 231 unit (with 390px fit checks for both roles on every screen and detail page) |

### Outcome by issue

| ID | Outcome | Evidence (`docs/audit/after/`) |
|---|---|---|
| P0-1 Positioning | Fixed | `visitor-desktop-landing.jpg`, `visitor-mobile-landing.jpg`, `.playwright-mcp/after-landing-fold-desktop-1440.jpg` |
| P0-2 Ecosystem | Fixed: connected map, owner-day, stories, FAQ | `visitor-desktop-landing.jpg` |
| P0-3 `/demo` | Fixed: ivory brand, projects instead of client workspaces, placeholder removed, CTA links to sign-up, presenter reset behind `?presenter`, product names | `visitor-desktop-demo.jpg`, `visitor-mobile-demo.jpg` |
| P0-4 Message → Task | Fixed: a "Make task" button (≥40px) on every message including your own; the task shows "From a conversation" with a link back | `owner-mobile-conversation-thread.jpg`, `owner-mobile-task-detail.jpg` |
| P0-5 Verified countdown | Fixed: record band, no clocks, no reminder, no Change time; Verified node green | `owner-desktop-task-detail.jpg`, `member-desktop-task-detail.jpg` |
| P0-6 Stacked bars | Fixed: no tab bar on task and conversation screens; closed tasks keep their action in the page | `owner-mobile-task-detail.jpg`, `member-mobile-conversation-thread.jpg` |
| P0-7 Project overflow | Fixed: 390px for both roles | `owner-mobile-project-detail.jpg` (390px wide) |
| P0-8 Setup layout | Fixed: two-column onboarding frame, Step 1 of 3 | `newowner-desktop-setup.jpg` |
| P0-9 New-owner path | Fixed: "Get your workspace ready" guide ticked from real data; empty Conversations leads to Invite | `newowner-desktop-today-empty.jpg`, `newowner-desktop-conversations-empty.jpg` |
| P0-10 Templates | Fixed: template row on Documents, "Create from a template" on project and task (pre-linked), Templates in More, guide step 5, website | `owner-desktop-documents.jpg`, `owner-mobile-more.jpg`, `owner-desktop-project-detail.jpg` |
| P0-11 Leave and Holidays | Fixed: "Attendance & leave" nav, section links, pending-leave banner first, "Leave & holidays" in More, labelled balance buttons | `owner-mobile-attendance.jpg`, `owner-mobile-more.jpg` |
| P0-12 Punch-out status | Fixed: "Punched out at … · worked"; neutral "Punched out" chip | `member-mobile-today.jpg`, `member-desktop-attendance.jpg` |
| P0-13 Hero document and contrast | Fixed: full name shown; muted ink raised to ≥ 4.5:1; Lighthouse contrast passes | `visitor-desktop-landing.jpg` |
| P1-1 to P1-6 | Fixed: focus rings, SVG labels, headers, 404, OG/robots/sitemap, font preloads | Lighthouse 100; `curl -I` headers |
| P1-7 Login | Fixed: "Sign in or get started", no-password line, three next steps, prominent staff line, English wordmark | `visitor-mobile-login.jpg` |
| P1-8, P1-9 Website nav and tabs | Fixed: mobile menu; numbered stage grid with no clipping | `visitor-mobile-landing.jpg` |
| P1-10 Team naming | Fixed: "Team" heading, "Invite to team" in the header on desktop, correct plurals | `owner-desktop-team.jpg` |
| P1-12 Nav landmark | Fixed: "Main" | `.aria.txt` snapshots |
| P1-13, P1-14, P1-15 | Fixed: "New task" title; template project link first ("Keep it with a project") and the free-text field renamed "Project or site name"; viewport-neutral Today copy | `owner-desktop-new-task.jpg`, `owner-desktop-template-form.jpg` |
| P1-16 Invalid invite | Fixed: Sign in and Home actions | `visitor-mobile-join-invalid.jpg` |
| P1-17 Attendance history | Fixed: Date / In / Out / Worked headers | `member-mobile-attendance.jpg` |
| P1-18 Privacy | Partly fixed: attendance, leave, documents and Google data listed; back link goes home. Voice-note proof is kept because audio proof is a shipped feature. A legal entity and grievance officer need the owner's details | `visitor-desktop-privacy.jpg` |
| Unread badge drops on some pages | Fixed: Settings, Daily routine, Attendance, Team, Conversations and threads carry the count | owner desktop captures |
| P1-11 Mobile Late / Not seen | Not changed: the mobile header already shows them as chips when non-zero (verified in code) | — |
| P1-23 Stale "needs approval" notifications | Deferred: needs a backend change | — |
| P2 items | Deferred, as listed in the business audit | — |

### Journeys after

- **Visitor:** the first screen states the category and the promise. The chain shows how work moves; the connected map shows all twelve capabilities working together; FAQ and trust lines answer the owner's questions; every CTA leads to "Sign in or get started".
- **New owner:** a composed three-step setup, then a Today guide that puts inviting the team first and unlocks the conversation and task steps once someone joins.
- **Daily owner:** the thread turns their own instruction into a task. The task links back to the conversation and closes into a clean record. Templates and leave are reachable from the page where they are needed.
- **Employee:** Today reports the true punch status. Task and thread screens give the whole phone to the work, and the invite dead end now offers a way forward.
- **Mobile:** every captured screen fits 390px; there are no stacked fixed bars; More lists Templates and Leave & holidays.
