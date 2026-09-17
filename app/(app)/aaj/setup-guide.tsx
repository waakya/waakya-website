import Link from "next/link";
import { CalendarCheck, Check, ChevronRight, FilePlus2, ListPlus, MessageSquare, UserPlus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";
import { getUx } from "@/lib/i18n/ux";
import { cn } from "@/lib/utils";
import { Illustration } from "@/components/waakya/illustrations";

/**
 * The owner's first week, in order. Each step is ticked from what the business
 * has actually done — not from a checkbox — and the guide disappears once
 * every step is real. Until someone joins, the steps that need a colleague
 * say so instead of leading to an empty picker.
 */
export async function SetupGuide({ locale, orgId }: { locale: Locale; orgId: string }) {
  const ux = getUx(locale);
  const supabase = await createClient();
  const count = (query: PromiseLike<{ count: number | null }>) =>
    Promise.resolve(query).then((result) => result.count ?? 0);

  const [members, conversations, tasks, attendance, templates] = await Promise.all([
    count(supabase.from("memberships").select("user_id", { count: "exact", head: true }).eq("org_id", orgId)),
    count(supabase.from("conversations").select("id", { count: "exact", head: true }).eq("org_id", orgId)),
    count(supabase.from("tasks").select("id", { count: "exact", head: true }).eq("org_id", orgId)),
    count(supabase.from("attendance_records").select("id", { count: "exact", head: true }).eq("org_id", orgId)),
    count(supabase.from("documents").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("source", "template")),
  ]);

  const teamJoined = members > 1;
  const steps = [
    { key: "invite", icon: UserPlus, href: "/staff", done: teamJoined, needsTeam: false, copy: ux.guide.steps.invite },
    { key: "conversation", icon: MessageSquare, href: "/baat", done: conversations > 0, needsTeam: true, copy: ux.guide.steps.conversation },
    { key: "task", icon: ListPlus, href: "/naya", done: tasks > 0, needsTeam: true, copy: ux.guide.steps.task },
    { key: "attendance", icon: CalendarCheck, href: "/hazri", done: attendance > 0, needsTeam: false, copy: ux.guide.steps.attendance },
    { key: "template", icon: FilePlus2, href: "/documents/templates", done: templates > 0, needsTeam: false, copy: ux.guide.steps.template },
  ];
  const completed = steps.filter((step) => step.done).length;
  if (completed === steps.length) return null;
  const next = steps.find((step) => !step.done && (!step.needsTeam || teamJoined));

  return (
    <section
      aria-labelledby="setup-guide-title"
      data-testid="setup-guide"
      className="mb-5 overflow-hidden rounded-card border border-neel-100 bg-paper-0"
    >
      <div className="flex items-start gap-4 border-b border-paper-100 px-4 py-4 sm:px-5">
        <div className="min-w-0 flex-1">
          <h2 id="setup-guide-title" className="font-display text-[22px] leading-[1.15] font-extrabold text-ink-900">
            {ux.guide.title}
          </h2>
          <p className="mt-1 text-[14.5px] leading-[20px] text-ink-500">{ux.guide.lead}</p>
          <p className="num mt-2 text-[13px] font-semibold text-neel-700">{ux.guide.progress(completed, steps.length)}</p>
        </div>
        <Illustration name="team" className="hidden h-20 w-auto shrink-0 sm:block" />
      </div>
      <ol>
        {steps.map((step, index) => {
          const Icon = step.icon;
          const blocked = step.needsTeam && !teamJoined && !step.done;
          const isNext = next?.key === step.key;
          return (
            <li key={step.key} className="border-b border-paper-100 last:border-b-0">
              <div className={cn("flex items-center gap-3 px-4 py-3 sm:px-5", isNext && "bg-neel-50")}>
                <span
                  className={cn(
                    "num grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-bold",
                    step.done ? "bg-hara-600 text-white" : isNext ? "bg-neel-600 text-white" : "border border-paper-300 text-ink-500",
                  )}
                  aria-hidden="true"
                >
                  {step.done ? <Check className="size-4" strokeWidth={3} /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("flex items-center gap-1.5 text-[15px] font-semibold", step.done ? "text-ink-500 line-through decoration-ink-400/60" : "text-ink-900")}>
                    <Icon className="size-4 shrink-0 text-neel-700" aria-hidden="true" />
                    {step.copy.title}
                  </span>
                  {!step.done ? (
                    <span className="mt-0.5 block text-[13.5px] leading-[19px] text-ink-500">
                      {blocked ? ux.guide.waitingForTeam : step.copy.body}
                    </span>
                  ) : null}
                </span>
                {step.done ? (
                  <span className="sr-only">{ux.guide.doneLabel}</span>
                ) : blocked ? null : (
                  <Link
                    href={step.href}
                    className={cn(
                      "inline-flex min-h-10 shrink-0 items-center gap-1 rounded-button px-3 text-[14px] font-semibold",
                      isNext ? "bg-neel-600 text-white hover:bg-neel-700" : "text-neel-700 hover:bg-neel-50",
                    )}
                  >
                    {step.copy.action}
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
