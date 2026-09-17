import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
export default defineConfig({
  testDir: "./e2e-prod",
  retries: 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  projects: [{ name: "prod", use: { ...devices["Desktop Chrome"] } }],
});
