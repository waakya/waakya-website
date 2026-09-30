"use client";

import * as React from "react";

import { DemoPhoto } from "./demo-photo";
import { StoryControl, StoryDots, useSequence } from "./v35-seq";

/**
 * Two synchronised worlds. On the left, the customer's phone: a message, her
 * own page, one decision. Between them, the crossing: her choice travels from
 * her side into the business. On the right, the business: the rows that were
 * waiting on her stop waiting, a vendor gets an order, the next job opens.
 * One tap, every consequence of it, visible in one frame.
 */
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

export function CustomerLoop() {
  const { ref, step, playing, setPlaying, pick, replay, done } = useSequence(LOOP.length, 1100);
  const at = (k: (typeof LOOP)[number]["key"]) => LOOP.findIndex((s) => s.key === k);
  const opened = step >= at("open");
  const needs = step >= at("needs");
  const chosen = step >= at("chose");
  const crossed = step >= at("cross");
  const team = step >= at("team");
  const next = step >= at("next");
  const pct = crossed ? 74 : 71;
  const [laminate, setLaminate] = React.useState<(typeof SWATCHES)[number]["name"]>("Walnut");
  const swatch = SWATCHES.find((s) => s.name === laminate)!;
  const say = LOOP[step].key === "chose" ? `She picks ${laminate}` : LOOP[step].say;

  return (
    <div ref={ref} className="w35-cx w4-cx">
      <div className="w4-cx-worlds">
        {/* ------------------------------------------------------ her side */}
        <div className="w4-cx-her">
          <p className="w4-cx-side">
            <span className="w4-kicker">Customer side</span>
            <b>Sterling Group</b>
          </p>
          <div className="w4-phone">
            <div className="w4-phone-status">
              <span className="num">9:41</span>
              <span className="num">{opened ? "waakya.abcinteriors.com" : "WhatsApp"}</span>
            </div>

            {opened ? (
              <div className="w4-phone-page">
                <p className="w4-kicker w4-phone-kicker">Your Kharadi office</p>
                <div className="flex items-end gap-3">
                  <p className="num w4-display w4-phone-pct">{pct}%</p>
                  <p className="w32-status mb-1" data-tone="done">
                    On track
                  </p>
                </div>
                <div className="w32-progress mt-2">
                  <span style={{ width: `${pct}%` }} />
                </div>
                <DemoPhoto scene="reception" className="mt-3 h-24" caption="Reception complete · today" label={false} />
                <p className="w4-phone-next num">Next · conference room lighting, Friday</p>

                <div className="w4-needsyou" data-on={needs}>
                  <p className="w4-kicker">Needs you</p>
                  <p className="w4-needsyou-what">Choose your laminate</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SWATCHES.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        className="w4-swatch"
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
                  <p className="w32-status mt-2" data-tone="done" data-on={chosen} style={{ opacity: chosen ? 1 : 0 }}>
                    {laminate} approved
                  </p>
                </div>
              </div>
            ) : (
              <div className="w4-phone-page">
                <div className="w4-wa">
                  <p className="w4-kicker">ABC Interiors</p>
                  <p className="w4-wa-text">Reception is complete. Your Kharadi office is 71% done.</p>
                  <p className="num w4-wa-link">waakya.abcinteriors.com/sterling</p>
                  <span className="num w4-wa-time">2:14 pm</span>
                </div>
                <p className="w4-phone-note">She taps the link — nothing to install, no password.</p>
              </div>
            )}
          </div>
        </div>

        {/* --------------------------------------------------- the crossing */}
        <div className="w4-cross" aria-hidden="true" data-on={crossed} data-chosen={chosen}>
          <svg viewBox="0 0 120 200" preserveAspectRatio="none">
            <path d="M0 100 C 40 100, 80 100, 120 100" className="w4-cross-rail" pathLength={1} />
            <path d="M0 100 C 40 100, 80 100, 120 100" className="w4-cross-live" pathLength={1} />
          </svg>
          {chosen ? (
            <span className="w4-cross-chip">
              <i style={{ background: swatch.colour }} />
              {laminate} ✓
            </span>
          ) : null}
          <span className="w4-cross-word">{crossed ? "approved" : chosen ? "sending" : "waiting on her"}</span>
        </div>

        {/* ------------------------------------------------- the business */}
        <div className="w4-cx-biz">
          <p className="w4-cx-side">
            <span className="w4-kicker">Business side</span>
            <b>Inside ABC Interiors · Sterling Group, Kharadi</b>
          </p>
          <ul className="w4-rows">
            <li className="w4-row">
              <span className="min-w-0 flex-1">
                <b>Reception</b>
                <span className="w4-row-meta">Rahul · false ceiling</span>
              </span>
              <span className="w32-status" data-tone="done">
                Complete
              </span>
            </li>
            <li className="w4-row" data-changed={crossed}>
              <span className="min-w-0 flex-1">
                <b>Laminate</b>
                <span className="w4-row-meta">{crossed ? `${laminate} · approved by Sterling, 2:20 pm` : team ? "" : "Neha · sent to Sterling to choose"}</span>
              </span>
              <span className="w32-status" data-tone={crossed ? "done" : "wait"}>
                {crossed ? "Approved" : "Waiting on customer"}
              </span>
            </li>
            <li className="w4-row" data-changed={next}>
              <span className="min-w-0 flex-1">
                <b>Shutters · Deccan</b>
                <span className="w4-row-meta">{next ? "Deccan · order received, 12 units" : "Deccan · 12 units, waiting"}</span>
              </span>
              <span className="w32-status" data-tone={next ? "go" : "wait"}>
                {next ? `Ordered · ${laminate}` : "Waiting on laminate"}
              </span>
            </li>
            <li className="w4-row" data-changed={next}>
              <span className="min-w-0 flex-1">
                <b>Conference room lighting</b>
                <span className="w4-row-meta">{next ? "Rahul · next job, Friday" : "Rahul · blocked by the shutters"}</span>
              </span>
              <span className="w32-status" data-tone={next ? "go" : "wait"}>
                {next ? "Active" : "Waiting"}
              </span>
            </li>
          </ul>

          <ol className="w4-effects-list" aria-label="What that one tap did">
            {/* Each consequence is written in its waiting state first, so the
                list is complete before her tap and changes because of it. */}
            {(
              [
                ["Approval not recorded yet", "Approval recorded on the project", crossed],
                ["Neha is waiting on Sterling", "Neha stops waiting", team],
                ["Deccan has no order yet", `Deccan gets the order · ${laminate}, 12 units`, next],
                ["Rahul’s lighting job is blocked", "Rahul’s next job opens", next],
              ] as const
            ).map(([before, after, on]) => (
              <li key={after} data-on={Boolean(on)}>
                <i aria-hidden="true" />
                {on ? after : before}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="w4-cx-foot">
        <p className="w4-display w4-line" data-on={done}>
          Your customer’s best experience is also how the work gets unblocked.
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
      <StoryDots count={LOOP.length} step={step} onPick={pick} labels={LOOP.map((s) => s.say)} className="w4-dots-light" />
      <p className="w4-say w4-say-light">{say}</p>
    </div>
  );
}
