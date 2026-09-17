"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Lock, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { Bubble, Composer, DocCard, Frame, Stamp, TaskCard } from "./mock";

const STEPS = [
  { id: "conversation", label: "Conversation" },
  { id: "assign", label: "Assign a task" },
  { id: "proof", label: "Submit proof" },
  { id: "verify", label: "Verify" },
] as const;

/**
 * One quotation, four steps. The panels are the product's own shapes with
 * sample data, so a visitor sees exactly what a team will see.
 */
export function Walkthrough() {
  const [index, setIndex] = React.useState(0);
  const step = STEPS[index];

  return (
    <div>
      <div role="tablist" aria-label="Walkthrough" className="flex justify-center gap-1 overflow-x-auto border-b border-[#e6e8f1]">
        {STEPS.map((item, i) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={i === index}
            onClick={() => setIndex(i)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-[14px] font-semibold transition-colors",
              i === index ? "border-neel-600 text-neel-700" : "border-transparent text-ink-500 hover:text-ink-900",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Frame className="mt-5" title="UrbanNest Interiors · Kitchen quotation">
        <div role="tabpanel" aria-label={step.label} className="grid gap-4 p-4 md:grid-cols-[1.2fr_1fr_0.9fr]">
          <div className="flex flex-col gap-3">
            <Bubble initials="PS" name="Priya Singh" time="11:24 AM" text="Rahul, send the revised quotation by 5 PM." highlight={index === 1} />
            <Bubble initials="RS" name="Rahul Sharma" time="11:26 AM" text="Got it. I'll share the revised quotation by 5 PM." />
            <Bubble initials="PS" name="Priya Singh" time="11:31 AM" text="Please use the latest BOQ and include both flooring options." />
            <Composer />
          </div>

          <div className="flex flex-col gap-2.5 md:border-l md:border-[#eceef6] md:pl-4">
            <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">Linked work</p>
            {index === 0 ? (
              <p className="rounded-[10px] border border-dashed border-[#dfe2ef] p-3 text-[12px] text-ink-400">
                Nothing yet. Any message can become a task.
              </p>
            ) : (
              <TaskCard
                title="Revised quotation"
                who="Rahul Sharma"
                due="Today, 5 PM"
                state={index === 1 ? "Accepted" : index === 2 ? "Submitted" : "Verified"}
                tone={index === 3 ? "hara" : index === 2 ? "amber" : "neel"}
              />
            )}
            {index >= 2 ? <DocCard name="Quotation-v2.pdf" meta="1.8 MB · attached by Rahul" state={index === 2 ? "To review" : undefined} /> : null}
            {index === 3 ? <Stamp text="Verified by Priya · 4:52 PM" /> : null}
          </div>

          <div className="rounded-[10px] border border-[#eceef6] bg-[#fafbfe] p-3">
            {index < 3 ? (
              <>
                <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-700">
                  <Lock className="size-3" aria-hidden="true" /> Only your team
                </p>
                <p className="mt-2 text-[12px] font-semibold text-ink-900">Notes for the quotation</p>
                <ul className="mt-1 list-disc pl-4 text-[11.5px] leading-[18px] text-ink-500">
                  <li>Workstations, two variants</li>
                  <li>Conference room</li>
                  <li>Flooring, wooden and vinyl</li>
                  <li>Electrical and data points</li>
                </ul>
              </>
            ) : (
              <>
                <p className="text-[12px] font-semibold text-ink-900">Record</p>
                <ol className="mt-2 flex flex-col gap-1.5 text-[11.5px] text-ink-700">
                  {["Created 11:31 AM", "Seen 11:32 AM", "Accepted 11:33 AM", "Proof submitted 4:40 PM", "Verified 4:52 PM"].map((line) => (
                    <li key={line} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-neel-600" aria-hidden="true" />
                      {line}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-[#eceef6] px-4 py-2.5">
          <button
            type="button"
            onClick={() => setIndex((index + 1) % STEPS.length)}
            className="flex items-center gap-2 text-[13px] font-semibold text-neel-700"
          >
            <span className="grid size-6 place-items-center rounded-full bg-neel-600 text-white">
              <Play className="size-3" aria-hidden="true" />
            </span>
            Next step
          </button>
          <span className="num ml-auto text-[12px] text-ink-400">
            0{index + 1} / 04
          </span>
          <button type="button" aria-label="Previous step" onClick={() => setIndex(Math.max(0, index - 1))} className="grid size-7 place-items-center rounded-full border border-[#e6e8f1] text-ink-500">
            <ChevronLeft className="size-3.5" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Next step" onClick={() => setIndex(Math.min(STEPS.length - 1, index + 1))} className="grid size-7 place-items-center rounded-full border border-[#e6e8f1] text-ink-500">
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </button>
          <span className="hidden text-[11.5px] text-ink-400 sm:inline">Sample business data</span>
        </div>
      </Frame>
    </div>
  );
}
