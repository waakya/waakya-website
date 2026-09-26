import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * Design V2 interaction tests. They run against the LOCAL design stack with
 * the seeded businesses (`npx jiti scripts/local/seed-design.ts`) and a
 * running `next dev` (default :3200), and they refuse anything else.
 */
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  // The tests report what is missing.
}
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")) {
  throw new Error("Design tests run against a local Supabase stack only.");
}

const BASE = process.env.DESIGN_BASE ?? "http://localhost:3200";

export default defineConfig({
  testDir: "./e2e-design",
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: { baseURL: BASE, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, grepInvert: /@phone/ },
    { name: "phone", use: { ...devices["Pixel 7"] }, grep: /@phone/ },
  ],
});
