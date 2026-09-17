"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { setTaskProject } from "@/lib/actions/projects";

export function TaskProjectPicker({
  locale,
  taskId,
  projectId,
  projects,
}: {
  locale: Locale;
  taskId: string;
  projectId: string | null;
  projects: { id: string; name: string }[];
}) {
  const p = getPhase1(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  return (
    <span className="flex items-center gap-2">
      <select
        aria-label={p.documents.linkedProject}
        value={projectId ?? ""}
        disabled={pending}
        onChange={(event) =>
          startTransition(async () => {
            setError(null);
            const result = await setTaskProject({ taskId, projectId: event.target.value || null });
            if (!result.ok) setError(result.message);
            else router.refresh();
          })
        }
        className="h-9 rounded-button border border-paper-200 bg-paper-0 px-3 text-[14px]"
      >
        <option value="">{p.common.none}</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      {error ? <span role="alert" className="text-[13px] text-laal-700">{error}</span> : null}
    </span>
  );
}
