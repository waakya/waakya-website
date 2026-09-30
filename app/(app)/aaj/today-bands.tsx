import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Ticks } from "@/components/waakya/ticks";
import { ChangeLine, type LineMark } from "@/components/waakya/change-line";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getDesign } from "@/lib/i18n/design";
import type { NeedsYou } from "@/lib/tasks/counters";
import type { TaskListItem } from "@/lib/tasks/queries";
import type { AttendanceDay, TeamAttendanceRow } from "@/lib/attendance/queries";
import { recentChanges, type ChangeKind } from "@/lib/events/changes";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime, isToday } from "@/lib/tasks/time";
import { rowMeta } from "@/lib/tasks/present";
import { ticksFor } from "@/lib/tasks/state-machine";
import { formatDuration } from "@/lib/tasks/sla";
import { AttentionRows, AttentionSummary, NEEDS_KEYS, STUCK_KEYS, collectAttention } from "./attention";
import { PunchLine } from "./punch-line";
import { TeamToday, type TeamPulse } from "./team-today";

const MARK: Record<ChangeKind, LineMark> = {
  proof: "proof",
  verified: "verified",
  customer: "customer",
  lead: "moved",
  vendor: "moved",
  other: "moved",
};

/**
 * Today, as the owner reads it (Visual V2):
 *
 *   the sentence   how many things need you, how many are stuck, what changed
 *   Needs you      decisions only you can make — the attention rule and a verb
 *   Stuck          work that cannot move until someone nudges it, and who is behind
 *   Changed        what moved since yesterday, drawn as the Line
 *   Moving         one line of reassurance, and what the team is doing next
 *
 * The owner does not inspect the whole business here; Waakya surfaces the
 * places where their attention changes something. Every number is real and
 * every count leads to exactly the items it counts.
 */
export async function TodayBands({
  locale,
  orgId,
  userId,
  attention,
  waiting,
  done,
  staff,
  teamAttendance,
  myToday,
  showPunch,
  canSeeHistory,
  nowIso,
}: {
  locale: Locale;
  orgId: string;
  userId: string;
  attention: NeedsYou[];
  waiting: TaskListItem[];
  done: TaskListItem[];
  staff: TeamPulse[];
  teamAttendance: TeamAttendanceRow[];
  myToday: AttendanceDay | null;
  showPunch: boolean;
  canSeeHistory: boolean;
  nowIso: string;
}) {
  const t = getDictionary(locale);
  const d = getDesign(locale);
  const x = d.today2;
  const now = new Date(nowIso);
  const [all, changes] = await Promise.all([
    collectAttention({ locale, orgId, userId, manages: true, attention, nowIso }),
    recentChanges(orgId, locale, now),
  ]);

  const sum = (keys: string[]) => all.groups.filter((g) => keys.includes(g.key)).reduce((n, g) => n + g.count, 0);
  const needsTotal = sum(NEEDS_KEYS);
  const stuckTotal = sum(STUCK_KEYS);
  const dueToday = waiting.filter((task) => task.dueAt && isToday(task.dueAt, now)).length;

  // Who is behind: one line per person, the worst first — the owner nudges a
  // person, not a hundred and forty rows.
  const behind = new Map<string, { id: string; name: string; late: number; unseen: number; oldest: number }>();
  for (const item of attention) {
    if (item.reason !== "late" && item.reason !== "unseen") continue;
    const id = item.task.assigneeId ?? "none";
    const p = behind.get(id) ?? { id, name: item.task.assigneeName, late: 0, unseen: 0, oldest: 0 };
    if (item.reason === "late") {
      p.late += 1;
      if (item.task.dueAt) p.oldest = Math.max(p.oldest, now.getTime() - Date.parse(item.task.dueAt));
    } else p.unseen += 1;
    behind.set(id, p);
  }
  const people = [...behind.values()].sort((a, b) => b.late - a.late || b.unseen - a.unseen).slice(0, 4);

  const when = (at: string) => {
    if (isToday(at, now)) return formatTime(at);
    const yesterday = new Date(now.getTime() - 86_400_000);
    if (isToday(at, yesterday)) return `${x.yesterday} ${formatTime(at)}`;
    return `${formatIndianDate(at, locale)} · ${formatTime(at)}`;
  };

  const needsRows = all.groups.some((g) => NEEDS_KEYS.includes(g.key));
  const stuckRows = all.groups.some((g) => STUCK_KEYS.includes(g.key));

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-x-14">
      <div className="min-w-0">
        {/* ------------------------------------------------ the sentence */}
        <section aria-labelledby="today-sentence">
          <h2 id="today-sentence" className="font-display text-[28px] leading-[1.1] font-extrabold text-fg sm:text-[34px]">
            {needsTotal > 0 ? x.needs(needsTotal) : x.allClear}
          </h2>
          <p className="num mt-2 flex flex-wrap gap-x-4 gap-y-1 text-body text-fg-muted">
            {/* Only what is there: a calm day is one short sentence. */}
            {stuckTotal > 0 ? (
              <a href="#stuck" className="font-semibold text-laal-700 hover:underline">{x.stuckCount(stuckTotal)}</a>
            ) : null}
            {changes.total > 0 ? <a href="#changed" className="hover:underline">{x.changedCount(changes.total)}</a> : null}
            {waiting.length > 0 ? <a href="#moving" className="hover:underline">{x.movingCount(waiting.length)}</a> : null}
          </p>
          <AttentionSummary attention={all} className="mt-3" />
        </section>

        {showPunch ? <div className="mt-6"><PunchLine locale={locale} today={myToday} /></div> : null}

        {/* ------------------------------------------------- needs you */}
        {needsTotal > 0 ? (
        <section aria-labelledby="needs" className="mt-8">
          <h3 id="needs" className="mb-2 text-body-lg font-bold text-fg">
            {t.lists.aapkeLiye}
            <span className="num ml-1.5 font-normal text-fg-subtle">{needsTotal}</span>
          </h3>
          {needsRows ? <AttentionRows attention={all} keys={NEEDS_KEYS} label={t.lists.aapkeLiye} mode="needs" locale={locale} /> : null}
        </section>
        ) : null}

        {/* ----------------------------------------------------- stuck */}
        {stuckTotal === 0 ? (
          <p id="stuck" className="mt-8 border-y border-line py-3 text-body-sm text-fg-subtle">{x.stuckEmpty}</p>
        ) : (
        <section id="stuck" aria-labelledby="stuck-h" className="mt-10 scroll-mt-6">
          <h3 id="stuck-h" className="mb-2 text-body-lg font-bold text-fg">
            {x.stuck}
            <span className="num ml-1.5 font-normal text-fg-subtle">{stuckTotal}</span>
          </h3>
          {people.length > 0 ? (
            <div className="mb-3">
              <p className="text-caption font-semibold text-fg-subtle">{x.byPerson}</p>
              <ul className="mt-1 grid grid-cols-[minmax(0,1fr)] gap-x-8 sm:grid-cols-2">
                {people.map((p) => (
                  <li key={p.id} className="num min-w-0 border-b border-line text-body-sm last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
                    <Link href={p.id === "none" ? "/work?need=late" : `/work?person=${p.id}`} className="flex min-h-10 items-center gap-2 hover:bg-paper-100/60">
                      <span className="min-w-0 flex-1 truncate font-semibold text-fg" title={p.name}>{p.name}</span>
                      {p.late > 0 ? <span className="shrink-0 font-semibold text-laal-700">{p.late} {t.chips.late}</span> : null}
                      {p.unseen > 0 ? <span className="shrink-0 text-amber-700">{p.unseen} {t.chips.dekhaNahi}</span> : null}
                      {p.oldest > 0 ? <span className="shrink-0 text-fg-subtle">{formatDuration(p.oldest, t.time)}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {stuckRows ? <AttentionRows attention={all} keys={STUCK_KEYS} label={x.stuck} mode="stuck" locale={locale} /> : null}
        </section>
        )}

        {/* ---------------------------------------------- moving normally */}
        <section id="moving" aria-labelledby={waiting.length > 0 || done.length > 0 ? "moving-h" : undefined} className="mt-10 scroll-mt-6">
          {waiting.length > 0 || done.length > 0 ? <h3 id="moving-h" className="text-body-lg font-bold text-fg">{x.moving}</h3> : null}
          {waiting.length > 0 || done.length > 0 ? (
            <p className="num mt-1 text-body text-fg-muted">{x.movingLine(waiting.length, dueToday, done.length)}</p>
          ) : null}
          {waiting.length > 0 ? (
            <div className="mt-4">
              <p className="mb-1 text-caption font-semibold text-fg-subtle">
                {d.v3.waiting} <span className="num font-normal">{waiting.length}</span>
              </p>
              <ul aria-label={d.v3.waiting} className="border-y border-line">
                {waiting.slice(0, 5).map((task) => {
                  const ticks = ticksFor(task.state);
                  return (
                    <li key={task.id} className="border-b border-line last:border-b-0">
                      <Link href={`/kaam/${task.id}`} className="flex min-h-12 items-center gap-3 py-2 transition-colors duration-150 hover:bg-paper-100/60">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body-sm text-fg">{task.title}</span>
                          {/* The state in words, never the glyph alone (D-03). */}
                          <span className="num block truncate text-caption text-fg-subtle">
                            {rowMeta(task, { now, locale, viewer: "owner" }, task.assigneeName)}
                          </span>
                        </span>
                        {ticks ? <Ticks state={ticks} locale={locale} size={16} /> : null}
                      </Link>
                    </li>
                  );
                })}
                {waiting.length > 5 ? (
                  <li>
                    <Link href="/work?need=waiting" className="num flex min-h-11 items-center gap-1.5 text-label font-semibold text-neel-700 hover:text-neel-800">
                      {d.v3.moreOf(waiting.length - 5)} · {d.v3.waiting}
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
          {done.length > 0 ? (
            <details className="group mt-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-body-sm font-semibold text-fg-muted">
                {d.v3.doneToday}
                <span className="num font-normal text-fg-subtle">{done.length}</span>
              </summary>
              <ul aria-label={t.lists.hoGayaSection} className="border-y border-line">
                {done.map((task) => {
                  const ticks = ticksFor(task.state);
                  return (
                    <li key={task.id} className="border-b border-line last:border-b-0">
                      <Link href={`/kaam/${task.id}`} className="flex items-center gap-3 py-2 hover:bg-paper-100/60">
                        <span className="min-w-0 flex-1 truncate text-body-sm text-fg">{task.title}</span>
                        {ticks ? <Ticks state={ticks} locale={locale} size={16} /> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          ) : null}
          <Link href="/work" className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-body-sm font-semibold text-neel-700 hover:text-neel-800">
            {d.v3.allWork}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      </div>

      <aside className="mt-10 lg:sticky lg:top-6 lg:mt-1">
        {/* ------------------------------------------------------ changed */}
        <section id="changed" aria-labelledby="changed-h" className="scroll-mt-6">
          <h3 id="changed-h" className="text-body-lg font-bold text-fg">{x.changed}</h3>
          {changes.entries.length > 0 ? (
            <ChangeLine
              className="mt-2"
              label={x.changed}
              items={changes.entries.map((c) => ({
                id: c.id,
                mark: MARK[c.kind],
                text: c.text,
                href: c.href,
                meta: `${c.actor} · ${when(c.at)}`,
              }))}
            />
          ) : (
            <p className="mt-2 text-body-sm text-fg-subtle">{x.changedEmpty}</p>
          )}
          {canSeeHistory ? (
            <Link href="/settings/history" className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-label font-semibold text-neel-700 hover:text-neel-800">
              {x.history}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </section>

        {/* ------------------------------------------------ team today */}
        <section aria-labelledby="team-h" className="mt-8">
          <h3 id="team-h" className="mb-1 text-body-lg font-bold text-fg">{d.v3.teamToday}</h3>
          <TeamToday locale={locale} staff={staff} attendance={teamAttendance} />
        </section>
      </aside>
    </div>
  );
}
