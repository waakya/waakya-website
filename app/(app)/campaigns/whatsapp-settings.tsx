"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setWhatsAppNumber } from "@/lib/campaigns/actions";

/** The phone number id from WhatsApp Manager: replies to it belong to this business. */
export function WhatsAppSettings({ initial, label, save }: { initial: string; label: string; save: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState(initial);
  const [pending, startTransition] = React.useTransition();
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await setWhatsAppNumber({ phoneNumberId: value });
          if (!result.ok) toast.error(result.message);
          router.refresh();
        });
      }}
    >
      <div className="min-w-56">
        <Label htmlFor="wa-phone-id">{label}</Label>
        <Input id="wa-phone-id" className="mt-1 h-10 text-body-sm" value={value} maxLength={40} inputMode="numeric" onChange={(e) => setValue(e.target.value)} />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending || value === initial}>{save}</Button>
    </form>
  );
}
