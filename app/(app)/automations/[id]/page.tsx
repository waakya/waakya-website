import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getAutomation } from "@/lib/i18n/automation";
import { getRule } from "@/lib/automation/queries";
import { editorChoices } from "@/lib/automation/choices";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime } from "@/lib/tasks/time";
import { AppShell } from "@/components/waakya/app-shell";
import { PageHeader, Section } from "@/components/waakya/page";
import { StateChip } from "@/components/ui/state-chip";
import { RuleEditor } from "../rule-editor";

export const metadata: Metadata = { title: "Rule" };

/** One rule: edit it, and read every run it made — what it did, or why it stopped. */
export default async function RulePage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireModule("automation");
  const { id } = await params;
  const shell = await shellFor(viewer);
  const t = getAutomation(shell.locale);
  const found = await getRule(viewer.org.id, id);
  if (!found) notFound();
  const manages = viewerCan(viewer, "automation.manage");
  const choices = manages ? await editorChoices(viewer.org.id) : null;
  const tone = (s: string) => (s === "succeeded" ? "hara" : s === "failed" ? "laal" : s === "running" ? "neel" : "muted");

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader back={{ href: "/automations", label: t.title }} title={found.rule.name} description={`${t.when} ${found.rule.triggerEvent} · ${t.runs.count(found.rule.runCount, found.rule.failCount)}`} />
        {choices ? (
          <div className="mt-5">
            <RuleEditor locale={shell.locale} choices={choices} initial={{ id: found.rule.id, name: found.rule.name, triggerEvent: found.rule.triggerEvent, conditions: found.rule.conditions, actions: found.rule.actions, enabled: found.rule.enabled }} />
          </div>
        ) : null}
        <Section title={t.runs.title} count={found.runs.length}>
          {found.runs.length === 0 ? (
            <p className="text-body-sm text-fg-subtle">{t.runs.empty}</p>
          ) : (
            <ol className="divide-y divide-line rounded-card border border-line bg-surface">
              {found.runs.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StateChip tone={tone(r.status)}>{t.runs.status[r.status as keyof typeof t.runs.status] ?? r.status}</StateChip>
                    <span className="min-w-0 flex-1 truncate text-body-sm text-fg">{r.eventType}{r.eventTitle ? ` · ${r.eventTitle}` : ""}</span>
                    <span className="num text-caption text-fg-subtle">{r.startedAt ? `${formatIndianDate(r.startedAt, shell.locale)} ${formatTime(r.startedAt)}` : ""} · {t.runs.attempts(r.attempts)}</span>
                  </div>
                  {r.error ? <p className="mt-1 text-body-sm text-laal-700">{r.error}</p> : null}
                  {r.log.length ? (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-caption font-semibold text-fg-subtle">{t.runs.log}</summary>
                      <pre className="num mt-1 overflow-x-auto rounded-inner bg-paper-50 p-2 text-caption text-fg">{JSON.stringify(r.log, null, 1)}</pre>
                    </details>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </Section>
      </main>
    </AppShell>
  );
}
