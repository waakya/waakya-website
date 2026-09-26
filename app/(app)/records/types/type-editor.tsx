"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRecords } from "@/lib/i18n/records";
import type { Locale } from "@/lib/i18n";
import { archiveRecordType, saveRecordType } from "@/lib/records/actions";
import { FIELD_TYPES, keyFromLabel, type FieldDefinition, type FieldType, type StatusDefinition } from "@/lib/records/schema";

const SELECT = "h-10 rounded-button border-2 border-paper-200 bg-paper-0 px-2 text-body-sm outline-none focus:border-neel-600";
const TONES = ["outline", "neel", "amber", "laal", "hara", "muted"] as const;

interface Initial {
  key: string;
  name: string;
  namePlural: string;
  description: string;
  statuses: StatusDefinition[];
  defaultStatus: string;
  customerVisibleDefault: boolean;
  fields: FieldDefinition[];
  archived: boolean;
}

type FieldDraft = { key: string; label: string; fieldType: FieldType; required: boolean; showInList: boolean; customerVisible: boolean; unit: string; choices: string };

/**
 * A type is a name, its statuses and its fields. The editor writes the whole
 * thing at once, so a half-saved type can never exist.
 */
export function TypeEditor({ locale, initial, existing }: { locale: Locale; initial: Initial | null; existing: { key: string; name: string; archived: boolean }[] }) {
  const t = getRecords(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [name, setName] = React.useState(initial?.name ?? "");
  const [namePlural, setNamePlural] = React.useState(initial?.namePlural ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [statuses, setStatuses] = React.useState<StatusDefinition[]>(initial?.statuses ?? [{ key: "open", label: "Open", tone: "neel" }, { key: "done", label: "Done", tone: "hara", isTerminal: true }]);
  const [defaultStatus, setDefaultStatus] = React.useState(initial?.defaultStatus ?? "open");
  const [customerVisibleDefault, setCustomerVisibleDefault] = React.useState(initial?.customerVisibleDefault ?? false);
  const [fields, setFields] = React.useState<FieldDraft[]>(
    (initial?.fields ?? []).map((f) => ({
      key: f.key,
      label: f.label,
      fieldType: f.fieldType,
      required: f.required,
      showInList: f.showInList,
      customerVisible: f.customerVisible,
      unit: f.unit ?? "",
      choices: (f.options.choices ?? []).map((c) => c.label).join(", "),
    })),
  );

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveRecordType({
        key: initial?.key,
        name,
        namePlural,
        description,
        statuses,
        defaultStatus,
        customerVisibleDefault,
        fields: fields.map((f) => ({
          key: f.key || keyFromLabel(f.label),
          label: f.label,
          fieldType: f.fieldType,
          required: f.required,
          showInList: f.showInList,
          customerVisible: f.customerVisible,
          unit: f.unit,
          options:
            f.fieldType === "select" || f.fieldType === "multi_select"
              ? {
                  // A choice keeps the key it was saved with: records already
                  // hold that key, and re-deriving it from the label would
                  // silently orphan every one of them.
                  choices: f.choices
                    .split(",")
                    .map((c) => c.trim())
                    .filter(Boolean)
                    .map((label) => ({
                      key: initial?.fields.find((x) => x.key === f.key)?.options.choices?.find((c) => c.label === label)?.key ?? keyFromLabel(label),
                      label,
                    })),
                }
              : {},
        })),
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(t.types.saved);
      router.push(`/records/${result.data.key}`);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {existing.length ? (
        <ul className="flex flex-wrap gap-2">
          {existing.map((x) => (
            <li key={x.key}>
              <Link href={`/records/types?edit=${x.key}`} className="inline-flex min-h-9 items-center rounded-chip border border-paper-200 bg-paper-0 px-3 text-label font-semibold text-ink-700" aria-current={initial?.key === x.key ? "page" : undefined}>
                {x.name}{x.archived ? ` · ${t.types.archive}` : ""}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="type-name">{t.types.name}</Label>
            <Input id="type-name" className="mt-1" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="type-plural">{t.types.namePlural}</Label>
            <Input id="type-plural" className="mt-1" value={namePlural} maxLength={60} onChange={(e) => setNamePlural(e.target.value)} required />
          </div>
        </div>
        <div>
          <Label htmlFor="type-desc">{t.types.description}</Label>
          <Input id="type-desc" className="mt-1" value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-body font-bold text-fg">{t.types.statuses}</legend>
          {statuses.map((s, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <Input aria-label={t.types.statusLabel} className="h-10 min-w-40 flex-1 text-body-sm" value={s.label} maxLength={40} onChange={(e) => setStatuses(statuses.map((x, j) => (j === i ? { ...x, label: e.target.value, key: initial?.statuses[i]?.key ?? keyFromLabel(e.target.value) } : x)))} />
              <select aria-label={t.types.statusTone} className={SELECT} value={s.tone} onChange={(e) => setStatuses(statuses.map((x, j) => (j === i ? { ...x, tone: e.target.value as StatusDefinition["tone"] } : x)))}>
                {TONES.map((tone) => (
                  <option key={tone} value={tone}>{t.types.tones[tone]}</option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-label text-fg-subtle">
                <input type="radio" name="default-status" checked={defaultStatus === s.key} onChange={() => setDefaultStatus(s.key)} />
                {t.types.defaultStatus}
              </label>
              <Button type="button" variant="ghost" size="icon" aria-label={`${t.types.archive} ${s.label}`} disabled={statuses.length <= 1} onClick={() => setStatuses(statuses.filter((_, j) => j !== i))}>
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setStatuses([...statuses, { key: `status_${statuses.length + 1}`, label: "", tone: "outline" }])}>
            <Plus aria-hidden="true" />
            {t.types.addStatus}
          </Button>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-body font-bold text-fg">{t.types.fields}</legend>
          {fields.map((f, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-inner bg-paper-50 p-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Input aria-label={t.types.fieldLabel} className="h-10 min-w-40 flex-1 text-body-sm" value={f.label} maxLength={60} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, label: e.target.value, key: initial?.fields[i]?.key ?? keyFromLabel(e.target.value) } : x)))} />
              <select aria-label={t.types.fieldType} className={SELECT} value={f.fieldType} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, fieldType: e.target.value as FieldType } : x)))}>
                {FIELD_TYPES.map((ft) => (
                  <option key={ft} value={ft}>{t.types.fieldTypes[ft]}</option>
                ))}
              </select>
              {f.fieldType === "select" || f.fieldType === "multi_select" ? (
                <Input aria-label={t.types.choices} placeholder={t.types.choicesHint} className="h-10 min-w-40 flex-1 text-body-sm" value={f.choices} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, choices: e.target.value } : x)))} />
              ) : null}
              {f.fieldType === "number" ? (
                <Input aria-label={t.record.unit} placeholder={t.record.unit} className="h-10 w-24 text-body-sm" value={f.unit} maxLength={20} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))} />
              ) : null}
              <label className="flex items-center gap-1 text-label text-fg-subtle"><input type="checkbox" checked={f.required} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, required: e.target.checked } : x)))} />{t.types.required}</label>
              <label className="flex items-center gap-1 text-label text-fg-subtle"><input type="checkbox" checked={f.showInList} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, showInList: e.target.checked } : x)))} />{t.types.inList}</label>
              <label className="flex items-center gap-1 text-label text-fg-subtle"><input type="checkbox" checked={f.customerVisible} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, customerVisible: e.target.checked } : x)))} />{t.types.customerVisible}</label>
              <Button type="button" variant="ghost" size="icon" aria-label={`${t.types.archive} ${f.label}`} onClick={() => setFields(fields.filter((_, j) => j !== i))}>
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setFields([...fields, { key: "", label: "", fieldType: "text", required: false, showInList: true, customerVisible: false, unit: "", choices: "" }])}>
            <Plus aria-hidden="true" />
            {t.types.addField}
          </Button>
        </fieldset>

        <label className="flex items-center gap-2 text-body-sm text-fg">
          <input type="checkbox" checked={customerVisibleDefault} onChange={(e) => setCustomerVisibleDefault(e.target.checked)} />
          {t.record.customerVisible}
        </label>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending || !name.trim() || !namePlural.trim()}>{t.record.save}</Button>
          {initial ? (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await archiveRecordType({ key: initial.key, archived: !initial.archived });
                  if (!result.ok) toast.error(result.message);
                  router.refresh();
                })
              }
            >
              {initial.archived ? t.record.restore : t.types.archive}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
