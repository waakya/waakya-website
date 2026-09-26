# Waakya — visual experience candidate (2026-09-26)

**Status: local/preview candidate. Not merged, not deployed. Waiting for owner visual approval.**

| | |
|---|---|
| Clone | `~/waakya-visual` (a plain clone of github.com/waakya/waakya-website; the Desktop checkout was not touched) |
| Branch | `feature/visual-experience-production`, from `main` = `aaf2ea6` (Platform V1 release) |
| Local review | `http://localhost:3500` — homepage signed out; product with the seeded owner (`owner@waakya.test`) via the dev-only test login; customer page via `customer@waakya.test` after the customer journey spec has run once |
| Local stack | the same local Supabase project as the platform clone (API :57521); start it from either clone with `npx supabase start` |
| Start | `cd ~/waakya-visual && (set -a; . ~/waakya-platform/.env.local; set +a; ALLOW_TEST_LOGIN=true npx next dev --port 3500)` |
| Preview deployment | not created (see "Owner judgment" below) |

The problem map this work answers is `docs/visual/VISUAL_PROBLEM_MAP.md`.

## The Monday scene, fixed

Production drew the scene in a fixed 16:9 stage. The six scraps exited
(opacity to 0 in 360 ms) 240 ms *before* the record entered, so the frame
passed through a near-blank state; afterwards the left half stayed empty and
the record sat at 50 % of a stage that was often below the fold. The
`IntersectionObserver` also fired at 20 % visibility, so the change usually
ran while the reader was still arriving.

Now: no stage. The scraps and the record are both on the page from the first
frame — the record honestly showing *nobody yet · not decided · no time set*.
The change is wiring: each scrap grows a stub to a bus, the bus feeds the
record, the fields fill, the attachments appear. Nothing leaves the frame, the
height is the content's, and the story starts at 50 % visibility. Before,
during and after are each a complete composition (verified by screenshot at
1440 and 390 in all three states).

## Grid and rhythm

- One container: 1200 px, margins 20 / 40 / 48 px, twelve columns, 24 px gutters (`.w4-wrap`, `.w4-grid`).
- Two chapter layouts: **split** (words in columns 1–5, sticky; picture in 6–12) and **wide** (words in 1–8, an aside in 10–12, picture full width).
- Chapter padding 56 px (phone) / 88 px (desk); paper, one tinted band, one indigo chapter, an indigo close.
- Pacing: two chapters dominate (56 px H2), two whisper (34 px), the rest speak (44 px); the hero is 66 px.

## Homepage chapters, materially changed

1. **Hero** — promise beside evidence: one customer's ledger page (six entries, ticks glyph per line, three drawn photos, her page) instead of six boxes in a row.
2. **Monday** — see above.
3. **One business, one day** — a day board: four lanes against one clock, moments as marks, cross-lane consequences drawn as lines (approval → vendor order → next job on site); the current moment told beneath; the tally as an aside. Phone: one vertical timeline.
4. **Conversation → work** — the chat on the left with WHO / WHAT / WHEN / FOR marked in the sentence; the commitment sheet on the right with the product's six-step stepper (Bheja → Verified), the completion clock, four proof photos and the verifying tick.
5. **Your morning** — the Today screen as a screen (rail + sheet), a single large **4**, four decisions as one surface, everything else on one calm line.
6. **For your customers** — phone on the left, business on the right, a drawn crossing between them along which the chosen laminate travels; people and consequences change state on the business side.
7. **Built around the way you work** — a compact switch; the workspace re-forms (rail, table, place, people) and a word-for-word strip says what is called what in each business.
8. **How far it goes** — a depth line with four growing stops, and the estimator example as a pipeline, not four cards.
9. **Your website** — browser → workspace → customer page as one wired system; an enquiry travels along it.
10. **Close** — the ticks glyph draws to Verified; one primary, one text link.

## Product screens, materially changed

- **Customers**: a desk table (name · kind · owner · next action · last activity · call); the primary action in the header; the truncated "Naam," sort button replaced by a search icon button; phone keeps the two-line rows.
- **New customer / project / vendor**: the form opens as a sheet from the header primary, so the list never jumps.
- **Projects**: one surface, one row per project with a progress bar, open work, papers, end date.
- **Pipeline**: stages as headings over one surface each; empty stages take one line, not a grey slab.
- **Vendors**: primary in the header; open work in words.
- **Sidebar**: the business name was collapsing to 0 px on every screen inside "More" (a flex child with no minimum in a scrolling nav). Fixed with `shrink-0`.
- **Today**: the phone header's Late / Not seen chips wrap instead of overflowing the viewport (was 14 px past the edge at 390); the desktop primary lost its floating shadow.
- **Settings**: the Save-name button no longer stretches to a beige slab.
- **Customer project page**: a readable status block (large %, latest, next) and a plain sentence: "Nothing needs you right now" or "Needs you · N" linking down.
- **Demo**: the opening and closing slide headline now match the homepage promise ("Your entire business. One workspace.").

## Motion

`useSequence` starts at 45 % visibility (25 % for the hero), holds the last step, hands over on touch, and under reduced motion arrives finished. Every scene is complete at step 0. Consequence motion only: stubs join, a clock line moves, marks fill, a chip crosses, a dot travels, a tick draws. No looping, floating or parallax.

## Responsive

Recomposed, not shrunk: the hero copy leads and the ledger follows on a phone; Monday is a 2-/3-column scrap grid, an arrow, the record (side-by-side only from 1280); the day board becomes a timeline below 1024; the conversation and the two worlds stack; the workspace rail becomes a chip row. No horizontal overflow at 390 / 430 / 768 / 820 / 1024 / 1280 / 1440. All targets ≥ 44 px on a coarse pointer.

## Accessibility

axe (serious/critical): 0 on the homepage after replacing opacity-dimmed "not yet" text with colour states that pass 4.5:1. Every control has a name; steps use `aria-current`; the ticks glyph carries its state word; reduced motion honoured.

## Regression

- `vitest`: 292 passed.
- `eslint`, `tsc`: clean on every touched file.
- Playwright (local stack, this server): `homepage.spec` and `a11y.spec` — see the log in the final report; `customer.spec` 6 passed.

## Known visual limitations

- Demo photography is drawn, not photographed (unchanged from V3.5; flagged in code for replacement).
- The Monday scraps are tight at 1280–1440 (two columns of ~155 px); readable, not roomy.
- The day board relies on hover-free marks; on a phone it is a list, so the cross-lane lines are a desk-only picture.
- Product screens were reviewed with the QA fixture data ("Flood 55", numeric suffixes), which makes any list look worse than a real business would.
- `/demo` remains a slide deck with its own visual language; only its promise copy was aligned.

## Owner judgment needed

- **Preview deployment**: Vercel previews on this project are SSO-protected and their environment would point at production Supabase; I did not create one. The local URL above is the review surface. Say the word if you want a preview anyway.
- The demo deck: keep as a separate presentation, or fold its strongest moments into the homepage and retire it?
- Whether the customer chapter should stay indigo (kept, per the brief) now that the close is indigo too — two dark bands on one page.
- Hindi/Hinglish homepage: the page is English-only, as before.
