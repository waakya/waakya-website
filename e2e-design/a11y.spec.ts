import { writeFileSync, mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { sharmaId, signIn } from "./support";

/**
 * Automated accessibility sweep (axe, WCAG 2.1 A/AA) over every major screen,
 * for an owner and a staff member, on a desk and on a phone. Serious and
 * critical violations fail the test; everything found is written to
 * test-results/a11y-<project>.json for the design test matrix.
 */
const OWNER_ROUTES = [
  "/aaj",
  "/baat",
  "conversation:Site team",
  "/work",
  "task:Photograph the chipped",
  "/projects",
  "/documents",
  "/documents/templates",
  "/hazri",
  "/approvals",
  "/staff",
  "/search?q=kapoor",
  "/khabar",
  "/settings",
];
const STAFF_ROUTES = ["/aaj", "/work", "task:Measure the wardrobe", "/hazri", "/khabar"];
const PUBLIC_ROUTES = ["/", "/login", "/privacy"];

async function resolve(route: string) {
  if (route.startsWith("conversation:")) return `/baat/${await sharmaId("conversation", route.slice(13))}`;
  if (route.startsWith("task:")) return `/kaam/${await sharmaId("task", route.slice(5))}`;
  return route;
}

for (const [who, routes] of [
  ["priya", OWNER_ROUTES],
  ["rahul", STAFF_ROUTES],
  ["visitor", PUBLIC_ROUTES],
] as const) {
  for (const tag of ["", "@phone"]) {
    test(`${tag} axe: ${who}`.trim(), async ({ page }, info) => {
      if (who !== "visitor") await signIn(page, who);
      const findings: Record<string, { id: string; impact: string | null | undefined; nodes: number; help: string }[]> = {};
      const blocking: string[] = [];
      for (const route of routes) {
        const url = await resolve(route);
        await page.goto(url, { waitUntil: "networkidle" });
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          // Dev-only overlays that never ship.
          .exclude("nextjs-portal")
          .analyze();
        findings[route] = result.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));
        for (const v of result.violations) {
          if (v.impact === "serious" || v.impact === "critical") {
            blocking.push(`${route} · ${v.id} (${v.impact}) × ${v.nodes.length}: ${v.nodes[0]?.target.join(" ")}`);
          }
        }
      }
      mkdirSync("test-results", { recursive: true });
      writeFileSync(`test-results/a11y-${info.project.name}-${who}.json`, JSON.stringify(findings, null, 2));
      expect(blocking, blocking.join("\n")).toEqual([]);
    });
  }
}
