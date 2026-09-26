"use client";

import * as React from "react";

import { Ticks } from "@/components/waakya/ticks";
import { Character } from "./characters";
import { DemoPhoto } from "./demo-photo";
import { StoryControl, StoryDots, useSequence } from "./v35-seq";

/**
 * Waakya's signature mechanism, running: a sentence in a group chat becomes
 * a commitment (who, what, when, for whom), then work, then proof, then a
 * record. The chat is on the left, the commitment on the right; the reading
 * is visible — the four parts of the sentence are marked in the message and
 * land in the four fields — and the work then moves along the same six-step
 * stepper the product uses: Bheja · Dekha · Maana · Chal raha · Ho gaya ·
 * Verified.
 */
const STEPS = [
  { key: "said", kicker: "Said, in the Sterling site group", say: "Priya says it once" },
  { key: "commit", kicker: "Read as a commitment", say: "Waakya reads who, what, when and for whom" },
  { key: "work", kicker: "Accepted, on site", say: "Rahul accepts it; the clock starts" },
  { key: "proof", kicker: "Back with proof", say: "Four photos come back from site" },
  { key: "record", kicker: "Verified, and kept", say: "Neha verifies it; it stays on the project and the customer" },
] as const;

const STEPPER = ["Bheja", "Dekha", "Maana", "Chal raha", "Ho gaya", "Verified"] as const;
const STEPPER_AT = [0, 1, 3, 3, 4, 5]; // which stepper step each story step reaches
const STEPPER_TIME = ["Wed 9:05", "Wed 9:06", "Wed 9:11", "Wed 9:11", "Fri 3:41", "Fri 5:10"];

export function ConversationToWork() {
  const { ref, step, playing, setPlaying, pick, replay, done } = useSequence(STEPS.length, 1900);
  const read = step >= 1;
  const accepted = step >= 2;
  const proved = step >= 3;
  const verified = step >= 4;
  const reached = STEPPER_AT[step];

  return (
    <div ref={ref} className="w4-talk" data-read={read}>
      <div className="w4-talk-grid">
        {/* ------------------------------------------------- the message */}
        <div className="w4-chat" aria-label="The Sterling site group">
          <p className="w4-chat-top">
            <b>Sterling site</b>
            <span className="num">Priya, Neha, Rahul, Imran</span>
          </p>
          <div className="w4-chat-msg">
            <span className="w4-chat-avatar" aria-hidden="true">
              <Character name="owner" action={step === 0 ? "talking" : "idle"} className="w-9" />
            </span>
            <div className="w4-chat-bubble">
              <span className="w4-chat-who">Priya</span>
              <p className="w4-chat-text">
                <mark data-part="who" data-on={read}>
                  <small>who</small>Rahul
                </mark>
                , <mark data-part="for" data-on={read}>
                  <small>for</small>Sterling
                </mark>{" "}
                ka{" "}
                <mark data-part="what" data-on={read}>
                  <small>what</small>conference room lighting
                </mark>{" "}
                <mark data-part="when" data-on={read}>
                  <small>when</small>Friday tak
                </mark>{" "}
                kar dena.
              </p>
              <span className="num w4-chat-time">Wednesday · 9:05 am</span>
            </div>
          </div>
          <p className="w4-chat-read" data-on={read}>
            <Ticks state={verified ? "verified" : proved ? "done" : accepted ? "accepted" : "seen"} size={14} />
            {verified ? "Verified · on the project" : proved ? "Ho gaya · proof attached" : accepted ? "Maana · Rahul accepted" : "Waakya read it"}
          </p>
          {accepted ? (
            <div className="w4-chat-msg w4-chat-msg-reply">
              <span className="w4-chat-avatar" aria-hidden="true">
                <Character name="site" action={proved ? "uploading" : "working"} className="w-9" />
              </span>
              <div className="w4-chat-bubble" data-mine={false}>
                <span className="w4-chat-who">Rahul</span>
                <p className="w4-chat-text">{proved ? "Ho gaya. Photos attached." : "Ho jayega."}</p>
                <span className="num w4-chat-time">{proved ? "Friday · 3:41 pm" : "Wednesday · 9:11 am"}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* ---------------------------------------------- the commitment */}
        <div className="w4-work" data-on={read}>
          <p className="w4-kicker">Work · from a conversation</p>
          <p className="w4-work-title" data-on={read}>
            Conference-room lighting
          </p>
          <dl className="w4-work-fields">
            <div data-part="who" data-on={read}>
              <dt>Who</dt>
              <dd>
                <Character name="site" action="idle" className="w-6" />
                Rahul
              </dd>
            </div>
            <div data-part="when" data-on={read}>
              <dt>When</dt>
              <dd className="num">Friday, 6:00 pm</dd>
            </div>
            <div data-part="for" data-on={read}>
              <dt>For</dt>
              <dd>Sterling Group · Kharadi</dd>
            </div>
          </dl>

          <ol className="w4-stepper" aria-label="Where the work is">
            {STEPPER.map((s, i) => (
              <li key={s} data-done={i < reached} data-now={i === reached} data-verified={i === 5 && reached === 5}>
                <i aria-hidden="true" />
                <span>{s}</span>
                <span className="num w4-stepper-time">{i <= reached ? STEPPER_TIME[i] : ""}</span>
              </li>
            ))}
          </ol>
          <div className="w4-clock" aria-hidden="true">
            <span className="w4-kicker">Completion clock</span>
            <span className="w4-clock-bar">
              <i style={{ width: verified ? "100%" : proved ? "92%" : accepted ? "6%" : "2%" }} data-tone={verified ? "hara" : proved ? "amber" : "neel"} />
            </span>
            <span className="num w4-clock-right">{verified ? "done Friday, 3:41 pm · verified 5:10 pm" : proved ? "92% used · done, waiting for verification" : "Friday, 6:00 pm · reminders at 50% and 90%"}</span>
          </div>

          <div className="w4-proof" data-on={proved} aria-hidden={!proved}>
            <span className="w4-kicker">Proof · Friday, 3:41 pm</span>
            <div className="w4-proof-strip">
              <DemoPhoto scene="openfloor" className="w4-proof-photo" label={false} />
              <DemoPhoto scene="site" className="w4-proof-photo" label={false} />
              <DemoPhoto scene="reception" className="w4-proof-photo" label={false} />
              <DemoPhoto scene="material" className="w4-proof-photo" label={false} />
            </div>
          </div>

          <p className="w4-verified" data-on={verified}>
            <Ticks state="verified" size={18} animate={verified} />
            <span>
              <b>Verified by Neha</b> · Friday, 5:10 pm · on the Kharadi project, on Sterling’s record, for good
            </span>
          </p>
        </div>
      </div>

      <div className="w4-talk-foot">
        <p className="w4-display w4-line">Said once. Owned, done, proved and kept — without anyone typing it again.</p>
        <StoryControl
          playing={playing}
          done={done}
          label="this"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onReplay={replay}
        />
      </div>
      <StoryDots count={STEPS.length} step={step} onPick={pick} labels={STEPS.map((s) => s.kicker)} />
      <p className="w4-say">{STEPS[step].say}</p>
    </div>
  );
}
