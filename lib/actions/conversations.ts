"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth/session";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";

/**
 * Internal conversations.
 *
 * As with attendance, the database functions decide who may do what: the org
 * comes from the caller's membership and posting requires being a participant.
 * This layer validates shape, translates complaints into sentences, and
 * refreshes the lists.
 */

const messageSchema = z.object({
  conversationId: uuidSchema,
  body: z.string().trim().min(1).max(4000),
});

function explain(message: string | undefined): string {
  const text = (message ?? "").toLowerCase();
  if (text.includes("not in this conversation")) return "You are not in this conversation.";
  if (text.includes("write something")) return "Write something first.";
  if (text.includes("not a member")) return "You are not a member of this business.";
  if (text.includes("choose somebody else")) return "Choose somebody else.";
  if (text.includes("not in this business")) return "That person is not in this business.";
  return "That did not go through. Please try again.";
}

/** Open the one direct conversation with somebody, or make it. */
export async function startDirectConversation(
  input: unknown,
): Promise<ActionResult<{ conversationId: string }>> {
  const parsed = z.object({ userId: uuidSchema }).safeParse(input);
  if (!parsed.success) return fail("Choose somebody to message.");

  const viewer = await requireOrg();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_direct_conversation", {
    p_org: viewer.org.id,
    p_other: parsed.data.userId,
  });
  if (error || !data) return fail(explain(error?.message));

  revalidatePath("/baat");
  const row = Array.isArray(data) ? data[0] : data;
  return ok({ conversationId: (row as { id: string }).id });
}

export async function postMessage(input: unknown): Promise<ActionResult> {
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return fail("Write something first.");

  await requireOrg();
  const supabase = await createClient();
  const { error } = await supabase.rpc("post_message", {
    p_conversation: parsed.data.conversationId,
    p_body: parsed.data.body,
  });
  if (error) return fail(explain(error.message));

  revalidatePath("/baat");
  revalidatePath(`/baat/${parsed.data.conversationId}`);
  return ok();
}

export async function markConversationRead(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ conversationId: uuidSchema }).safeParse(input);
  if (!parsed.success) return ok();

  await requireOrg();
  const supabase = await createClient();
  await supabase.rpc("mark_conversation_read", {
    p_conversation: parsed.data.conversationId,
  });
  revalidatePath("/baat");
  return ok();
}

/* -------------------------------------------------------------------------
 * Message to task.
 *
 * The one interaction that separates Waakya from a chat app. It is explicit:
 * somebody decides this sentence is work, and says who owns it and by when.
 *
 * `createTask` is the single entry point for every task in the product and its
 * input schema is strict, so the origin is stamped onto the row afterwards
 * rather than threaded through it. Nothing about the existing path changes.
 * ---------------------------------------------------------------------- */

const fromMessageSchema = z.object({
  conversationId: uuidSchema,
  messageId: uuidSchema,
  assigneeId: uuidSchema,
  title: z.string().trim().min(2).max(140),
  dueAt: z.string().datetime(),
});

export async function createTaskFromMessage(
  input: unknown,
): Promise<ActionResult<{ taskId: string }>> {
  const parsed = fromMessageSchema.safeParse(input);
  if (!parsed.success) return fail("Give the task a title and a deadline.");

  const { createTask } = await import("@/lib/tasks/create");
  const created = await createTask({
    assigneeId: parsed.data.assigneeId,
    title: parsed.data.title,
    priority: "normal",
    proofRequired: false,
    deadline: { kind: "at", at: parsed.data.dueAt },
  });
  if (!created.ok) return created;

  // Keep the conversation it came from. A task that cannot say where it was
  // agreed is just a task in a list.
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ source_message_id: parsed.data.messageId })
    .eq("id", created.data.taskId);

  revalidatePath("/aaj");
  revalidatePath(`/baat/${parsed.data.conversationId}`);
  return created;
}

/* -------------------------------------------------------------------------
 * Group conversations and shared files.
 * ---------------------------------------------------------------------- */

const groupSchema = z.object({
  title: z.string().trim().min(2).max(80),
  memberIds: z.array(uuidSchema).min(1).max(100),
});

export async function createGroupConversation(
  input: unknown,
): Promise<ActionResult<{ conversationId: string }>> {
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return fail("Name the group and add at least one person.");

  const viewer = await requireOrg();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_group_conversation", {
    p_org: viewer.org.id,
    p_title: parsed.data.title,
    p_members: parsed.data.memberIds,
  });
  if (error || !data) return fail(explain(error?.message));

  revalidatePath("/baat");
  const row = Array.isArray(data) ? data[0] : data;
  return ok({ conversationId: (row as { id: string }).id });
}

const shareSchema = z.object({
  conversationId: uuidSchema,
  key: z.string().max(400),
  name: z.string().trim().min(1).max(200),
  contentType: z.string().max(120),
  size: z.number().int().positive().max(25 * 1024 * 1024),
});

/**
 * A file shared in a conversation: a message saying so, and a document that
 * belongs to that message. Row level security keeps the document visible only
 * to the people in the conversation.
 */
export async function shareFileInConversation(input: unknown): Promise<ActionResult> {
  const parsed = shareSchema.safeParse(input);
  if (!parsed.success) return fail("That file could not be shared.");

  const viewer = await requireOrg();
  const { orgIdFromDocumentKey, isAllowedType } = await import("@/lib/documents/rules");
  if (orgIdFromDocumentKey(parsed.data.key) !== viewer.org.id) return fail("That file could not be shared.");
  if (!isAllowedType(parsed.data.contentType)) return fail("That kind of file cannot be shared here.");

  const supabase = await createClient();
  const { data: message, error } = await supabase.rpc("post_message", {
    p_conversation: parsed.data.conversationId,
    p_body: `Shared ${parsed.data.name}`,
  });
  if (error || !message) return fail(explain(error?.message));
  const messageRow = (Array.isArray(message) ? message[0] : message) as { id: string };

  const { error: docError } = await supabase.from("documents").insert({
    org_id: viewer.org.id,
    name: parsed.data.name,
    category: "other",
    mime_type: parsed.data.contentType,
    size_bytes: parsed.data.size,
    storage_key: parsed.data.key,
    uploaded_by: viewer.userId,
    message_id: messageRow.id,
    source: "upload",
  });
  if (docError) return fail("That file could not be shared.");

  revalidatePath(`/baat/${parsed.data.conversationId}`);
  revalidatePath("/baat");
  return ok();
}
