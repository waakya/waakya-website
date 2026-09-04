import type { Page } from "@playwright/test";

/**
 * The seeded test users from `supabase/seed-e2e.sql`. They exist only in the
 * development project, and only /api/test-login (dev-only) can use them.
 */
export const TEST_USERS = {
  owner: { email: "owner@vaakya.test", password: "vaakya-e2e-owner-pass", name: "Rakesh" },
  staff: { email: "staff@vaakya.test", password: "vaakya-e2e-staff-pass", name: "Raju" },
} as const;

export type TestUserKey = keyof typeof TEST_USERS;

/**
 * Sign in without waiting on a real OTP email. The app's own sign-in is an
 * email OTP; this shortcut exists so the e2e can exercise everything after it.
 */
export async function signInAs(page: Page, who: TestUserKey): Promise<void> {
  const user = TEST_USERS[who];
  const response = await page.request.post("/api/test-login", {
    data: { email: user.email, password: user.password },
  });
  if (!response.ok()) {
    throw new Error(
      `test-login failed for ${who}: ${response.status()} ${await response.text()}`,
    );
  }
}

export async function signOut(page: Page): Promise<void> {
  await page.context().clearCookies();
}
