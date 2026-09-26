import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Workflow } from "lucide-react";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getAutomation } from "@/lib/i18n/automation";
import { listRules, RULE_EXAMPLES } from "@/lib/automation/queries";
import { AppShell } from "@/components/waakya/app-shell";
import { EmptyState, ListSurface, PageHeader, Section } from "@/components/waakya/page";
import { buttonVariants } from "@/components/ui/button";
import { StateChip } from "@/components/ui/state-chip";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { InstallExample, RuleToggle } from "./rule-controls";

export const metadata: Metadata = { title: "Automation" };

/** Every rule, whether it is on, how often it ran, and where it last stopped. */
export default async function AutomationsPage() {
  const viewer = await requireModule("automation");
  const shell = await shellFor(viewer);
  const t = getAutomation(shell.locale);
  const manages = viewerCan(viewer, "automation.manage");
  const rules = await listRules(viewer.org.id);

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader
          title={t.title}
          description={t.subtitle}
          actions={manages ? <Link href="/automations/new" className={buttonVariants({ size: "owner" })}><Plus aria-hidden="true" />{t.newRule}</Link> : null}
        />
        {rules.length === 0 ? (
          <EmptyState className="mt-6" icon={<Workflow />} title={t.empty} body={t.emptyHelp} />
        ) : (
          <ListSurface className="mt-5" label={t.title}>
            {rules.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <Link href={`/automations/${r.id}`} className="block truncate text-body font-semibold text-fg hover:text-neel-700">{r.name}</Link>
                  <span className="num block truncate text-caption text-fg-subtle">
                    {t.when} {r.triggerEvent} · {r.actions.length} {t.doWord.toLowerCase()} · {t.runs.count(r.runCount, r.failCount)}
                    {r.lastRunAt ? ` · ${formatIndianDate(r.lastRunAt, shell.locale)}` : ""}
                  </span>
                </span>
                {!r.valid ? <StateChip tone="laal">{t.errors.badInput}</StateChip> : null}
                {manages ? <RuleToggle locale={shell.locale} id={r.id} enabled={r.enabled} /> : <StateChip tone={r.enabled ? "hara" : "muted"}>{r.enabled ? t.enabled : t.disabled}</StateChip>}
              </li>
            ))}
          </ListSurface>
        )}
        {manages ? (
          <Section title={t.examples.title}>
            <div className="flex flex-wrap gap-2">
              {Object.keys(RULE_EXAMPLES).map((key) => (
                <InstallExample key={key} locale={shell.locale} exampleKey={key} label={t.examples[key as keyof typeof t.examples] as string} />
              ))}
            </div>
          </Section>
        ) : null}
      </main>
    </AppShell>
  );
}
