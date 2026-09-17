"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { addProjectMember, setTaskProject, updateProject } from "@/lib/actions/projects";
import type { ProjectStatus } from "@/lib/projects/queries";

const SELECT =
  "h-10 max-w-full min-w-0 rounded-button border border-paper-200 bg-paper-0 px-3 text-[14px] text-ink-900";

/** Status, people and tasks — the three things a manager changes on a project. */
export function ProjectControls({
  locale,
  projectId,
  status,
  candidates,
  tasks,
}: {
  locale: Locale;
  projectId: string;
  status: ProjectStatus;
  candidates: { id: string; name: string }[];
  tasks: { id: string; title: string }[];
}) {
  const p = getPhase1(locale);
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.message ?? p.common.failed);
      else router.refresh();
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label={p.projects.status}
          className={SELECT}
          value={status}
          disabled={pending}
          onChange={(event) =>
            run(() => updateProject({ id: projectId, status: event.target.value }))
          }
        >
          {(["planned", "active", "on_hold", "completed"] as const).map((value) => (
            <option key={value} value={value}>
              {p.projects.statuses[value]}
            </option>
          ))}
        </select>

        {candidates.length > 0 ? (
          <select
            aria-label={p.projects.addMember}
            className={SELECT}
            value=""
            disabled={pending}
            onChange={(event) =>
              event.target.value &&
              run(() => addProjectMember({ projectId, userId: event.target.value }))
            }
          >
            <option value="">{p.projects.addMember}</option>
            {candidates.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        ) : null}

        {tasks.length > 0 ? (
          <select
            aria-label={p.projects.linkTask}
            className={`${SELECT} max-w-full sm:max-w-[320px]`}
            value=""
            disabled={pending}
            onChange={(event) =>
              event.target.value &&
              run(() => setTaskProject({ taskId: event.target.value, projectId }))
            }
          >
            <option value="">{p.projects.linkTask}</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="rounded-card bg-laal-100 px-3 py-2 text-[14px] text-laal-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
