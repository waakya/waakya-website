"use client";

import * as React from "react";


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

    </div>
  );
}
