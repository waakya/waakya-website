import "server-only";

import { after } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { processAutomation } from "./run";

/**
 * Run the engine for one business right after the request that caused an
 * event has answered. Best effort: the scheduled tick processes anything
 * this misses, and runs are unique per (rule, event), so the two never
 * double a business action.
 */
export function kickAutomation(orgId: string): void {
  const admin = createAdminClient();
  if (!admin) return;
  try {
    after(async () => {
      try {
        await processAutomation(admin, { orgId, limit: 50 });
      } catch (error) {
        console.error("[automation] kick failed", orgId, error instanceof Error ? error.message : error);
      }
    });
  } catch {
    // Outside a request (tests, scripts): the tick will get it.
  }
}
