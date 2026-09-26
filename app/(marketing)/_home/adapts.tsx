"use client";

import * as React from "react";

import { Character } from "./characters";
import { DemoPhoto } from "./demo-photo";

/**
 * The same workspace holding two trades. The switch re-forms the whole
 * screen — navigation, the record on it, the place, the people — and the
 * strip beneath says exactly what changed, word for word, so the adaptation
 * is a fact you can read, not a label swap you have to notice.
 */
type Biz = {
  key: "abc" | "omega";
  name: string;
  kind: string;
  switchLabel: string;
  core: string[];
  modules: { id: string; name: string; on: boolean }[];
  title: string;
  columns: [string, string, string];
  rows: [string, string, string, string][];
  scene: "reception" | "tower";
  people: { name: Parameters<typeof Character>[0]["name"]; role: string }[];
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
    title: "Sterling Group · Kharadi office · 74%",
    columns: ["Work package", "Who · what", "State"],
    rows: [
      ["Reception", "Rahul · false ceiling", "Complete", "done"],
      ["Shutters", "Deccan · 12 units", "Ordered", "go"],
      ["Lighting", "Rahul · conference room", "Friday", "wait"],
    ],
    scene: "reception",
    people: [
      { name: "designer", role: "Sunita · designs" },
      { name: "site", role: "Rahul · on site" },
      { name: "manager", role: "Neha · runs customers" },
    ],
    foot: "4 live projects · 1 approval waiting on a customer",
  },
  {
    key: "omega",
    name: "Omega Builders",
    kind: "Residential developer · Nashik",
    switchLabel: "One sells flats",
    core: ["Today", "Leads", "Properties", "Bookings"],
    modules: [
      { id: "campaigns", name: "Campaigns", on: true },
      { id: "attendance", name: "Attendance", on: true },
      { id: "sitevisits", name: "Site visits", on: false },
      { id: "portal", name: "Customer page", on: false },
    ],
    title: "Omega Heights · Tower A · 38 of 64 sold",
    columns: ["Unit", "Type · area", "State"],
    rows: [
      ["101", "3 BHK · 1,420 sq ft", "Available", "go"],
      ["102", "3 BHK · 1,420 sq ft", "Held · 2 days", "wait"],
      ["103", "4 BHK · 1,860 sq ft", "Sold", "done"],
    ],
    scene: "tower",
    people: [
      { name: "manager", role: "Sameer · sales" },
      { name: "desk", role: "Kavita · bookings" },
      { name: "road", role: "Imran · site visits" },
    ],
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

/** What the same place is called in each business. */
const DIFF: [string, string][] = [
  ["Projects", "Properties"],
  ["Work packages", "Units"],
  ["Customers", "Leads"],
  ["Vendors", "Campaigns"],
  ["Customer page", "Attendance"],
  ["Site measurement", "Site visit"],
];

export function TwoBusinesses() {
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
    <div className="w4-adapt">
      <div className="w4-adapt-top">
        <div className="w4-seg" role="group" aria-label="Business">
          {BUSINESSES.map((x) => (
            <button
              key={x.key}
              type="button"
              className="w4-seg-btn"
              data-on={which === x.key}
              aria-pressed={which === x.key}
              onClick={() => setWhich(x.key)}
            >
              <span className="w4-kicker">{x.switchLabel}</span>
              <span className="w4-seg-name">{x.name}</span>
            </button>
          ))}
        </div>
        <p className="w4-adapt-hint">Switch, and watch the workspace re-form.</p>
      </div>

      <div className="w4-screen w4-ws" key={b.key}>
        <nav className="w4-rail w4-arrive" aria-label={b.name}>
          <p className="w4-rail-biz">{b.name}</p>
          <p className="w4-rail-sub">{b.kind}</p>
          <ul>
            {nav.map((n, i) => (
              <li key={n} className="w4-arrive" data-active={i === 0} style={{ animationDelay: `${i * 40}ms` }}>
                {n}
              </li>
            ))}
          </ul>
        </nav>

        <div className="w4-ws-main">
          <p className="w4-kicker w4-arrive">{b.title}</p>
          <table className="w4-table w4-arrive" style={{ animationDelay: "60ms" }}>
            <thead>
              <tr>
                {b.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([what, meta, state, tone], i) => (
                <tr key={`${b.key}-${what}`} className="w4-arrive" style={{ animationDelay: `${100 + i * 60}ms` }}>
                  <td className="num">
                    <b>{what}</b>
                  </td>
                  <td className="num">{meta}</td>
                  <td>
                    <span className="w32-status" data-tone={tone}>
                      {state}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="w4-row-meta mt-3">{b.foot}</p>
        </div>

        <div className="w4-ws-place w4-arrive" style={{ animationDelay: "120ms" }}>
          <DemoPhoto scene={b.scene} className="h-28 w-full" label={false} />
          <ul className="w4-ws-people" aria-hidden="true">
            {b.people.map((p) => (
              <li key={p.name}>
                <Character name={p.name} action="idle" className="w-10" />
                <span>{p.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="w4-adapt-lower">
        <div className="w4-diff" aria-label="What is called what">
          <p className="w4-kicker">The same place, in each business’s words</p>
          <ul>
            {DIFF.map(([a, o]) => (
              <li key={a}>
                <span data-on={which === "abc"}>{a}</span>
                <i aria-hidden="true" />
                <span data-on={which === "omega"}>{o}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="w4-modules">
          <p className="w4-kicker">Start with what {b.name} needs. Add the rest when it does.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {b.modules.map((m) => {
              const isOn = live.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  className="w4-module"
                  data-on={isOn}
                  aria-pressed={isOn}
                  onClick={() =>
                    setOn((s) => ({
                      ...s,
                      [which]: isOn ? s[which].filter((x) => x !== m.id) : [...s[which], m.id],
                    }))
                  }
                >
                  <i aria-hidden="true" />
                  {m.name}
                  <span className="w4-module-state">{isOn ? "on" : "add"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
