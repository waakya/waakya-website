"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, ListPlus, Paperclip, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StateChip } from "@/components/ui/state-chip";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getUx } from "@/lib/i18n/ux";
import {
  createTaskFromMessage,
  postMessage,
  shareFileInConversation,
} from "@/lib/actions/conversations";
import { openDocument, requestDocumentUpload } from "@/lib/actions/documents";
import { MAX_DOCUMENT_BYTES, isAllowedType } from "@/lib/documents/rules";
import { getPhase1 } from "@/lib/i18n/phase1";
import { formatPunchTime } from "@/lib/attendance/time";
import type { Message } from "@/lib/conversations/queries";
import { attempt } from "@/lib/actions/attempt";

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
  attachments = {},
  isGroup = false,
}: {
  locale: Locale;
  conversationId: string;
  title: string;
  messages: Message[];
  members: { userId: string; name: string }[];
  attachments?: Record<string, { id: string; name: string }[]>;
  isGroup?: boolean;
}) {
  const router = useRouter();
  const p1 = getPhase1(locale);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function shareFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_DOCUMENT_BYTES) return setError(p1.documents.tooBig);
    const type = file.type || "application/octet-stream";
    if (!isAllowedType(type)) return setError(p1.documents.badType);
    setUploading(true);
    try {
      const signed = await requestDocumentUpload({ name: file.name, contentType: type, size: file.size });
      if (!signed.ok) return setError(signed.message);
      const put = await fetch(signed.data.url, { method: "PUT", headers: signed.data.headers, body: file });
      if (!put.ok) return setError(p1.common.failed);
      const shared = await shareFileInConversation({
        conversationId,
        key: signed.data.key,
        name: file.name,
        contentType: type,
        size: file.size,
      });
      if (!shared.ok) return setError(shared.message);
      router.refresh();
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function openAttachment(id: string) {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    const result = await openDocument({ id });
    if (!result.ok) {
      tab?.close();
      return setError(result.message);
    }
    const url = result.data.url;
    if (url.startsWith("/")) {
      tab?.close();
      router.push(url);
    } else if (tab) tab.location.replace(url);
    else window.location.assign(url);
  }

  const t = getDictionary(locale);
  const ux = getUx(locale);
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [openFor, setOpenFor] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function send(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setError(null);
    const text = body;
    setBody("");
    startTransition(async () => {
      const result = await attempt(() => postMessage({ conversationId, body: text }), t.common.noConnection);
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
                      ? "border border-neel-200 bg-neel-50 text-ink-900"
                      : "border border-paper-200 bg-paper-0 text-ink-900",
                  )}
                >
                  {message.body}
                  {attachments[message.id]?.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => openAttachment(doc.id)}
                      className={cn(
                        "mt-2 flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] font-semibold",
                        message.mine ? "bg-paper-0 text-neel-800" : "bg-neel-50 text-neel-800",
                      )}
                    >
                      <FileText className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{doc.name}</span>
                    </button>
                  ))}
                </div>
                <p
                  className={cn(
                    "num mt-1 text-[12px] text-ink-400",
                    message.mine && "text-right",
                  )}
                >
                  {message.mine || !isGroup ? (message.mine ? "" : `${message.authorName} · `) : `${message.authorName} · `}
                  {formatPunchTime(message.createdAt)}
                </p>
              </div>
            </div>

            {/* Any message can become work — your own instruction included,
                which is the most common case. */}
            <div className={cn("mt-1.5 flex", message.mine && "justify-end", message.taskId && "mb-2")}>
              {message.taskId ? (
                <Link href={`/kaam/${message.taskId}`} className="inline-flex">
                  <StateChip tone="hara">{t.baat.taskMade}</StateChip>
                </Link>
              ) : openFor === message.id ? (
                <div className="w-full max-w-[92%]">
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
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenFor(message.id)}
                  data-testid="make-task"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-button border border-neel-200 bg-paper-0 px-3 text-[13.5px] font-semibold text-neel-700 transition-colors hover:border-neel-400 hover:bg-neel-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neel-600"
                >
                  <ListPlus className="size-4" aria-hidden="true" />
                  {ux.thread.makeTask}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mx-4 rounded-card bg-laal-100 px-3 py-2 text-[15px] text-laal-700">
          {error}
        </p>
      ) : null}

      <form onSubmit={send} className="sticky bottom-0 z-20 flex items-center gap-2 border-t border-paper-200 bg-paper-50 p-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))]">
        <input
          ref={fileInput}
          type="file"
          className="sr-only"
          data-testid="thread-file-input"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
          onChange={(event) => shareFile(event.target.files)}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={p1.conversations.attach}
          title={p1.conversations.attach}
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        >
          <Paperclip aria-hidden="true" />
        </Button>
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
  // Your own message is an instruction to somebody else; start with them.
  const [assignee, setAssignee] = React.useState(
    message.mine
      ? (members.find((member) => member.userId !== message.authorId)?.userId ?? message.authorId)
      : message.authorId,
  );
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
      const result = await attempt(
        () =>
          createTaskFromMessage({
            conversationId,
            messageId: message.id,
            assigneeId: assignee,
            title: title.trim(),
            dueAt: due.toISOString(),
          }),
        t.common.noConnection,
      );
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
