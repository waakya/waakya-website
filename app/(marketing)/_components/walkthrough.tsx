"use client";

import * as React from "react";
import { ArrowRight, CalendarCheck, FileText, FolderKanban, MessageSquare, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { Bubble, Composer, DocCard, Frame, Stamp, TaskCard } from "./mock";

const STAGES = [
  {
    id: "conversation",
    stage: "Conversation",
    verb: "Talk",
    line: "Your team agrees things in a conversation, one to one or as a group.",
    uses: ["Conversations", "Files in chat"],
  },
  {
    id: "commitment",
    stage: "Commitment",
    verb: "Assign",
    line: "One tap turns the message into a task with an owner and a deadline.",
    uses: ["Message → Task", "Work", "Projects"],
  },
  {
    id: "execution",
    stage: "Execution",
    verb: "Execute",
    line: "The work moves on its own: seen, accepted, in progress. Nobody chases.",
    uses: ["Work", "Attendance", "Notifications"],
  },
  {
    id: "proof",
    stage: "Proof",
    verb: "Prove",
    line: "The quotation is attached as proof, and the owner verifies it.",
    uses: ["Documents", "Business templates", "Approvals"],
  },
  {
    id: "record",
    stage: "Record",
    verb: "Keep",
    line: "Every step is stamped with who and when, and stays findable.",
    uses: ["Record", "Search"],
  },
] as const;

/**
 * One quotation, from the message it was agreed in to the record it leaves.
 * The stages are a numbered grid rather than a scrolling tab strip, so every
 * label is readable on a 390px phone.
 */
export function Walkthrough() {
  const [index, setIndex] = React.useState(0);
  const stage = STAGES[index];
  const last = index === STAGES.length - 1;

  return (
    <div>
      <div role="tablist" aria-label="From conversation to record" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STAGES.map((item, i) => (
          <button
            key={item.id}
            id={`stage-tab-${item.id}`}
            role="tab"
            type="button"
            aria-selected={i === index}
            aria-controls="stage-panel"
            onClick={() => setIndex(i)}
            className={cn(
              "flex min-h-14 items-center gap-2.5 rounded-[12px] border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neel-600",
              i === index ? "border-neel-600 bg-neel-50" : "border-[#e3e6ee] bg-white hover:border-neel-300",
              i === STAGES.length - 1 && "col-span-2 sm:col-span-1",
            )}
          >
            <span
              className={cn(
                "num grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-bold",
                i === index ? "bg-neel-600 text-white" : i < index ? "bg-neel-100 text-neel-800" : "bg-[#eef0f5] text-ink-700",
              )}
            >
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-[14.5px] leading-tight font-bold text-neel-900">{item.stage}</span>
              <span className="block text-[12.5px] text-ink-500">{item.verb}</span>
            </span>
          </button>
        ))}
      </div>

      <div id="stage-panel" role="tabpanel" aria-labelledby={`stage-tab-${stage.id}`} className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="lg:pt-2">
          <p className="text-[13px] font-semibold tracking-[0.12em] text-neel-700 uppercase">
            Step {index + 1} · {stage.verb}
          </p>
          <h3 className="mt-1 font-display text-[30px] leading-[1.1] font-extrabold text-neel-900">{stage.stage}</h3>
          <p className="mt-2 max-w-md text-[16px] leading-[25px] text-ink-700">{stage.line}</p>
          <p className="mt-4 text-[13px] font-semibold text-ink-500">Inside Waakya</p>
          <p className="mt-1 text-[15px] font-semibold text-neel-800">{stage.uses.join(" · ")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {last ? (
              <>
                <a href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-button bg-neel-600 px-4 text-[15px] font-semibold text-white hover:bg-neel-700">
                  Get started <ArrowRight className="size-4" aria-hidden="true" />
                </a>
                <button type="button" onClick={() => setIndex(0)} className="min-h-11 px-2 text-[15px] font-semibold text-neel-700 hover:underline">
                  Start again
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIndex(index + 1)}
                className="inline-flex min-h-11 items-center gap-2 rounded-button border border-neel-200 bg-white px-4 text-[15px] font-semibold text-neel-700 hover:bg-neel-50"
              >
                Next: {STAGES[index + 1].stage} <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <Frame title="Sharma Interiors · Office renovation" chrome>
          <div className="grid gap-4 p-4 md:grid-cols-[1.15fr_0.85fr]">
            <div className="flex min-w-0 flex-col gap-3">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-500">
                <MessageSquare className="size-3.5" aria-hidden="true" /> Site team · 4 people
              </p>
              <Bubble initials="PS" name="Priya Sharma" time="11:24 AM" text="Rahul, please send the revised quotation by 5 PM." highlight={index === 0}>
                {index >= 1 ? (
                  <span className="mt-1.5 inline-flex items-center rounded-full bg-hara-100 px-2 py-0.5 text-[11px] font-semibold text-hara-700">
                    Task created
                  </span>
                ) : (
                  <span className="mt-1.5 inline-flex items-center rounded-[8px] border border-neel-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-neel-700">
                    Make task
                  </span>
                )}
              </Bubble>
              <Bubble initials="RV" name="Rahul Verma" time="11:26 AM" text="Got it. Using the latest BOQ, both flooring options." />
              <Composer />
            </div>

            <div className="flex min-w-0 flex-col gap-2.5 md:border-l md:border-[#eceef6] md:pl-4">
              {index === 0 ? (
                <p className="rounded-[10px] border border-dashed border-[#d9dcea] p-3 text-[12.5px] leading-[18px] text-ink-500">
                  Nothing assigned yet. Any message can become a task.
                </p>
              ) : null}
              {index >= 1 && index <= 3 ? (
                <TaskCard
                  title="Revised quotation"
                  who="Rahul Verma"
                  due="Today, 5 PM"
                  state={index === 1 ? "Sent · Office renovation" : index === 2 ? "In progress" : "Proof submitted"}
                  tone={index === 3 ? "amber" : "neel"}
                />
              ) : null}
              {index === 2 ? (
                <p className="flex items-center gap-1.5 text-[12px] text-ink-500">
                  <CalendarCheck className="size-3.5 shrink-0" aria-hidden="true" /> Rahul punched in at 9:41 AM
                </p>
              ) : null}
              {index === 3 ? (
                <>
                  <DocCard name="Quotation-v2.pdf" meta="PDF · 1.8 MB" />
                  <p className="flex items-center gap-1.5 text-[12px] text-ink-500">
                    <FileText className="size-3.5 shrink-0" aria-hidden="true" /> Made from the Quotation template
                  </p>
                  <p className="flex items-center gap-1.5 text-[12px] text-ink-500">
                    <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" /> Waiting for Priya to verify
                  </p>
                </>
              ) : null}
              {index === 4 ? (
                <div>
                  <Stamp text="Verified by Priya · 4:52 PM" />
                  <ol className="mt-3 flex flex-col gap-1.5 text-[12px] text-ink-700">
                    {[
                      ["Message", "11:24 AM"],
                      ["Task sent to Rahul", "11:31 AM"],
                      ["Seen and accepted", "11:33 AM"],
                      ["Proof submitted", "4:40 PM"],
                      ["Verified by Priya", "4:52 PM"],
                    ].map(([label, time]) => (
                      <li key={label} className="flex items-center gap-2">
                        <span className="size-1.5 shrink-0 rounded-full bg-neel-600" aria-hidden="true" />
                        <span className="flex-1">{label}</span>
                        <span className="num text-ink-500">{time}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-500">
                    <FolderKanban className="size-3.5 shrink-0" aria-hidden="true" /> Kept in Office renovation
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </Frame>
      </div>
    </div>
  );
}
