"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { ACTIVE_ORG_COOKIE, requireViewer } from "@/lib/auth/session";
import { fail, ok, uuidSchema, type ActionResult } from "@/lib/validation";
import { getDictionary } from "@/lib/i18n";

/** Work in another business this person belongs to. */
export async function switchOrg(input: unknown): Promise<ActionResult> {
  const viewer = await requireViewer();
  const parsed = uuidSchema.safeParse(input);
  const target = parsed.success ? viewer.memberships.find((m) => m.orgId === parsed.data) : undefined;
  if (!target) return fail(getDictionary(viewer.org?.language ?? "hi").common.somethingWentWrong);

  (await cookies()).set(ACTIVE_ORG_COOKIE, target.orgId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  return ok();
}
