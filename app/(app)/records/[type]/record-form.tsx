"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRecords } from "@/lib/i18n/records";
import type { Locale } from "@/lib/i18n";
import { saveRecord } from "@/lib/records/actions";
import type { FieldDefinition, FieldValue, StatusDefinition } from "@/lib/records/schema";

const SELECT = "mt-1 h-tap w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 text-body outline-none focus:border-neel-600";
const TEXTAREA = "mt-1 w-full rounded-button border-2 border-paper-200 bg-paper-0 px-3 py-2 text-body outline-none focus:border-neel-600";

export interface FormType {
  key: string;
  name: string;
  fields: FieldDefinition[];
  statuses: StatusDefinition[];
  defaultStatus: string | null;
  customerVisibleDefault: boolean;
}

export interface FormRecord {
  id: string;
  title: string;
  values: Record<string, FieldValue>;
  projectId: string | null;
  contactId: string | null;
  assigneeId: string | null;
  customerVisible: boolean;
}

/**
 * One form drawn from the type's field definitions. The same component
 * creates and edits, so a record never has two shapes.
 */
export function RecordForm({
  locale,
  type,
  people,
  projects,
  contacts,
  record,
  canSetVisibility,
  onDone,
}: {
  locale: Locale;
  type: FormType;
  people: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
  record?: FormRecord;
  canSetVisibility: boolean;
  onDone?: () => void;
}) {
  const t = getRecords(locale);
  const router = useRouter();
  const [open, setOpen] = React.useState(!!record);
  const [error, setError] = React.useState<string | null>(null);
  const [field, setField] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const values: Record<string, unknown> = {};
    for (const f of type.fields) {
      if (f.fieldType === "boolean") values[f.key] = form.get(`v_${f.key}`) === "on";
      else if (f.fieldType === "multi_select") values[f.key] = form.getAll(`v_${f.key}`).map(String);
      else values[f.key] = form.get(`v_${f.key}`) ?? "";
    }
    startTransition(async () => {
      const result = await saveRecord({
        typeKey: type.key,
        id: record?.id,
        title: String(form.get("title") ?? ""),
        statusKey: record ? undefined : String(form.get("statusKey") ?? "") || undefined,
        values,
        projectId: String(form.get("projectId") ?? ""),
        contactId: String(form.get("contactId") ?? ""),
        assigneeId: String(form.get("assigneeId") ?? ""),
        customerVisible: canSetVisibility ? form.get("customerVisible") === "on" : undefined,
      });
      if (!result.ok) {
        setError(result.message);
        setField(result.field ?? null);
        return;
      }
      if (record) {
        onDone?.();
        router.refresh();
      } else {
        router.push(`/records/${type.key}/${result.data.id}`);
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        {t.list.newRecord}: {type.name}
      </Button>
    );
  }

  const v = (key: string) => record?.values[key];

  return (
    <Card className="p-4">
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <div>
          <Label htmlFor="r-title">{type.name}</Label>
          <Input id="r-title" name="title" className="mt-1" defaultValue={record?.title ?? ""} maxLength={200} required aria-invalid={field === "title" || undefined} />
        </div>
        {!record && type.statuses.length ? (
          <div>
            <Label htmlFor="r-status">{t.record.status}</Label>
            <select id="r-status" name="statusKey" className={SELECT} defaultValue={type.defaultStatus ?? type.statuses[0].key}>
              {type.statuses.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {type.fields.map((f) => {
            const id = `r-${f.key}`;
            const name = `v_${f.key}`;
            const invalid = field === f.key || undefined;
            const label = `${f.label}${f.required ? " *" : ""}${f.unit ? ` (${f.unit})` : ""}`;
            switch (f.fieldType) {
              case "long_text":
                return (
                  <div key={f.key} className="sm:col-span-2">
                    <Label htmlFor={id}>{label}</Label>
                    <textarea id={id} name={name} rows={3} maxLength={4000} defaultValue={(v(f.key) as string) ?? ""} className={TEXTAREA} aria-invalid={invalid} />
                  </div>
                );
              case "boolean":
                return (
                  <label key={f.key} htmlFor={id} className="flex min-h-tap items-center gap-2 text-body text-fg">
                    <input id={id} name={name} type="checkbox" defaultChecked={v(f.key) === true} />
                    {f.label}
                  </label>
                );
              case "select":
                return (
                  <div key={f.key}>
                    <Label htmlFor={id}>{label}</Label>
                    <select id={id} name={name} className={SELECT} defaultValue={(v(f.key) as string) ?? ""} aria-invalid={invalid}>
                      <option value="">—</option>
                      {(f.options.choices ?? []).map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                );
              case "multi_select":
                return (
                  <fieldset key={f.key} className="min-w-0">
                    <legend className="text-label font-semibold text-ink-700">{label}</legend>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(f.options.choices ?? []).map((c) => (
                        <label key={c.key} className="flex min-h-9 items-center gap-1 rounded-chip border border-paper-200 px-3 text-label">
                          <input type="checkbox" name={name} value={c.key} defaultChecked={Array.isArray(v(f.key)) && (v(f.key) as string[]).includes(c.key)} />
                          {c.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              case "member":
              case "project":
              case "contact": {
                const options = f.fieldType === "member" ? people : f.fieldType === "project" ? projects : contacts;
                return (
                  <div key={f.key}>
                    <Label htmlFor={id}>{label}</Label>
                    <select id={id} name={name} className={SELECT} defaultValue={(v(f.key) as string) ?? ""} aria-invalid={invalid}>
                      <option value="">—</option>
                      {options.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                );
              }
              case "number":
              case "money":
                return (
                  <div key={f.key}>
                    <Label htmlFor={id}>{label}</Label>
                    <Input id={id} name={name} type="number" inputMode="decimal" step="any" className="mt-1" defaultValue={v(f.key) === null || v(f.key) === undefined ? "" : String(v(f.key))} aria-invalid={invalid} />
                  </div>
                );
              case "date":
                return (
                  <div key={f.key}>
                    <Label htmlFor={id}>{label}</Label>
                    <Input id={id} name={name} type="date" className="mt-1" defaultValue={(v(f.key) as string) ?? ""} aria-invalid={invalid} />
                  </div>
                );
              default:
                return (
                  <div key={f.key}>
                    <Label htmlFor={id}>{label}</Label>
                    <Input id={id} name={name} type={f.fieldType === "email" ? "email" : f.fieldType === "phone" ? "tel" : f.fieldType === "url" ? "url" : "text"} className="mt-1" defaultValue={(v(f.key) as string) ?? ""} maxLength={200} aria-invalid={invalid} />
                  </div>
                );
            }
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="r-project">{t.record.project}</Label>
            <select id="r-project" name="projectId" className={SELECT} defaultValue={record?.projectId ?? ""}>
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="r-contact">{t.record.contact}</Label>
            <select id="r-contact" name="contactId" className={SELECT} defaultValue={record?.contactId ?? ""}>
              <option value="">—</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="r-assignee">{t.record.assignee}</Label>
            <select id="r-assignee" name="assigneeId" className={SELECT} defaultValue={record?.assigneeId ?? ""}>
              <option value="">—</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        {canSetVisibility ? (
          <label className="flex min-h-tap items-center gap-2 text-body text-fg">
            <input type="checkbox" name="customerVisible" defaultChecked={record ? record.customerVisible : type.customerVisibleDefault} />
            {t.record.customerVisible}
          </label>
        ) : null}
        {error ? <p role="alert" className="text-body-sm text-laal-600">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{t.record.save}</Button>
          <Button type="button" variant="outline" onClick={() => (record ? onDone?.() : setOpen(false))}>{t.record.cancel}</Button>
        </div>
      </form>
    </Card>
  );
}
