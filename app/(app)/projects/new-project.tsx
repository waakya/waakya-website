"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { createProject } from "@/lib/actions/projects";
import { cn } from "@/lib/utils";

export function NewProject({
  locale,
  people,
}: {
  locale: Locale;
  people: { id: string; name: string }[];
}) {
  const p = getPhase1(locale);
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [members, setMembers] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createProject({
        name,
        description,
        startDate: start || null,
        endDate: end || null,
        memberIds: members,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(`/projects/${result.data.id}`);
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        {p.projects.newProject}
      </Button>
    );
  }

  return (
    <Card className="p-4">
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <div>
          <Label htmlFor="project-name">{p.projects.name}</Label>
          <Input id="project-name" className="mt-1" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="project-description">
            {p.projects.description} ({p.common.optional})
          </Label>
          <textarea
            id="project-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-button border border-paper-200 bg-paper-0 px-3 py-2 text-[15px] outline-none focus:border-neel-600"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="project-start">{p.projects.start}</Label>
            <Input id="project-start" type="date" className="mt-1" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="project-end">{p.projects.end}</Label>
            <Input id="project-end" type="date" className="mt-1" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        {people.length > 0 ? (
          <div>
            <p className="text-[13px] font-semibold text-ink-700">{p.projects.members}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {people.map((person) => {
                const on = members.includes(person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setMembers(on ? members.filter((id) => id !== person.id) : [...members, person.id])
                    }
                    className={cn(
                      "rounded-chip border px-3 py-1 text-[13px] font-semibold",
                      on ? "border-neel-600 bg-neel-600 text-white" : "border-paper-200 bg-paper-0 text-ink-700",
                    )}
                  >
                    {person.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {error ? (
          <p role="alert" data-testid="project-error" className="rounded-card bg-laal-100 px-3 py-2 text-[14px] text-laal-700">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending || name.trim().length < 2}>
            {pending ? p.common.loading : p.common.create}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {p.common.cancel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
