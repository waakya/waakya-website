"use client";

import * as React from "react";

import { Character, type CharacterName } from "./characters";
import { DemoPhoto, type DemoScene } from "./demo-photo";
import { StoryControl, useSequence } from "./v35-seq";

/**
 * One business, one day, drawn as a day board: four lanes (Customers,
 * Projects, Vendors, You) against one clock from 9 am to 6 pm. Every moment
 * is a mark on its lane at its time; the consequences that cross lanes are
 * drawn as lines between marks, so you can see a customer's approval open a
 * vendor order and the vendor's confirmation open the next job on site.
 *
 * The whole board is on the page from the first frame, in outline. The story
 * moves the clock; marks fill as it passes them and the detail beneath the
 * board tells that moment. On a phone the same moments are one vertical
 * timeline with the current one open.
 */
type Lane = "customers" | "projects" | "vendors" | "you";

type Moment = {
  key: string;
  time: string;
  minutes: number; // since 9:00
  lane: Lane;
  tag: string;
  thread: string;
  head: string;
  figure?: CharacterName;
  photo?: DemoScene;
  where: string;
  effects: string[];
};

const LANES: { key: Lane; label: string }[] = [
  { key: "customers", label: "Customers" },
  { key: "projects", label: "Projects" },
  { key: "vendors", label: "Vendors" },
  { key: "you", label: "You" },
];

const DAY: Moment[] = [
  {
    key: "meera",
    time: "9:12 am",
    minutes: 12,
    lane: "customers",
    tag: "New enquiry",
    thread: "Meera Joshi · 2,400 sq ft office",
    head: "An enquiry comes in from the website",
    figure: "desk",
    where: "Customers",
    effects: ["Customer record created, with her requirement", "Neha owns it", "Follow-up due 11:00 am"],
  },
  {
    key: "proof",
    time: "10:35 am",
    minutes: 95,
    lane: "projects",
    tag: "Live project",
    thread: "Sterling Group · Kharadi office",
    head: "Rahul sends the reception proof from site",
    figure: "site",
    photo: "reception",
    where: "Projects",
    effects: ["Reception marked complete · 64% → 71%", "Sterling sees it on their own page", "Laminate choice sent to Sterling to approve"],
  },
  {
    key: "quote",
    time: "11:40 am",
    minutes: 160,
    lane: "customers",
    tag: "Quotation",
    thread: "Pashan clinic · fit-out",
    head: "The quotation goes out",
    figure: "manager",
    where: "Customers",
    effects: ["₹19.4 lakh · Q-1184 sent", "Follow-up set for Thursday, 11:00 am", "Nobody has to remember it"],
  },
  {
    key: "approve",
    time: "2:20 pm",
    minutes: 320,
    lane: "customers",
    tag: "Customer approval",
    thread: "Sterling Group · Kharadi office",
    head: "Sterling approves the Walnut laminate",
    where: "Customer experience",
    effects: ["Approval recorded against the project", "Shutter order released to Deccan · 12 units", "Conference-room lighting opens for Rahul"],
  },
  {
    key: "vendor",
    time: "4:10 pm",
    minutes: 430,
    lane: "vendors",
    tag: "Vendor",
    thread: "Deccan Shutters · 12 units",
    head: "Deccan confirms the shutter order",
    figure: "road",
    photo: "material",
    where: "Vendors",
    effects: ["Dispatch due 3 October · Neha verifies it when it lands", "Handover date holds", "Nobody had to phone the vendor"],
  },
  {
    key: "you",
    time: "5:30 pm",
    minutes: 510,
    lane: "you",
    tag: "Only for you",
    thread: "Pashan clinic · fit-out",
    head: "One thing actually needs the owner",
    figure: "owner",
    where: "Today",
    effects: ["Pashan wants the scope revised", "Everything else moved without you"],
  },
];

/** Consequences that cross lanes: from one moment to a place on another lane. */
const LINKS: { from: string; toLane: Lane; toMinutes: number; label: string; at: number; ghost?: boolean }[] = [
  { from: "proof", toLane: "customers", toMinutes: 320, label: "laminate to approve", at: 1 },
  { from: "approve", toLane: "vendors", toMinutes: 430, label: "shutter order released", at: 3 },
  // the one consequence that lands where no moment is: a new job opening on site
  { from: "approve", toLane: "projects", toMinutes: 335, label: "lighting opens for Rahul", at: 3, ghost: true },
];

const TALLY: [string, string][] = [
  ["3 people", "moved work forward"],
  ["2 customers", "were updated"],
  ["1 approval", "unlocked the next job"],
  ["0 times", "you had to chase anyone"],
];

const HOURS = ["9", "10", "11", "12", "1", "2", "3", "4", "5", "6"];
const SPAN = 540; // 9:00 → 18:00 in minutes
const x = (m: number) => (m / SPAN) * 100;
const laneY = (lane: Lane) => LANES.findIndex((l) => l.key === lane) * 100 + 50;

export function DayBoard() {
  const { ref, step, playing, setPlaying, pick, replay, done } = useSequence(DAY.length, 2400);
  const now = DAY[step];

  return (
    <div ref={ref} className="w4-day">
      {/* ------------------------------------------------ the board (≥ lg) */}
      <div className="w4-board" role="group" aria-label="Tuesday at ABC Interiors, by lane and hour">
        <div className="w4-board-axis" aria-hidden="true">
          <span className="w4-board-lanelabel" />
          <span className="w4-board-hours">
            {HOURS.map((h, i) => (
              <b key={h} className="num" style={{ left: `${x(i * 60)}%` }}>
                {h}
                {i === 0 ? " am" : i === 9 ? " pm" : ""}
              </b>
            ))}
          </span>
        </div>

        <div className="w4-board-lanes">
          {LANES.map((lane) => (
            <div key={lane.key} className="w4-lane" data-lane={lane.key}>
              <span className="w4-board-lanelabel">{lane.label}</span>
              <div className="w4-lane-track">
                {DAY.map((m, i) =>
                  m.lane === lane.key ? (
                    <button
                      key={m.key}
                      type="button"
                      className="w4-mark"
                      style={{ left: `${x(m.minutes)}%` }}
                      data-on={i <= step}
                      data-now={i === step}
                      aria-current={i === step ? "step" : undefined}
                      aria-label={`${m.time} · ${m.head}`}
                      onClick={() => pick(i)}
                    >
                      <i aria-hidden="true" />
                      <span className="num w4-mark-time">{m.time}</span>
                      <span className="w4-mark-tag">{m.tag}</span>
                    </button>
                  ) : null,
                )}
                {/* consequences that land on this lane */}
                {LINKS.filter((l) => l.ghost && l.toLane === lane.key).map((l) => (
                  <span
                    key={l.from + l.toLane}
                    className="w4-land"
                    data-on={step >= l.at}
                    style={{ left: `${x(l.toMinutes)}%` }}
                    aria-hidden="true"
                  >
                    <i />
                    <span>{l.label}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* the lines between lanes, drawn over the tracks */}
          <svg className="w4-board-links" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
            {LINKS.map((l) => {
              const from = DAY.find((m) => m.key === l.from)!;
              const x1 = x(from.minutes) * 10;
              const y1 = laneY(from.lane);
              const x2 = x(l.toMinutes) * 10;
              const y2 = laneY(l.toLane);
              const mx = (x1 + x2) / 2;
              return (
                <path
                  key={l.from + l.toLane}
                  d={`M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  data-on={step >= l.at}
                  pathLength={1}
                />
              );
            })}
          </svg>

          <span className="w4-board-now" style={{ left: `calc(var(--lane-label) + (100% - var(--lane-label)) * ${x(now.minutes) / 100})` }} aria-hidden="true">
            <b className="num">{now.time}</b>
          </span>
        </div>
      </div>

      {/* --------------------------------------------- the moment, in words */}
      <div className="w4-day-lower">
        <div className="w4-moment" key={now.key}>
          <div className="w4-moment-fig" aria-hidden="true">
            {now.figure ? <Character name={now.figure} action="working" className="w-16" /> : <Character name="manager" action="approving" className="w-16" />}
          </div>
          <div className="w4-moment-text">
            <p className="w4-moment-head">
              <span className="num w4-time">{now.time}</span>
              <span className="w4-tag">{now.tag}</span>
              <span className="w4-thread">{now.thread}</span>
            </p>
            <p className="w4-moment-what">{now.head}</p>
            <ul className="w4-effects">
              {now.effects.map((e, i) => (
                <li key={e} style={{ animationDelay: `${120 + i * 90}ms` }}>
                  {e}
                </li>
              ))}
            </ul>
            <p className="w4-where">
              in <b>{now.where}</b>
            </p>
          </div>
          {now.photo ? <DemoPhoto scene={now.photo} className="w4-moment-photo" label={false} /> : null}
        </div>

        {/* ------------------------------------------- the same day, < lg */}
        <ol className="w4-day-list" aria-label="Tuesday at ABC Interiors">
          {DAY.map((m, i) => (
            <li key={m.key} className="w4-day-item" data-on={i <= step} data-now={i === step} data-lane={m.lane}>
              <button type="button" className="w4-day-item-btn" onClick={() => pick(i)} aria-current={i === step ? "step" : undefined}>
                <span className="num w4-time">{m.time}</span>
                <span className="w4-day-item-main">
                  <span className="w4-day-item-lane">{LANES.find((l) => l.key === m.lane)!.label}</span>
                  <span className="w4-day-item-head">{m.head}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>

        <aside className="w4-tally" aria-label="Today, at ABC Interiors">
          <p className="w4-kicker">Today, at ABC Interiors</p>
          <dl>
            {TALLY.map(([n, what]) => (
              <div key={n} className="w4-tally-row" data-zero={n.startsWith("0")}>
                <dt className="num w4-display">{n}</dt>
                <dd>{what}</dd>
              </div>
            ))}
          </dl>
          <p className="w4-tally-end w4-display" data-on={done}>
            The day moved. You only turned up once.
          </p>
          <div className="mt-4">
            <StoryControl
              playing={playing}
              done={done}
              label="the day"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onReplay={replay}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
