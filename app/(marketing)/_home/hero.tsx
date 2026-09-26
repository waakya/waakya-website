"use client";

import Link from "next/link";
import * as React from "react";

import { Ticks, type TicksState } from "@/components/waakya/ticks";
import { Character, type CharacterName } from "./characters";
import { DemoPhoto } from "./demo-photo";
import { StoryControl, useSequence } from "./v35-seq";

/**
 * The first viewport: the promise on the left, the evidence on the right.
 *
 * The evidence is one customer's record — a ledger page from ABC Interiors
 * with six entries, from her first message to her own page. All six lines are
 * on the page from the first frame; the story moves a reading mark down the
 * ledger and the ticks glyph on each line reports its real state as it is
 * reached. Nothing appears out of nowhere, so the frame is complete before,
 * during and after.
 */
type Entry = {
  when: string;
  kicker: string;
  head: string;
  meta: string;
  ticks?: TicksState;
  who?: CharacterName;
  photos?: boolean;
  phone?: boolean;
};

const LEDGER: Entry[] = [
  { when: "Mon 9:12", kicker: "A customer", head: "Meera Joshi writes from your website", meta: "2,400 sq ft office · Baner · budget shared", who: "desk" },
  { when: "Mon 9:12", kicker: "Your business", head: "She becomes a customer", meta: "requirement, budget and the thread, in one record", ticks: "sent" },
  { when: "Mon 9:14", kicker: "Your team", head: "Neha owns it", meta: "follow-up by 11:00 — not “someone will call”", who: "manager", ticks: "seen" },
  { when: "Thu 4:00", kicker: "The work", head: "Site measured", meta: "Rahul · Thursday, 4:00 pm · on time", who: "site", ticks: "accepted" },
  { when: "Thu 4:38", kicker: "The proof", head: "3 photos, on the job", meta: "attached to the work, not lost in a chat", photos: true, ticks: "done" },
  { when: "Thu 4:40", kicker: "Back to her", head: "She can see it", meta: "her own page · what is done, what is next", phone: true, ticks: "verified" },
];

export function Hero() {
  const { ref, step, playing, setPlaying, pick, replay, done } = useSequence(LEDGER.length, 1500, { threshold: 0.25 });

  return (
    <section className="w4-hero">
      <div className="w4-wrap">
        <div className="w4-grid w4-hero-grid">
          <div className="w32-herocopy w4-hero-copy">
            <p className="w4-eyebrow">Bolo. Ho jayega.</p>
            <h1 className="w4-display w4-h1">
              Your entire business.
              <br />
              One workspace.
            </h1>
            <p className="w4-lede w4-hero-lede">
              Customers, team, operations and the follow-ups nobody has time for, together in one workspace, shaped
              around how your business already works.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
              <Link href="/login" className="w4-primary" style={{ minHeight: 48 }}>
                Start with my business
              </Link>
              <a href="#one-day" className="w4-act" style={{ minHeight: 44 }}>
                Watch a business run →
              </a>
            </div>
            <p className="w4-hero-note">
              A customer comes in. Waakya knows who she is. Someone owns the work. The work happens. Proof returns.
              She knows.
            </p>
          </div>

          <div ref={ref} className="w4-hero-evidence">
            <figure className="w4-ledger" aria-label="One customer's record at ABC Interiors">
              <figcaption className="w4-ledger-top">
                <span className="w4-kicker">Customer record · ABC Interiors</span>
                <span className="w4-ledger-name">Meera Joshi</span>
                <span className="w4-ledger-sub num">2,400 sq ft office · from your website</span>
                <span className="w4-ledger-state" data-done={done}>
                  <Ticks state={done ? "verified" : step >= 2 ? "seen" : "sent"} size={16} />
                  {done ? "Verified" : step >= 3 ? "In progress" : step >= 2 ? "Owned" : "New"}
                </span>
              </figcaption>

              <ol className="w35-chain w4-ledger-rows">
                {LEDGER.map((e, i) => (
                  <li key={e.head} className="w35-chain-item w4-ledger-row" data-on={i <= step} data-now={i === step}>
                    <button
                      type="button"
                      className="w35-chain-card w4-ledger-btn"
                      onClick={() => pick(i)}
                      aria-current={i === step ? "step" : undefined}
                    >
                      <span className="num w4-ledger-when">{e.when}</span>
                      <span className="w4-ledger-spine" aria-hidden="true">
                        <i />
                      </span>
                      <span className="w4-ledger-main">
                        <span className="w4-kicker">{e.kicker}</span>
                        <span className="w4-ledger-head">{e.head}</span>
                        <span className="w4-ledger-meta">{e.meta}</span>
                        {e.photos ? (
                          <span className="w4-ledger-photos" aria-hidden="true">
                            <DemoPhoto scene="reception" className="w4-ledger-photo" label={false} />
                            <DemoPhoto scene="openfloor" className="w4-ledger-photo" label={false} />
                            <DemoPhoto scene="site" className="w4-ledger-photo" label={false} />
                          </span>
                        ) : null}
                        {e.phone ? (
                          <span className="w4-ledger-page" aria-hidden="true">
                            <span className="w4-ledger-page-bar">
                              <i style={{ width: i <= step ? "38%" : "0%" }} />
                            </span>
                            <span className="num">waakya.abcinteriors.com/meera · 38% · next: quotation</span>
                          </span>
                        ) : null}
                      </span>
                      <span className="w4-ledger-end" aria-hidden="true">
                        {e.who ? <Character name={e.who} action={i === step ? "working" : "idle"} className="w-9" /> : null}
                        {e.ticks ? <Ticks state={i <= step ? e.ticks : "sent"} size={14} className="w4-ledger-ticks" /> : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>

              <div className="w4-ledger-foot">
                <p className="w4-loop" data-on={done}>
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
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
