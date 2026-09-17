"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { createGroupConversation, startDirectConversation } from "@/lib/actions/conversations";
import { cn } from "@/lib/utils";

/** Start a direct conversation with one teammate, or a group with several. */
export function StartConversation({
  locale,
  people,
}: {
  locale: Locale;
  people: { userId: string; name: string; role: string }[];
}) {
  const t = getDictionary(locale);
  const p = getPhase1(locale);
  const router = useRouter();
  const [mode, setMode] = React.useState<"closed" | "direct" | "group">("closed");
  const [title, setTitle] = React.useState("");
  const [picked, setPicked] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function startDirect(userId: string) {
    setError(null);
    startTransition(async () => {
      const result = await startDirectConversation({ userId });
      if (!result.ok) return setError(result.message);
      router.push(`/baat/${result.data.conversationId}`);
    });
  }

  function startGroup() {
    setError(null);
    startTransition(async () => {
      const result = await createGroupConversation({ title, memberIds: picked });
      if (!result.ok) return setError(result.message);
      router.push(`/baat/${result.data.conversationId}`);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setMode(mode === "direct" ? "closed" : "direct")}>
          <Plus aria-hidden="true" />
          {t.baat.newChat}
        </Button>
        <Button variant="outline" onClick={() => setMode(mode === "group" ? "closed" : "group")}>
          <Users aria-hidden="true" />
          {p.conversations.newGroup}
        </Button>
      </div>

      {mode !== "closed" ? (
        <Card className="mt-3 p-3">
          {mode === "group" ? (
            <div className="mb-3">
              <label htmlFor="group-name" className="text-[13px] font-semibold text-ink-700">
                {p.conversations.groupName}
              </label>
              <Input id="group-name" className="mt-1" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
            </div>
          ) : null}
          <p className="mb-2 text-[13px] font-semibold text-ink-700">
            {mode === "group" ? p.conversations.choosePeople : t.baat.choosePerson}
          </p>
          {error ? (
            <p role="alert" className="mb-2 rounded-card bg-laal-100 px-3 py-2 text-[14px] text-laal-700">
              {error}
            </p>
          ) : null}
          <ul className="flex flex-col gap-1">
            {people.map((person) => {
              const on = picked.includes(person.userId);
              return (
                <li key={person.userId}>
                  <button
                    type="button"
                    disabled={pending}
                    aria-pressed={mode === "group" ? on : undefined}
                    onClick={() =>
                      mode === "direct"
                        ? startDirect(person.userId)
                        : setPicked(on ? picked.filter((id) => id !== person.userId) : [...picked, person.userId])
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-card px-2 py-2 text-left transition-colors hover:bg-paper-100 disabled:opacity-50",
                      mode === "group" && on && "bg-neel-50",
                    )}
                  >
                    <Avatar name={person.name} size={30} />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink-900">{person.name}</span>
                    {mode === "group" && on ? (
                      <span className="text-[12px] font-semibold text-neel-700">✓</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {mode === "group" ? (
            <Button className="mt-3" disabled={pending || title.trim().length < 2 || picked.length === 0} onClick={startGroup}>
              {pending ? p.common.loading : p.conversations.createGroup}
            </Button>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
