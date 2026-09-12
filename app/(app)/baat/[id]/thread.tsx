"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ListPlus, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StateChip } from "@/components/ui/state-chip";
import { getDictionary, type Locale } from "@/lib/i18n";
import { createTaskFromMessage, postMessage } from "@/lib/actions/conversations";
import { formatPunchTime } from "@/lib/attendance/time";
import type { Message } from "@/lib/conversations/queries";

/**
 * A conversation, and the thing that makes it Waakya: any message can become
 * work somebody owns, without leaving the thread and without retyping it.
 *
 * The task is created by an explicit decision — who owns it, by when — so the
 * conversation stays a conversation until somebody commits.
 */
export function Thread({
  locale,
  conversationId,
  title,
  messages,
  members,
}: {
  locale: Locale;
  conversationId: string;
  title: string;
  messages: Message[];
  members: { userId: string; name: string }[];
}) {
  const t = getDictionary(locale);
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [openFor, setOpenFor] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function send(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setError(null);
    const text = body;
    setBody("");
    startTransition(async () => {
      const result = await postMessage({ conversationId, body: text });
      if (!result.ok) {
        setError(result.message);
        setBody(text);
      }
    });
  }

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-paper-200 px-4 py-3">
        <Link
          href="/baat"
          aria-label={t.baat.back}
          className="grid size-9 shrink-0 place-items-center rounded-button border border-paper-200"
        >
          <ArrowLeft className="size-4 text-ink-700" aria-hidden="true" />
        </Link>
        <h1 className="truncate text-[17px] font-bold text-ink-900">{title}</h1>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div className={cn("flex", message.mine && "justify-end")}>
              <div className="max-w-[80%]">
                <div
                  className={cn(
                    "rounded-card px-3.5 py-2.5 text-[15px] leading-[21px]",
                    message.mine
                      ? "bg-neel-600 text-white"
                      : "border border-paper-200 bg-paper-0 text-ink-900",
                  )}
                >
                  {message.body}
                </div>
                <p
                  className={cn(
                    "num mt-1 text-[12px] text-ink-400",
                    message.mine && "text-right",
                  )}
                >
                  {message.mine ? "" : `${message.authorName} · `}
                  {formatPunchTime(message.createdAt)}
                </p>
              </div>
            </div>

            {/* Any message somebody else sent can become work. */}
            {!message.mine ? (
              <div className={cn("mt-1", message.taskId && "mb-2")}>
                {message.taskId ? (
                  <Link href={`/kaam/${message.taskId}`} className="inline-flex">
                    <StateChip tone="hara">{t.baat.taskMade}</StateChip>
                  </Link>
                ) : openFor === message.id ? (
                  <TaskFromMessage
                    locale={locale}
                    conversationId={conversationId}
                    message={message}
                    members={members}
                    onDone={() => {
                      setOpenFor(null);
                      // The link comes back from the server, so it survives a refresh.
                      router.refresh();
                    }}
                    onCancel={() => setOpenFor(null)}
                  />
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setOpenFor(message.id)}
                  >
                    <ListPlus aria-hidden="true" />
                    {t.baat.createTask}
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mx-4 rounded-card bg-laal-100 px-3 py-2 text-[15px] text-laal-700">
          {error}
        </p>
      ) : null}

      <form onSubmit={send} className="flex items-center gap-2 border-t border-paper-200 p-3">
        <Input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t.baat.writeMessage}
          aria-label={t.baat.writeMessage}
          maxLength={4000}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={pending || !body.trim()} aria-label={t.baat.send}>
          <Send aria-hidden="true" />
        </Button>
      </form>
    </main>
  );
}

/** Who owns it, and by when. Defaults that are usually right, all editable. */
function TaskFromMessage({
  locale,
  conversationId,
  message,
  members,
  onDone,
  onCancel,
}: {
  locale: Locale;
  conversationId: string;
  message: Message;
  members: { userId: string; name: string }[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = getDictionary(locale);
  const [title, setTitle] = React.useState(message.body.slice(0, 140));
  const [assignee, setAssignee] = React.useState(message.authorId);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    // Today at 6pm, which is what "by end of day" means in an office.
    const due = new Date();
    due.setHours(18, 0, 0, 0);
    if (due.getTime() < Date.now()) due.setDate(due.getDate() + 1);

    startTransition(async () => {
      const result = await createTaskFromMessage({
        conversationId,
        messageId: message.id,
        assigneeId: assignee,
        title: title.trim(),
        dueAt: due.toISOString(),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onDone();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="mt-1 rounded-card border border-neel-200 bg-neel-50 p-3"
    >
      <p className="mb-2 text-[12px] font-semibold text-neel-700">
        {t.baat.fromThisMessage}
      </p>
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        aria-label={t.create.kya}
        maxLength={140}
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {members.map((member) => (
          <Button
            key={member.userId}
            type="button"
            size="sm"
            variant={assignee === member.userId ? "primary" : "outline"}
            onClick={() => setAssignee(member.userId)}
          >
            {member.name}
          </Button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-laal-700">
          {error}
        </p>
      ) : null}
      <div className="mt-2 flex gap-2">
        <Button type="submit" size="sm" disabled={pending || title.trim().length < 2}>
          {pending ? t.common.loading : t.baat.createTask}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t.baat.back}
        </Button>
      </div>
    </form>
  );
}
