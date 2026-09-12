"use client";

import { Check, ShieldCheck, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AppWindow,
  Chip,
  DemoButton,
  Eyebrow,
  PersonAvatar,
  PresenterNote,
  Stage,
  Title,
} from "../chrome";
import { APPROVALS, BUSINESS, PEOPLE, inr } from "../../_lib/data";
import { useDemo } from "../../_lib/store";
import type { SectionProps } from "../../_lib/types";

/**
 * Approvals: the decisions that hold a project up, kept next to the work they
 * are about rather than buried in somebody's inbox.
 */
export function ApprovalsSection(props: SectionProps) {
  void props;
  const { state, dispatch } = useDemo();

  const selectedId = state.openApprovalId ?? APPROVALS[0].id;
  const selected = APPROVALS.find((item) => item.id === selectedId) ?? APPROVALS[0];
  const selectedApproved = state.approvals[selected.id] === "approved";
  const waiting = APPROVALS.filter((item) => state.approvals[item.id] !== "approved").length;

  return (
    <Stage wide className="min-h-full">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="wk-rise">Approvals</Eyebrow>
          <Title size="md" className="wk-rise wk-d1 mt-3 max-w-[24ch]">
            Decisions stop being something you chase.
          </Title>
        </div>
        <Chip tone={waiting === 0 ? "good" : "warn"} onDark className="wk-rise wk-d2">
          {waiting === 0 ? "Nothing waiting on you" : `${waiting} waiting for you`}
        </Chip>
      </div>

      <div className="wk-pop wk-d2 mt-6">
        <AppWindow
          title={BUSINESS.name}
          subtitle="Approvals"
          bodyClassName="grid h-[min(58vh,520px)] grid-cols-1 overflow-hidden lg:grid-cols-[320px_1fr]"
        >
          {/* list */}
          <ul className="wk-scroll overflow-y-auto border-b border-[var(--s-line)] p-2.5 lg:border-r lg:border-b-0">
            {APPROVALS.map((item) => {
              const approved = state.approvals[item.id] === "approved";
              const active = item.id === selected.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "openApproval", id: item.id })}
                    className={cn(
                      "flex w-full flex-col gap-1.5 rounded-[11px] border px-3.5 py-3 text-left transition-all duration-200",
                      active
                        ? "border-[#c9cdf6] bg-[#fafbff]"
                        : "border-transparent hover:bg-[var(--s-sub)]",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
                        {item.title}
                      </span>
                      {approved ? (
                        <Chip tone="good" icon={<Check aria-hidden="true" />}>
                          Approved
                        </Chip>
                      ) : (
                        <Chip tone="warn">Waiting</Chip>
                      )}
                    </span>
                    <span className="block truncate text-[11.5px] text-[var(--s-faint)]">
                      {item.context}
                    </span>
                    {item.amount ? (
                      <span className="wk-tabnum block text-[12px] font-semibold text-[var(--s-dim)]">
                        {inr(item.amount)}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* detail */}
          <div className="wk-scroll overflow-y-auto p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={selectedApproved ? "good" : "warn"} icon={<ShieldCheck aria-hidden="true" />}>
                {selectedApproved ? "Approved" : "Waiting for your decision"}
              </Chip>
              <span className="wk-tabnum text-[11.5px] text-[var(--s-faint)]">
                {selected.when}
              </span>
            </div>

            <h3 className="mt-3 font-display text-[22px] font-bold">{selected.title}</h3>
            <p className="mt-1 text-[13px] text-[var(--s-dim)]">{selected.context}</p>

            {selected.amount ? (
              <p className="wk-tabnum mt-4 font-display text-[30px] leading-none font-bold">
                {inr(selected.amount)}
              </p>
            ) : null}

            <p className="mt-4 max-w-[62ch] text-[13.5px] leading-[1.6] text-[var(--s-dim)]">
              {selected.detail}
            </p>

            <div className="mt-5 flex items-center gap-2.5 rounded-[11px] border border-[var(--s-line)] px-3.5 py-3">
              <PersonAvatar personId={selected.requestedBy} size={30} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">
                  {PEOPLE[selected.requestedBy]?.name}
                </span>
                <span className="block truncate text-[11.5px] text-[var(--s-faint)]">
                  {PEOPLE[selected.requestedBy]?.role} · asked for this
                </span>
              </span>
            </div>

            {selectedApproved ? (
              <div className="wk-pop mt-5 rounded-[12px] border border-[#cfeddf] bg-[#f2faf6] p-4">
                <p className="flex items-center gap-2 text-[13.5px] font-semibold text-[#14623a]">
                  <Check className="size-4" aria-hidden="true" />
                  Approved by Aarav Mehta
                </p>
                <p className="wk-tabnum mt-1 text-[12px] text-[#14623a]">
                  5:12 PM · recorded against {selected.context}
                </p>
                <p className="mt-2 text-[12.5px] leading-[1.5] text-[var(--s-dim)]">
                  Everyone working on this can see the decision and when it was made.
                </p>
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap gap-2.5">
                <DemoButton
                  variant="good"
                  onClick={() => dispatch({ type: "approve", id: selected.id })}
                >
                  <Check aria-hidden="true" />
                  Approve
                </DemoButton>
                <DemoButton variant="soft">
                  <X aria-hidden="true" />
                  Send back
                </DemoButton>
              </div>
            )}
          </div>
        </AppWindow>
      </div>

      <div className="mt-6">
        <PresenterNote>
          Every important decision stays connected to the work it decided.
        </PresenterNote>
      </div>
    </Stage>
  );
}
