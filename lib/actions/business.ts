"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/validation";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().max(400).optional(),
  gstin: z
    .string()
    .trim()
    .max(15)
    .regex(/^$|^[0-9A-Za-z]{15}$/, "gstin")
    .optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.union([z.literal(""), z.string().trim().email().max(120)]).optional(),
});

/** The business details templates and documents are filled from. Owner or admin only. */
export async function updateBusinessProfile(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    if (field === "gstin") return fail("A GSTIN is 15 letters and digits.", "gstin");
    if (field === "email") return fail("That email does not look right.", "email");
    return fail("Give the business a name of at least two letters.", "name");
  }

  const viewer = await requireOrg();
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_business_profile", {
    p_org: viewer.org.id,
    p_name: parsed.data.name,
    p_address: parsed.data.address || undefined,
    p_gstin: parsed.data.gstin || undefined,
    p_phone: parsed.data.phone || undefined,
    p_email: parsed.data.email || undefined,
  });
  if (error) {
    return fail(
      error.message.includes("owner or admin")
        ? "Only an owner or admin can edit the business."
        : "The details could not be saved.",
    );
  }
  revalidatePath("/", "layout");
  return ok();
}
