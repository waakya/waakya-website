import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * A new client per server render — never share one across requests.
 *
 * `setAll` throws inside a server component (React forbids writing cookies
 * during render); the session refresh that would have written them already
 * happened in `proxy.ts`, so swallowing that specific case is correct.
 */
export async function createClient() {
  const store = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // Called from a server component: proxy.ts refreshes the session.
        }
      },
    },
  });
}
