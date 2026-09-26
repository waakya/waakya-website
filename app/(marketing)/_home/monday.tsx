"use client";

import * as React from "react";

import { Character } from "./characters";
import { useSequence } from "./v35-seq";

/**
 * Monday: six scraps of one enquiry, in six places, becoming one piece of
 * work with a name on it.
 *
 * Both halves are on the page from the first frame. On the left, the scraps
 * — each drawn as the thing it is (a website form, a WhatsApp bubble, an
 * email attachment, a group chat, a spreadsheet row, a missed call). On the
 * right, the record, which starts honest: a customer with nobody's name on
 * her. The change is wiring: each scrap's stub joins the bus, the bus feeds
 * the record, and the record's empty fields fill. Nothing leaves the frame,
 * so there is never a blank stage — before, during or after.
 */
type Scrap = {
  kind: "web" | "wa" | "mail" | "chat" | "xls" | "call";
  where: string;
  said: string;
  meta: string;
};

const SCRAPS: Scrap[] = [
  { kind: "web", where: "Your website", said: "“Need a quote for a 2,400 sq ft office.”", meta: "abcinteriors.com · contact form · Mon 9:12" },
  { kind: "wa", where: "WhatsApp", said: "“Bhej diya na? Kal bola tha.”", meta: "Meera · 4:31 pm" },
  { kind: "mail", where: "Email", said: "Floor_plan_final.pdf", meta: "2.4 MB · Fwd: Fwd: Baner office" },
  { kind: "chat", where: "A group chat", said: "“Meera ko kisne call kiya?”", meta: "ABC Team · 14 unread" },
  { kind: "xls", where: "Excel", said: "leads_sept.xlsx", meta: "row 41 · Meera J · “follow up”" },
  { kind: "call", where: "A phone call", said: "“Uska kya hua?”", meta: "Priya → Neha · 4:40 pm · 0:42" },
];

const ATTACHED = ["Website enquiry", "WhatsApp thread", "Floor plan", "Requirement"];

export function Monday() {
  const { ref, step, pick, replay, done } = useSequence(2, 2400, { threshold: 0.5 });
  const together = step >= 1;

  return (
    <div ref={ref} className="w4-monday" data-on={together}>
      <div className="w4-monday-scene">
        <ul className="w4-scraps" aria-label="Where the enquiry is on Monday">
          {SCRAPS.map((s, i) => (
            <li key={s.kind} className="w4-scrap" data-kind={s.kind} style={{ ["--i" as string]: String(i) }}>
              <span className="w4-scrap-chrome" aria-hidden="true">
                {s.kind === "web" ? (
                  <>
                    <i /> <i /> <i />
                    <b>abcinteriors.com/contact</b>
                  </>
                ) : s.kind === "wa" ? (
                  <b>Meera Joshi</b>
                ) : s.kind === "mail" ? (
                  <b>1 attachment</b>
                ) : s.kind === "chat" ? (
                  <b>ABC Team · group</b>
                ) : s.kind === "xls" ? (
                  <>
                    <b>A</b>
                    <b>B</b>
                    <b>C</b>
                    <b>D</b>
                  </>
                ) : (
                  <b>Missed call · 2</b>
                )}
              </span>
              <span className="w4-kicker">{s.where}</span>
              <span className="w4-scrap-said">{s.said}</span>
              <span className="num w4-scrap-meta">{s.meta}</span>
              <span className="w4-scrap-stub" aria-hidden="true" />
              <span className="w4-scrap-tag" aria-hidden="true">
                attached
              </span>
            </li>
          ))}
        </ul>

        <div className="w4-bus" aria-hidden="true">
          <i className="w4-bus-line" />
          <i className="w4-bus-arrow" />
        </div>

        <div className="w4-record">
          <p className="w4-kicker w4-record-kicker">
            {together ? "New enquiry · owned" : "New enquiry · nobody’s name on it"}
          </p>
          <p className="w4-display w4-record-name">Meera Joshi</p>
          <p className="num w4-record-sub">2,400 sq ft office · Baner</p>

          <dl className="w4-record-fields">
            <div data-filled={together}>
              <dt className="w4-kicker">Owner</dt>
              <dd className="w4-record-val">
                {together ? (
                  <>
                    <Character name="manager" action="idle" className="w-7" />
                    Neha Singh
                  </>
                ) : (
                  <span className="w4-empty">nobody yet</span>
                )}
              </dd>
            </div>
            <div data-filled={together}>
              <dt className="w4-kicker">Next action</dt>
              <dd className="w4-record-val">{together ? "Call the customer" : <span className="w4-empty">not decided</span>}</dd>
            </div>
            <div data-filled={together}>
              <dt className="w4-kicker">By</dt>
              <dd className="num w4-record-val">{together ? "11:00 am today" : <span className="w4-empty">no time set</span>}</dd>
            </div>
          </dl>

          <div className="w4-record-attached">
            <span className="w4-kicker">{together ? "Everything attached" : "Attached"}</span>
            <ul>
              {ATTACHED.map((a, i) => (
                <li key={a} data-on={together} style={{ transitionDelay: `${360 + i * 80}ms` }}>
                  {a}
                </li>
              ))}
              {!together ? <li className="w4-empty">nothing — it is in six places</li> : null}
            </ul>
          </div>
        </div>
      </div>

      <div className="w4-monday-foot">
        <p className="w4-display w4-line">
          {together ? "One piece of work. Someone’s name on it." : "Six places. Nobody’s name on any of it."}
        </p>
        <button type="button" className="w4-control" onClick={() => (done ? replay() : pick(1))}>
          {together ? "↺ Show Monday again" : "▸ Bring it together"}
        </button>
      </div>
      <p className="w4-sentence mt-5 max-w-[56ch]">
        Waakya does not just collect all of it in one place. It turns it into work that has an owner, a next action
        and a time, which is the part a folder has never done for anyone.
      </p>
    </div>
  );
}
