"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAutomation } from "@/lib/i18n/automation";
import type { Locale } from "@/lib/i18n";
import { deleteRule, saveRule } from "@/lib/automation/actions";
import { ACTION_TYPES, CONDITION_OPS, TRIGGERABLE_EVENTS, type Action, type Conditions } from "@/lib/automation/engine";

const SELECT = "h-10 rounded-button border-2 border-paper-200 bg-paper-0 px-2 text-body-sm outline-none focus:border-neel-600";

export interface EditorChoices {
  people: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  statuses: { key: string; label: string; type: string }[];
  templates: { id: string; name: string }[];
}

type Draft = { type: Action["type"]; params: Record<string, string | number | boolean> };

function toDraft(action: Action): Draft {
  const { type, ...params } = action as Record<string, unknown> & { type: Action["type"] };
  return { type, params: params as Draft["params"] };
}

function fromDraft(d: Draft): Record<string, unknown> {
  const p: Record<string, unknown> = { ...d.params };
  if (d.type === "create_task" && typeof p.due_in_minutes === "string") p.due_in_minutes = Number(p.due_in_minutes) || undefined;
  if (d.type === "publish_customer_update" && typeof p.customer_visible === "string") p.customer_visible = p.customer_visible === "true";
  return { type: d.type, ...p };
}

/** WHEN one event, IF conditions on it, DO steps in order. Saved whole; a half-rule cannot exist. */
export function RuleEditor({
  locale,
  choices,
  initial,
}: {
  locale: Locale;
  choices: EditorChoices;
  initial: { id: string; name: string; triggerEvent: string; conditions: Conditions; actions: Action[]; enabled: boolean } | null;
}) {
  const t = getAutomation(locale);
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [name, setName] = React.useState(initial?.name ?? "");
  const [trigger, setTrigger] = React.useState(initial?.triggerEvent ?? "lead.created");
  const [conditions, setConditions] = React.useState<Conditions["all"]>(initial?.conditions.all ?? []);
  const [actions, setActions] = React.useState<Draft[]>((initial?.actions ?? [{ type: "notify_member", role: "owner", body: "{{title}}" } as Action]).map(toDraft));
  const [enabled, setEnabled] = React.useState(initial?.enabled ?? true);

  const setParam = (i: number, key: string, value: string | number | boolean) =>
    setActions(actions.map((a, j) => (j === i ? { ...a, params: { ...a.params, [key]: value } } : a)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveRule({
        id: initial?.id,
        name,
        triggerEvent: trigger,
        conditions: { all: conditions.map((c) => ({ ...c, value: c.op === "is_set" || c.op === "not_set" ? undefined : c.value })) },
        actions: actions.map(fromDraft),
        enabled,
      });
      if (!result.ok) {
        toast.error(`${result.message}${result.field ? ` (${result.field})` : ""}`);
        return;
      }
      router.push(`/automations/${result.data.id}`);
      router.refresh();
    });
  };

  const paramInput = (i: number, key: string, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="min-w-40 flex-1">
      <Label htmlFor={`a-${i}-${key}`}>{label}</Label>
      <Input id={`a-${i}-${key}`} className="mt-1 h-10 text-body-sm" value={String(actions[i].params[key] ?? "")} onChange={(e) => setParam(i, key, e.target.value)} {...extra} />
    </div>
  );
  const paramSelect = (i: number, key: string, label: string, options: { value: string; label: string }[], allowEmpty = true) => (
    <div className="min-w-40">
      <Label htmlFor={`a-${i}-${key}`}>{label}</Label>
      <select id={`a-${i}-${key}`} className={`mt-1 w-full ${SELECT}`} value={String(actions[i].params[key] ?? "")} onChange={(e) => setParam(i, key, e.target.value)}>
        {allowEmpty ? <option value="">{t.params.anyone}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
  const people = choices.people.map((p) => ({ value: p.id, label: p.name }));

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div>
        <Label htmlFor="rule-name">{t.name}</Label>
        <Input id="rule-name" className="mt-1" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} required />
      </div>

      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <Label htmlFor="rule-trigger" className="text-body font-bold text-fg">{t.when}</Label>
        <select id="rule-trigger" className={`mt-2 w-full ${SELECT} h-tap text-body`} value={trigger} onChange={(e) => setTrigger(e.target.value)}>
          {TRIGGERABLE_EVENTS.map((ev) => (
            <option key={ev} value={ev}>{ev}</option>
          ))}
        </select>
      </section>

      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <p className="text-body font-bold text-fg">{t.ifWord}</p>
        {conditions.map((c, i) => (
          <div key={i} className="mt-2 flex flex-wrap items-end gap-2">
            <div className="min-w-32 flex-1">
              <Label htmlFor={`c-${i}-field`}>{t.field}</Label>
              <Input id={`c-${i}-field`} className="mt-1 h-10 text-body-sm" value={c.field} placeholder="source" onChange={(e) => setConditions(conditions.map((x, j) => (j === i ? { ...x, field: e.target.value } : x)))} />
            </div>
            <select aria-label={t.op} className={SELECT} value={c.op} onChange={(e) => setConditions(conditions.map((x, j) => (j === i ? { ...x, op: e.target.value as typeof c.op } : x)))}>
              {CONDITION_OPS.map((op) => (
                <option key={op} value={op}>{t.ops[op]}</option>
              ))}
            </select>
            {c.op !== "is_set" && c.op !== "not_set" ? (
              <div className="min-w-32 flex-1">
                <Label htmlFor={`c-${i}-value`}>{t.value}</Label>
                <Input id={`c-${i}-value`} className="mt-1 h-10 text-body-sm" value={String(c.value ?? "")} onChange={(e) => setConditions(conditions.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
              </div>
            ) : null}
            <Button type="button" variant="ghost" size="icon" aria-label={t.remove} onClick={() => setConditions(conditions.filter((_, j) => j !== i))}><Trash2 aria-hidden="true" /></Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setConditions([...conditions, { field: "source", op: "eq", value: "" }])}>
          <Plus aria-hidden="true" />
          {t.addCondition}
        </Button>
      </section>

      <section className="rounded-card border border-line bg-surface p-4 shadow-card">
        <p className="text-body font-bold text-fg">{t.doWord}</p>
        <p className="mt-1 text-caption text-fg-subtle">{t.params.hint}</p>
        {actions.map((a, i) => (
          <div key={i} className="mt-3 flex flex-col gap-2 rounded-inner bg-paper-50 p-3">
            <div className="flex items-center gap-2">
              <select aria-label={t.doWord} className={`${SELECT} flex-1`} value={a.type} onChange={(e) => setActions(actions.map((x, j) => (j === i ? { type: e.target.value as Action["type"], params: {} } : x)))}>
                {ACTION_TYPES.map((type) => (
                  <option key={type} value={type}>{t.actions[type]}</option>
                ))}
              </select>
              <Button type="button" variant="ghost" size="icon" aria-label={t.remove} disabled={actions.length <= 1} onClick={() => setActions(actions.filter((_, j) => j !== i))}><Trash2 aria-hidden="true" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {a.type === "assign_contact" ? paramSelect(i, "member_id", t.params.member, [{ value: "", label: t.params.anyMember }, ...people], false) : null}
              {a.type === "create_task" ? (
                <>
                  {paramInput(i, "title", t.params.title, { required: true, maxLength: 140 })}
                  {paramSelect(i, "assignee_id", t.params.member, people)}
                  {paramInput(i, "due_in_minutes", t.params.dueIn, { type: "number", min: 5 })}
                  {paramSelect(i, "priority", t.params.priority, ["low", "normal", "high", "urgent"].map((p) => ({ value: p, label: p })))}
                </>
              ) : null}
              {a.type === "notify_member" ? (
                <>
                  {paramSelect(i, "member_id", t.params.member, people)}
                  {paramSelect(i, "role", t.params.role, ["owner", "admin", "manager", "member"].map((r) => ({ value: r, label: r })))}
                  {paramInput(i, "body", t.params.body, { required: true, maxLength: 280 })}
                  {paramInput(i, "href", t.params.href, { placeholder: "/crm" })}
                </>
              ) : null}
              {a.type === "move_opportunity" ? paramSelect(i, "stage_id", t.params.stage, choices.stages.map((s) => ({ value: s.id, label: s.name })), false) : null}
              {a.type === "set_record_status" ? paramSelect(i, "status", t.params.status, choices.statuses.map((s) => ({ value: s.key, label: `${s.type}: ${s.label}` })), false) : null}
              {a.type === "publish_customer_update" ? paramInput(i, "body", t.params.body, { required: true, maxLength: 2000 }) : null}
              {a.type === "request_verification" ? paramInput(i, "title", t.params.title, { maxLength: 140 }) : null}
              {a.type === "send_email" ? (
                <>
                  {paramSelect(i, "to", t.params.to, [{ value: "contact", label: t.params.toContact }, { value: "member", label: t.params.toMember }], false)}
                  {paramSelect(i, "member_id", t.params.member, people)}
                  {paramInput(i, "subject", t.params.subject, { required: true, maxLength: 140 })}
                  {paramInput(i, "body", t.params.body, { required: true, maxLength: 4000 })}
                </>
              ) : null}
              {a.type === "send_whatsapp_template" ? paramSelect(i, "template_id", t.params.template, choices.templates.map((x) => ({ value: x.id, label: x.name })), false) : null}
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setActions([...actions, { type: "notify_member", params: { role: "owner", body: "{{title}}" } }])}>
          <Plus aria-hidden="true" />
          {t.addAction}
        </Button>
      </section>

      <label className="flex min-h-tap items-center gap-2 text-body text-fg">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        {t.enabled}
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || !name.trim() || actions.length === 0}>{t.save}</Button>
        {initial ? (
          <Button type="button" variant="danger" disabled={pending} onClick={() => startTransition(async () => { const r = await deleteRule(initial.id); if (!r.ok) toast.error(r.message); else router.push("/automations"); })}>
            <Trash2 aria-hidden="true" />
            {t.remove}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
