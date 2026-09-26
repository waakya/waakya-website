/**
 * The records engine's pure rules: what a field is, whether a value fits
 * it, how a value reads on screen. No database, so every rule is a test.
 */

export const FIELD_TYPES = [
  "text",
  "long_text",
  "number",
  "money",
  "date",
  "boolean",
  "select",
  "multi_select",
  "phone",
  "email",
  "url",
  "member",
  "contact",
  "project",
  "vendor",
  "record",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface FieldOption {
  key: string;
  label: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
  position: number;
  showInList: boolean;
  customerVisible: boolean;
  unit: string | null;
  options: {
    choices?: FieldOption[];
    /** For `record`: the key of the record type this field points at. */
    recordType?: string;
    min?: number;
    max?: number;
  };
}

export interface StatusDefinition {
  key: string;
  label: string;
  tone: "neel" | "amber" | "laal" | "hara" | "muted" | "outline";
  isTerminal?: boolean;
}

export type FieldValue = string | number | boolean | string[] | null;

export type ValidationIssue = { key: string; reason: "required" | "type" | "choice" | "range" | "format" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate and normalise raw form values against the type's fields. Unknown
 * keys are dropped; empty strings become null; numbers are parsed. Returns
 * the clean values and every problem, so a form can mark each field.
 */
export function validateValues(
  fields: readonly FieldDefinition[],
  raw: Record<string, unknown>,
): { values: Record<string, FieldValue>; issues: ValidationIssue[] } {
  const values: Record<string, FieldValue> = {};
  const issues: ValidationIssue[] = [];
  for (const field of fields) {
    const input = raw[field.key];
    const empty = input === undefined || input === null || input === "" || (Array.isArray(input) && input.length === 0);
    if (empty) {
      if (field.required) issues.push({ key: field.key, reason: "required" });
      values[field.key] = null;
      continue;
    }
    const result = coerce(field, input);
    if (result.issue) {
      issues.push({ key: field.key, reason: result.issue });
      continue;
    }
    values[field.key] = result.value;
  }
  return { values, issues };
}

function coerce(field: FieldDefinition, input: unknown): { value: FieldValue; issue?: ValidationIssue["reason"] } {
  switch (field.fieldType) {
    case "text":
    case "long_text": {
      if (typeof input !== "string") return { value: null, issue: "type" };
      const value = input.trim().slice(0, field.fieldType === "text" ? 200 : 4000);
      return { value };
    }
    case "number":
    case "money": {
      const n = typeof input === "number" ? input : Number(String(input).replace(/[,\s₹]/g, ""));
      if (!Number.isFinite(n)) return { value: null, issue: "type" };
      if (field.fieldType === "money" && n < 0) return { value: null, issue: "range" };
      if (field.options.min !== undefined && n < field.options.min) return { value: null, issue: "range" };
      if (field.options.max !== undefined && n > field.options.max) return { value: null, issue: "range" };
      return { value: n };
    }
    case "date": {
      const s = String(input);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) return { value: null, issue: "format" };
      return { value: s };
    }
    case "boolean": {
      if (typeof input === "boolean") return { value: input };
      if (input === "true" || input === "on" || input === "1") return { value: true };
      if (input === "false" || input === "off" || input === "0") return { value: false };
      return { value: null, issue: "type" };
    }
    case "select": {
      const s = String(input);
      if (!(field.options.choices ?? []).some((c) => c.key === s)) return { value: null, issue: "choice" };
      return { value: s };
    }
    case "multi_select": {
      const list = Array.isArray(input) ? input.map(String) : String(input).split(",").map((s) => s.trim()).filter(Boolean);
      const allowed = new Set((field.options.choices ?? []).map((c) => c.key));
      if (list.some((s) => !allowed.has(s))) return { value: null, issue: "choice" };
      return { value: [...new Set(list)] };
    }
    case "phone": {
      const digits = String(input).replace(/[^\d+]/g, "");
      if (!/^\+?\d{7,15}$/.test(digits)) return { value: null, issue: "format" };
      return { value: digits };
    }
    case "email": {
      const s = String(input).trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) return { value: null, issue: "format" };
      return { value: s };
    }
    case "url": {
      const s = String(input).trim();
      if (!/^https?:\/\/\S+$/i.test(s)) return { value: null, issue: "format" };
      return { value: s.slice(0, 500) };
    }
    case "member":
    case "contact":
    case "project":
    case "vendor":
    case "record": {
      const s = String(input);
      if (!UUID.test(s)) return { value: null, issue: "format" };
      return { value: s };
    }
  }
}

/** Fields shown as list columns, in order, at most six so a phone can read them. */
export function listColumns(fields: readonly FieldDefinition[], max = 6): FieldDefinition[] {
  return [...fields].filter((f) => f.showInList).sort((a, b) => a.position - b.position).slice(0, max);
}

/** How a stored value reads: money in rupees, choices by label, booleans as words. */
export function formatValue(
  field: FieldDefinition,
  value: FieldValue | undefined,
  words: { yes: string; no: string; none: string },
  lookups: { names?: Map<string, string> } = {},
): string {
  if (value === null || value === undefined || value === "") return words.none;
  switch (field.fieldType) {
    case "money":
      return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value));
    case "number":
      return `${new Intl.NumberFormat("en-IN").format(Number(value))}${field.unit ? ` ${field.unit}` : ""}`;
    case "boolean":
      return value ? words.yes : words.no;
    case "select":
      return field.options.choices?.find((c) => c.key === value)?.label ?? String(value);
    case "multi_select":
      return (value as string[]).map((k) => field.options.choices?.find((c) => c.key === k)?.label ?? k).join(", ");
    case "member":
    case "contact":
    case "project":
    case "vendor":
    case "record":
      return lookups.names?.get(String(value)) ?? words.none;
    default:
      return String(value);
  }
}

/** The status a record is in, with a safe fallback for an unknown key. */
export function statusOf(statuses: readonly StatusDefinition[], key: string | null): StatusDefinition | null {
  if (!key) return null;
  return statuses.find((s) => s.key === key) ?? { key, label: key, tone: "outline" };
}

/** Which statuses a record may move to: any declared one that is not the current one. */
export function nextStatuses(statuses: readonly StatusDefinition[], current: string | null): StatusDefinition[] {
  return statuses.filter((s) => s.key !== current);
}

export function isFieldType(value: string): value is FieldType {
  return (FIELD_TYPES as readonly string[]).includes(value);
}

/** A stable key from a label: "Unit Number" → unit_number. */
export function keyFromLabel(label: string): string {
  const key = label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return /^[a-z]/.test(key) ? key : `f_${key}`.slice(0, 40);
}
