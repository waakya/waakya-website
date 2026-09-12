"use client";

import {
  Activity,
  CheckCircle2,
  FileText,
  FolderKanban,
  Handshake,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Eyebrow, Lead, PresenterNote, Stage, Title } from "../chrome";
import type { SectionProps } from "../../_lib/types";

const LOOP = [
  { id: "conversation", label: "Conversation", note: "Something gets agreed" },
  { id: "commitment", label: "Commitment", note: "Someone owns it, by when" },
  { id: "execution", label: "Execution", note: "The work happens" },
  { id: "proof", label: "Proof", note: "It is shown, not claimed" },
  { id: "record", label: "Record", note: "It stays on the business" },
];

const CONNECTED = [
  { id: "people", icon: Users, label: "People" },
  { id: "messages", icon: MessageSquare, label: "Messages" },
  { id: "tasks", icon: CheckCircle2, label: "Tasks" },
  { id: "projects", icon: FolderKanban, label: "Projects" },
  { id: "documents", icon: FileText, label: "Documents" },
  { id: "approvals", icon: ShieldCheck, label: "Approvals" },
  { id: "proof", icon: Handshake, label: "Proof" },
  { id: "activity", icon: Activity, label: "Activity" },
];

/** The idea itself: communication that carries work, and one place it lives. */
export function IdeaSection(props: SectionProps) {
  void props;
  return (
    <Stage wide className="min-h-full">
      <Eyebrow className="wk-rise">The Waakya idea</Eyebrow>
      <Title className="wk-rise wk-d1 mt-4 max-w-[24ch]">
        Businesses do not need more messages. They need messages that move work forward.
      </Title>

      {/* The loop. */}
      <div className="relative mt-11">
        <span
          aria-hidden="true"
          className="wk-sweep absolute top-[21px] right-2 left-2 hidden h-px bg-gradient-to-r from-[var(--d-accent-deep)] via-[var(--d-accent)] to-transparent md:block"
        />
        <ol className="relative grid gap-5 sm:grid-cols-3 md:grid-cols-5">
          {LOOP.map((step, index) => (
            <li
              key={step.id}
              style={{ animationDelay: `${0.15 + index * 0.13}s` }}
              className="wk-rise"
            >
              <span className="grid size-[42px] place-items-center rounded-full border border-[var(--d-line)] bg-[var(--d-ground-2)] font-display text-[15px] font-extrabold text-[var(--d-accent-bright)]">
                {index + 1}
              </span>
              <p className="mt-3.5 font-display text-[19px] font-semibold text-[var(--d-text)]">
                {step.label}
              </p>
              <p className="mt-1 text-[13.5px] leading-[1.5] text-[var(--d-faint)]">
                {step.note}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div>
          <Title size="md" className="wk-rise wk-d3">
            One business workspace.
          </Title>
          <Lead className="wk-rise wk-d4 mt-4">
            Not another inbox to check. The conversation, the commitment it created, the
            document it produced and the approval that closed it are the same object, seen
            from different sides.
          </Lead>
          <div className="wk-rise wk-d5 mt-6">
            <PresenterNote>Communication is the entry point, not the product.</PresenterNote>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {CONNECTED.map((thing, index) => {
            const Icon = thing.icon;
            return (
              <div
                key={thing.id}
                style={{ animationDelay: `${0.3 + index * 0.06}s` }}
                className="wk-pop flex flex-col items-start gap-2.5 rounded-[13px] border border-[var(--d-line)] bg-[var(--d-veil)] px-3.5 py-3.5"
              >
                <Icon className="size-4 text-[var(--d-accent-bright)]" aria-hidden="true" />
                <span className="text-[13px] font-semibold text-[var(--d-text)]">
                  {thing.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Stage>
  );
}
