"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireOrg, canManage } from "@/lib/auth/session";
import { getDictionary, type Locale } from "@/lib/i18n";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";

const clockSchema = z
  .string()
  .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "hh:mm");

const saveSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().trim().min(2).max(60),
  assignedTo: uuidSchema.nullable(),
  runAt: clockSchema,
  windowMinutes: z.number().int().min(15).max(24 * 60),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        proofRequired: z.boolean(),
      }),
    )
    .min(1)
    .max(20),
});

/**
 * Create or replace a checklist and its items.
 *
 * Items are rewritten wholesale rather than diffed: a checklist is a short
 * list somebody edits by hand, and the tasks already generated keep working
 * because `tasks.checklist_item_id` is `on delete set null` — yesterday's
 * record never disappears because today's template changed.
 */
export async function saveChecklist(input: unknown): Promise<ActionResult> {
  const viewer = await requireOrg();
  const locale = viewer.org.language;
  if (!canManage(viewer.role)) return fail(errors(locale).notAllowed);

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return fail(field === "items" ? errors(locale).needItems : errors(locale).badName);
  }

  const supabase = await createClient();
  const { id, name, assignedTo, runAt, windowMinutes, items } = parsed.data;

  let checklistId = id;
  if (checklistId) {
    const { error } = await supabase
      .from("checklists")
      .update({
        name,
        assigned_to: assignedTo,
        run_at: runAt,
        window_minutes: windowMinutes,
      })
      .eq("id", checklistId)
      .eq("org_id", viewer.org.id);
    if (error) return fail(errors(locale).generic);
    await supabase.from("checklist_items").delete().eq("checklist_id", checklistId);
  } else {
    const { data, error } = await supabase
      .from("checklists")
      .insert({
        org_id: viewer.org.id,
        name,
        assigned_to: assignedTo,
        run_at: runAt,
        window_minutes: windowMinutes,
        created_by: viewer.userId,
      })
      .select("id")
      .single();
    if (error || !data) return fail(errors(locale).generic);
    checklistId = data.id;
  }

  const { error: itemsError } = await supabase.from("checklist_items").insert(
    items.map((item, index) => ({
      checklist_id: checklistId!,
      org_id: viewer.org.id,
      title: item.title,
      position: index,
      proof_required: item.proofRequired,
    })),
  );
  if (itemsError) return fail(errors(locale).generic);

  revalidatePath("/checklists");
  revalidatePath("/aaj");
  return ok();
}

export async function setChecklistActive(
  input: unknown,
): Promise<ActionResult> {
  const viewer = await requireOrg();
  const locale = viewer.org.language;
  if (!canManage(viewer.role)) return fail(errors(locale).notAllowed);

  const parsed = z
    .object({ id: uuidSchema, active: z.boolean() })
    .safeParse(input);
  if (!parsed.success) return fail(errors(locale).generic);

  const supabase = await createClient();
  const { error } = await supabase
    .from("checklists")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.id)
    .eq("org_id", viewer.org.id);
  if (error) return fail(errors(locale).generic);

  revalidatePath("/checklists");
  return ok();
}

export async function deleteChecklist(input: unknown): Promise<ActionResult> {
  const viewer = await requireOrg();
  const locale = viewer.org.language;
  if (!canManage(viewer.role)) return fail(errors(locale).notAllowed);

  const parsed = uuidSchema.safeParse(input);
  if (!parsed.success) return fail(errors(locale).generic);

  const supabase = await createClient();
  // Tasks already generated keep their record; only the template goes.
  const { error } = await supabase
    .from("checklists")
    .delete()
    .eq("id", parsed.data)
    .eq("org_id", viewer.org.id);
  if (error) return fail(errors(locale).generic);

  revalidatePath("/checklists");
  return ok();
}

function errors(locale: Locale) {
  const shared = getDictionary(locale).common;
  const table = {
    hi: {
      notAllowed: "यह काम सिर्फ़ मालिक या मैनेजर कर सकते हैं।",
      badName: "चेकलिस्ट का नाम डालिए।",
      needItems: "कम से कम एक काम जोड़िए।",
      generic: `${shared.somethingWentWrong}। ${shared.tryAgain}।`,
    },
    "hi-Latn": {
      notAllowed: "Yeh kaam sirf owner ya manager kar sakte hain.",
      badName: "Checklist ka naam daaliye.",
      needItems: "Kam se kam ek kaam jodiye.",
      generic: `${shared.somethingWentWrong}. ${shared.tryAgain}.`,
    },
    en: {
      notAllowed: "Only an owner or a manager can do this.",
      badName: "Give the checklist a name.",
      needItems: "Add at least one task.",
      generic: `${shared.somethingWentWrong}. ${shared.tryAgain}.`,
    },
  } as const;
  return table[locale];
}
