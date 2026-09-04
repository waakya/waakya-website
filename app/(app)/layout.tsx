import { requireViewer } from "@/lib/auth/session";

/**
 * The signed-in shell. The auth check lives here, in the render path, not in
 * `proxy.ts` — a guard that only exists in the proxy is one rewrite away from
 * being bypassed, and RLS is the real backstop underneath both.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireViewer();
  return <div className="mx-auto min-h-dvh w-full max-w-md">{children}</div>;
}
