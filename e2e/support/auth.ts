import type { Page } from "@playwright/test";

/**
 * The seeded test users from `supabase/seed-e2e.sql`. They exist only in the
 * development project, and only /api/test-login (dev-only) can use them.
 */
export const TEST_USERS = {
  owner: { email: "owner@waakya.test", password: "waakya-e2e-owner-pass", name: "Rakesh" },
  staff: { email: "staff@waakya.test", password: "waakya-e2e-staff-pass", name: "Raju" },
  /** Never joins an org, so the "no business yet" path stays testable. */
  noorg: { email: "noorg@waakya.test", password: "waakya-e2e-noorg-pass", name: "Naya Owner" },
} as const;

export type TestUserKey = keyof typeof TEST_USERS;

/**
 * The language the suite is written in.
 *
 * Screens follow the *reader's* language, so without pinning it a test would
 * render in whatever the last human clicked in Settings — and fail for a
 * reason that has nothing to do with what it is testing. The cookie takes
 * priority over the stored preference, so this controls the test's own session
 * without changing anybody's saved choice.
 */
export const TEST_LOCALE = "hi-Latn";

/**
 * Sign in without waiting on a real OTP email. The app's own sign-in is an
 * email OTP; this shortcut exists so the e2e can exercise everything after it.
 */
export async function signInAs(
  page: Page,
  who: TestUserKey,
  locale: string = TEST_LOCALE,
): Promise<void> {
  const user = TEST_USERS[who];
  const response = await page.request.post("/api/test-login", {
    data: { email: user.email, password: user.password },
  });
  if (!response.ok()) {
    throw new Error(
      `test-login failed for ${who}: ${response.status()} ${await response.text()}`,
    );
  }
  await pinLocale(page, locale);
}

/**
 * Pin the session's language. The domain comes from the auth cookie that
 * test-login just set, so this needs no knowledge of the base URL.
 */
export async function pinLocale(page: Page, locale: string): Promise<void> {
  const cookies = await page.context().cookies();
  const auth = cookies.find((cookie) => cookie.name.includes("auth-token"));
  if (!auth) return;
  await page.context().addCookies([
    { name: "waakya_lang", value: locale, domain: auth.domain, path: "/" },
  ]);
}

export async function signOut(page: Page): Promise<void> {
  await page.context().clearCookies();
}
