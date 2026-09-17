import Link from "next/link";
import { ArrowLeft, Camera, CheckCircle2, Clock, MessageSquare, X, Zap } from "lucide-react";

import { StateChip } from "@/components/ui/state-chip";
import { Stepper } from "@/components/waakya/stepper";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getUx } from "@/lib/i18n/ux";
import type { TimelineEntry, ThreadMessage } from "@/lib/tasks/detail";
import type { TaskListItem } from "@/lib/tasks/queries";
import type { Clock as SlaClock } from "@/lib/tasks/sla";
import { formatDuration } from "@/lib/tasks/sla";
import { formatTime } from "@/lib/tasks/time";
import { formatDeadline, stateWord } from "@/lib/tasks/present";
import type { StepperState } from "@/lib/tasks/state-machine";
import { Thread } from "./thread";
import { ProofList } from "./proof-list";
import type { ProofItem } from "@/lib/tasks/proofs";

export interface StepperData {
  reached: Partial<Record<StepperState, string>>;
  current: StepperState | null;
  ack: SlaClock;
  completion: SlaClock;
  ackMinutes: number;
  nextReminderAt: string | null;
}

export interface DetailProps {
  task: TaskListItem;
  timeline: TimelineEntry[];
  thread: ThreadMessage[];
  proofs: ProofItem[];
  locale: Locale;
  nowIso: string;
  stepper: StepperData;
  viewerId: string;
  /** The conversation message this task was made from, if any. */
  source?: { conversationId: string; body: string } | null;
}

/**
 * Everything both task detail screens share: the title, the deadline band, the
 * stepper with the two clocks, the timeline and the thread. Only the actions
 * beneath differ, and those are the caller's `children`.
 */
export function TaskShell({
  task,
  timeline,
  thread,
  proofs,
  locale,
  nowIso,
  stepper,
  viewerId,
  source,
  heading,
  lead,
  children,
}: DetailProps & {
  heading: string;
  /** The line above the title — who sent it, or who it is for. */
  lead: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = getDictionary(locale);
  const ux = getUx(locale);
  const now = new Date(nowIso);
  // A closed task is a record, not a countdown: no time left, no reminder,
  // no clocks — just when it closed.
  const closed = ["done", "verified", "cancelled"].includes(task.state);
  const closedAt =
    stepper.reached[task.state === "verified" ? "verified" : "done"] ?? null;
  const remaining = task.dueAt
    ? formatDuration(Date.parse(task.dueAt) - now.getTime(), t.time)
    : null;
  const late = task.dueAt ? Date.parse(task.dueAt) < now.getTime() : false;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-2 p-4 pb-2">
        <Link
          href="/aaj"
          aria-label={t.actions.back}
          className="flex size-tap items-center justify-center rounded-full text-ink-900"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="flex-1 text-center text-[17px] font-bold text-ink-700">
          {heading}
        </h1>
        <span className="size-tap" aria-hidden="true" />
      </header>

      {/*
        The action bar below is fixed to the bottom of the viewport — a sticky
        bar inside this flex column did not pin reliably under mobile
        emulation, and a primary action that can slip below the fold is the one
        thing this screen cannot get wrong. The bar sits above the 4rem bottom
        nav, and the padding here is the room the two together occupy.
      */}
      <main className={task.state === "verified" || task.state === "cancelled" ? "flex-1 px-4 pb-44 lg:pb-8" : "flex-1 px-4 pb-56 lg:pb-8"}>
        {lead}

        <h2 className="mt-2 text-[28px] leading-[36px] font-bold text-ink-900">
          {task.title}
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {task.state === "cancelled" ? (
            <StateChip tone="laal" icon={<X />}>
              {t.chips.cancelled}
            </StateChip>
          ) : null}
          {task.priority === "urgent" ? (
            <StateChip tone="laalSolid" icon={<Zap />}>
              {t.chips.urgent}
            </StateChip>
          ) : null}
          {task.proofRequired ? (
            <StateChip tone="outline" icon={<Camera />}>
              {t.chips.photoChahiye}
            </StateChip>
          ) : null}
        </div>

        {source ? (
          <Link
            href={`/baat/${source.conversationId}`}
            className="mt-3 flex items-start gap-2 rounded-card border border-paper-200 bg-paper-0 px-3.5 py-2.5 hover:border-neel-300"
          >
            <MessageSquare className="mt-0.5 size-4 shrink-0 text-neel-700" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-semibold text-neel-700">
                {ux.task.fromConversation}
              </span>
              <span className="line-clamp-2 block text-[15px] leading-[20px] text-ink-900">
                “{source.body}”
              </span>
            </span>
            <span className="shrink-0 self-center text-[13px] font-semibold text-neel-700">
              {ux.task.openConversation}
            </span>
          </Link>
        ) : null}

        {closed ? (
          <div
            className={
              task.state === "cancelled"
                ? "mt-3 rounded-card bg-paper-100 px-4 py-3"
                : task.state === "done"
                  ? "mt-3 rounded-card bg-neel-50 px-4 py-3"
                  : "mt-3 rounded-card bg-hara-100 px-4 py-3"
            }
          >
            <p
              className={
                task.state === "cancelled"
                  ? "num flex items-center gap-2 text-[17px] font-bold text-ink-700"
                  : task.state === "done"
                    ? "num flex items-center gap-2 text-[17px] font-bold text-neel-700"
                    : "num flex items-center gap-2 text-[17px] font-bold text-hara-700"
              }
            >
              {task.state === "cancelled" ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="size-5" aria-hidden="true" />
              )}
              {task.state === "cancelled"
                ? ux.task.recordCancelled
                : task.state === "verified"
                  ? ux.task.recordVerified(closedAt ? formatTime(closedAt) : "")
                  : ux.task.recordDone(closedAt ? formatTime(closedAt) : "")}
            </p>
            {task.state === "done" ? null : (
              <p className="mt-0.5 text-[15px] text-ink-700">{ux.task.recordLead}</p>
            )}
          </div>
        ) : task.dueAt ? (
          <div
            className={
              late
                ? "mt-3 rounded-card bg-laal-100 px-4 py-3"
                : "mt-3 rounded-card bg-neel-50 px-4 py-3"
            }
          >
            <p
              className={
                late
                  ? "num flex items-center gap-2 text-[17px] font-bold text-laal-700"
                  : "num flex items-center gap-2 text-[17px] font-bold text-neel-700"
              }
            >
              <Clock className="size-5" aria-hidden="true" />
              {t.time.tak(formatDeadline(task.dueAt, locale, now))}
            </p>
            <p
              className={
                late
                  ? "num mt-0.5 text-[15px] text-laal-700"
                  : "num mt-0.5 text-[15px] text-neel-700"
              }
            >
              {late
                ? t.chips.lateBy(remaining ?? "")
                : t.detail.remaining(remaining ?? "")}
            </p>
          </div>
        ) : null}

        {task.details ? (
          <p className="mt-3 flex items-start gap-2 text-[17px] leading-[24px] text-ink-700">
            <MessageSquare
              className="mt-1 size-5 shrink-0 text-ink-400"
              aria-hidden="true"
            />
            {task.details}
          </p>
        ) : null}

        <div className="lg:grid lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
        <Stepper
          locale={locale}
          reached={stepper.reached}
          current={stepper.current}
          ack={stepper.ack}
          completion={stepper.completion}
          ackMinutes={stepper.ackMinutes}
          nextReminderAt={stepper.nextReminderAt}
          nowIso={nowIso}
          closed={closed}
          className="mt-4"
        />

        <ProofList locale={locale} proofs={proofs} />
        </div>

        <div className="lg:col-span-2">
        <section className="mt-6">
          <h3 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
            {t.detail.timeline}
          </h3>
          <ol aria-label={t.detail.timeline} className="flex flex-col">
            {timeline.map((entry, index) => (
              <li key={entry.id} className="flex gap-3">
                <span className="flex flex-col items-center">
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-ink-700" />
                  {index < timeline.length - 1 ? (
                    <span className="w-0.5 flex-1 bg-paper-200" />
                  ) : null}
                </span>
                <span className="flex-1 pb-3">
                  <span className="text-[15px] leading-[20px] text-ink-900">
                    <strong className="font-bold">{entry.actorName}</strong>{" "}
                    {entry.kind === "time_changed" && entry.dueAt
                      ? t.detail.timeChanged(formatDeadline(entry.dueAt, locale, now))
                      : stateWord(entry.to, locale)}
                  </span>
                  {entry.note ? (
                    <span className="block text-[13px] text-ink-500">
                      {entry.note}
                    </span>
                  ) : null}
                </span>
                <span className="num shrink-0 text-[13px] text-ink-500">
                  {formatTime(entry.at)}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <Thread
          locale={locale}
          taskId={task.id}
          messages={thread}
          viewerId={viewerId}
        />
        </div>
        </div>
      </main>

      {/* One instance at every width. On a phone the bar inside is fixed to
          the bottom of the viewport; from lg it sits in flow under the
          columns, where there is no fold for it to fall below. */}
      <div className="px-4">{children}</div>
    </div>
  );
}
