"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";

export function SignOutButton({
  label,
  icon,
}: {
  label: string;
  icon: React.ReactNode;
}) {
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      variant="ghost"
      className="mt-3"
      disabled={pending}
      onClick={() => startTransition(async () => void (await signOut()))}
    >
      {icon}
      {label}
    </Button>
  );
}
