import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireModule, viewerCan } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { getIntegrations } from "@/lib/i18n/integrations";
import { createClient } from "@/lib/supabase/server";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { formatTime } from "@/lib/tasks/time";
import { AppShell } from "@/components/waakya/app-shell";
import { ListSurface, PageHeader, Section } from "@/components/waakya/page";
import { StateChip } from "@/components/ui/state-chip";
import { KeyControls, NewKey } from "./key-controls";

export const metadata: Metadata = { title: "Website integration" };

/** Keys a website uses to send enquiries, the endpoint to call, and what arrived. */
export default async function IntegrationsPage() {
  const viewer = await requireModule("website_integration");
  if (!viewerCan(viewer, "integrations.manage")) redirect("/settings");
  const shell = await shellFor(viewer);
  const t = getIntegrations(shell.locale);
  const supabase = await createClient();
  const [{ data: keys }, { data: requests }] = await Promise.all([
    supabase.from("integration_keys").select("id, name, key_prefix, created_at, last_used_at, revoked_at").eq("org_id", viewer.org.id).order("created_at", { ascending: false }),
    supabase.from("integration_requests").select("id, status, response, created_at, integration_keys(name)").eq("org_id", viewer.org.id).order("created_at", { ascending: false }).limit(30),
  ]);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const sample = `curl -X POST ${siteUrl}/api/integrations/leads \\
  -H "Authorization: Bearer wk_live_xxxxxxxx_…" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: form-submission-123" \\
  -d '{"full_name":"Meera Joshi","phone":"9876543210","email":"meera@example.com","source":"website","interest":"2,400 sq ft office","message":"Need a quote"}'`;

  return (
    <AppShell {...shell} width="list">
      <main className="flex-1 p-4 pb-8 lg:px-0">
        <PageHeader back={{ href: "/settings", label: shell.locale === "en" ? "Settings" : "Settings" }} title={t.title} description={t.subtitle} />

        <Section title={t.keys} count={(keys ?? []).filter((k) => !k.revoked_at).length} action={<NewKey locale={shell.locale} />}>
          {(keys ?? []).length === 0 ? (
            <p className="text-body-sm text-fg-subtle">{t.empty}</p>
          ) : (
            <ListSurface>
              {(keys ?? []).map((k) => (
                <li key={k.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-semibold text-fg">{k.name}</span>
                    <span className="num block text-caption text-fg-subtle">
                      wk_…_{k.key_prefix}_… · {t.lastUsed}: {k.last_used_at ? `${formatIndianDate(k.last_used_at, shell.locale)} ${formatTime(k.last_used_at)}` : t.never}
                    </span>
                  </span>
                  {k.revoked_at ? <StateChip tone="muted">{t.revoked}</StateChip> : <KeyControls locale={shell.locale} id={k.id} />}
                </li>
              ))}
            </ListSurface>
          )}
        </Section>

        <Section title={t.howTo}>
          <p className="text-body-sm text-fg-muted">{t.howToBody}</p>
          <pre className="num mt-2 overflow-x-auto rounded-card border border-line bg-surface p-3 text-caption text-fg">{sample}</pre>
          <p className="mt-2 text-caption text-fg-subtle">
            {t.fields}: full_name, phone, email, source, interest, project, message, metadata
          </p>
        </Section>

        <Section title={t.requests} count={(requests ?? []).length}>
          {(requests ?? []).length === 0 ? (
            <p className="text-body-sm text-fg-subtle">{t.noRequests}</p>
          ) : (
            <ListSurface>
              {(requests ?? []).map((r) => {
                const body = (r.response ?? {}) as Record<string, unknown>;
                return (
                  <li key={r.id} className="num flex flex-wrap items-center gap-3 px-4 py-2 text-body-sm">
                    <StateChip tone={r.status < 300 ? "hara" : r.status === 429 ? "amber" : "laal"}>{r.status}</StateChip>
                    <span className="min-w-0 flex-1 truncate text-fg">{typeof body.error === "string" ? body.error : body.deduplicated ? "deduplicated" : "recorded"}</span>
                    <span className="text-caption text-fg-subtle">{(r.integration_keys as { name: string } | null)?.name} · {formatIndianDate(r.created_at, shell.locale)} {formatTime(r.created_at)}</span>
                  </li>
                );
              })}
            </ListSurface>
          )}
        </Section>
      </main>
    </AppShell>
  );
}
