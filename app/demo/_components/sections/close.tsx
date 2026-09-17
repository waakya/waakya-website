"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";

import { Stage, StageButton, Title } from "../chrome";
import { useDemo } from "../../_lib/store";
import type { SectionProps } from "../../_lib/types";

/**
 * -----------------------------------------------------------------------
 * SALESPERSON: put your own details here before the visit.
 * Leave a field as an empty string and it simply will not be shown.
 * Nothing here is invented — fill in only what is real.
 * -----------------------------------------------------------------------
 */
const PRESENTER = {
  name: "",
  role: "",
  phone: "",
  email: "",
};

const PROOF_POINTS = [
  "Know who owns every task",
  "Know what was promised, and by when",
  "Keep every project, file and approval in one place",
  "Know who is in today, and who is on leave",
  "Get approvals without chasing",
  "See proof, not claims",
  "Keep a permanent business record",
];

/** The close. A decision to make, not a thank-you slide. */
export function CloseSection(props: SectionProps) {
  const { reset } = useDemo();
  // The reset control is for the person presenting, not for a prospect who
  // opens the link later.
  const [presenter, setPresenter] = React.useState(false);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the URL once on mount
    setPresenter(new URLSearchParams(window.location.search).has("presenter"));
  }, []);
  const hasContact = Boolean(PRESENTER.name || PRESENTER.phone || PRESENTER.email);

  return (
    <Stage wide className="min-h-full">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <Title size="xl" className="wk-rise max-w-[16ch]">
            Your business already runs on conversations.
          </Title>
          <p className="wk-rise wk-d2 mt-6 font-display text-[clamp(22px,2.4vw,34px)] leading-[1.2] font-semibold text-[var(--d-accent-bright)]">
            Now let those conversations run the work.
          </p>

          <div className="wk-rise wk-d3 mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center gap-2 rounded-[12px] bg-[var(--d-accent-deep)] px-5 text-[16px] font-semibold text-white hover:brightness-110"
            >
              Set up your business
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
            {presenter ? (
              <StageButton variant="ghost" onClick={reset}>
                <RotateCcw aria-hidden="true" />
                Reset for the next meeting
              </StageButton>
            ) : (
              <StageButton variant="ghost" onClick={() => props.onGoTo("opening")}>
                <RotateCcw aria-hidden="true" />
                Watch again
              </StageButton>
            )}
          </div>

          <p className="wk-rise wk-d4 mt-5 text-[15px] text-[var(--d-dim)]">
            Let&rsquo;s set up your business workspace.
          </p>
        </div>

        <div className="wk-rise wk-d3">
          <div className="rounded-[18px] border border-[var(--d-line)] bg-[var(--d-ground-2)] p-6">
            <p className="font-display text-[11px] font-extrabold tracking-[0.4em] text-[var(--d-accent)]">
              WAAKYA
            </p>
            <p className="mt-2 text-[14px] leading-[1.5] text-[var(--d-dim)]">
              The new era of business communication.
            </p>

            <ul className="mt-5 flex flex-col gap-2.5 border-t border-[var(--d-line)] pt-5">
              {PROOF_POINTS.map((point, index) => (
                <li
                  key={point}
                  style={{ animationDelay: `${0.25 + index * 0.06}s` }}
                  className="wk-rise flex items-start gap-2.5 text-[14px] leading-[1.45] text-[var(--d-text)]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[var(--d-accent)]"
                  />
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-[var(--d-line)] pt-5">
              {hasContact ? (
                <div className="flex flex-col gap-0.5">
                  {PRESENTER.name ? (
                    <p className="text-[14px] font-semibold text-[var(--d-text)]">
                      {PRESENTER.name}
                      {PRESENTER.role ? (
                        <span className="font-normal text-[var(--d-faint)]">
                          {" "}
                          · {PRESENTER.role}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  {PRESENTER.phone ? (
                    <p className="wk-tabnum text-[13.5px] text-[var(--d-dim)]">
                      {PRESENTER.phone}
                    </p>
                  ) : null}
                  {PRESENTER.email ? (
                    <p className="text-[13.5px] text-[var(--d-dim)]">{PRESENTER.email}</p>
                  ) : null}
                </div>
              ) : (
                <Link href="/" className="text-[14px] font-semibold text-[var(--d-accent-deep)] hover:underline">
                  waakya.com
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}
