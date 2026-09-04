"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatTime } from "@/lib/tasks/time";
import type { ThreadMessage } from "@/lib/tasks/detail";
import { addMessageAction } from "@/lib/actions/task-actions";
import { cn } from "@/lib/utils";

/**
 * The reply thread. The assignee reverts on the message rather than calling,
 * and every line is timestamped, so a "I told you" is a fact rather than a
 * memory.
 */
export function Thread({
  locale,
  taskId,
  messages,
  viewerId,
}: {
  locale: Locale;
  taskId: string;
  messages: ThreadMessage[];
  viewerId: string;
}) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function send(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    setError(null);
    startTransition(async () => {
      const result = await addMessageAction({ taskId, body: text });
      if (!result.ok) setError(result.message);
      else {
        setBody("");
        router.refresh();
      }
    });
  }

  return (
    <section className="mt-6">
      <h3 className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-700">
        {t.detail.thread}
      </h3>

      {messages.length === 0 ? (
        <p className="text-[15px] text-ink-400">{t.detail.noMessages}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {messages.map((message) => {
            const mine = message.authorId === viewerId;
            return (
              <li
                key={message.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-card px-3 py-2",
                    mine
                      ? "bg-neel-100 text-neel-800"
                      : "border border-paper-200 bg-paper-0 text-ink-900",
                  )}
                >
                  <p className="text-[13px] font-semibold">
                    {message.authorName}
                  </p>
                  <p className="text-[15px] leading-[20px]">{message.body}</p>
                  <p className="num mt-0.5 text-[11px] text-ink-500">
                    {formatTime(message.at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={send} noValidate className="mt-3 flex gap-2">
        <Input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t.detail.threadPlaceholder}
          aria-label={t.detail.thread}
          className="flex-1 text-[15px] font-normal"
        />
        <Button
          type="submit"
          size="icon"
          aria-label={t.actions.bhejo}
          disabled={pending || body.trim().length === 0}
        >
          <Send />
        </Button>
      </form>

      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-laal-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
