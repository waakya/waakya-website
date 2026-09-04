import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabaseServiceRoleKey, supabaseUrl } from "./env";

/**
 * The service-role client. It bypasses RLS, so it is only for the SLA and
 * escalation job and for server-side seeding — never for a request made on a
 * user's behalf, and never imported into a client component.
 *
 * Returns null when the key is absent so the app still runs without it; the
 * SLA job reports the missing key rather than crashing the request.
 */
export function createAdminClient() {
  const key = supabaseServiceRoleKey();
  if (!key) return null;

  return createSupabaseClient<Database>(supabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
