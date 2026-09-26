"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, FileText, ListPlus, Paperclip, Send, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Ticks } from "@/components/waakya/ticks";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getDesign } from "@/lib/i18n/design";
import {
  createTaskFromMessage,
  postMessage,
  shareFileInConversation,
} from "@/lib/actions/conversations";
import { openDocument, requestDocumentUpload } from "@/lib/actions/documents";
import { MAX_DOCUMENT_BYTES, isAllowedType } from "@/lib/documents/rules";
import { getPhase1 } from "@/lib/i18n/phase1";
import type { Message } from "@/lib/conversations/queries";
import { attempt } from "@/lib/actions/attempt";
import { atIstTime, dayKey, formatTime } from "@/lib/tasks/time";
import { formatIndianDate } from "@/lib/tasks/format-date";
import { stateWord } from "@/lib/tasks/present";
import { ticksFor } from "@/lib/tasks/state-machine";
import type { TaskState } from "@/lib/supabase/types";

/**
 * A conversation, and the thing that makes it Waakya: any message can become
 * work somebody owns, without leaving the thread and without retyping it.
 *
 * The task is created by an explicit decision — who owns it, by when — so the
 * conversation stays a conversation until somebody commits.
 *
 * Layout: the thread is exactly one viewport tall. Only the messages scroll,
 * the composer never covers them, and the thread opens at the newest message.
 */
export function Thread({
  locale,
  conversationId,
  title,
  messages,
  members,
  attachments = {},
  isGroup = false,
  participantCount,
}: {
  locale: Locale;
  conversationId: string;
  title: string;
  messages: Message[];
  members: { userId: string; name: string }[];
  attachments?: Record<string, { id: string; name: string }[]>;
  isGroup?: boolean;
  participantCount?: number;
}) {
  const router = useRouter();
  const p1 = getPhase1(locale);
  const t = getDictionary(locale);
  const d = getDesign(locale);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const scroller = React.useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [openFor, setOpenFor] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [awayFromEnd, setAwayFromEnd] = React.useState(false);

  // Open at the newest message, and follow new ones — unless the reader has
  // scrolled up to read something older, which a new message must not yank
  // them away from.
  const lastId = messages[messages.length - 1]?.id;
  const firstRender = React.useRef(true);
  const awayRef = React.useRef(false);
  React.useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (firstRender.current || !awayRef.current) el.scrollTop = el.scrollHeight;
    firstRender.current = false;
  }, [lastId]);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    const away = el.scrollHeight - el.scrollTop - el.clientHeight > 160;
    awayRef.current = away;
    setAwayFromEnd(away);
  }

  function toLatest() {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }

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

  function send(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setError(null);
    const text = body;
    setBody("");
    startTransition(async () => {
      const result = await attempt(() => postMessage({ conversationId, body: text }), t.common.noConnection);
      if (!result.ok) {
        // Never lose what somebody typed: put it back with the reason.
        setError(result.message);
        setBody(text);
      }
    });
  }

  // The moment this thread was opened, read once: rendering must not ask
  // the clock, or two renders could disagree about what "today" is.
  const [openedAt] = React.useState(() => Date.now());
  const today = dayKey(new Date(openedAt));
  const yesterday = dayKey(new Date(openedAt - 86_400_000));
  const dayLabel = (iso: string) => {
    const key = dayKey(iso);
    if (key === today) return d.thread.today;
    if (key === yesterday) return d.thread.yesterday;
    return formatIndianDate(iso, locale);
  };

  return (
    <main className="flex h-dvh min-h-0 flex-1 flex-col bg-canvas">
      <header className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-3 py-2.5 lg:px-5">
        <Link
          href="/baat"
          aria-label={t.baat.back}
          className="grid size-10 shrink-0 place-items-center rounded-button text-fg-muted transition-colors duration-150 hover:bg-surface-muted lg:hidden"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <Avatar name={title} size={36} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-body-lg font-bold text-fg">{title}</h1>
          {isGroup && participantCount ? (
            <p className="num flex items-center gap-1 text-caption text-fg-subtle">
              <Users className="size-3.5" aria-hidden="true" />
              {d.thread.people(participantCount)}
            </p>
          ) : null}
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="h-full overflow-y-auto overscroll-contain px-3 py-4 lg:px-6"
        >
          <ol className="mx-auto flex max-w-3xl flex-col">
            {messages.map((message, index) => {
              const previous = messages[index - 1];
              const newDay = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt);
              // Consecutive messages from one person read as one turn: the
              // name once, tighter spacing.
              const sameRun =
                !newDay &&
                previous?.authorId === message.authorId &&
                Date.parse(message.createdAt) - Date.parse(previous.createdAt) < 10 * 60_000;
              const showAuthor = isGroup && !message.mine && !sameRun;

              return (
                <li key={message.id} className={cn(index === 0 ? "" : sameRun ? "mt-1" : "mt-4")}>
                  {newDay ? (
                    <p className="num mb-3 flex items-center gap-3 text-caption font-semibold text-fg-subtle">
                      <span className="h-px flex-1 bg-line" aria-hidden="true" />
                      {dayLabel(message.createdAt)}
                      <span className="h-px flex-1 bg-line" aria-hidden="true" />
                    </p>
                  ) : null}

                  <div className={cn("group flex flex-col", message.mine ? "items-end" : "items-start")}>
                    {showAuthor ? (
                      <p className="mb-1 px-1 text-caption font-semibold text-fg-muted">{message.authorName}</p>
                    ) : null}

                    <div
                      className={cn(
                        "max-w-[85%] rounded-card px-3.5 py-2.5 text-body lg:max-w-[70%]",
                        message.mine
                          ? "rounded-br-inner bg-neel-50 text-fg ring-1 ring-neel-100"
                          : "rounded-bl-inner bg-surface text-fg ring-1 ring-line",
                      )}
                    >
                      <p className="break-words whitespace-pre-wrap">{message.body}</p>
                      {attachments[message.id]?.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => openAttachment(doc.id)}
                          className={cn(
                            "mt-2 flex w-full items-center gap-2 rounded-inner px-2.5 py-2 text-left text-label font-semibold transition-colors duration-150",
                            message.mine ? "bg-surface text-neel-800 hover:bg-paper-50" : "bg-neel-50 text-neel-800 hover:bg-neel-100",
                          )}
                        >
                          <FileText className="size-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">{doc.name}</span>
                        </button>
                      ))}
                      <div className={cn("mt-1 flex items-center gap-2", message.mine && "flex-row-reverse")}>
                        <p className="num text-caption text-fg-subtle">
                          {!isGroup && !message.mine ? `${message.authorName} · ` : ""}
                          {formatTime(message.createdAt)}
                        </p>
                        {/* Any message can become work — your own instruction
                            included, the most common case. It lives on the
                            message's own time line so it never adds a row:
                            an icon on touch, a word on hover or focus. */}
                        {!message.taskId && openFor !== message.id ? (
                          <button
                            type="button"
                            onClick={() => setOpenFor(message.id)}
                            data-testid="make-task"
                            aria-label={d.thread.makeTask}
                            title={d.thread.makeTask}
                            // V3 review: hidden-until-hover made the core
                            // loop (message → work) undiscoverable. It is
                            // always there now, quiet, with a real target.
                            className={cn(
                              "-my-2 inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-inner px-1.5 text-caption font-semibold text-neel-700/75",
                              "transition-[color,background-color] duration-150 hover:bg-neel-50 hover:text-neel-700",
                              "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-neel-600",
                            )}
                          >
                            <ListPlus className="size-4" aria-hidden="true" />
                            <span className="hidden [@media(hover:hover)]:inline">{d.thread.makeTask}</span>
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {message.taskId || openFor === message.id ? (
                      <div className={cn("mt-1 flex w-full", message.mine ? "justify-end" : "justify-start")}>
                        {message.taskId ? (
                          <LinkedTask taskId={message.taskId} task={message.task} locale={locale} />
                        ) : (
                          <div className="w-full max-w-md">
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
                        )}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {awayFromEnd ? (
          <button
            type="button"
            onClick={toLatest}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-chip bg-surface px-3.5 py-2 text-label font-semibold text-neel-700 shadow-float ring-1 ring-line"
          >
            <ArrowDown className="size-4" aria-hidden="true" />
            {d.thread.latest}
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mx-3 mb-2 shrink-0 rounded-card bg-laal-100 px-3 py-2 text-body text-laal-700 lg:mx-6">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={send}
        className="shrink-0 border-t border-line bg-surface px-3 pt-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] lg:px-6"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            className="sr-only"
            // The paperclip button is the control; this input is its engine.
            aria-label={p1.conversations.attach}
            tabIndex={-1}
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
            className="flex-1 bg-canvas font-normal"
          />
          <Button type="submit" size="icon" disabled={pending || !body.trim()} aria-label={t.baat.send}>
            <Send aria-hidden="true" />
          </Button>
        </div>
      </form>
    </main>
  );
}

/**
 * The work a message became, and where it stands now — the glyph and the
 * state in words, never a colour on its own. Links to the task.
 */
function LinkedTask({
  taskId,
  task,
  locale,
}: {
  taskId: string;
  task: Message["task"];
  locale: Locale;
}) {
  const t = getDictionary(locale);
  const state = (task?.state ?? "delivered") as TaskState;
  const ticks = ticksFor(state);
  return (
    <Link
      href={`/kaam/${taskId}`}
      className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-chip bg-surface px-3 text-label font-semibold text-fg-muted ring-1 ring-line transition-colors duration-150 hover:text-neel-700 hover:ring-neel-200"
    >
      {ticks ? <Ticks state={ticks} locale={locale} size={16} /> : null}
      <span className="truncate">
        {t.baat.taskMade}
        {task ? ` · ${task.assigneeName} · ${stateWord(state, locale)}` : ""}
      </span>
    </Link>
  );
}

type DueChoice = "eod" | "tomorrow" | "hour";

/** Who owns it, and by when — both visible before anything is created. */
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
  const d = getDesign(locale);
  const titleId = React.useId();
  const [title, setTitle] = React.useState(message.body.slice(0, 140));
  // Your own message is an instruction to somebody else; start with them.
  const [assignee, setAssignee] = React.useState(
    message.mine
      ? (members.find((member) => member.userId !== message.authorId)?.userId ?? message.authorId)
      : message.authorId,
  );
  const [due, setDue] = React.useState<DueChoice>("eod");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  // "End of day" is 6 pm in the business's time zone; once that has passed it
  // is 6 pm tomorrow, and the label says so.
  const [eodPassed] = React.useState(() => atIstTime(new Date(), 18, 0).getTime() < Date.now());
  const choices: { key: DueChoice; label: string; at: () => Date }[] = [
    {
      key: "eod",
      label: eodPassed ? d.thread.dueTomorrowEvening : d.thread.dueToday,
      at: () => atIstTime(new Date(), 18, 0, eodPassed ? 1 : 0),
    },
    { key: "tomorrow", label: d.thread.dueTomorrow, at: () => atIstTime(new Date(), 10, 0, 1) },
    { key: "hour", label: d.thread.dueHour, at: () => new Date(Date.now() + 60 * 60_000) },
  ];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const dueAt = (choices.find((choice) => choice.key === due) ?? choices[0]).at();

    startTransition(async () => {
      const result = await attempt(
        () =>
          createTaskFromMessage({
            conversationId,
            messageId: message.id,
            assigneeId: assignee,
            title: title.trim(),
            dueAt: dueAt.toISOString(),
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

  const legend = "mb-1.5 text-caption font-semibold text-fg-muted";

  return (
    <form onSubmit={submit} className="enter-pop mt-1 rounded-card bg-surface p-3.5 shadow-float ring-1 ring-neel-200">
      <p className="mb-3 flex items-center gap-2 text-label font-semibold text-neel-700">
        <ListPlus className="size-4" aria-hidden="true" />
        {t.baat.fromThisMessage}
      </p>

      <label htmlFor={titleId} className={cn(legend, "block")}>
        {d.thread.whatLabel}
      </label>
      <Input
        id={titleId}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={140}
        className="h-11 text-body font-semibold"
      />

      <fieldset className="mt-3">
        <legend className={legend}>{d.thread.whoLabel}</legend>
        <div className="flex flex-wrap gap-1.5">
          {members.map((member) => (
            <Button
              key={member.userId}
              type="button"
              size="sm"
              aria-pressed={assignee === member.userId}
              variant={assignee === member.userId ? "primary" : "outline"}
              onClick={() => setAssignee(member.userId)}
              className="max-w-full"
            >
              <span className="truncate">{member.name}</span>
            </Button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-3">
        <legend className={legend}>{d.thread.byWhenLabel}</legend>
        <div className="flex flex-wrap gap-1.5">
          {choices.map((choice) => (
            <Button
              key={choice.key}
              type="button"
              size="sm"
              aria-pressed={due === choice.key}
              variant={due === choice.key ? "secondary" : "outline"}
              onClick={() => setDue(choice.key)}
              className="num"
            >
              {choice.label}
            </Button>
          ))}
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="mt-3 text-label text-laal-700">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex gap-2">
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
