import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import {
  DEV_ROLE_COOKIE,
  DEV_USERS,
  devAuthDisabled,
  toDevRole,
} from "@/lib/auth/dev-bypass";

/**
 * Renamed from `middleware` in Next 16. It runs before rendering and does one
 * job: refresh the Supabase session and write the rotated cookies onto the
 * response, so pages and server actions always see a live session.
 *
 * Route protection lives in the (app) layout, not here — an auth check that
 * only exists in the proxy is one rewrite away from being bypassed.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Responses that set auth cookies must never be cached by a CDN.
        for (const [header, value] of Object.entries(headers)) {
          response.headers.set(header, value);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
   * Development only, and off unless DEV_DISABLE_AUTH is exactly "true".
   *
   * It happens here rather than in the layout because this is the only place
   * that can write cookies onto the response — signing in during a render
   * would establish a session for that one request and then throw it away, so
   * every navigation would sign in again.
   */
  // The landing page is for logged-out visitors, so signing in there would
  // make it unreachable while the flag is on.
  const onMarketing =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/privacy");

  if (!user && !onMarketing && devAuthDisabled()) {
    const wanted = DEV_USERS[toDevRole(request.cookies.get(DEV_ROLE_COOKIE)?.value)];
    const { error } = await supabase.auth.signInWithPassword(wanted);
    if (error) {
      console.warn(
        `[dev] DEV_DISABLE_AUTH is on but signing in as ${wanted.email} failed: ` +
          `${error.message}. Run supabase/seed-e2e.sql against this project.`,
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files — the session only
     * matters for pages, actions and route handlers.
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|sound/|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|wav|webmanifest)$).*)",
  ],
};
