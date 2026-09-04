import { cookies } from "next/headers";

import { requireViewer } from "@/lib/auth/session";
import { LiveNotifications } from "@/components/vaakya/live-notifications";
import { DevRoleSwitch } from "@/components/vaakya/dev-role-switch";
import {
  DEV_ROLE_COOKIE,
  devAuthDisabled,
  toDevRole,
} from "@/lib/auth/dev-bypass";

/**
 * The signed-in shell. The auth check lives here, in the render path, not in
 * `proxy.ts` — a guard that only exists in the proxy is one rewrite away from
 * being bypassed, and RLS is the real backstop underneath both.
 *
 * The width is set by each screen rather than here: phone screens stay a
 * centred column, and the desktop layouts use the whole viewport.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireViewer();

  // Development only; renders nothing unless DEV_DISABLE_AUTH is on.
  const devRole = devAuthDisabled()
    ? toDevRole((await cookies()).get(DEV_ROLE_COOKIE)?.value)
    : null;

  const viewer = await requireViewer();

  return (
    <>
      {children}
      <LiveNotifications userId={viewer.userId} />
      {devRole ? <DevRoleSwitch current={devRole} /> : null}
    </>
  );
}
