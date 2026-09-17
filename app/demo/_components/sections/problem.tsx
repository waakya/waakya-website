"use client";

import {
  FileText,
  FolderOpen,
  ListChecks,
  Mail,
  MessageCircle,
  Phone,
  Table2,
} from "lucide-react";

import { Eyebrow, Lead, Stage, Title } from "../chrome";
import type { SectionProps } from "../../_lib/types";

const CHANNELS = [
  { id: "wa", icon: MessageCircle, name: "Messaging", line: "“Send it by 4”", tilt: "-3deg", delay: "0s" },
  { id: "call", icon: Phone, name: "Calls", line: "Agreed on a call", tilt: "2deg", delay: "0.6s" },
  { id: "mail", icon: Mail, name: "Email", line: "Re: Re: revised quote", tilt: "-1.5deg", delay: "1.2s" },
  { id: "xls", icon: Table2, name: "Spreadsheets", line: "tracker_final_v6", tilt: "2.5deg", delay: "0.3s" },
  { id: "drive", icon: FolderOpen, name: "Drive", line: "Shared folder (47)", tilt: "-2deg", delay: "0.9s" },
  { id: "doc", icon: FileText, name: "Documents", line: "Quotation_v2.pdf", tilt: "1.5deg", delay: "1.5s" },
  { id: "task", icon: ListChecks, name: "Task apps", line: "Nobody updated it", tilt: "-2.5deg", delay: "0.45s" },
];

const QUESTIONS = [
  "Who owns this?",
  "Did they accept it?",
  "What is overdue?",
  "Where is the quotation?",
  "Has the client approved it?",
  "Who completed this?",
  "Where is the proof?",
];

/**
 * The problem, shown rather than argued: seven places the work is scattered
 * across, and the seven questions that follow from that.
 */
export function ProblemSection(props: SectionProps) {
  void props;
  return (
    <Stage wide className="min-h-full">
      <Eyebrow className="wk-rise">The reality today</Eyebrow>
      <Title className="wk-rise wk-d1 mt-4 max-w-[20ch]">
        Your business is communicating everywhere. But where is the work?
      </Title>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="flex flex-wrap gap-3">
          {CHANNELS.map((channel, index) => {
            const Icon = channel.icon;
            return (
              <div
                key={channel.id}
                style={{ rotate: channel.tilt, animationDelay: channel.delay }}
                className={`wk-rise wk-drift wk-d${Math.min(index + 1, 6)} flex min-w-[150px] flex-1 items-center gap-3 rounded-[13px] border border-[var(--d-line)] bg-[var(--d-veil)] px-3.5 py-3`}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-[9px] border border-[var(--d-line)] bg-white">
                  <Icon className="size-4 text-[var(--d-accent-bright)]" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-[var(--d-text)]">
                    {channel.name}
                  </span>
                  <span className="block truncate text-[12px] text-[var(--d-faint)]">
                    {channel.line}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <div>
          <Lead className="wk-rise wk-d2">
            Nothing is missing, exactly. It is all there somewhere. The cost shows up the
            moment anyone has to ask a simple question.
          </Lead>

          <ul className="mt-6 flex flex-col gap-2.5">
            {QUESTIONS.map((question, index) => (
              <li
                key={question}
                style={{ animationDelay: `${0.25 + index * 0.09}s` }}
                className="wk-rise flex items-center gap-3 text-[17px] leading-[1.4] text-[var(--d-text)]"
              >
                <span
                  aria-hidden="true"
                  className="h-px w-6 shrink-0 bg-[var(--d-accent)] opacity-70"
                />
                {question}
              </li>
            ))}
          </ul>

          <p
            style={{ animationDelay: "1.1s" }}
            className="wk-rise mt-7 border-l-2 border-[var(--d-accent)] pl-4 text-[15px] leading-[1.6] text-[var(--d-dim)]"
          >
            Every one of those answers exists in somebody&rsquo;s phone. None of them is in
            your business.
          </p>
        </div>
      </div>
    </Stage>
  );
}
