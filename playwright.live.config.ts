import { defineConfig, devices } from "@playwright/test";

/**
 * The signed-out smoke against a live deployment: the homepage story, its
 * doors, seven widths and axe, in a real browser, with no server of our own.
 *
 *   LIVE_URL=https://waakya.com npx playwright test --config playwright.live.config.ts
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["homepage.spec.ts"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.LIVE_URL ?? "https://waakya.com",
    trace: "retain-on-failure",
  },
  projects: [{ name: "mobile-chrome", use: { ...devices["Pixel 7"] } }],
});
