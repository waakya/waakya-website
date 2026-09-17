import type { Metadata } from "next";

import { requireOrg } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/waakya/app-shell";
import { TEMPLATES } from "@/lib/documents/templates";
import { TemplateBuilder } from "./template-builder";

export const metadata: Metadata = { title: "Templates" };

/** Choose a template, fill the business fields, preview, and keep it. */
export default async function TemplatesPage({ searchParams }: PageProps<"/documents/templates">) {
  const params = await searchParams;
  const pick = (value: unknown) => (typeof value === "string" && /^[0-9a-f-]{36}$/.test(value) ? value : null);
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const supabase = await createClient();

  const [{ data: org }, { data: projects }] = await Promise.all([
    supabase
      .from("orgs")
      .select("name, address, gstin, phone, email")
      .eq("id", viewer.org.id)
      .single(),
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", viewer.org.id)
      .order("updated_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <AppShell {...shell}>
      <TemplateBuilder
        locale={shell.locale}
        templates={TEMPLATES}
        business={{
          name: org?.name ?? viewer.org.name,
          address: org?.address ?? null,
          gstin: org?.gstin ?? null,
          phone: org?.phone ?? null,
          email: org?.email ?? null,
        }}
        projects={projects ?? []}
        initialProjectId={pick(params.project)}
        taskId={pick(params.task)}
        initialTemplateKey={typeof params.template === "string" ? params.template : null}
      />
    </AppShell>
  );
}
