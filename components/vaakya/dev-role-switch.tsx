"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { DEV_ROLES, type DevRole } from "@/lib/auth/dev-bypass";
import { setDevRole } from "@/lib/actions/dev";
import { cn } from "@/lib/utils";

/**
 * Development only. Switches which seeded user the app signs you in as, so
 * both sides of the product can be looked at without logging in and out.
 *
 * It renders nothing unless the layout passes it a role, and the layout only
 * does that when `DEV_DISABLE_AUTH` is on — so in production this component is
 * never mounted, and there is nothing to see.
 */
export function DevRoleSwitch({ current }: { current: DevRole }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <div
      className={cn(
        // Bottom right: the sidebar's own person card lives bottom left.
        // Clear of the bottom nav on a phone, and of nothing on desktop.
        "fixed right-3 bottom-20 z-50 flex items-center gap-1 rounded-chip lg:bottom-3",
        "border border-paper-300 bg-paper-0/95 p-1 shadow-float backdrop-blur",
      )}
    >
      <span className="px-2 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
        dev
      </span>
      {DEV_ROLES.map((role) => (
        <button
          key={role}
          type="button"
          disabled={pending}
          aria-pressed={role === current}
          onClick={() =>
            startTransition(async () => {
              await setDevRole(role);
              router.refresh();
            })
          }
          className={cn(
            "rounded-chip px-3 py-1.5 text-[13px] font-semibold capitalize transition-colors",
            role === current
              ? "bg-neel-600 text-white"
              : "text-ink-700 hover:bg-paper-100",
          )}
        >
          {role}
        </button>
      ))}
    </div>
  );
}
