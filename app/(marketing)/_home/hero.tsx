"use client";

import Link from "next/link";
import * as React from "react";

import { Ticks, type TicksState } from "@/components/waakya/ticks";
import { Character } from "./characters";
import { DemoPhoto } from "./demo-photo";
import { StoryControl, useSequence } from "./v35-seq";

/**
 * The first viewport: the promise on the left; on the right, ONE customer's
 * record changing state (Visual V2). The Line along its top fills as the
 * work moves — enquiry, owner, site, proof, verified, her page — the state
 * word and the ticks glyph say where it stands, and the panel beneath shows
 * the thing each step produced. All six panels are laid out from the first
 * frame in the same place, so the record is complete before, during and
 * after the story runs.
 */
type Step = { key: string; mark: string; state: string; ticks: TicksState };

const STEPS: Step[] = [
  { key: "enquiry", mark: "Enquiry", state: "New enquiry", ticks: "sent" },
  { key: "owner", mark: "Owner", state: "Owned by Neha", ticks: "seen" },
  { key: "site", mark: "Site", state: "Site visit accepted", ticks: "accepted" },
  { key: "proof", mark: "Proof", state: "Measured · proof in", ticks: "done" },
  { key: "verified", mark: "Verified", state: "Verified", ticks: "verified" },
  { key: "page", mark: "Her page", state: "She can see it", ticks: "verified" },
];

export function Hero() {
  const { ref, step, playing, setPlaying, pick, replay, done } = useSequence(STEPS.length, 1300, { threshold: 0.25 });
  const verified = step >= 4;
  const now = STEPS[step];

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
          </div>

          <div ref={ref} className="w4-hero-evidence">
            <figure className="w4-rec" data-verified={verified} aria-label="One customer's record at ABC Interiors">
              <figcaption className="w4-rec-top">
                <span className="w4-kicker">ABC Interiors · customer record</span>
                <span className="w4-rec-name">Meera Joshi</span>
                <span className="num w4-rec-sub">2,400 sq ft office · Baner · from your website</span>
                <span className="w4-rec-state" aria-live="polite">
                  <Ticks state={now.ticks} size={20} animate={step === 4} />
                  <b>{now.state}</b>
                </span>
              </figcaption>

              {/* the Line: where this record's work has got to */}
              <ol className="w4-rec-line" aria-label="Where the work is">
                {STEPS.map((s, i) => (
                  <li key={s.key} data-on={i <= step} data-now={i === step} data-verified={i >= 4 && i <= step}>
                    <button type="button" onClick={() => pick(i)} aria-current={i === step ? "step" : undefined} aria-label={`${s.mark}: ${s.state}`}>
                      <i aria-hidden="true" />
                      <span>{s.mark}</span>
                    </button>
                  </li>
                ))}
              </ol>

              {/* what each step produced — every panel present, one shown */}
              <div className="w4-rec-stage">
                <div className="w4-rec-panel" data-on={step === 0} aria-hidden={step !== 0}>
                  <p className="w4-kicker">From abcinteriors.com · Mon 9:12</p>
                  <p className="w4-rec-quote">“Need a quote for a 2,400 sq ft office in Baner. Can someone come and measure?”</p>
                  <p className="w4-rec-meta">Waakya made her a customer record, with the requirement and the thread.</p>
                </div>
                <div className="w4-rec-panel" data-on={step === 1} aria-hidden={step !== 1}>
                  <div className="w4-rec-row">
                    <Character name="manager" action="working" className="w-12" />
                    <div>
                      <p className="w4-kicker">Owner</p>
                      <p className="w4-rec-big">Neha Singh</p>
                      <p className="num w4-rec-meta">Call Meera by 11:00 today — not “someone will call”.</p>
                    </div>
                  </div>
                </div>
                <div className="w4-rec-panel" data-on={step === 2} aria-hidden={step !== 2}>
                  <div className="w4-rec-row">
                    <Character name="site" action="walking" className="w-12" />
                    <div className="min-w-0 flex-1">
                      <p className="w4-kicker">Work · accepted by Rahul</p>
                      <p className="w4-rec-big">Site measurement</p>
                      <p className="num w4-rec-meta">Thursday, 4:00 pm · reminders at 50% and 90%</p>
                      <span className="w4-rec-clock" aria-hidden="true">
                        <i style={{ width: step >= 2 ? "34%" : "0%" }} />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w4-rec-panel" data-on={step === 3} aria-hidden={step !== 3}>
                  <p className="w4-kicker">Proof · Rahul · Thu 4:38</p>
                  <div className="w4-rec-photos">
                    <DemoPhoto scene="openfloor" className="w4-rec-photo" label={false} />
                    <DemoPhoto scene="site" className="w4-rec-photo" label={false} />
                    <DemoPhoto scene="reception" className="w4-rec-photo" label={false} />
                  </div>
                  <p className="w4-rec-meta">Attached to the work, not lost in a chat.</p>
                </div>
                <div className="w4-rec-panel" data-on={step === 4} aria-hidden={step !== 4}>
                  <div className="w4-rec-row">
                    <Ticks state="verified" size={40} animate={step === 4} />
                    <div>
                      <p className="w4-kicker">Verified · Thu 5:10</p>
                      <p className="w4-rec-big">Neha checked the measurements</p>
                      <p className="w4-rec-meta">It stays on Meera’s record, for good.</p>
                    </div>
                  </div>
                </div>
                <div className="w4-rec-panel" data-on={step === 5} aria-hidden={step !== 5}>
                  <div className="w4-rec-page">
                    <p className="num w4-rec-url">waakya.abcinteriors.com/meera</p>
                    <p className="w4-rec-big">Hello Meera.</p>
                    <ul>
                      <li data-done="true">Site measured · Thursday</li>
                      <li>Quotation · Friday</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="w4-rec-foot">
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
