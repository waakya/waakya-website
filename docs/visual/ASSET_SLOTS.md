# Waakya — photography and asset slots (Visual V2)

**Rule.** Waakya's own drawings explain; real business imagery proves. No stock
photography was added to this candidate. Every photograph-shaped image on the
homepage today is a *drawn demo scene* (`app/(marketing)/_home/demo-photo.tsx`),
rendered as SVG with photographic framing. They are placeholders, and each one
is a named slot below that a licensed or commissioned photograph can fill
without layout changes.

In the product itself, proof is always the customer's own upload (task proof,
vendor proof, project photos); nothing here changes that.

## Brand guard

Waakya is not an interiors brand. Photography appears only as:

- **Proof** — the evidence a person submitted against a commitment.
- **Context** — the place a customer's project is happening.
- **Customer projects** — what a customer sees on their own page.

The story's business is an interiors firm (ABC Interiors) because one believable
business runs through the page. The second business on the page (Omega
Builders, property sales) and the website chapter keep the story general; a
future third example (services or trading) should get its own proof slots
rather than reuse site photography.

## Slots

| Slot id | Where it appears | What the photo must show | Frame | Notes |
|---|---|---|---|---|
| `proof-site-openfloor` | Hero step "Proof"; Conversation proof strip; Close | An open office floor mid-work: ceiling grid, lights being fitted, no people's faces | 4:3, ≥ 1200 px wide | Phone-camera look (slightly wide, natural light). This is *proof*, not a showroom. |
| `proof-site-measure` | Hero step "Proof"; Conversation proof strip | A tape or laser measure against a wall or floor, a hand in frame | 4:3 | Hands only; no identifiable person unless released. |
| `proof-reception-done` | Hero step "Proof"; Customer phone ("Reception complete"); Close | A finished reception desk and wall | 16:10 | The one "finished" image; used where the customer sees completed work. |
| `proof-material` | Conversation proof strip; Day board (vendor moment) | Laminate or material samples on a table, or shutters delivered | 1:1 | Supports the vendor and "customer chooses" moments. |
| `context-tower` | Business switch (Omega) | A residential tower under construction or just completed, Indian city context | 16:10 | Context only; never presented as a Waakya customer's building. |

## Specification for every slot

- Licensed for web marketing use, perpetual, with model/property releases where
  people or identifiable property appear.
- No brand marks, no visible phone numbers or addresses, no faces without release.
- Colour: natural daylight, not graded; the page's warmth comes from the paper,
  not the photos.
- Delivery: AVIF + JPEG, 2× the displayed size, under 180 KB each at display size.
- Every image keeps its current caption and `aria-label` (what it proves), and the
  small "demo" tag is removed only when the image is a real, licensed photo.

## Until photography exists

The drawn scenes stay, deliberately recognisable as illustrations and marked
`demo` wherever the tag is shown. The page is designed to read correctly with
them: proof is always carried by the words beside it (who, when, what it
proves), never by the picture alone.
