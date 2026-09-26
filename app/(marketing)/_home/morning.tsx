import { Character } from "./characters";

/**
 * The owner's Wednesday morning, as the product shows it: a navy rail, the
 * date, and one number that matters. Four things carry a decision only Priya
 * can make; everything else is stated once, calmly, on one line, and left
 * alone. Drawn as a screen (a hairline and a paper shadow), not as a card in
 * a card.
 */
const NEEDS = [
  {
    thread: "Pashan clinic · fit-out",
    what: "They want the cabins added to the quotation",
    meta: "₹2.4 lakh more · Neha has held it for you",
    act: "Decide",
  },
  {
    thread: "Deccan Shutters · 12 units",
    what: "Deccan asks for half the amount before dispatch",
    meta: "₹55,000 against PO-4471 · raised by Neha",
    act: "Approve",
  },
  {
    thread: "Meera Joshi · new enquiry",
    what: "She wants the measurement moved to Thursday morning",
    meta: "Rahul is at Kharadi till noon · Neha needs your call",
    act: "Decide",
  },
  {
    thread: "Rahul · leave",
    what: "Rahul has asked for Saturday off",
    meta: "No site work at Kharadi that day",
    act: "Approve",
  },
];

const MOVING: [string, string][] = [
  ["12 jobs", "running to plan"],
  ["3 customers", "updated yesterday"],
  ["Kharadi handover", "on track for 17 October"],
  ["2 vendors", "on time"],
];

export function OwnerAttention() {
  return (
    <div className="w4-screen w4-today">
      <nav className="w4-rail" aria-label="ABC Interiors">
        <p className="w4-rail-biz">ABC Interiors</p>
        <p className="w4-rail-sub">Commercial interiors · Pune</p>
        <ul>
          {["Today", "Conversations", "Work", "Customers", "Projects", "Vendors"].map((n, i) => (
            <li key={n} data-active={i === 0}>
              {n}
              {i === 0 ? <b className="num">4</b> : null}
            </li>
          ))}
        </ul>
        <p className="w4-rail-me">
          <span aria-hidden="true">P</span> Priya · Owner
        </p>
      </nav>

      <div className="w4-today-main">
        <div className="w4-today-head">
          <div>
            <p className="w4-kicker">Wednesday, 24 September</p>
            <p className="w4-today-big">
              <b className="num w4-display">4</b>
              <span className="w4-display">things need you.</span>
            </p>
            <p className="w4-today-sub">Everything else is already moving.</p>
          </div>
          <div className="w4-today-people" aria-hidden="true">
            <Character name="owner" action="reviewing" className="w-16" />
          </div>
        </div>

        <ul className="w4-needs">
          {NEEDS.map((n) => (
            <li key={n.thread} className="w4-need">
              <span className="min-w-0 flex-1">
                <span className="w4-kicker">{n.thread}</span>
                <span className="w4-need-what">{n.what}</span>
                <span className="w4-need-meta">{n.meta}</span>
              </span>
              <span className="w4-need-act">{n.act}</span>
            </li>
          ))}
        </ul>

        <div className="w4-moving">
          <p className="w4-kicker">Everything else · moving normally</p>
          <dl>
            {MOVING.map(([n, what]) => (
              <div key={n}>
                <dt className="num">{n}</dt>
                <dd>{what}</dd>
              </div>
            ))}
          </dl>
          <p className="w4-moving-more">Nothing else is waiting on you.</p>
        </div>
      </div>
    </div>
  );
}
