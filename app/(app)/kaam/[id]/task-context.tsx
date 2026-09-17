import { createClient } from "@/lib/supabase/server";
import { getPhase1 } from "@/lib/i18n/phase1";
import type { Locale } from "@/lib/i18n";
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
  const supabase = await createClient();
  const [documents, { data: task }, { data: projects }] = await Promise.all([
    listTaskDocuments(orgId, taskId),
    supabase.from("tasks").select("project_id").eq("id", taskId).maybeSingle(),
    manages
      ? supabase.from("projects").select("id, name").eq("org_id", orgId).order("updated_at", { ascending: false }).limit(100)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  let projectName: string | null = null;
  if (task?.project_id && !manages) {
    const { data } = await supabase.from("projects").select("name").eq("id", task.project_id).maybeSingle();
    projectName = data?.name ?? null;
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-8" aria-label={p.documents.attached}>
      <div className="flex flex-col gap-4 rounded-card border border-paper-200 bg-paper-0 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-ink-700">{p.documents.linkedProject}</span>
          {manages ? (
            <TaskProjectPicker locale={locale} taskId={taskId} projectId={task?.project_id ?? null} projects={projects ?? []} />
          ) : (
            <span className="text-[14px] text-ink-900">{projectName ?? p.common.none}</span>
          )}
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[13px] font-semibold text-ink-700">{p.documents.attached}</h2>
            <DocumentUploader locale={locale} taskId={taskId} compact />
          </div>
          {documents.length ? (
            <DocumentList locale={locale} documents={documents} viewerId={viewerId} manages={manages} showLinks={false} />
          ) : (
            <p className="text-[14px] text-ink-500">{p.projects.noDocuments.replace(/project/i, "task")}</p>
          )}
        </div>
      </div>
    </section>
  );
}
