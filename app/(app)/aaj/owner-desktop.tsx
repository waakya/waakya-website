import Link from "next/link";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Bell } from "@/components/waakya/bell";
import { TaskTable } from "@/components/waakya/task-table";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { DayCounters, NeedsYou } from "@/lib/tasks/counters";
import type { TaskListItem } from "@/lib/tasks/queries";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { cn } from "@/lib/utils";

/**
 * The dashboard as a wide screen wants it (screens/DashboardDesktop.png):
 * the counters as their own cards rather than crammed into a Neel bar, the
 * needs-you cards two across, the day's work as a table, and a right rail for
 * the things a phone has no room for — the week's completion and who is on
 * today.
 *
 * It is the same data and the same rules as the phone layout; only the shape
 * differs. Hidden below `lg`, where `OwnerToday` renders instead.
 */
export function OwnerDesktop({
  locale,
  orgName,
  ownerName,
  counters,
  attention,
  live,
  done,
  staff,
  unread,
  nowIso,
  phones,
  children,
}: {
  locale: Locale;
  orgName: string;
  ownerName: string | null;
  counters: DayCounters;
  attention: NeedsYou[];
  live: TaskListItem[];
  done: TaskListItem[];
  staff: { id: string; name: string; total: number; done: number; late: number }[];
  unread: number;
  nowIso: string;
  phones: Record<string, string | null>;
  /** The "Aapke liye" cards, which are client components. */
  children: React.ReactNode;
}) {
  const t = getDictionary(locale);
  const now = new Date(nowIso);
  const activeStaff = staff.filter((member) => member.total > 0).length;

  return (
    <div className="hidden flex-1 lg:flex">
      <main className="min-w-0 flex-1 p-8">
        <header className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[36px] leading-none font-extrabold text-ink-900">
              {ownerName ? t.lists.greeting(ownerName) : t.lists.aajHeading}
            </h1>
            <p className="num mt-2 text-[15px] text-ink-500">
              {formatIndianDate(now, locale)} · {orgName} ·{" "}
              {t.desktop.staffActive(activeStaff)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/naya"
              className={buttonVariants({ className: "shadow-mic" })}
            >
              <Plus />
              {t.create.newTask}
            </Link>
            <Bell locale={locale} unread={unread} />
          </div>
        </header>

        <ul
          aria-label={t.lists.aajHeading}
          className="mt-6 grid grid-cols-3 gap-3 xl:grid-cols-6"
        >
          <CounterCard label={t.lists.bheje} value={counters.bheje} />
          <CounterCard label={t.lists.dekhe} value={counters.dekhe} />
          <CounterCard label={t.lists.hoGaye} value={counters.hoGaye} />
          <CounterCard label={t.lists.verifiedCount} value={counters.verified} />
          <CounterCard
            label={t.chips.late}
            value={counters.late}
            tone={counters.late > 0 ? "laal" : undefined}
          />
          <CounterCard
            label={t.chips.dekhaNahi}
            value={counters.dekhaNahi}
            tone={counters.dekhaNahi > 0 ? "amber" : undefined}
          />
        </ul>

        {attention.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 text-[17px] font-bold text-ink-700">
              {t.lists.aapkeLiye}{" "}
              <span className="num font-normal text-ink-400">
                {attention.length}
              </span>
            </h2>
            {children}
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="mb-3 text-[17px] font-bold text-ink-700">
            {t.desktop.todaysWork}{" "}
            <span className="num font-normal text-ink-400">{live.length}</span>
          </h2>
          {live.length > 0 ? (
            <TaskTable tasks={live} locale={locale} now={now} phones={phones} />
          ) : (
            <Card className="p-8 text-center">
              <p className="font-display text-[20px] font-extrabold text-ink-900">
                {t.lists.noTasks}
              </p>
              <p className="mt-1 text-[15px] text-ink-500">
                {t.lists.noTasksHelp}
              </p>
            </Card>
          )}
        </section>

        {done.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 text-[17px] font-bold text-ink-700">
              {t.lists.hoGayaSection}{" "}
              <span className="num font-normal text-ink-400">{done.length}</span>
            </h2>
            <TaskTable tasks={done} locale={locale} now={now} phones={phones} />
          </section>
        ) : null}
      </main>

      <aside className="hidden w-80 shrink-0 flex-col gap-4 p-8 pl-0 xl:flex">
        <Card className="p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold text-ink-900">
              {t.desktop.thisWeek}
            </h2>
          </div>
          <p className="mt-2 flex items-baseline gap-2">
            <span
              className={cn(
                "num font-display text-[40px] leading-none font-extrabold",
                counters.completionRate === null
                  ? "text-ink-400"
                  : "text-hara-700",
              )}
            >
              {counters.completionRate === null
                ? "—"
                : `${counters.completionRate}%`}
            </span>
            <span className="text-[15px] text-ink-500">{t.desktop.onTime}</span>
          </p>
          <p className="mt-1 text-[13px] text-ink-500">
            {t.lists.completionRate}
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-bold text-ink-900">
            {t.desktop.staffToday}
          </h2>
          {staff.length === 0 ? (
            <p className="mt-2 text-[15px] text-ink-500">{t.desktop.noOne}</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {staff.map((member) => (
                <li key={member.id} className="flex items-center gap-3">
                  <Avatar name={member.name} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] leading-tight font-bold text-ink-900">
                      {member.name}
                    </span>
                    <span
                      className={cn(
                        "num block text-[13px]",
                        member.late > 0 ? "text-laal-700" : "text-ink-500",
                      )}
                    >
                      {member.total} {t.desktop.columnTask.toLowerCase()}
                      {member.late > 0
                        ? ` · ${t.chips.lateBy(String(member.late))}`
                        : ""}
                    </span>
                  </span>
                  <span className="num text-[15px] font-bold text-ink-700">
                    {member.done}/{member.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </aside>
    </div>
  );
}

function CounterCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "laal" | "amber";
}) {
  return (
    <li>
      <Card className="p-4">
        <p
          className={cn(
            "num font-display text-[32px] leading-none font-extrabold",
            tone === "laal"
              ? "text-laal-600"
              : tone === "amber"
                ? "text-amber-700"
                : "text-neel-800",
          )}
        >
          {value}
        </p>
        <p className="mt-1.5 text-[13px] leading-none text-ink-500">{label}</p>
      </Card>
    </li>
  );
}
