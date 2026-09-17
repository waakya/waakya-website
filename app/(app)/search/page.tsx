import type { Metadata } from "next";
import Link from "next/link";
import { FileText, FolderKanban, MessageSquare, Search, SquareCheckBig, User } from "lucide-react";

import { requireOrg } from "@/lib/auth/session";
import { shellFor } from "@/lib/auth/shell";
import { createClient } from "@/lib/supabase/server";
import { getPhase1 } from "@/lib/i18n/phase1";
import { getOrgMembers } from "@/lib/org/members";
import { stateWord } from "@/lib/tasks/present";
import type { TaskState } from "@/lib/supabase/types";
import { AppShell } from "@/components/waakya/app-shell";

export const metadata: Metadata = { title: "Search" };

/** Escape the characters ILIKE treats as wildcards, so a query means what it says. */
function pattern(query: string): string {
  return `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * One search across the business's operational history. Every query runs as the
 * signed-in person, so row level security decides what can appear: another org's
 * data, or a conversation they are not in, is never a result.
 */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const viewer = await requireOrg();
  const shell = await shellFor(viewer);
  const p = getPhase1(shell.locale);
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";

  let results: {
    tasks: { id: string; title: string; state: TaskState }[];
    projects: { id: string; name: string }[];
    documents: { id: string; name: string }[];
    messages: { id: string; body: string; conversation_id: string }[];
    people: { userId: string; name: string; role: string }[];
  } | null = null;

  if (q.length >= 2) {
    const supabase = await createClient();
    const like = pattern(q);
    const [tasks, projects, documents, messages, members] = await Promise.all([
      supabase.from("tasks").select("id, title, state").eq("org_id", viewer.org.id).ilike("title", like).order("created_at", { ascending: false }).limit(10),
      supabase.from("projects").select("id, name").eq("org_id", viewer.org.id).ilike("name", like).limit(10),
      supabase.from("documents").select("id, name").eq("org_id", viewer.org.id).ilike("name", like).order("created_at", { ascending: false }).limit(10),
      supabase.from("messages").select("id, body, conversation_id").eq("org_id", viewer.org.id).ilike("body", like).order("created_at", { ascending: false }).limit(10),
      getOrgMembers(viewer.org.id),
    ]);
    const needle = q.toLowerCase();
    results = {
      tasks: (tasks.data ?? []) as { id: string; title: string; state: TaskState }[],
      projects: projects.data ?? [],
      documents: documents.data ?? [],
      messages: messages.data ?? [],
      people: members.filter((member) => member.name.toLowerCase().includes(needle)).slice(0, 10),
    };
  }

  const total = results
    ? results.tasks.length + results.projects.length + results.documents.length + results.messages.length + results.people.length
    : 0;

  const groupClass = "overflow-hidden rounded-card border border-paper-200 bg-paper-0";
  const rowClass = "flex items-center gap-3 border-b border-paper-100 px-3.5 py-3 last:border-b-0 hover:bg-paper-50";

  return (
    <AppShell {...shell}>
      <main className="flex-1 p-4 pb-8">
        <h1 className="text-[24px] leading-[30px] font-bold text-ink-900">{p.search.title}</h1>
        <form action="/search" className="relative mt-4">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <input
            name="q"
            defaultValue={q}
            autoFocus
            placeholder={p.search.placeholder}
            aria-label={p.search.placeholder}
            className="h-12 w-full rounded-button border border-paper-200 bg-paper-0 pr-3 pl-10 text-[16px] outline-none focus:border-neel-600"
          />
        </form>

        {!results ? (
          <p className="mt-4 text-[14px] text-ink-500">{p.search.hint}</p>
        ) : total === 0 ? (
          <p className="mt-6 text-[15px] text-ink-500">{p.search.none}</p>
        ) : (
          <div className="mt-5 flex flex-col gap-5">
            {results.tasks.length ? (
              <section>
                <h2 className="mb-2 text-[13px] font-semibold text-ink-700">{p.search.tasks}</h2>
                <ul className={groupClass}>
                  {results.tasks.map((task) => (
                    <li key={task.id}>
                      <Link href={`/kaam/${task.id}`} className={rowClass}>
                        <SquareCheckBig className="size-4 shrink-0 text-neel-700" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-ink-900">{task.title}</span>
                        <span className="shrink-0 text-[12.5px] text-ink-500">{stateWord(task.state, shell.locale)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {results.projects.length ? (
              <section>
                <h2 className="mb-2 text-[13px] font-semibold text-ink-700">{p.search.projects}</h2>
                <ul className={groupClass}>
                  {results.projects.map((project) => (
                    <li key={project.id}>
                      <Link href={`/projects/${project.id}`} className={rowClass}>
                        <FolderKanban className="size-4 shrink-0 text-neel-700" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-ink-900">{project.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {results.documents.length ? (
              <section>
                <h2 className="mb-2 text-[13px] font-semibold text-ink-700">{p.search.documents}</h2>
                <ul className={groupClass}>
                  {results.documents.map((doc) => (
                    <li key={doc.id}>
                      <Link href={`/documents/${doc.id}`} className={rowClass}>
                        <FileText className="size-4 shrink-0 text-neel-700" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-ink-900">{doc.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {results.people.length ? (
              <section>
                <h2 className="mb-2 text-[13px] font-semibold text-ink-700">{p.search.people}</h2>
                <ul className={groupClass}>
                  {results.people.map((person) => (
                    <li key={person.userId}>
                      <Link href="/staff" className={rowClass}>
                        <User className="size-4 shrink-0 text-neel-700" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-ink-900">{person.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {results.messages.length ? (
              <section>
                <h2 className="mb-2 text-[13px] font-semibold text-ink-700">{p.search.messages}</h2>
                <ul className={groupClass}>
                  {results.messages.map((message) => (
                    <li key={message.id}>
                      <Link href={`/baat/${message.conversation_id}`} className={rowClass}>
                        <MessageSquare className="size-4 shrink-0 text-neel-700" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-[14px] text-ink-900">{message.body}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </AppShell>
  );
}
