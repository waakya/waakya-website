import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { getMemberNames } from "@/lib/org/members";
import type { TaskState } from "@/lib/supabase/types";

/**
 * Projects gather the work, people and documents for one piece of business.
 * Row level security keeps every read inside the reader's org.
 */

export type ProjectStatus = "planned" | "active" | "on_hold" | "completed";

export const PROJECT_STATUSES: ProjectStatus[] = ["planned", "active", "on_hold", "completed"];

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  openTasks: number;
  totalTasks: number;
  documents: number;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  state: TaskState;
  dueAt: string | null;
  assigneeName: string;
}

export interface ProjectDetail extends ProjectSummary {
  createdByName: string;
  members: { userId: string; name: string }[];
  tasks: ProjectTask[];
  activity: { id: string; text: string; at: string }[];
}

const OPEN_STATES: TaskState[] = [
  "created",
  "delivered",
  "acknowledged",
  "accepted",
  "in_progress",
  "done",
  "escalated",
  "reassigned",
];

export const listProjects = cache(async (orgId: string): Promise<ProjectSummary[]> => {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, description, status, start_date, end_date, updated_at")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (!projects?.length) return [];
  const ids = projects.map((project) => project.id);

  const [{ data: tasks }, { data: docs }] = await Promise.all([
    supabase.from("tasks").select("project_id, state").in("project_id", ids),
    supabase.from("documents").select("project_id").in("project_id", ids),
  ]);

  return projects.map((project) => {
    const mine = (tasks ?? []).filter((task) => task.project_id === project.id);
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status as ProjectStatus,
      startDate: project.start_date,
      endDate: project.end_date,
      totalTasks: mine.length,
      openTasks: mine.filter((task) => OPEN_STATES.includes(task.state as TaskState)).length,
      documents: (docs ?? []).filter((doc) => doc.project_id === project.id).length,
      updatedAt: project.updated_at,
    };
  });
});

export const getProject = cache(
  async (orgId: string, id: string): Promise<ProjectDetail | null> => {
    const supabase = await createClient();
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, description, status, start_date, end_date, updated_at, created_by")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!project) return null;

    const [names, { data: members }, { data: tasks }, { data: docs }] = await Promise.all([
      getMemberNames(orgId),
      supabase.from("project_members").select("user_id").eq("project_id", id),
      supabase
        .from("tasks")
        .select("id, title, state, due_at, assigned_to, created_at")
        .eq("project_id", id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("documents").select("id, name, created_at, uploaded_by").eq("project_id", id),
    ]);

    const taskIds = (tasks ?? []).map((task) => task.id);
    const { data: events } = taskIds.length
      ? await supabase
          .from("task_events")
          .select("id, task_id, to_state, actor_id, created_at")
          .in("task_id", taskIds)
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [] as { id: string; task_id: string; to_state: string; actor_id: string | null; created_at: string }[] };

    const titleOf = new Map((tasks ?? []).map((task) => [task.id, task.title]));
    const activity = [
      ...(events ?? []).map((event) => ({
        id: event.id,
        text: `${names.get(event.actor_id ?? "") ?? "Someone"} moved "${titleOf.get(event.task_id) ?? "a task"}" to ${String(event.to_state).replace("_", " ")}`,
        at: event.created_at,
      })),
      ...(docs ?? []).map((doc) => ({
        id: doc.id,
        text: `${names.get(doc.uploaded_by) ?? "Someone"} added ${doc.name}`,
        at: doc.created_at,
      })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 20);

    const list = tasks ?? [];
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status as ProjectStatus,
      startDate: project.start_date,
      endDate: project.end_date,
      updatedAt: project.updated_at,
      createdByName: names.get(project.created_by) ?? "Someone",
      totalTasks: list.length,
      openTasks: list.filter((task) => OPEN_STATES.includes(task.state as TaskState)).length,
      documents: (docs ?? []).length,
      members: (members ?? []).map((member) => ({
        userId: member.user_id,
        name: names.get(member.user_id) ?? "Someone",
      })),
      tasks: list.map((task) => ({
        id: task.id,
        title: task.title,
        state: task.state as TaskState,
        dueAt: task.due_at,
        assigneeName: names.get(task.assigned_to ?? "") ?? "—",
      })),
      activity,
    };
  },
);

/** Open tasks not yet in any project, for linking. */
export const getUnassignedTasks = cache(
  async (orgId: string): Promise<{ id: string; title: string }[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tasks")
      .select("id, title")
      .eq("org_id", orgId)
      .is("project_id", null)
      .in("state", OPEN_STATES)
      .order("created_at", { ascending: false })
      .limit(100);
    return data ?? [];
  },
);
