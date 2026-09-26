import { createClient } from "@supabase/supabase-js";

import { isPlatformHost } from "./hostname";

/**
 * Which business, if any, a request host belongs to. Used by the proxy on
 * every request whose host is not the platform's own; answers only for
 * verified, unremoved hostnames, through an anonymous read-only function.
 * Never the source of tenancy for data: the customer still signs in.
 */
export async function resolvePortalHost(host: string | null): Promise<{ orgId: string; orgName: string } | null> {
  if (!host) return null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (isPlatformHost(host, siteUrl)) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await supabase.rpc("resolve_portal_host", { p_host: host.toLowerCase().replace(/:\d+$/, "") });
  const row = Array.isArray(data) ? data[0] : null;
  return row ? { orgId: row.org_id, orgName: row.org_name } : null;
}
