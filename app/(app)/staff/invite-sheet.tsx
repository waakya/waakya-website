"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Send, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getDictionary, type Locale } from "@/lib/i18n";
import { createInvite } from "@/lib/actions/org";

type Role = "admin" | "manager" | "member";

/**
 * Name and phone, then a link the owner sends themselves. The invite arrives
 * from the owner's own number, not from an app — which is why staff join
 * (Character document §3.1).
 */
export function InviteSheet({ locale, compact = false, staffOnly = false }: { locale: Locale; compact?: boolean; staffOnly?: boolean }) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState<Role[]>(["member"]);
  const [link, setLink] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function reset() {
    setFullName("");
    setPhone("");
    setRole(["member"]);
    setLink(null);
    setCopied(false);
    setError(null);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createInvite({
        fullName,
        phone,
        role: role[0] ?? "member",
      });
      if (!result.ok) setError(result.message);
      else {
        setLink(result.data.url);
        router.refresh();
      }
    });
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Clipboard refused (an insecure origin, or the WhatsApp in-app browser).
      // The link stays selectable on screen, so nothing is lost.
      setCopied(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <SheetTrigger
        render={
          <Button size={compact ? "owner" : "block"}>
            <UserPlus />
            {t.org.invite}
          </Button>
        }
      />
      <SheetContent>
        <SheetTitle>{t.org.inviteTitle}</SheetTitle>
        <SheetDescription>
          {link ? t.org.linkHelp : t.org.inviteSubtitle}
        </SheetDescription>

        {link ? (
          <div className="mt-4">
            <p className="text-[13px] font-semibold text-ink-700">
              {t.org.linkReady}
            </p>
            <p className="mt-1 rounded-card border border-paper-200 bg-paper-0 p-3 text-[13px] break-all text-ink-700 select-all">
              {link}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Button size="block" onClick={copy}>
                {copied ? <Check /> : <Copy />}
                {copied ? t.org.copied : t.org.copyLink}
              </Button>
              <Button variant="ghost" onClick={() => reset()}>
                {t.org.invite}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-4">
            <Label htmlFor="invite-name">{t.org.staffName}</Label>
            <Input
              id="invite-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder={t.org.staffNamePlaceholder}
              className="mt-1.5"
            />

            <Label htmlFor="invite-phone" className="mt-4 block">
              {t.org.staffPhone}
            </Label>
            <Input
              id="invite-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={t.org.staffPhonePlaceholder}
              className="num mt-1.5"
            />

            <p className="mt-4 mb-1.5 text-[13px] font-semibold text-ink-700">
              {t.org.roleLabel}
            </p>
            <ToggleGroup
              value={role}
              onValueChange={(next) =>
                setRole(next.length ? (next as Role[]) : role)
              }
              aria-label={t.org.roleLabel}
            >
              <ToggleGroupItem value="member">{t.org.roles.member}</ToggleGroupItem>
              {/* A manager invites staff; higher roles are the owner's to give. */}
              {staffOnly ? null : <ToggleGroupItem value="manager">{t.org.roles.manager}</ToggleGroupItem>}
              {staffOnly ? null : <ToggleGroupItem value="admin">{t.org.roles.admin}</ToggleGroupItem>}
            </ToggleGroup>

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-card bg-laal-100 px-3 py-2 text-[15px] leading-[20px] text-laal-700"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" size="block" disabled={pending} className="mt-5">
              <Send />
              {pending ? t.common.loading : t.org.makeInvite}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
