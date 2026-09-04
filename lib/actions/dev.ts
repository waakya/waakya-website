"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  DEV_ROLE_COOKIE,
  devAuthDisabled,
  toDevRole,
} from "@/lib/auth/dev-bypass";
import { createClient } from "@/lib/supabase/server";

/**
 * Development only. Records which seeded user to sign in as, then drops the
 * current session so the proxy signs in again as the other one on the next
 * request.
 *
 * It refuses to do anything when the flag is off, so shipping it changes
 * nothing about production behaviour.
 */
export async function setDevRole(role: string): Promise<void> {
  if (!devAuthDisabled()) return;

  const store = await cookies();
  store.set(DEV_ROLE_COOKIE, toDevRole(role), {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });

  // Sign out so the proxy signs in as the newly chosen user.
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
}
