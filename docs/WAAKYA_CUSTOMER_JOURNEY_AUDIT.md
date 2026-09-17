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

*Filled in after implementation and deployment. The re-audit uses the same personas, the same journeys, the same viewports and the same 100-capture set (`docs/audit/after/`).*
