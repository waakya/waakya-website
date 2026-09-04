import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";

// The e2e talks to Supabase directly to prove RLS, so the test process needs
// the same public credentials the app uses. Next loads .env.local itself; this
// config runs outside that, so it reads the file once.
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // No .env.local: the app itself will report what is missing.
}

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * The e2e runs against `next dev` on purpose: the dev-only test-login route
 * that seeds a session refuses to exist when NODE_ENV is production, so a
 * production build could not sign in without real OTP email delivery.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    // A ₹8,000 Android in portrait: the product is designed one-handed.
    ...devices["Pixel 7"],
  },
  projects: [{ name: "mobile-chrome", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { ALLOW_TEST_LOGIN: "true" },
  },
});
