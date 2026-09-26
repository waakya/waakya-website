"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { installTemplate } from "@/lib/records/actions";
import { getRecords } from "@/lib/i18n/records";
import type { Locale } from "@/lib/i18n";

export function InstallTemplate({ locale, templateKey, label, installed = false }: { locale: Locale; templateKey: string; label: string; installed?: boolean }) {
  const t = getRecords(locale);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant={installed ? "outline" : "secondary"}
      disabled={pending || installed}
      onClick={() =>
        startTransition(async () => {
          const result = await installTemplate(templateKey);
          if (!result.ok) {
            toast.error(result.message);
            return;
          }
          router.push(`/records/${result.data.key}`);
        })
      }
    >
      {installed ? null : <Plus aria-hidden="true" />}
      {installed ? `${label} · ${t.types.installed}` : `${t.types.install}: ${label}`}
    </Button>
  );
}
