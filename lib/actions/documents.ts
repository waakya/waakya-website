"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { canManage, requireOrg } from "@/lib/auth/session";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";
import {
  DOCUMENT_CATEGORIES,
  MAX_DOCUMENT_BYTES,
  documentKey,
  isAllowedType,
  orgIdFromDocumentKey,
  safeFileName,
} from "@/lib/documents/rules";
import { getTemplate, renderTemplateHtml } from "@/lib/documents/templates";

/**
 * The document library.
 *
 * Files never pass through the app: the server signs a key inside the caller's
 * own org folder, the browser PUTs straight to private storage, and only then
 * is a row recorded. Every read and write is checked twice — here, and by row
 * level security and the storage policies underneath — so a forged org id, a
 * guessed key or a hidden button is refused by the database.
 */

const BUCKET = "documents";

function refresh(extra: string[] = []) {
  revalidatePath("/documents");
  for (const path of extra) revalidatePath(path);
}

const uploadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  contentType: z.string().min(3).max(120),
  size: z.number().int().positive().max(MAX_DOCUMENT_BYTES),
});

export async function requestDocumentUpload(
  input: unknown,
): Promise<ActionResult<{ key: string; url: string; headers: Record<string, string> }>> {
  const parsed = uploadSchema.safeParse(input);
  if (!parsed.success) return fail("That file is larger than 25 MB.");
  if (!isAllowedType(parsed.data.contentType)) {
    return fail("That kind of file cannot be stored here. Use PDF, an image, Word, Excel or PowerPoint.");
  }

  const viewer = await requireOrg();
  const key = documentKey(viewer.org.id, randomUUID(), parsed.data.name);

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(key);
  if (error || !data) return fail("The upload could not start. Please try again.");

  return ok({
    key,
    url: data.signedUrl,
    headers: { "content-type": parsed.data.contentType },
  });
}

const recordSchema = z.object({
  key: z.string().max(400),
  name: z.string().trim().min(1).max(200),
  contentType: z.string().max(120),
  size: z.number().int().positive().max(MAX_DOCUMENT_BYTES),
  category: z.enum(DOCUMENT_CATEGORIES).default("other"),
  taskId: uuidSchema.nullable().optional(),
  projectId: uuidSchema.nullable().optional(),
  messageId: uuidSchema.nullable().optional(),
});

/** Record a document once its file is actually in storage. */
export async function recordDocument(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = recordSchema.safeParse(input);
  if (!parsed.success) return fail("That document could not be saved.");

  const viewer = await requireOrg();
  const { key, name, contentType, size, category, taskId, projectId, messageId } = parsed.data;

  // Whatever the caller says, the key must sit inside their own org.
  if (orgIdFromDocumentKey(key) !== viewer.org.id) {
    return fail("That document could not be saved.");
  }
  if (!isAllowedType(contentType)) return fail("That kind of file cannot be stored here.");

  const supabase = await createClient();

  // Confirm the upload really landed before a row points at it.
  const folder = key.slice(0, key.lastIndexOf("/"));
  const file = key.slice(key.lastIndexOf("/") + 1);
  const { data: listed } = await supabase.storage.from(BUCKET).list(folder, { search: file });
  if (!listed?.some((object) => object.name === file)) {
    return fail("The upload did not finish. Please try again.");
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      org_id: viewer.org.id,
      name,
      category,
      mime_type: contentType,
      size_bytes: size,
      storage_key: key,
      uploaded_by: viewer.userId,
      task_id: taskId ?? null,
      project_id: projectId ?? null,
      message_id: messageId ?? null,
      source: "upload",
    })
    .select("id")
    .single();

  if (error || !data) return fail("That document could not be saved.");

  refresh([
    ...(taskId ? [`/kaam/${taskId}`] : []),
    ...(projectId ? [`/projects/${projectId}`] : []),
  ]);
  return ok({ id: data.id });
}

const openSchema = z.object({ id: uuidSchema, download: z.boolean().optional() });

/** A short-lived link to look at or save one document. */
export async function openDocument(input: unknown): Promise<ActionResult<{ url: string }>> {
  const parsed = openSchema.safeParse(input);
  if (!parsed.success) return fail("That document could not be opened.");

  const viewer = await requireOrg();
  const supabase = await createClient();

  // Row level security decides whether this person may see it at all.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, name, storage_key, org_id, source")
    .eq("id", parsed.data.id)
    .eq("org_id", viewer.org.id)
    .maybeSingle();
  if (!doc) return fail("That document could not be found.");

  if (doc.source === "template" && !parsed.data.download) {
    return ok({ url: `/documents/${doc.id}` });
  }

  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_key, 120, parsed.data.download ? { download: doc.name } : undefined);
  if (!data?.signedUrl) return fail("That document could not be opened.");
  return ok({ url: data.signedUrl });
}

export async function deleteDocument(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ id: uuidSchema }).safeParse(input);
  if (!parsed.success) return fail("That document could not be deleted.");

  const viewer = await requireOrg();
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("id, storage_key, uploaded_by, task_id, project_id")
    .eq("id", parsed.data.id)
    .eq("org_id", viewer.org.id)
    .maybeSingle();
  if (!doc) return fail("That document could not be found.");

  if (doc.uploaded_by !== viewer.userId && !canManage(viewer.role)) {
    return fail("Only the person who uploaded it, or a manager, can delete it.");
  }

  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) return fail("That document could not be deleted.");

  // The row is gone either way; a leftover file is unreachable without it.
  await supabase.storage.from(BUCKET).remove([doc.storage_key]);

  refresh([
    ...(doc.task_id ? [`/kaam/${doc.task_id}`] : []),
    ...(doc.project_id ? [`/projects/${doc.project_id}`] : []),
  ]);
  return ok();
}

const linkSchema = z.object({
  id: uuidSchema,
  taskId: uuidSchema.nullable().optional(),
  projectId: uuidSchema.nullable().optional(),
});

/** Connect an existing document to a task or a project. */
export async function linkDocument(input: unknown): Promise<ActionResult> {
  const parsed = linkSchema.safeParse(input);
  if (!parsed.success) return fail("That document could not be attached.");

  const viewer = await requireOrg();
  const supabase = await createClient();

  const patch: { task_id?: string | null; project_id?: string | null } = {};
  if (parsed.data.taskId !== undefined) patch.task_id = parsed.data.taskId;
  if (parsed.data.projectId !== undefined) patch.project_id = parsed.data.projectId;

  const { error } = await supabase
    .from("documents")
    .update(patch)
    .eq("id", parsed.data.id)
    .eq("org_id", viewer.org.id);
  if (error) return fail("That document could not be attached.");

  refresh([
    ...(parsed.data.taskId ? [`/kaam/${parsed.data.taskId}`] : []),
    ...(parsed.data.projectId ? [`/projects/${parsed.data.projectId}`] : []),
  ]);
  return ok();
}

const templateSchema = z.object({
  templateKey: z.string().min(2).max(40),
  data: z.record(z.string().max(40), z.string().max(4000)),
  projectId: uuidSchema.nullable().optional(),
  taskId: uuidSchema.nullable().optional(),
});

/** Fill a template, render it, and keep it as a real document. */
export async function saveTemplateDocument(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return fail("Check the details and try again.");

  const template = getTemplate(parsed.data.templateKey);
  if (!template) return fail("That template does not exist.");

  // Only the template's own fields are kept.
  const allowed = new Set(template.fields.map((field) => field.key));
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed.data.data)) {
    if (allowed.has(key) && value.trim()) data[key] = value.trim();
  }
  const missing = template.fields.find((field) => field.required && !data[field.key]);
  if (missing) return fail("Fill in the required details first.");

  // Money and percentages are calculated into the document, so they must be numbers.
  for (const field of template.fields) {
    const value = data[field.key];
    if (!value) continue;
    if (field.kind === "money") {
      const amount = Number(value.replace(/[, ₹]/g, ""));
      if (!Number.isFinite(amount) || amount <= 0) return fail("Enter the amount as a number, for example 25000.");
    }
    if (field.kind === "percent") {
      const rate = Number(value.replace(/%/g, ""));
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) return fail("GST must be a number between 0 and 100.");
    }
    if (field.kind === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fail("Choose a valid date.");
  }

  const viewer = await requireOrg();
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("orgs")
    .select("name, address, gstin, phone, email")
    .eq("id", viewer.org.id)
    .single();
  if (!org) return fail("Your business details could not be read.");

  const html = renderTemplateHtml(template.key, data, org);
  const label = data.client_name || data.project_name || data.date || "draft";
  const name = `${template.title} - ${label}.html`;
  const key = documentKey(viewer.org.id, randomUUID(), safeFileName(name));

  const upload = await supabase.storage
    .from(BUCKET)
    .upload(key, new Blob([html], { type: "text/html" }), { contentType: "text/html" });
  if (upload.error) return fail("The document could not be saved. Please try again.");

  const { data: row, error } = await supabase
    .from("documents")
    .insert({
      org_id: viewer.org.id,
      name,
      category: template.category,
      mime_type: "text/html",
      size_bytes: new TextEncoder().encode(html).length,
      storage_key: key,
      uploaded_by: viewer.userId,
      project_id: parsed.data.projectId ?? null,
      task_id: parsed.data.taskId ?? null,
      source: "template",
      template_key: template.key,
      template_data: data,
    })
    .select("id")
    .single();

  if (error || !row) {
    await supabase.storage.from(BUCKET).remove([key]);
    return fail("The document could not be saved. Please try again.");
  }

  refresh();
  return ok({ id: row.id });
}
