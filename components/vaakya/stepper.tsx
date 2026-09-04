import { Check } from "lucide-react";

import { getDictionary, type Locale } from "@/lib/i18n";
import { STEPPER_STATES, type StepperState } from "@/lib/tasks/state-machine";
import { formatTime } from "@/lib/tasks/time";
import { formatDuration, percent, type Clock } from "@/lib/tasks/sla";
import { cn } from "@/lib/utils";

/**
 * The stepper and the two clock bars (Design Direction §5.3).
 *
 * **The same component renders on the owner's and the staff member's task
 * detail; only the actions beneath it differ (D-06).** That is the point: what
 * the owner sees is exactly what the staff member was reminded about, so
 * nobody argues about whether the clock was fair.
 *
 * Six steps — Bheja, Dekha, Maana, Chal raha, Ho gaya, Verified. Done steps are
 * Hara with a tick and a timestamp; the current step is Neel with a halo;
 * future steps are hollow.
 */
export interface StepperProps {
  locale: Locale;
  /** When each step was reached, or null if it has not been. */
  reached: Partial<Record<StepperState, string | null>>;
  /** The step the task is on now. */
  current: StepperState | null;
  ack: Clock;
  completion: Clock;
  /** The acknowledge SLA in minutes, for the bar's label. */
  ackMinutes: number;
  /** "reminder 3:30" — the next reminder, if one is still coming. */
  nextReminderAt?: string | null;
  /** How the completion clock is doing, in words. */
  className?: string;
}

const BAR_COLOUR: Record<Clock["tone"], string> = {
  neel: "bg-neel-600",
  amber: "bg-amber-600",
  laal: "bg-laal-600",
  hara: "bg-hara-600",
};

export function Stepper({
  locale,
  reached,
  current,
  ack,
  completion,
  ackMinutes,
  nextReminderAt,
  className,
}: StepperProps) {
  const t = getDictionary(locale);
  const labels: Record<StepperState, string> = {
    delivered: t.stepper.bheja,
    acknowledged: t.stepper.dekha,
    accepted: t.stepper.maana,
    in_progress: t.stepper.chalRaha,
    done: t.stepper.hoGaya,
    verified: t.stepper.verified,
  };

  const currentIndex = current ? STEPPER_STATES.indexOf(current) : -1;

  return (
    <div
      className={cn(
        "rounded-card border border-paper-200 bg-paper-0 p-4 shadow-card",
        className,
      )}
    >
      <ol className="flex items-start justify-between gap-1">
        {STEPPER_STATES.map((step, index) => {
          const at = reached[step] ?? null;
          const isCurrent = index === currentIndex;
          const complete = currentIndex >= 0 && index < currentIndex;

          return (
            <li
              key={step}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              {/* The line to the previous step, coloured only once passed. */}
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-3 right-1/2 left-[-50%] h-0.5",
                    complete || isCurrent ? "bg-hara-600" : "bg-paper-200",
                  )}
                />
              ) : null}

              <span
                className={cn(
                  "relative z-10 flex size-6 items-center justify-center rounded-full",
                  complete && "bg-hara-600 text-white",
                  isCurrent &&
                    "bg-neel-600 text-white ring-4 ring-neel-200",
                  !complete && !isCurrent && "border-2 border-paper-300 bg-paper-0",
                )}
              >
                {complete ? (
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                ) : null}
              </span>

              <span
                className={cn(
                  "text-center text-[11px] leading-tight font-bold",
                  isCurrent
                    ? "text-neel-700"
                    : complete
                      ? "text-ink-900"
                      : "text-ink-400",
                )}
              >
                {labels[step]}
              </span>
              {at ? (
                <span
                  className={cn(
                    "num text-center text-[11px] leading-tight",
                    isCurrent ? "text-neel-700" : "text-ink-500",
                  )}
                >
                  {formatTime(at)}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-col gap-3">
        <ClockBar
          label={`${t.time.ackClock} (${ackMinutes} min SLA)`}
          clock={ack}
          right={
            ack.tone === "hara"
              ? t.time.metIn(formatDuration(ack.elapsedMs, t.time))
              : t.time.percentGaya(percent(ack.progress))
          }
        />
        <ClockBar
          label={t.time.completionClock}
          clock={completion}
          right={
            completion.breached
              ? t.chips.lateBy(formatDuration(completion.remainingMs, t.time))
              : [
                  t.time.percentGaya(percent(completion.progress)),
                  nextReminderAt ? t.time.reminderAt(formatTime(nextReminderAt)) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
          }
        />
      </div>
    </div>
  );
}

function ClockBar({
  label,
  clock,
  right,
}: {
  label: string;
  clock: Clock;
  right: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] leading-[18px] font-bold text-ink-900">
          {label}
        </span>
        <span className="num text-[13px] leading-[18px] text-ink-500">
          {right}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent(clock.progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={right}
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-paper-200"
      >
        <div
          className={cn("h-full rounded-full transition-all", BAR_COLOUR[clock.tone])}
          style={{ width: `${Math.max(percent(clock.progress), 2)}%` }}
        />
      </div>
    </div>
  );
}
