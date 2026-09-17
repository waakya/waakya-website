import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
/** Full-organization functional QA against production. One worker: people share one business. */
export default defineConfig({
  testDir: "./e2e-prod/qa",
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  reporter: [["line"]],
  projects: [{ name: "qa", use: { ...devices["Desktop Chrome"], screenshot: "only-on-failure" } }],
});
