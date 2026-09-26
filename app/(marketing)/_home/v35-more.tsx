"use client";

import * as React from "react";

import { Character } from "./characters";
import { DemoPhoto } from "./demo-photo";
import { StoryControl, StoryDots, useSequence } from "./v35-seq";

/* ============================================================= 5 · owner == */
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

const MOVING = [
  ["12 jobs", "running to plan"],
  ["3 customers", "updated yesterday"],
  ["Kharadi handover", "on track for 17 October"],
];

/**
 * The owner's screen says most of the business is fine. Four things carry a
 * decision only Priya can make; everything else is stated once, calmly, and
 * then left alone.
 */
export function OwnerAttention() {
  return (
    <div className="w32-scene w35-owner">
      <nav className="w35-owner-nav" aria-label="ABC Interiors">
        <p className="w32-display text-body-lg text-neel-700">ABC Interiors</p>
        <p className="w35-kicker mt-1">Commercial interiors · Pune</p>
        <ul className="mt-3">
          {["Today", "Customers", "Projects", "Work", "Vendors", "Conversations"].map((n, i) => (
            <li key={n} className="w32-nav" data-active={i === 0}>
              {n}
            </li>
          ))}
        </ul>
      </nav>

      <div className="w35-owner-main">
        <p className="w35-kicker">Wednesday, 24 September</p>
        <h3 className="w32-display mt-1 text-[30px] leading-tight sm:text-[34px]">Four things need you.</h3>
        <p className="w32-sentence mt-1">Everything else is already moving.</p>

        <ul className="w35-needs">
          {NEEDS.map((n) => (
            <li key={n.thread} className="w35-need">
              <span className="min-w-0 flex-1">
                <span className="w35-kicker">{n.thread}</span>
                <span className="w35-need-what">{n.what}</span>
                <span className="w35-need-meta">{n.meta}</span>
              </span>
              <span className="w35-need-act">{n.act}</span>
            </li>
          ))}
        </ul>

        <div className="w35-moving">
          <p className="w35-kicker">Everything else · moving normally</p>
          <dl className="w35-moving-rows">
            {MOVING.map(([n, what]) => (
              <div key={n}>
                <dt className="num w35-moving-n">{n}</dt>
                <dd className="w35-moving-what">{what}</dd>
              </div>
            ))}
          </dl>
          <span className="w35-moving-more">Nothing else is waiting on you.</span>
        </div>
      </div>

      <div className="w35-owner-people" aria-hidden="true">
        <Character name="owner" action="reviewing" className="w-16" />
        <Character name="manager" action="talking" className="w-14" />
      </div>
    </div>
  );
}

/* ========================================================== 6 · customer == */
const LOOP = [
  { key: "ping", say: "ABC Interiors tells her, automatically" },
  { key: "open", say: "She opens her own page" },
  { key: "needs", say: "One thing needs her" },
  { key: "chose", say: "She picks a laminate" },
  { key: "cross", say: "Her answer crosses into the business" },
  { key: "team", say: "Neha knows without being told" },
  { key: "next", say: "The shutters are ordered and the next job opens" },
] as const;

const SWATCHES = [
  { name: "Oak", colour: "linear-gradient(140deg,#e8d5b5,#cdb189)" },
  { name: "Walnut", colour: "linear-gradient(140deg,#8a5a3b,#5d3a24)" },
  { name: "Teak", colour: "linear-gradient(140deg,#c58b52,#8a5a2c)" },
] as const;

/**
 * One sequence, not two demonstrations: the message she gets, the page she
 * opens, the one decision she makes, and every consequence of it landing back
 * inside the business. The customer experience and the operation are the same
 * system, seen from two sides.
 */
export function CustomerLoop() {
  const { ref, step, playing, setPlaying, pick, replay, done } = useSequence(LOOP.length, 2100);
  const at = (k: (typeof LOOP)[number]["key"]) => LOOP.findIndex((s) => s.key === k);
  const opened = step >= at("open");
  const chosen = step >= at("chose");
  const crossed = step >= at("cross");
  const team = step >= at("team");
  const next = step >= at("next");
  const pct = crossed ? 74 : 71;
  const [laminate, setLaminate] = React.useState<(typeof SWATCHES)[number]["name"]>("Walnut");
  const say = LOOP[step].key === "chose" ? `She picks ${laminate}` : LOOP[step].say;

  return (
    <div ref={ref} className="w35-cx">
      {/* the business, before and after her tap */}
      <div className="w35-cx-biz">
        <p className="w35-kicker">Inside ABC Interiors</p>
        <p className="w32-display mt-1 text-[22px]">Sterling Group · Kharadi</p>
        <ul className="w35-rows">
          <li className="w35-row">
            <span className="min-w-0 flex-1">
              <b>Reception</b>
              <span className="w35-row-meta">Rahul · false ceiling</span>
            </span>
            <span className="w32-status" data-tone="done">
              Complete
            </span>
          </li>
          <li className="w35-row" data-changed={crossed}>
            <span className="min-w-0 flex-1">
              <b>Shutters · Deccan</b>
              <span className="w35-row-meta">12 units · ₹1,10,000</span>
            </span>
            <span className="w32-status" data-tone={crossed ? "go" : "wait"}>
              {crossed ? `Ordered · ${laminate}` : "Waiting on laminate"}
            </span>
          </li>
          <li className="w35-row" data-changed={next}>
            <span className="min-w-0 flex-1">
              <b>Conference room lighting</b>
              <span className="w35-row-meta">{next ? "Rahul’s next job" : "Blocked by the shutters"}</span>
            </span>
            <span className="w32-status" data-tone={next ? "go" : "wait"}>
              {next ? "Active" : "Waiting"}
            </span>
          </li>
        </ul>
        <div className="w35-cx-people" aria-hidden="true">
          <Character name="manager" action={team ? "working" : "waiting"} className="w-14" />
          <Character name="road" action={next ? "walking" : "idle"} className="w-12" />
        </div>
      </div>

      {/* her side */}
      <div className="w35-cx-phone">
        <div className="w32-phone">
          <div className="flex items-center justify-between px-4 pt-3 text-caption font-semibold">
            <span className="num">9:41</span>
            <span className="num text-[color:var(--ink-subtle)]">{opened ? "waakya.abcinteriors.com" : "WhatsApp"}</span>
          </div>

          {opened ? (
            <div className="px-4 pt-3 pb-5">
              <p className="w35-kicker" style={{ color: "#96470a" }}>
                Your Kharadi office
              </p>
              <div className="mt-2 flex items-end gap-3">
                <p className="num w32-display text-[34px] leading-none">{pct}%</p>
                <p className="w32-status mb-1" data-tone="done">
                  On track
                </p>
              </div>
              <div className="w32-progress mt-2">
                <span style={{ width: `${pct}%` }} />
              </div>

              <DemoPhoto scene="reception" className="mt-4 h-28" caption="Reception complete · today" label={false} />
              <p className="w35-row-meta mt-2">Next · conference room lighting, Friday</p>

              {step >= at("needs") ? (
                <div className="w35-needsyou">
                  <p className="w35-kicker">Needs you</p>
                  <p className="mt-1 text-body-sm font-bold">Choose your laminate</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SWATCHES.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        className="w35-swatch"
                        data-on={chosen && s.name === laminate}
                        aria-pressed={chosen && s.name === laminate}
                        onClick={() => {
                          setLaminate(s.name);
                          pick(at("chose"));
                        }}
                      >
                        <i style={{ background: s.colour }} aria-hidden="true" />
                        {s.name}
                      </button>
                    ))}
                  </div>
                  {chosen ? (
                    <p className="w32-status mt-2" data-tone="done">
                      {laminate} approved
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="px-4 pt-4 pb-6">
              <div className="w35-wa">
                <p className="w35-kicker">ABC Interiors</p>
                <p className="mt-1 text-body-sm font-semibold">Reception is complete.</p>
                <p className="w35-row-meta">Your Kharadi office is 71% done.</p>
                <p className="num mt-2 text-caption font-semibold text-neel-700 underline">waakya.abcinteriors.com/sterling</p>
              </div>
              <p className="w35-row-meta mt-3">She taps the link — nothing to install, no password.</p>
            </div>
          )}
        </div>
        <span className="w35-cross" data-on={crossed} aria-hidden="true">
          {laminate} ✓
        </span>
      </div>

      {/* what her one tap did */}
      <div className="w35-cx-effects">
        <p className="w35-kicker">What that one tap did</p>
        <ol className="mt-3">
          {[
            ["Approval recorded on the project", crossed],
            ["Neha stops waiting", team],
            [`Deccan gets the order · ${laminate}, 12 units`, next],
            ["Rahul’s next job opens", next],
          ].map(([label, on]) => (
            <li key={label as string} className="w35-effect-row" data-on={Boolean(on)}>
              <span className="w35-effect-mark" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ol>
        <p className="w35-cx-punch" data-on={done}>
          Your customer’s best experience is also how the work gets unblocked.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <StoryControl
            playing={playing}
            done={done}
            label="the loop"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onReplay={replay}
          />
        </div>
        <StoryDots count={LOOP.length} step={step} onPick={pick} labels={LOOP.map((s) => s.say)} />
        <p className="w35-cx-say">{say}</p>
      </div>
    </div>
  );
}

/* ======================================================== 7 · adaptation == */
type Biz = {
  key: "abc" | "omega";
  name: string;
  kind: string;
  switchLabel: string;
  core: string[];
  modules: { id: string; name: string; on: boolean }[];
  title: string;
  rows: [string, string, string, string][];
  scene: "reception" | "tower";
  people: Parameters<typeof Character>[0]["name"][];
  foot: string;
};

const BUSINESSES: Biz[] = [
  {
    key: "abc",
    name: "ABC Interiors",
    kind: "Commercial interiors · Pune",
    switchLabel: "One builds offices",
    core: ["Today", "Customers", "Projects", "Work"],
    modules: [
      { id: "vendors", name: "Vendors", on: true },
      { id: "portal", name: "Customer page", on: true },
      { id: "attendance", name: "Attendance", on: false },
      { id: "campaigns", name: "Campaigns", on: false },
    ],
    title: "Sterling Group · Kharadi office",
    rows: [
      ["Reception", "False ceiling · Rahul", "Complete", "done"],
      ["Shutters", "Deccan · 12 units", "Ordered", "go"],
      ["Lighting", "Conference room", "Friday", "wait"],
    ],
    scene: "reception",
    people: ["designer", "site", "manager"],
    foot: "4 live projects · 1 approval waiting on a customer",
  },
  {
    key: "omega",
    name: "Omega Builders",
    kind: "Residential developer · Nashik",
    switchLabel: "One sells flats",
    core: ["Today", "Customers", "Inventory", "Bookings"],
    modules: [
      { id: "campaigns", name: "Campaigns", on: true },
      { id: "attendance", name: "Attendance", on: true },
      { id: "sitevisits", name: "Site visits", on: false },
      { id: "portal", name: "Customer page", on: false },
    ],
    title: "Omega Heights · Tower A",
    rows: [
      ["101", "3 BHK · 1,420 sq ft", "Available", "go"],
      ["102", "3 BHK · 1,420 sq ft", "Held · 2 days", "wait"],
      ["103", "4 BHK · 1,860 sq ft", "Sold", "done"],
    ],
    scene: "tower",
    people: ["manager", "desk", "road"],
    foot: "212 customers · 14 enquiries this week",
  },
];

const EXTRA_ROW: Record<string, [string, string, string, string]> = {
  attendance: ["Attendance", "Site crew", "18 of 24 in", "done"],
  campaigns: ["Campaign", "Launch · 212 customers", "Ready", "go"],
  portal: ["Customer page", "What they can see", "Live", "go"],
  vendors: ["Vendors", "3 orders open", "On time", "go"],
  sitevisits: ["Site visits", "6 booked this week", "Booked", "go"],
};

/**
 * The same workspace holding two trades. Switching business changes the
 * navigation, the records, the place and the people together — and the module
 * row belongs to whichever business is on screen, so nothing from the other
 * one is ever left underneath.
 */
export function TwoBusinesses35() {
  const [which, setWhich] = React.useState<"abc" | "omega">("abc");
  const [on, setOn] = React.useState<Record<string, string[]>>({
    abc: BUSINESSES[0].modules.filter((m) => m.on).map((m) => m.id),
    omega: BUSINESSES[1].modules.filter((m) => m.on).map((m) => m.id),
  });
  const b = BUSINESSES.find((x) => x.key === which)!;
  const live = on[which];
  const nav = [...b.core, ...b.modules.filter((m) => live.includes(m.id)).map((m) => m.name), "Documents"];
  const rows = [...b.rows, ...live.map((id) => EXTRA_ROW[id]).filter(Boolean).slice(0, 1)];

  return (
    <div>
      <div className="w35-switch" role="group" aria-label="Business">
        {BUSINESSES.map((x) => (
          <button
            key={x.key}
            type="button"
            className="w35-switch-btn"
            data-on={which === x.key}
            aria-pressed={which === x.key}
            onClick={() => setWhich(x.key)}
          >
            <span className="w35-kicker">{x.switchLabel}</span>
            <span className="w35-switch-name">{x.name}</span>
          </button>
        ))}
      </div>

      <div className="w32-scene w35-biz" key={b.key}>
        <nav className="w35-biz-nav w32-arrive" aria-label={b.name}>
          <p className="w32-display text-body-lg text-neel-700">{b.name}</p>
          <p className="w35-kicker mt-1">{b.kind}</p>
          <ul className="mt-3">
            {nav.map((n, i) => (
              <li key={n} className="w32-nav w32-arrive" data-active={i === 0} style={{ animationDelay: `${i * 40}ms` }}>
                {n}
              </li>
            ))}
          </ul>
        </nav>

        <div className="w35-biz-main">
          <p className="w35-kicker w32-arrive">{b.title}</p>
          <ul className="w35-rows mt-2">
            {rows.map(([what, meta, state, tone], i) => (
              <li key={`${b.key}-${what}`} className="w35-row w32-arrive" style={{ animationDelay: `${60 + i * 60}ms` }}>
                <span className="min-w-0 flex-1">
                  <b>{what}</b>
                  <span className="w35-row-meta">{meta}</span>
                </span>
                <span className="w32-status" data-tone={tone}>
                  {state}
                </span>
              </li>
            ))}
          </ul>
          <p className="w35-row-meta mt-3">{b.foot}</p>
        </div>

        <div className="w35-biz-place w32-arrive">
          <DemoPhoto scene={b.scene} className="h-28 w-full" label={false} />
          <div className="mt-3 flex items-end gap-1" aria-hidden="true">
            {b.people.map((c) => (
              <Character key={c} name={c} action="idle" className="w-12" />
            ))}
          </div>
        </div>
      </div>

      {/* modules: evidence, kept small */}
      <div className="w35-modules">
        <p className="w35-kicker">Start with what {b.name} needs. Add the rest when it does.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {b.modules.map((m) => {
            const isOn = live.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                className="w35-module"
                data-on={isOn}
                aria-pressed={isOn}
                onClick={() =>
                  setOn((s) => ({
                    ...s,
                    [which]: isOn ? s[which].filter((x) => x !== m.id) : [...s[which], m.id],
                  }))
                }
              >
                <span className="w35-module-mark" aria-hidden="true" />
                {m.name}
                <span className="w35-module-state">{isOn ? "on" : "add"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ===================================================== 7b · how far it goes */
const LEVELS = [
  { word: "Ready", say: "Customers, projects, work and documents, on day one." },
  { word: "Adapted", say: "Your stages, your fields, your approvals." },
  { word: "Connected", say: "Your website, WhatsApp and email." },
  { word: "Built for you", say: "The workflow that only your business has." },
];

const ABC_FLOW = ["Estimator on your website", "Floor plan", "Customer record", "Design inspiration", "WhatsApp", "Neha", "Project"];

export function AdaptLevels() {
  const [i, setI] = React.useState(3);
  return (
    <div>
      <ol className="w35-levels">
        {LEVELS.map((l, n) => (
          <li key={l.word}>
            <button type="button" className="w35-level" data-on={n === i} aria-current={n === i ? "step" : undefined} onClick={() => setI(n)}>
              <span className="num w35-level-n">{n + 1}</span>
              <span className="w35-level-word">{l.word}</span>
              <span className="w35-level-say">{l.say}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="w35-custom">
        <p className="w35-kicker">What “built for you” means, once</p>
        <p className="w32-display mt-1 max-w-[30ch] text-[22px] leading-tight">
          ABC Interiors wins work with a cost estimator on their own website.
        </p>
        <ol className="w35-flow">
          {ABC_FLOW.map((f, n) => (
            <li key={f} className="w35-flow-node" style={{ animationDelay: `${n * 60}ms` }}>
              {f}
            </li>
          ))}
        </ol>
        <p className="w32-sentence mt-3 max-w-[56ch]">
          That estimator is theirs alone — and it still lands in the same customer record, the same salesperson’s day
          and the same project as everything else.
        </p>
      </div>
    </div>
  );
}

/* ========================================================== 8 · website === */
export function WebsiteStrip() {
  return (
    <ol className="w35-web">
      <li className="w35-web-step">
        <span className="w35-kicker">Stays exactly as it is</span>
        <span className="w35-web-head num">abcinteriors.com</span>
        <span className="w35-web-meta">Their site, their brand, their estimator</span>
      </li>
      <li className="w35-web-step" data-mid="true">
        <span className="w35-kicker">Now connected to</span>
        <span className="w35-web-head">Waakya</span>
        <span className="w35-web-meta">Customer · team · projects · vendors</span>
      </li>
      <li className="w35-web-step">
        <span className="w35-kicker">And their customer gets</span>
        <span className="w35-web-head num">waakya.abcinteriors.com</span>
        <span className="w35-web-meta">Progress, photos, approvals — with their name on it</span>
      </li>
    </ol>
  );
}
