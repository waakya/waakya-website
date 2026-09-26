import Link from "next/link";
import { FilePlus2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getPhase1 } from "@/lib/i18n/phase1";
import type { Locale } from "@/lib/i18n";
import { getPlatform } from "@/lib/i18n/platform";
import { getUx } from "@/lib/i18n/ux";
import { listTaskDocuments } from "@/lib/documents/queries";
import { DocumentList } from "@/components/waakya/document-list";
import { DocumentUploader } from "@/components/waakya/document-uploader";
import { TaskProjectPicker } from "./task-project-picker";

/**
 * What connects a task to the rest of the business: the project it belongs to
 * and the documents attached to it. A document attached here is the proof a
 * reviewer opens before verifying.
 */
export async function TaskContext({
  locale,
  orgId,
  taskId,
  viewerId,
  manages,
}: {
  locale: Locale;
  orgId: string;
  taskId: string;
  viewerId: string;
  manages: boolean;
}) {
  const p = getPhase1(locale);
  const ux = getUx(locale);
  const supabase = await createClient();
  const [documents, { data: task }, { data: projects }] = await Promise.all([
    listTaskDocuments(orgId, taskId),
    supabase.from("tasks").select("project_id, origin_kind, origin_id, origin_label").eq("id", taskId).maybeSingle(),
    manages
      ? supabase.from("projects").select("id, name").eq("org_id", orgId).order("updated_at", { ascending: false }).limit(100)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  let projectName: string | null = null;
  if (task?.project_id && !manages) {
    const { data } = await supabase.from("projects").select("name").eq("id", task.project_id).maybeSingle();
    projectName = data?.name ?? null;
  }

  const origin = originLine(locale, task?.origin_kind ?? "manual", task?.origin_id ?? null, task?.origin_label ?? null);

  return (
    <section className="w-full min-w-0 pt-4 lg:pt-0" aria-label={p.documents.attached}>
      <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-label font-semibold text-ink-700">{origin.title}</span>
          {origin.href ? (
            <Link href={origin.href} className="text-body-sm font-semibold text-neel-700 underline-offset-2 hover:underline">
              {origin.text}
            </Link>
          ) : (
            <span className="text-body-sm text-ink-900">{origin.text}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-label font-semibold text-ink-700">{p.documents.linkedProject}</span>
          {manages ? (
            <TaskProjectPicker locale={locale} taskId={taskId} projectId={task?.project_id ?? null} projects={projects ?? []} />
          ) : (
            <span className="text-body-sm text-ink-900">{projectName ?? p.common.none}</span>
          )}
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-label font-semibold text-ink-700">{p.documents.attached}</h2>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Link
                href={`/documents/templates?task=${taskId}${task?.project_id ? `&project=${task.project_id}` : ""}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-button border border-neel-200 bg-paper-0 px-3 text-label font-semibold text-neel-700 hover:bg-neel-50"
              >
                <FilePlus2 className="size-4" aria-hidden="true" />
                {ux.templates.createFromTemplate}
              </Link>
              <DocumentUploader locale={locale} taskId={taskId} compact />
            </div>
          </div>
          {documents.length ? (
            <DocumentList locale={locale} documents={documents} viewerId={viewerId} manages={manages} showLinks={false} />
          ) : (
            <p className="text-body-sm text-ink-500">{p.projects.noDocuments.replace(/project/i, "task")}</p>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Where a task came from, in words: the origin kind is a record and the label
 * is what the source called itself (a customer's name, a rule's name).
 */
function originLine(locale: Locale, kind: string, id: string | null, label: string | null) {
  const o = getPlatform(locale).origin;
  const word = (o as Record<string, string>)[kind] ?? o.manual;
  const text = label ? `${word} · ${label}` : word;
  const href =
    kind === "crm" && id ? `/crm/${id}`
    : kind === "automation" && id ? `/automations/${id}`
    : kind === "vendor_action" && id ? `/vendors/assignments/${id}`
    : kind === "customer_action" && id ? `/projects` // the decision lives on the project
    : null;
  return { title: o.title, text, href };
}
