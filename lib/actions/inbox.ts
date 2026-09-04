"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/auth/session";
import { ok, type ActionResult } from "@/lib/validation";

/** Marks everything the viewer can see as read. RLS scopes it to them. */
export async function markInboxRead(): Promise<ActionResult> {
  await requireViewer();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  revalidatePath("/khabar");
  revalidatePath("/aaj");
  return ok();
}
