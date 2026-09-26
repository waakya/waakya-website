"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getPortal } from "@/lib/i18n/portal";
import type { Locale } from "@/lib/i18n";
import { sendMessage } from "@/lib/portal/actions";

export function MessageForm({ locale, projectId }: { locale: Locale; projectId: string }) {
  const t = getPortal(locale).portal;
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await sendMessage({ projectId, body });
          if (!result.ok) {
            toast.error(result.message);
            return;
          }
          setBody("");
          router.refresh();
        });
      }}
    >
      <label htmlFor="portal-message" className="text-label font-semibold text-fg-muted">{t.writeToUs}</label>
      <textarea id="portal-message" rows={3} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 py-2 text-body outline-none focus:border-neel-600" required />
      <Button type="submit" size="staff" disabled={pending || body.trim().length === 0} className="self-end">{t.send}</Button>
    </form>
  );
}
