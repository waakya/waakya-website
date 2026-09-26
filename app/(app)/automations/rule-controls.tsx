"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getAutomation } from "@/lib/i18n/automation";
import type { Locale } from "@/lib/i18n";
import { installExampleRule, setRuleEnabled } from "@/lib/automation/actions";

export function RuleToggle({ locale, id, enabled }: { locale: Locale; id: string; enabled: boolean }) {
  const t = getAutomation(locale);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <span className="flex items-center gap-2">
      <span className="text-label font-semibold text-fg-muted">{enabled ? t.enabled : t.disabled}</span>
      <Switch
        checked={enabled}
        disabled={pending}
        aria-label={t.enabled}
        onCheckedChange={(checked) =>
          startTransition(async () => {
            const result = await setRuleEnabled({ id, enabled: checked });
            if (!result.ok) toast.error(result.message);
            router.refresh();
          })
        }
      />
    </span>
  );
}

export function InstallExample({ locale, exampleKey, label }: { locale: Locale; exampleKey: string; label: string }) {
  const t = getAutomation(locale);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await installExampleRule(exampleKey);
          if (!result.ok) {
            toast.error(result.message);
            return;
          }
          router.push(`/automations/${result.data.id}`);
        })
      }
    >
      <Plus aria-hidden="true" />
      {t.examples.install}: {label}
    </Button>
  );
}
