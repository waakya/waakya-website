"use client";

import { BadgeCheck, Check, Download, FileText, Play, Upload } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AppWindow,
  Chip,
  DemoButton,
  Eyebrow,
  PersonAvatar,
  PresenterNote,
  Stage,
  Timeline,
  Title,
} from "../chrome";
import { BUSINESS, TASK_FROM_CHAT, TASK_TIMELINE } from "../../_lib/data";
import { stageReached, useDemo, type TaskStage } from "../../_lib/store";
import type { SectionProps } from "../../_lib/types";

const STAGE_INDEX: Record<TaskStage, number> = {
  none: -1,
  created: 0,
  seen: 1,
  accepted: 2,
  in_progress: 3,
  submitted: 4,
  verified: 5,
};

/**
 * The same task, carried to the end: started, submitted with proof, verified.
 * The timeline is the point — every step is stamped with a time and a person.
 */
export function ExecutionSection(props: SectionProps) {
  void props;
  const { state, dispatch } = useDemo();

  // Before this section the task has at least been created and accepted.
  const stage: TaskStage = stageReached(state.stage, "accepted") ? state.stage : "accepted";
  const reached = STAGE_INDEX[stage];
  const submitted = stageReached(stage, "submitted");
  const verified = stageReached(stage, "verified");

  const nextAction = !stageReached(stage, "in_progress")
    ? { label: "Start work", icon: Play, stage: "in_progress" as TaskStage }
    : !submitted
      ? { label: "Submit proof", icon: Upload, stage: "submitted" as TaskStage }
      : !verified
        ? { label: "Verify work", icon: BadgeCheck, stage: "verified" as TaskStage }
        : null;

  return (
    <Stage wide className="min-h-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="wk-rise">Execution and proof</Eyebrow>
          <Title size="md" className="wk-rise wk-d1 mt-3 max-w-[24ch]">
            Done is not a word someone says. It is something you can see.
          </Title>
        </div>
        {nextAction ? (
          <DemoButton
            variant="primary"
            onClick={() => dispatch({ type: "setStage", stage: nextAction.stage })}
            className="wk-rise wk-d2 h-11 px-5 text-[15px]"
          >
            <nextAction.icon aria-hidden="true" />
            {nextAction.label}
          </DemoButton>
        ) : (
          <Chip tone="good" onDark icon={<BadgeCheck aria-hidden="true" />} className="wk-rise">
            Completed and on the record
          </Chip>
        )}
      </div>

      <div className="wk-pop wk-d2 mt-6">
        <AppWindow
          title={BUSINESS.name}
          subtitle="Task · Greenwood Residence — Tower B"
          bodyClassName="grid h-[min(58vh,520px)] grid-cols-1 overflow-hidden lg:grid-cols-[1fr_300px]"
        >
          {/* task body */}
          <div className="wk-scroll overflow-y-auto border-b border-[var(--s-line)] p-5 lg:border-r lg:border-b-0">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={verified ? "good" : "accent"}>
                {verified
                  ? "Verified"
                  : submitted
                    ? "Submitted, waiting for you"
                    : stageReached(stage, "in_progress")
                      ? "In progress"
                      : "Accepted"}
              </Chip>
              <Chip tone="neutral">{TASK_FROM_CHAT.due}</Chip>
              <Chip tone="bad">{TASK_FROM_CHAT.priority} priority</Chip>
            </div>

            <h3 className="mt-3 font-display text-[22px] font-bold">{TASK_FROM_CHAT.title}</h3>
            <p className="mt-2 max-w-[62ch] text-[13.5px] leading-[1.6] text-[var(--s-dim)]">
              {TASK_FROM_CHAT.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-5">
              <span className="flex items-center gap-2.5">
                <PersonAvatar personId="rahul" size={30} />
                <span>
                  <span className="block text-[13px] font-semibold">Rahul Sharma</span>
                  <span className="block text-[11.5px] text-[var(--s-faint)]">Doing it</span>
                </span>
              </span>
              <span className="flex items-center gap-2.5">
                <PersonAvatar personId="aarav" size={30} />
                <span>
                  <span className="block text-[13px] font-semibold">Aarav Mehta</span>
                  <span className="block text-[11.5px] text-[var(--s-faint)]">Asked for it</span>
                </span>
              </span>
            </div>

            {/* proof */}
            <div className="mt-6">
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--s-faint)]">
                Proof of work
              </p>

              {submitted ? (
                <div className="wk-pop mt-2.5 rounded-[12px] border border-[var(--s-line)] p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#eef0fe]">
                      <FileText className="size-4 text-[#3541c4]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold">
                        {TASK_FROM_CHAT.proofFile}
                      </span>
                      <span className="wk-tabnum block text-[11.5px] text-[var(--s-faint)]">
                        {TASK_FROM_CHAT.proofSize} · submitted 3:37 PM
                      </span>
                    </span>
                    <span className="grid size-8 shrink-0 place-items-center rounded-[9px] border border-[var(--s-line)]">
                      <Download className="size-3.5 text-[var(--s-dim)]" aria-hidden="true" />
                    </span>
                  </div>
                  <p className="mt-3 border-t border-[var(--s-line-soft)] pt-3 text-[13px] leading-[1.55] text-[var(--s-dim)]">
                    &ldquo;{TASK_FROM_CHAT.proofNote}&rdquo;
                  </p>
                  {verified ? (
                    <p className="wk-fade mt-3 flex items-center gap-2 rounded-[9px] bg-[#e6f6ee] px-3 py-2 text-[12.5px] font-semibold text-[#14623a]">
                      <Check className="size-3.5" aria-hidden="true" />
                      Verified by Aarav Mehta at 3:44 PM
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2.5 rounded-[12px] border border-dashed border-[var(--s-line)] px-3.5 py-6 text-center text-[13px] text-[var(--s-faint)]">
                  Nothing submitted yet. The task cannot be closed without it.
                </p>
              )}
            </div>
          </div>

          {/* timeline */}
          <div className="wk-scroll overflow-y-auto bg-[var(--s-sub)] p-5">
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[var(--s-faint)]">
              Activity
            </p>
            <div className="mt-3.5">
              <Timeline steps={TASK_TIMELINE} reachedUpTo={reached} />
            </div>
            <p
              className={cn(
                "mt-5 rounded-[10px] border border-[var(--s-line)] bg-[var(--s-bg)] px-3 py-2.5 text-[12px] leading-[1.5] text-[var(--s-dim)]",
                verified && "border-[#cfeddf] bg-[#e6f6ee] text-[#14623a]",
              )}
            >
              {verified
                ? "This record stays with the project permanently."
                : "Every step is stamped automatically. Nobody fills in a status."}
            </p>
          </div>
        </AppWindow>
      </div>

      <div className="mt-6">
        <PresenterNote>
          {verified
            ? "Six timestamps, one file, no chasing."
            : "Watch the right-hand column as the work moves."}
        </PresenterNote>
      </div>
    </Stage>
  );
}
