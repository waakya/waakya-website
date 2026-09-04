"use server";

import { revalidatePath } from "next/cache";
import { createTask as createTaskCore, type NewTask } from "@/lib/tasks/create";
import type { ActionResult } from "@/lib/validation";

/**
 * The server action wrapper. All it does is call the one entry point and
 * refresh the lists — the logic lives in `lib/tasks/create.ts` so a future
 * voice transcript can reach it without going through a form.
 */
export async function createTask(
  input: NewTask,
): Promise<ActionResult<{ taskId: string }>> {
  const result = await createTaskCore(input);
  if (result.ok) {
    revalidatePath("/aaj");
    revalidatePath("/hafta");
  }
  return result;
}
