"use client";

import { ArrowRight, Check, FileText } from "lucide-react";

import { Lead, PersonAvatar, Stage, StageButton, Title } from "../chrome";
import type { SectionProps } from "../../_lib/types";

/**
 * The opening frame. One statement, one promise, one way forward.
 *
 * The card on the right is the whole product argument in miniature: a sentence
 * somebody typed, and the accountable work it turned into.
 */
export function OpeningSection(props: SectionProps) {
  return (
    <Stage wide className="min-h-full">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <p className="wk-rise font-display text-[13px] font-extrabold tracking-[0.42em] text-[var(--d-accent)]">
            WAAKYA
          </p>

          <Title size="xl" className="wk-rise wk-d1 mt-6">
            The new era of business communication.
          </Title>

          <p className="wk-rise wk-d2 mt-7 font-display text-[clamp(20px,2.1vw,28px)] leading-[1.25] font-semibold text-[var(--d-accent-bright)]">
            All your business work.
            <br />
            One workspace.
          </p>

          <Lead className="wk-rise wk-d3 mt-5">
            Your team already agrees things all day, in messages and on calls. Waakya keeps
            what was agreed, who owns it, when it is due, and the proof that it was done.
          </Lead>

          <div className="wk-rise wk-d4 mt-9 flex flex-wrap items-center gap-3">
            <StageButton onClick={props.onNext}>
              See Waakya in action
              <ArrowRight aria-hidden="true" />
            </StageButton>
            <StageButton variant="ghost" onClick={() => props.onGoTo("home")}>
              Jump into the product
            </StageButton>
          </div>
        </div>

        {/* The argument, in one card. */}
        <div className="wk-rise wk-d3 wk-drift">
          <div className="rounded-[18px] border border-[var(--d-line)] bg-[var(--s-bg)] p-5 text-[var(--s-text)] shadow-[var(--d-shadow)]">
            <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[var(--s-faint)]">
              A message
            </p>
            <div className="mt-3 flex items-start gap-3">
              <PersonAvatar personId="aarav" size={32} />
              <div className="rounded-[12px] rounded-tl-[4px] bg-[var(--s-sub)] px-3.5 py-2.5 text-[13.5px] leading-[1.5]">
                Please revise the kitchen quotation with the new laminate pricing and send it
                by 4 PM.
              </div>
            </div>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--s-line)]" aria-hidden="true" />
              <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[var(--s-faint)]">
                becomes work
              </span>
              <span className="h-px flex-1 bg-[var(--s-line)]" aria-hidden="true" />
            </div>

            <div className="rounded-[12px] border border-[var(--s-line)] p-3.5">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 grid size-5 place-items-center rounded-full bg-[#14623a] text-white">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold">Revise kitchen quotation</p>
                  <p className="wk-tabnum mt-0.5 text-[12px] text-[var(--s-dim)]">
                    Rahul Sharma · Due today, 4:00 PM · Accepted 11:10 AM
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-[9px] bg-[var(--s-sub)] px-3 py-2">
                <FileText className="size-4 shrink-0 text-[#3541c4]" aria-hidden="true" />
                <span className="truncate text-[12.5px] font-medium">
                  Kitchen_Quotation_v3.pdf
                </span>
                <span className="wk-tabnum ml-auto shrink-0 text-[11.5px] text-[var(--s-faint)]">
                  Verified 3:44 PM
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}
