import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/auth/session";
import { getTask } from "@/lib/tasks/queries";
import { getDictionary } from "@/lib/i18n";
import { stateWord } from "@/lib/tasks/present";

export const metadata: Metadata = { title: "Kaam" };

// Slice 4 builds the real task detail: the stepper, the clocks, the timeline
// and the actions. This exists so every row already has somewhere to go.
export default async function TaskPage({ params }: PageProps<"/kaam/[id]">) {
  const { id } = await params;
  const viewer = await requireOrg();
  const task = await getTask(id, viewer.org.id, viewer.org.ackMinutes);
  if (!task) notFound();

  const t = getDictionary(viewer.org.language);

  return (
    <main className="p-4">
      <h1 className="text-[24px] leading-[32px] font-bold text-ink-900">
        {task.title}
      </h1>
      <p className="num mt-1 text-[15px] text-ink-500">
        {task.assigneeName} · {stateWord(task.state, viewer.org.language)}
      </p>
      {task.details ? (
        <p className="mt-3 text-[17px] leading-[24px] text-ink-700">
          {task.details}
        </p>
      ) : null}
      <p className="mt-6 text-[13px] text-ink-400">{t.common.loading}</p>
    </main>
  );
}
