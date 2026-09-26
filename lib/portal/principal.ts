import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * The customer principal: a signed-in person who holds active customer
 * access, resolved once per request. It is not a Viewer — a customer has no
 * membership, no role and no module set; they have projects.
 */
export interface CustomerPrincipal {
  userId: string;
  email: string | null;
  businesses: {
    accessId: string;
    orgId: string;
    orgName: string;
    contactName: string;
    projects: { id: string; name: string }[];
  }[];
}

export const getCustomerPrincipal = cache(async (): Promise<CustomerPrincipal | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return null;
  const { data } = await supabase.rpc("my_customer_access");
  if (!data?.length) return null;
  const businesses = new Map<string, CustomerPrincipal["businesses"][number]>();
  for (const row of data) {
    const entry = businesses.get(row.access_id) ?? {
      accessId: row.access_id,
      orgId: row.org_id,
      orgName: row.org_name,
      contactName: row.contact_name,
      projects: [],
    };
    if (row.project_id && !entry.projects.some((p) => p.id === row.project_id)) {
      entry.projects.push({ id: row.project_id, name: row.project_name ?? "" });
    }
    businesses.set(row.access_id, entry);
  }
  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    businesses: [...businesses.values()],
  };
});

export async function requireCustomer(next = "/portal"): Promise<CustomerPrincipal> {
  const principal = await getCustomerPrincipal();
  if (!principal) {
    // Signed in but not a customer (any more): the workspace or setup, never
    // back here. Signed out: sign in, then return.
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) redirect("/aaj");
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return principal;
}

/** The project a customer may open, or null. Every portal read goes through this. */
export function customerProject(principal: CustomerPrincipal, projectId: string) {
  for (const business of principal.businesses) {
    const project = business.projects.find((p) => p.id === projectId);
    if (project) return { business, project };
  }
  return null;
}
