import Link from "next/link";
import { ArrowLeft, Camera, CheckCircle2, Clock, MessageSquare, X, Zap } from "lucide-react";

import { RevealGroup, RevealToggle } from "@/components/waakya/reveal";

import { StateChip } from "@/components/ui/state-chip";
import { Stepper } from "@/components/waakya/stepper";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getUx } from "@/lib/i18n/ux";
import { getDesign } from "@/lib/i18n/design";
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
  /** What connects the task to the business: project and documents. */
  context?: React.ReactNode;
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
  context,
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
  const d = getDesign(locale);
  const now = new Date(nowIso);
  // A closed record has no fixed action bar to leave room for on a phone.
  const barFixed = !["verified", "cancelled"].includes(task.state);
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
      <header className="flex items-center gap-2 p-4 pb-2 lg:px-0 lg:pt-4 lg:pb-3">
        <Link
          href="/aaj"
          aria-label={t.actions.back}
          className="flex size-tap items-center justify-center rounded-full text-ink-900 lg:hidden"
        >
          <ArrowLeft className="size-6" />
        </Link>
        {/* On a desk the task lives under Work, and says so. */}
        <Link
          href="/work"
          className="hidden min-h-8 items-center gap-1.5 rounded-inner text-label font-semibold text-neel-700 hover:text-neel-800 lg:inline-flex"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {d.task.backToWork}
        </Link>
        <h1 className="flex-1 text-center text-body-lg font-bold text-ink-700 lg:sr-only">
          {heading}
        </h1>
        <span className="size-tap lg:hidden" aria-hidden="true" />
      </header>

      {/*
        The action bar below is fixed to the bottom of the viewport — a sticky
        bar inside this flex column did not pin reliably under mobile
        emulation, and a primary action that can slip below the fold is the one
        thing this screen cannot get wrong. The bar sits above the 4rem bottom
        nav, and the padding here is the room the two together occupy.
      */}
      {/* Desktop: the record on the left, the next step on the right and in
          view. Phone: one column, the action bar fixed to the bottom. */}
      <div className="flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <main className="min-w-0 px-4 pb-4 lg:px-0 lg:pb-10">
        {lead}

        <h2 className="mt-2 text-title-lg font-bold text-ink-900 lg:mt-3">
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
              <span className="block text-caption font-semibold text-neel-700">
                {ux.task.fromConversation}
              </span>
              <span className="line-clamp-2 block text-body leading-[20px] text-ink-900">
                “{source.body}”
              </span>
            </span>
            <span className="shrink-0 self-center text-label font-semibold text-neel-700">
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
                  ? "num flex items-center gap-2 text-body-lg font-bold text-ink-700"
                  : task.state === "done"
                    ? "num flex items-center gap-2 text-body-lg font-bold text-neel-700"
                    : "num flex items-center gap-2 text-body-lg font-bold text-hara-700"
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
              <p className="mt-0.5 text-body text-ink-700">{ux.task.recordLead}</p>
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
                  ? "num flex items-center gap-2 text-body-lg font-bold text-laal-700"
                  : "num flex items-center gap-2 text-body-lg font-bold text-neel-700"
              }
            >
              <Clock className="size-5" aria-hidden="true" />
              {t.time.tak(formatDeadline(task.dueAt, locale, now))}
            </p>
            <p
              className={
                late
                  ? "num mt-0.5 text-body text-laal-700"
                  : "num mt-0.5 text-body text-neel-700"
              }
            >
              {late
                ? t.chips.lateBy(remaining ?? "")
                : t.detail.remaining(remaining ?? "")}
            </p>
          </div>
        ) : null}

        {task.details ? (
          <p className="mt-3 flex items-start gap-2 text-body-lg leading-[24px] text-ink-700">
            <MessageSquare
              className="mt-1 size-5 shrink-0 text-ink-400"
              aria-hidden="true"
            />
            {task.details}
          </p>
        ) : null}

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

        {/* The record (V3): every step stays in the list, but on a phone only
            the latest three show until asked — the task leads with what to
            do, not with its history. Pure CSS: the checkbox below opens it. */}
        <RevealGroup as="section" id="task-record" className="group/record mt-6">
          <h3 className="mb-2 text-label font-semibold text-fg-muted">
            {t.detail.timeline}
          </h3>
          <ol id="task-record" aria-label={t.detail.timeline} className="flex flex-col">
            {timeline.map((entry, index) => (
              <li
                key={entry.id}
                className={
                  index < timeline.length - 3
                    ? "hidden gap-3 group-data-[open=true]/record:flex lg:flex"
                    : "flex gap-3"
                }
              >
                <span className="flex flex-col items-center">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-fg-muted" />
                  {index < timeline.length - 1 ? (
                    <span className="w-px flex-1 bg-line-strong" />
                  ) : null}
                </span>
                <span className="flex-1 pb-3">
                  <span className="text-body-sm text-fg">
                    <strong className="font-semibold">{entry.actorName}</strong>{" "}
                    {entry.kind === "time_changed" && entry.dueAt
                      ? t.detail.timeChanged(formatDeadline(entry.dueAt, locale, now))
                      : stateWord(entry.to, locale)}
                  </span>
                  {entry.note ? (
                    <span className="block text-label text-fg-subtle">
                      {entry.note}
                    </span>
                  ) : null}
                </span>
                <span className="num shrink-0 text-label text-fg-subtle">
                  {formatTime(entry.at)}
                </span>
              </li>
            ))}
          </ol>
          {timeline.length > 3 ? (
            <RevealToggle
              className="text-label font-semibold text-neel-700 lg:hidden"
              more={`${d.v3.showRecord} · ${timeline.length}`}
              less={d.v3.showLess}
            />
          ) : null}
        </RevealGroup>

        <Thread
          locale={locale}
          taskId={task.id}
          messages={thread}
          viewerId={viewerId}
        />
      </main>

      {/* One instance at every width. On a phone the action bar inside is
          fixed to the bottom of the viewport; from lg it heads a sticky rail,
          so the decision is on screen however long the record is. */}
      <aside
        aria-label={d.task.nextStep}
        className={
          barFixed
            ? "px-4 pb-56 lg:sticky lg:top-6 lg:px-0 lg:pb-10"
            : "px-4 pb-4 lg:sticky lg:top-6 lg:px-0 lg:pb-10"
        }
      >
        <p className="mb-2 hidden text-caption font-semibold text-fg-subtle lg:block">{d.task.nextStep}</p>
        {children}
        {context ? (
          // On a phone the task's project and documents wait behind one line;
          // on a desk they sit under the next step.
          <RevealGroup id="task-context" className="group/details mt-4 lg:mt-6">
            <div className="border-t border-line pt-1 lg:hidden">
              <RevealToggle chevron className="w-full text-body-sm font-semibold text-fg-muted" more={d.v3.detailsHint} less={d.v3.detailsHint} />
            </div>
            <div id="task-context" className="hidden group-data-[open=true]/details:block lg:block">{context}</div>
          </RevealGroup>
        ) : null}
      </aside>
      </div>
    </div>
  );
}
