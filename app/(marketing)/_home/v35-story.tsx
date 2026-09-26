"use client";

import * as React from "react";

import { Character } from "./characters";
import { DemoPhoto, type DemoScene } from "./demo-photo";
import { StoryControl, StoryDots, useSequence } from "./v35-seq";

/**
 * V3.5 — the same V3.4 story, made believable and made to move.
 *
 * One business runs through this whole page: ABC INTERIORS, commercial
 * interiors, Pune. Priya owns it, Neha runs the customers, Rahul is on site,
 * Deccan Shutters is the vendor. Three real customers recur — a new enquiry
 * (Meera Joshi), a live project (Sterling Group, Kharadi) and a quotation out
 * (the Pashan clinic). One calendar runs through every chapter: Monday is the
 * scattered day, Tuesday 23 September is the day that moves, Wednesday is the
 * owner's morning and the lighting is promised for Friday. Nothing in these
 * scenes contradicts anything else.
 *
 * The only other business on the page is Omega Builders, and it appears once,
 * on purpose, to show the same workspace holding a different trade.
 */

/* ============================================================== 1 · hero == */
const CHAIN: {
  kicker: string;
  head: string;
  meta: string;
  who?: Parameters<typeof Character>[0]["name"];
  photo?: DemoScene;
}[] = [
  { kicker: "A customer", head: "Meera Joshi", meta: "2,400 sq ft office · from your website", who: "desk" },
  { kicker: "Your business", head: "She becomes a customer", meta: "requirement, budget and thread in one record" },
  { kicker: "Your team", head: "Neha owns it", meta: "follow up by 11:00 — not “someone will call”", who: "manager" },
  { kicker: "The work", head: "Site measured", meta: "Rahul · Thursday, 4:00 pm", who: "site" },
  { kicker: "The proof", head: "3 photos, on the job", meta: "attached to the work, not lost in a chat", photo: "reception" },
  { kicker: "Back to her", head: "She can see it", meta: "her own page · what is done, what is next" },
];

/**
 * The promise, then the evidence, immediately: one loop of a real business
 * with a real name in it, six steps, no abstract dots travelling between
 * unnamed nodes.
 */
export function HeroChain() {
  const { ref, step, playing, setPlaying, pick, replay, done } = useSequence(CHAIN.length, 1100);

  return (
    <div ref={ref}>
      <ol className="w35-chain">
        {CHAIN.map((c, i) => (
          <li key={c.kicker + c.head} className="w35-chain-item" data-on={i <= step} data-now={i === step}>
            <button type="button" className="w35-chain-card" onClick={() => pick(i)} aria-current={i === step ? "step" : undefined}>
              <span className="w35-kicker">{c.kicker}</span>
              <span className="w35-chain-head">{c.head}</span>
              <span className="w35-chain-meta">{c.meta}</span>
              {c.who ? (
                <span className="w35-chain-fig" aria-hidden="true">
                  <Character name={c.who} action={i === step ? "working" : "idle"} className="w-10" />
                </span>
              ) : null}
              {c.photo ? <DemoPhoto scene={c.photo} className="mt-2 h-14 w-full" label={false} /> : null}
            </button>
            {i < CHAIN.length - 1 ? <span className="w35-chain-link" data-on={i < step} aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="w35-loop" data-on={done}>
          <span aria-hidden="true">↻</span> and the next job starts in the same place
        </p>
        <StoryControl
          playing={playing}
          done={done}
          label="the loop"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onReplay={replay}
        />
      </div>
    </div>
  );
}

/* =========================================================== 2 · scattered = */
const FRAGMENTS = [
  { where: "Your website", said: "“Need a quote for a 2,400 sq ft office.”", x: 5, y: 6 },
  { where: "WhatsApp", said: "“Bhej diya na? Kal bola tha.”", x: 52, y: 2 },
  { where: "Email", said: "Floor_plan_final.pdf", x: 27, y: 30 },
  { where: "A group chat", said: "“Meera ko kisne call kiya?”", x: 3, y: 54 },
  { where: "Excel", said: "leads_september.xlsx", x: 50, y: 40 },
  { where: "A phone call", said: "“Uska kya hua?”", x: 11, y: 76 },
];
const ROT = [-2.5, 1.8, -1, 2.2, -2, 1.4];

/**
 * Recognition, then consequence. Six scraps of one Monday do not become six
 * tidy rows — that would only prove filing. They become one piece of work
 * with a name, an owner and a time on it.
 */
export function ScatterToWork() {
  const { ref, step, pick, replay, done } = useSequence(2, 2600);
  const together = step >= 1;

  return (
    <div ref={ref}>
      <div className="w32-scene w35-scatter" data-together={together}>
        <ul className="w35-frags">
          {FRAGMENTS.map((f, i) => (
            <li
              key={f.where}
              className="w35-frag"
              data-gone={together}
              style={{
                ["--i" as string]: String(i),
                ["--x0" as string]: String(f.x),
                ["--y0" as string]: String(f.y),
                ["--rot" as string]: `${ROT[i]}deg`,
                transitionDelay: `${i * 60}ms`,
              }}
            >
              <span className="w35-kicker">{f.where}</span>
              <span className="w35-frag-said">{f.said}</span>
            </li>
          ))}
        </ul>

        {/* what the six of them actually were */}
        <div className="w35-record" data-on={together}>
          <p className="w35-kicker">New enquiry · today</p>
          <p className="w32-display mt-1 text-[26px]">Meera Joshi</p>
          <p className="w32-row-meta">2,400 sq ft office · Baner</p>
          <dl className="w35-record-grid">
            <div>
              <dt className="w35-kicker">Owner</dt>
              <dd className="w35-record-val">
                <Character name="manager" action="idle" className="w-7" />
                Neha Singh
              </dd>
            </div>
            <div>
              <dt className="w35-kicker">Next action</dt>
              <dd className="w35-record-val">Call the customer</dd>
            </div>
            <div>
              <dt className="w35-kicker">By</dt>
              <dd className="num w35-record-val">11:00 am today</dd>
            </div>
          </dl>
          <p className="w35-record-related">
            <span className="w35-kicker">Everything attached</span>
            {["Website enquiry", "WhatsApp thread", "Requirement", "Floor plan"].map((r) => (
              <span key={r} className="w35-pill">
                {r}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="w32-display max-w-[24ch] text-[22px] leading-tight sm:text-[26px]">
          {together ? "One piece of work. Someone’s name on it." : "Six places. Nobody’s name on any of it."}
        </p>
        <button type="button" className="w35-control" onClick={() => (done ? replay() : pick(1))}>
          {together ? "↺ Show Monday again" : "▸ Bring it together"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================ 3 · the day == */
type Moment = {
  time: string;
  tag: string;
  thread: string;
  who: "meera" | "sterling" | "pashan" | "house";
  head: string;
  figure?: Parameters<typeof Character>[0]["name"];
  photo?: DemoScene;
  where: string;
  effects: string[];
};

const DAY: Moment[] = [
  {
    time: "9:12 am",
    tag: "New enquiry",
    thread: "Meera Joshi · 2,400 sq ft office",
    who: "meera",
    head: "An enquiry comes in from the website",
    figure: "desk",
    where: "Customers",
    effects: ["Customer record created, with her requirement", "Neha owns it", "Follow-up due 11:00 am"],
  },
  {
    time: "10:35 am",
    tag: "Live project",
    thread: "Sterling Group · Kharadi office",
    who: "sterling",
    head: "Rahul sends the reception proof from site",
    figure: "site",
    photo: "reception",
    where: "Projects",
    effects: ["Reception marked complete · 64% → 71%", "Sterling sees it on their own page", "Laminate choice sent to Sterling to approve"],
  },
  {
    time: "11:40 am",
    tag: "Quotation",
    thread: "Pashan clinic · fit-out",
    who: "pashan",
    head: "The quotation goes out",
    figure: "manager",
    where: "Customers",
    effects: ["₹19.4 lakh · Q-1184 sent", "Follow-up set for Thursday, 11:00 am", "Nobody has to remember it"],
  },
  {
    time: "2:20 pm",
    tag: "Customer approval",
    thread: "Sterling Group · Kharadi office",
    who: "sterling",
    head: "Sterling approves the Walnut laminate",
    where: "Customer experience",
    effects: ["Approval recorded against the project", "Shutter order released to Deccan · 12 units", "Conference-room lighting opens for Rahul"],
  },
  {
    time: "4:10 pm",
    tag: "Vendor",
    thread: "Deccan Shutters · 12 units",
    who: "house",
    head: "Deccan confirms the shutter order",
    figure: "road",
    photo: "material",
    where: "Vendors",
    effects: ["Dispatch due 3 October · Neha verifies it when it lands", "Handover date holds", "Nobody had to phone the vendor"],
  },
  {
    time: "5:30 pm",
    tag: "Only for you",
    thread: "Pashan clinic · fit-out",
    who: "pashan",
    head: "One thing actually needs the owner",
    figure: "owner",
    where: "Today",
    effects: ["Pashan wants the scope revised", "Everything else moved without you"],
  },
];

const TALLY = [
  ["3 people", "moved work forward"],
  ["2 customers", "were updated"],
  ["1 approval", "unlocked the next job"],
];

/**
 * The main product story: an established business getting through one real
 * day. Several customers, several projects, at plausible speeds — an enquiry
 * that arrives today does not become a finished reception by evening.
 */
export function BusinessDay() {
  const { ref, step, playing, setPlaying, pick, replay, done } = useSequence(DAY.length, 2600);

  return (
    <div ref={ref} className="w35-day">
      <ol className="w35-day-list">
        {DAY.map((m, i) => (
          <li key={m.time} className="w35-moment" data-on={i <= step} data-now={i === step} data-thread={m.who}>
            <button type="button" className="w35-moment-card" onClick={() => pick(i)} aria-current={i === step ? "step" : undefined}>
              <span className="w35-moment-head">
                <span className="num w35-time">{m.time}</span>
                <span className="w35-tag">{m.tag}</span>
                <span className="w35-thread">{m.thread}</span>
              </span>

              <span className="w35-moment-body">
                {/* the slot is always there, so every headline starts on the
                    same line whether or not this beat has a person in it */}
                <span className="w35-moment-fig" aria-hidden="true">
                  {m.figure ? <Character name={m.figure} action={i === step ? "working" : "idle"} className="w-11" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="w35-moment-what">{m.head}</span>
                  {/* consequences arrive with their moment — reserving the
                      space for them left a hole in every beat still to come */}
                  {i <= step ? (
                    <span className="w35-effects">
                      {m.effects.map((e) => (
                        <span key={e} className="w35-effect">
                          {e}
                        </span>
                      ))}
                    </span>
                  ) : null}
                  <span className="w35-where">
                    in <b>{m.where}</b>
                  </span>
                </span>
              </span>

              {m.photo && i <= step ? <DemoPhoto scene={m.photo} className="w35-moment-photo" label={false} /> : null}
            </button>
          </li>
        ))}
      </ol>

      <aside className="w35-today">
        <p className="w35-kicker">Today, at ABC Interiors</p>
        <dl className="mt-3">
          {TALLY.map(([n, what]) => (
            <div key={n} className="w35-today-row">
              <dt className="num w32-display text-[26px] text-neel-700">{n}</dt>
              <dd className="w32-sentence">{what}</dd>
            </div>
          ))}
        </dl>
        <p className="w35-today-zero">
          <span className="num w32-display text-[30px]">0</span>
          <span>times you had to chase anyone</span>
        </p>
        <div className="w35-today-end" data-on={done}>
          <p className="w32-display text-[24px] leading-tight">The day moved. You only turned up once.</p>
        </div>
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
  );
}

/* ====================================================== 4 · conversation == */
const TALK = [
  {
    key: "said",
    kicker: "In the Sterling site group",
    head: "“Rahul, Sterling ka conference room lighting Friday tak kar dena.”",
    meta: "Priya · Wednesday, 9:05 am",
  },
  {
    key: "commit",
    kicker: "Waakya reads the commitment",
    head: "Conference-room lighting",
    meta: "Who Rahul · By Friday, 6:00 pm · For Sterling Group",
  },
  { key: "work", kicker: "It becomes work", head: "Accepted by Rahul", meta: "on the Kharadi project · due Friday" },
  { key: "proof", kicker: "It comes back with proof", head: "4 photos from site", meta: "Friday, 3:41 pm" },
  { key: "record", kicker: "And it stays", head: "Verified by Neha", meta: "on the project, on the customer, for good" },
];

/**
 * Not an origin story — the mechanism, running now. A sentence anybody would
 * say in a group becomes a commitment with a name and a time, then work, then
 * proof, then a record nobody has to remember.
 */
export function ConversationToWork() {
  const { ref, step, playing, setPlaying, pick, replay, done } = useSequence(TALK.length, 1700);

  return (
    <div ref={ref}>
      <ol className="w35-talk">
        {TALK.map((t, i) => (
          <li key={t.key} className="w35-talk-step" data-on={i <= step} data-now={i === step} data-kind={t.key}>
            <button type="button" className="w35-talk-card" onClick={() => pick(i)} aria-current={i === step ? "step" : undefined}>
              <span className="w35-kicker">{t.kicker}</span>
              <span className="w35-talk-head">{t.head}</span>
              <span className="num w35-talk-meta">{t.meta}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="w32-display max-w-[30ch] text-[22px] leading-tight">
          Said once. Owned, done, proved and kept — without anyone typing it again.
        </p>
        <StoryControl
          playing={playing}
          done={done}
          label="this"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onReplay={replay}
        />
      </div>
      <StoryDots count={TALK.length} step={step} onPick={pick} labels={TALK.map((t) => t.kicker)} />
    </div>
  );
}
