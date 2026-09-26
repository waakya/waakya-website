"use client";

import * as React from "react";

import { Character } from "./characters";

/**
 * How far it goes: four depths on one line, each further in than the last.
 * Not four cards — a progression, drawn as a rule with four stops that grow
 * as they go deeper. Beneath, the one worked example: a cost estimator that
 * exists only on ABC Interiors' website, landing in the same record, the same
 * person's day and the same project as everything else.
 */
const LEVELS = [
  { word: "Ready", say: "Customers, projects, work and documents, on day one." },
  { word: "Adapted", say: "Your stages, your fields, your approvals." },
  { word: "Connected", say: "Your website, WhatsApp and email." },
  { word: "Built for you", say: "The workflow that only your business has." },
];

const ABC_FLOW: { node: string; kind: "web" | "doc" | "record" | "chat" | "person" | "project" }[] = [
  { node: "Estimator on abcinteriors.com", kind: "web" },
  { node: "Floor plan", kind: "doc" },
  { node: "Customer record", kind: "record" },
  { node: "WhatsApp to Meera", kind: "chat" },
  { node: "Neha’s day", kind: "person" },
  { node: "Project", kind: "project" },
];

export function AdaptLevels({ intro }: { intro: React.ReactNode }) {
  const [i, setI] = React.useState(3);
  return (
    <div className="w4-levels">
      <div className="w4-levels-intro">{intro}</div>
      <div className="w4-levels-line">
        <ol className="w4-depth" aria-label="How far Waakya goes">
          {LEVELS.map((l, n) => (
            <li key={l.word} style={{ ["--n" as string]: String(n) }}>
              <button type="button" className="w4-depth-stop" data-on={n === i} data-past={n < i} aria-current={n === i ? "step" : undefined} onClick={() => setI(n)}>
                <i aria-hidden="true" />
                <span className="w4-depth-word">{l.word}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="w4-depth-say" key={i}>
          <span className="num w4-depth-n">{i + 1}</span>
          {LEVELS[i].say}
        </p>
      </div>

      <div className="w4-custom" data-deep={i === 3}>
        <p className="w4-kicker">What “built for you” means, once</p>
        <p className="w4-display w4-custom-line">ABC Interiors wins work with a cost estimator on their own website.</p>
        <ol className="w4-pipe" aria-label="Where an estimate goes">
          {ABC_FLOW.map((f, n) => (
            <li key={f.node} data-kind={f.kind} style={{ animationDelay: `${n * 70}ms` }}>
              <span className="w4-pipe-node">
                {f.kind === "person" ? <Character name="manager" action="working" className="w-7" /> : <i aria-hidden="true" />}
                {f.node}
              </span>
            </li>
          ))}
        </ol>
        <p className="w4-sentence mt-3 max-w-[56ch]">
          That estimator is theirs alone — and it still lands in the same customer record, the same salesperson’s day
          and the same project as everything else.
        </p>
      </div>
    </div>
  );
}
