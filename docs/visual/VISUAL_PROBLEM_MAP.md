# Waakya — visual problem map (production, 2026-09-26)

Source: the live site at https://waakya.com (release `aaf2ea6`) rendered in a real
Chromium at 1440 / 1280 / 1024 / 820 / 768 / 430 / 390, captured before, during and
after each scene's animation; and the signed-in product on the local Platform V1
stack at 1440 and 390. The V3.5 reference (`~/waakya-design-v3`, `890c472`,
`/design-lab/v35`) was diffed against the production port: the port is faithful
(copy edits only), so the weaknesses below are inherent to V3.5, not lost in transit.

Severity: **V1** visually broken · **V2** materially weak · **V3** polish.

## Homepage

| # | Where | Sev | What is wrong |
|---|---|---|---|
| H1 | Monday · "Nothing is lost" | **V1** | A fixed 16:9 stage (628 px tall at 1116 wide). Six scraps occupy the top-left; the right half is empty before the change. The scraps exit (opacity → 0, 360 ms) **before** the record enters (240 ms delay + 420 ms), so the frame passes through a near-blank state; after the change the left half stays empty and the record sits at 50 % of a stage that is often below the fold. The composition depends on invisible elements. |
| H2 | Hero | V2 | Headline confined to the left 55 %; the right half of the first viewport is a gradient with nothing in it. Below, six near-identical boxes of unequal height in a row — the first demonstration reads as a card strip, not a story. A floating "Pause the loop" pill with no anchor. |
| H3 | Every chapter | V2 | Identical section skeleton: eyebrow → 22ch headline (left) → paragraph → one large rounded scene box. Eight times. This repetition is the single biggest "generated" signal. |
| H4 | One business · one day | V2 | A vertical stack of six rounded cards; consequences appear only inside the current card, so five of six cards are near-empty (one line + "in Projects"). Time is written, not shown. |
| H5 | Conversation → work | V2 | Five equal cards in a row. The transformation (a sentence becoming WHO / WHAT / WHEN / FOR) is not visible; there is no proof, no state progression, no product surface. |
| H6 | Your morning | V2 | Good idea, weak frame: an app mock in a rounded box under a left-aligned header; the "four things vs everything else" contrast is one small tinted block at the bottom. |
| H7 | For your customers | V2 | Strongest chapter, but the business side and the customer side are two panels with no visible crossing; the "what that one tap did" list starts as four empty circles. |
| H8 | Built around the way you work | V2 | Two 70 px tall bars as a switch; the module row is a pill strip; switching swaps text without showing the system re-forming. |
| H9 | How far it goes (Ready → Built for you) | V2 | Four equal option cards plus a pill "flow" — the maturity idea is presented as a menu. |
| H10 | Your website | V2 | Three boxes in a row; nothing connects them; nothing moves between them. |
| H11 | Vertical rhythm | V2 | 8,865 px at 1440, 12,350 px at 390. Chapters spend height on containers rather than content (Monday alone is ~1,000 px). |
| H12 | Mobile 390 | V2 | Desktop stacked: six hero cards ≈ 900 px before any chapter; Monday becomes a list of six notes with a blank tail under it; scenes keep their desktop padding. |
| H13 | Typography | V3 | Every H2 is the same size and weight; the page never whispers. Kicker labels are used ~40 times. |
| H14 | Grid | V3 | Max width 1180 with 32 px margins, but scenes, tallies and copy columns do not share column edges (copy at 54–58ch, scene at full width, aside at a fixed 1fr/auto). |

## Product (signed in)

| # | Where | Sev | What is wrong |
|---|---|---|---|
| P1 | Customers (CRM) list | **V1** | The sort control label truncates to "Naam," beside the search box; the primary "Naya customer" button is dropped below the title on desktop while Pipeline sits in the header. |
| P2 | Sidebar | V2 | The business name shows under the wordmark on some screens (Today, Work, Settings) and not on others (Customers, Projects, Vendors…). |
| P3 | Customers, Projects, Vendors | V2 | The one primary action sits under the title instead of in the header, so the header pattern differs from Team / Automation / Records. |
| P4 | Projects | V2 | A two-column grid of equal cards ("1 kaam baaki · 0 documents · Chal raha"); no progress, no next milestone, no customer, no owner. |
| P5 | Customers list | V2 | Each row is name + email + two pills; no relationship, owner, last event or next action at a glance. Desktop uses phone rows. |
| P6 | Pipeline | V2 | Kanban cards carry only a name and "Enquiry"; empty columns are tall grey slabs. |
| P7 | Settings | V2 | Mixed surfaces: language and name rows are open, the business form is boxed; the disabled "Naam save karein" is a full-width beige slab. |
| P8 | Attendance | V3 | Four boxes of different kinds (punch, leave balance, team, holidays); the punch card is the only one that matters today. |
| P9 | Today | V3 | Sound structure. The right column is thin; the header primary carries a heavy shadow; count strip is dense. |
| P10 | Empty and thin states | V3 | Vendors, Records, Team: a single short list on a wide canvas with nothing that explains what the place is for. |

## What is worth keeping

The one-business narrative (ABC Interiors), the customer chapter's indigo
environment, the Baloo display voice, the line-character family, the drawn
demo photography, and the product's list-not-cards discipline on Today and Work.
