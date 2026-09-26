import type { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

export const PASSWORD = "waakya-design-pass";
export const PEOPLE = {
  priya: "priya@sharma.test",
  arjun: "arjun@sharma.test",
  rahul: "rahul@sharma.test",
  neha: "neha@sharma.test",
  imran: "imran@sharma.test",
  sunita: "sunita@sharma.test",
  anil: "anil@mehta.test",
} as const;

/** Sign in through the dev-only route, in English. */
export async function signIn(page: Page, who: keyof typeof PEOPLE) {
  const r = await page.request.post("/api/test-login", { data: { email: PEOPLE[who], password: PASSWORD } });
  if (!r.ok()) throw new Error(`sign-in failed for ${who}: ${r.status()}`);
  await page.context().addCookies([{ name: "waakya_lang", value: "en", url: process.env.DESIGN_BASE ?? "http://localhost:3200" }]);
}

/** Service-role reads for assertions and ids. Local stack only. */
export function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export async function sharmaId(name: "conversation" | "task", match: string) {
  const db = admin();
  const { data: org } = await db.from("orgs").select("id").eq("name", "Sharma Interiors").single();
  if (name === "conversation") {
    const { data } = await db.from("conversations").select("id").eq("org_id", org!.id).eq("title", match).single();
    return data!.id as string;
  }
  const { data } = await db.from("tasks").select("id").eq("org_id", org!.id).like("title", `${match}%`).limit(1).single();
  return data!.id as string;
}

/** The widest thing on the page must fit the real device width. */
export async function overflowPx(page: Page): Promise<number> {
  const width = page.viewportSize()!.width;
  return page.evaluate((w) => {
    let max = 0;
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) max = Math.max(max, r.right);
    }
    return Math.round(max - w);
  }, width);
}
