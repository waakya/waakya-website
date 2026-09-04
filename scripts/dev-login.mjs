/**
 * Print a sign-in link, so you can get into the app without an inbox.
 *
 *   npm run dev:login                        # owner@vaakya.test
 *   npm run dev:login -- staff@vaakya.test
 *
 * Development only, and structurally so:
 *
 *  - It is a script. Nothing in `app/` or `lib/` imports it, so it cannot be
 *    bundled and cannot reach the browser.
 *  - It refuses to run when NODE_ENV is production.
 *  - It needs SUPABASE_SERVICE_ROLE_KEY, which is server-only and must never
 *    be set in a client-visible variable.
 *
 * It asks Supabase's admin API to mint a magic-link token, then prints a URL
 * to *this app's* /auth/confirm route rather than Supabase's own verify
 * endpoint. That matters: Supabase's endpoint hands the session back in the
 * URL fragment, which never reaches a server, so cookie-based auth would not
 * pick it up. /auth/confirm verifies the hash server-side and sets the cookies.
 */
import { createClient } from "@supabase/supabase-js";

if (process.env.NODE_ENV === "production") {
  console.error("dev:login is for development only. Refusing to run.");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const email = process.argv[2] ?? "owner@vaakya.test";
const next = process.argv[3] ?? "/aaj";

if (!url) {
  console.error("NEXT_PUBLIC_SUPABASE_URL is not set. Check .env.local.");
  process.exit(1);
}

if (!serviceKey) {
  console.error(
    [
      "SUPABASE_SERVICE_ROLE_KEY is not set, and only the service role can mint",
      "a sign-in link.",
      "",
      "Get it from the Supabase dashboard:",
      "  Project Settings → API keys → service_role → Reveal",
      "",
      "Then put it in .env.local as:",
      "  SUPABASE_SERVICE_ROLE_KEY=...",
      "",
      "It bypasses row-level security, so it is server-only: never prefix it",
      "with NEXT_PUBLIC_, and never set it anywhere the browser can read.",
    ].join("\n"),
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
});

if (error) {
  console.error(`Could not generate a link for ${email}: ${error.message}`);
  if (/not found/i.test(error.message)) {
    console.error(
      "That user does not exist. Run supabase/seed-e2e.sql, or sign up first.",
    );
  }
  process.exit(1);
}

const hash = data?.properties?.hashed_token;
if (!hash) {
  console.error("Supabase returned no token hash. Nothing to sign in with.");
  process.exit(1);
}

const link = `${appUrl}/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=magiclink&next=${encodeURIComponent(next)}`;

console.log("");
console.log(`Sign-in link for ${email}:`);
console.log("");
console.log(`  ${link}`);
console.log("");
console.log("Paste it into the browser. It works once, and it expires.");
console.log("");
