"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import { fail, ok, type ActionResult } from "@/lib/validation";

const nameSchema = z.object({
  fullName: z.string().trim().min(1).max(60),
});

/**
 * Anyone may change their own name, the owner included. RLS allows a user to
 * update only their own profile row, so the filter below is a second fence,
 * not the only one.
 */
export async function updateMyName(
  input: unknown,
): Promise<ActionResult<{ fullName: string }>> {
  const viewer = await requireViewer();
  const t = getDictionary(await getLocale());

  const parsed = nameSchema.safeParse(input);
  if (!parsed.success) return fail(t.settings.nameInvalid, "fullName");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", viewer.userId);
  if (error) return fail(t.settings.nameSaveFailed);

  // The name shows in the header, the side nav, the staff list and task rows.
  revalidatePath("/", "layout");
  return ok({ fullName: parsed.data.fullName });
}
