"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { canManage, requireOrg } from "@/lib/auth/session";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";

/**
 * Projects. Creating and changing one is a manager's job; the row level
 * security policies enforce the same rule underneath, so the check here only
 * turns a refusal into a sentence.
 */

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional()
  .or(z.literal(""));

const projectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["planned", "active", "on_hold", "completed"]).default("active"),
  startDate: dateSchema,
  endDate: dateSchema,
  memberIds: z.array(uuidSchema).max(100).optional(),
});

export async function createProject(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return fail("Give the project a name of at least two letters.");

  const viewer = await requireOrg();
  if (!canManage(viewer.role)) return fail("Only an owner, admin or manager can create a project.");

  const { name, description, status, startDate, endDate, memberIds } = parsed.data;
  if (startDate && endDate && endDate < startDate) {
    return fail("The end date is before the start date.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      org_id: viewer.org.id,
      name,
      description: description || null,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
      created_by: viewer.userId,
    })
    .select("id")
    .single();
  if (error || !data) return fail("The project could not be created.");

  const people = [...new Set([viewer.userId, ...(memberIds ?? [])])];
  await supabase
    .from("project_members")
    .insert(people.map((userId) => ({ project_id: data.id, org_id: viewer.org.id, user_id: userId })));

  revalidatePath("/projects");
  return ok({ id: data.id });
}

const updateSchema = z.object({
  id: uuidSchema,
  status: z.enum(["planned", "active", "on_hold", "completed"]).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
});

export async function updateProject(input: unknown): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return fail("That change could not be saved.");

  const viewer = await requireOrg();
  if (!canManage(viewer.role)) return fail("Only an owner, admin or manager can change a project.");

  const patch: { status?: string; name?: string; description?: string | null } = {};
  if (parsed.data.status) patch.status = parsed.data.status;
  if (parsed.data.name) patch.name = parsed.data.name;
  if (parsed.data.description !== undefined) patch.description = parsed.data.description || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update(patch as never)
    .eq("id", parsed.data.id)
    .eq("org_id", viewer.org.id);
  if (error) return fail("That change could not be saved.");

  revalidatePath("/projects");
  revalidatePath(`/projects/${parsed.data.id}`);
  return ok();
}

const memberSchema = z.object({ projectId: uuidSchema, userId: uuidSchema });

export async function addProjectMember(input: unknown): Promise<ActionResult> {
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return fail("That person could not be added.");

  const viewer = await requireOrg();
  if (!canManage(viewer.role)) return fail("Only an owner, admin or manager can add people.");

  const supabase = await createClient();
  const { error } = await supabase.from("project_members").upsert(
    { project_id: parsed.data.projectId, org_id: viewer.org.id, user_id: parsed.data.userId },
    { onConflict: "project_id,user_id" },
  );
  if (error) return fail("That person could not be added.");

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return ok();
}

export async function removeProjectMember(input: unknown): Promise<ActionResult> {
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return fail("That person could not be removed.");

  const viewer = await requireOrg();
  if (!canManage(viewer.role)) return fail("Only an owner, admin or manager can remove people.");

  const supabase = await createClient();
  await supabase
    .from("project_members")
    .delete()
    .eq("project_id", parsed.data.projectId)
    .eq("user_id", parsed.data.userId);

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return ok();
}

const linkSchema = z.object({ taskId: uuidSchema, projectId: uuidSchema.nullable() });

/** Put a task in a project, or take it out. */
export async function setTaskProject(input: unknown): Promise<ActionResult> {
  const parsed = linkSchema.safeParse(input);
  if (!parsed.success) return fail("That task could not be moved.");

  const viewer = await requireOrg();
  if (!canManage(viewer.role)) return fail("Only an owner, admin or manager can organise tasks.");

  const supabase = await createClient();

  if (parsed.data.projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", parsed.data.projectId)
      .eq("org_id", viewer.org.id)
      .maybeSingle();
    if (!project) return fail("That project could not be found.");
  }

  const { data: before } = await supabase
    .from("tasks")
    .select("project_id")
    .eq("id", parsed.data.taskId)
    .eq("org_id", viewer.org.id)
    .maybeSingle();
  if (!before) return fail("That task could not be found.");

  const { error } = await supabase
    .from("tasks")
    .update({ project_id: parsed.data.projectId })
    .eq("id", parsed.data.taskId)
    .eq("org_id", viewer.org.id);
  if (error) return fail("That task could not be moved.");

  revalidatePath(`/kaam/${parsed.data.taskId}`);
  if (parsed.data.projectId) revalidatePath(`/projects/${parsed.data.projectId}`);
  if (before.project_id) revalidatePath(`/projects/${before.project_id}`);
  revalidatePath("/projects");
  return ok();
}
