# Waakya V3 — Mobile web

Same URLs as desktop; designed at **390 × 844** and **430 × 932**, with **768**
and **820** getting a wider single column (not a stretched phone).

## Shell
- Bottom bar: **Today · Chats · More** (staff) or **Today · Chats · Work ·
  More** (managers, owners). More lists Search first, then the business places,
  then tools. Detail screens (task, thread, create) bring their own bar.
- The owner keeps the kit's Neel header with the day's counters on Today.

## One primary at the thumb
- Owner Today: **New task**, sticky above the bottom bar.
- Employee task: the next step (Dekh liya, ho jayega → Shuru kiya → Ho gaya),
  60 px, bottom third.
- **Scroll padding (9rem below `lg`)** keeps anything scrolled to or focused
  above the sticky bars — WCAG 2.4.11 Focus Not Obscured; it also fixed an
  E2E where the sticky button intercepted a click.

## Progressive disclosure on a phone
- Task: the record shows its last three steps ("Every step, with its time ·
  N"); project and documents wait behind one line ("Project and documents").
- Today: finished work behind "Done today"; busy groups fold to three rows.
- Folds are real buttons with `aria-expanded`/`aria-controls`
  (`components/waakya/reveal.tsx`); the content stays server-rendered and
  folds by a `data-open` attribute. (An earlier CSS-checkbox version was
  announced as a checkbox and could be forced open by a select inside it —
  found by the adversarial review.)

## Employee Today
- "Up next": the one task to do now (late → new → today), ringed, then the
  kit's sections (Naya · Late · Aaj · Baad mein), then Done folded.
- Punch in/out as one line with its button (staff tap target).
- Approvals waiting on this person and unread chats appear above the tasks,
  only when there are any.

## Proof
- "Ho gaya" opens the proof sheet when the owner asked for a photo; the send
  button stays disabled until a photo is attached; there is no skip.

## Language and long content
- Hinglish is the staff default; Hindi (Devanagari, line-height ≥ 1.5, no
  letter-spacing) and English alike. Latin digits everywhere. Long names and
  titles truncate on list rows with the full text on the detail screen;
  wrapping titles use line-clamp-2.

## Known limits
- The phone header counters and the desktop line say the same numbers in two
  forms by design (one tree, switched by breakpoint).
