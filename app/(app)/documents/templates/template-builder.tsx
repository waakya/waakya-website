"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Locale } from "@/lib/i18n";
import { getPhase1 } from "@/lib/i18n/phase1";
import { getUx } from "@/lib/i18n/ux";
import { saveTemplateDocument } from "@/lib/actions/documents";
import {
  renderTemplateHtml,
  type BusinessDetails,
  type TemplateDefinition,
} from "@/lib/documents/templates";
import { workDate } from "@/lib/attendance/time";

/**
 * Select a template, fill structured fields, see the real document as it will
 * be saved, and keep it in the library. The preview is the same renderer the
 * server uses, so what is previewed is exactly what is stored.
 */
export function TemplateBuilder({
  locale,
  templates,
  business,
  projects,
  initialProjectId = null,
  taskId = null,
  initialTemplateKey = null,
}: {
  locale: Locale;
  templates: TemplateDefinition[];
  business: BusinessDetails;
  projects: { id: string; name: string }[];
  /** Opened from a project or a task: the document belongs there. */
  initialProjectId?: string | null;
  taskId?: string | null;
  initialTemplateKey?: string | null;
}) {
  const p = getPhase1(locale);
  const ux = getUx(locale);
  const router = useRouter();
  const [chosen, setChosen] = React.useState<TemplateDefinition | null>(
    () => templates.find((template) => template.key === initialTemplateKey) ?? null,
  );
  const [data, setData] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (initialTemplateKey) initial.date = workDate();
    return initial;
  });
  const [projectId, setProjectId] = React.useState<string>(initialProjectId ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [savedId, setSavedId] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function pick(template: TemplateDefinition) {
    setChosen(template);
    setSavedId(null);
    setError(null);
    setData({ date: workDate() });
  }

  const html = chosen ? renderTemplateHtml(chosen.key, data, business) : "";

  function save() {
    if (!chosen) return;
    setError(null);
    startTransition(async () => {
      const result = await saveTemplateDocument({
        templateKey: chosen.key,
        data,
        projectId: projectId || null,
        taskId,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSavedId(result.data.id);
      router.refresh();
    });
  }

  if (!chosen) {
    return (
      <main className="flex-1 p-4 pb-8">
        <Link href="/documents" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-neel-700">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {p.documents.title}
        </Link>
        <h1 className="mt-3 text-[24px] leading-[30px] font-bold text-ink-900">{p.templates.title}</h1>
        <p className="mt-0.5 text-[15px] leading-[20px] text-ink-500">{p.templates.subtitle}</p>

        <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {templates.map((template) => (
            <li key={template.key}>
              <button
                type="button"
                onClick={() => pick(template)}
                className="flex w-full items-start gap-3 rounded-card border border-paper-200 bg-paper-0 p-4 text-left transition-colors hover:border-neel-300 hover:bg-neel-50"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-neel-50">
                  <FileText className="size-4 text-neel-700" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-ink-900">{template.title}</span>
                  <span className="block text-[13px] text-ink-500">{template.blurb}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 pb-8">
      <button
        type="button"
        onClick={() => setChosen(null)}
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-neel-700"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {p.templates.back}
      </button>
      <h1 className="mt-3 text-[24px] leading-[30px] font-bold text-ink-900">{chosen.title}</h1>

      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          noValidate
          className="flex flex-col gap-3"
        >
          {projects.length > 0 ? (
            <div>
              <Label htmlFor="template-project">{ux.templates.linkProject}</Label>
              <select
                id="template-project"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className="mt-1 h-11 w-full rounded-button border border-paper-200 bg-paper-0 px-3 text-[15px]"
              >
                <option value="">{p.common.none}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {taskId ? (
            <p className="rounded-card bg-neel-50 px-3 py-2 text-[14px] text-neel-800">{ux.templates.linkedTask}</p>
          ) : null}
          <h2 className="mt-1 text-[13px] font-semibold text-ink-700">{p.templates.fields}</h2>
          {chosen.fields.map((field) => {
            const id = `field-${field.key}`;
            const label = p.templates.fieldLabels[field.key] ?? field.key;
            return (
              <div key={field.key}>
                <Label htmlFor={id}>
                  {label}
                  {field.required ? " *" : ""}
                </Label>
                {field.kind === "textarea" ? (
                  <textarea
                    id={id}
                    rows={3}
                    value={data[field.key] ?? ""}
                    onChange={(event) => setData({ ...data, [field.key]: event.target.value })}
                    className="mt-1 w-full rounded-button border border-paper-200 bg-paper-0 px-3 py-2 text-[15px] text-ink-900 outline-none focus:border-neel-600"
                  />
                ) : (
                  <Input
                    id={id}
                    className="mt-1"
                    type={field.kind === "date" ? "date" : "text"}
                    inputMode={field.kind === "money" || field.kind === "percent" ? "decimal" : undefined}
                    value={data[field.key] ?? ""}
                    onChange={(event) => setData({ ...data, [field.key]: event.target.value })}
                  />
                )}
              </div>
            );
          })}


          {error ? (
            <p role="alert" data-testid="template-error" className="rounded-card bg-laal-100 px-3 py-2 text-[14px] text-laal-700">
              {error}
            </p>
          ) : null}

          {savedId ? (
            <p className="flex items-center gap-2 rounded-card bg-hara-100 px-3 py-2 text-[14px] font-semibold text-hara-700">
              <Check className="size-4" aria-hidden="true" />
              {p.templates.saved}
              <Link href={`/documents/${savedId}`} className="ml-auto underline">
                {p.common.open}
              </Link>
            </p>
          ) : null}

          <Button type="submit" size="block" disabled={pending}>
            {pending ? p.common.loading : p.templates.generate}
          </Button>
        </form>

        <section aria-label={p.templates.preview} className="xl:sticky xl:top-4 xl:self-start">
          <h2 className="mb-2 text-[13px] font-semibold text-ink-700">{p.templates.preview}</h2>
          <iframe
            title={p.templates.preview}
            srcDoc={html}
            sandbox=""
            className="h-[480px] w-full rounded-card border border-paper-200 bg-white xl:h-[720px]"
          />
        </section>
      </div>
    </main>
  );
}
