/**
 * Business templates: structured fields in, a clean printable document out.
 *
 * Deliberately not an editor. A quotation is a known shape — who, for what,
 * how much, until when — so the owner fills the shape and Waakya lays it out.
 * The output is a self-contained HTML page with print styles, which the browser
 * can print or save as PDF without any server-side PDF machinery.
 */
import type { DocumentCategory } from "./rules";

export type FieldKind = "text" | "textarea" | "date" | "money" | "percent";

export interface TemplateField {
  key: string;
  kind: FieldKind;
  required?: boolean;
}

export interface TemplateDefinition {
  key: string;
  category: DocumentCategory;
  title: string;
  blurb: string;
  fields: TemplateField[];
  /** Whether the document carries an amount with GST on top. */
  money: boolean;
}

const party: TemplateField[] = [
  { key: "client_name", kind: "text", required: true },
  { key: "client_address", kind: "textarea" },
  { key: "project_name", kind: "text" },
  { key: "date", kind: "date", required: true },
  { key: "reference", kind: "text" },
];

export const TEMPLATES: TemplateDefinition[] = [
  {
    key: "quotation",
    category: "quotation",
    title: "Quotation",
    blurb: "Priced scope for a client",
    money: true,
    fields: [
      ...party,
      { key: "scope", kind: "textarea", required: true },
      { key: "amount", kind: "money", required: true },
      { key: "gst_percent", kind: "percent" },
      { key: "valid_until", kind: "date" },
      { key: "payment_terms", kind: "textarea" },
      { key: "notes", kind: "textarea" },
    ],
  },
  {
    key: "proposal",
    category: "proposal",
    title: "Proposal",
    blurb: "Scope and approach",
    money: true,
    fields: [
      ...party,
      { key: "scope", kind: "textarea", required: true },
      { key: "amount", kind: "money" },
      { key: "gst_percent", kind: "percent" },
      { key: "valid_until", kind: "date" },
      { key: "notes", kind: "textarea" },
    ],
  },
  {
    key: "invoice",
    category: "invoice",
    title: "Invoice",
    blurb: "Billing for work done",
    money: true,
    fields: [
      ...party,
      { key: "scope", kind: "textarea", required: true },
      { key: "amount", kind: "money", required: true },
      { key: "gst_percent", kind: "percent" },
      { key: "payment_terms", kind: "textarea" },
      { key: "notes", kind: "textarea" },
    ],
  },
  {
    key: "agreement",
    category: "agreement",
    title: "Agreement",
    blurb: "Terms between two parties",
    money: true,
    fields: [
      ...party,
      { key: "scope", kind: "textarea", required: true },
      { key: "term", kind: "text" },
      { key: "amount", kind: "money" },
      { key: "gst_percent", kind: "percent" },
      { key: "payment_terms", kind: "textarea" },
      { key: "signatory", kind: "text" },
    ],
  },
  {
    key: "nda",
    category: "nda",
    title: "Non-disclosure agreement",
    blurb: "Confidentiality terms",
    money: false,
    fields: [
      ...party,
      { key: "scope", kind: "textarea", required: true },
      { key: "term", kind: "text" },
      { key: "signatory", kind: "text" },
    ],
  },
  {
    key: "purchase_order",
    category: "purchase_order",
    title: "Purchase order",
    blurb: "An order placed with a vendor",
    money: true,
    fields: [
      ...party,
      { key: "scope", kind: "textarea", required: true },
      { key: "amount", kind: "money", required: true },
      { key: "gst_percent", kind: "percent" },
      { key: "payment_terms", kind: "textarea" },
      { key: "notes", kind: "textarea" },
    ],
  },
  {
    key: "work_order",
    category: "work_order",
    title: "Work order",
    blurb: "Authority to begin work",
    money: true,
    fields: [
      ...party,
      { key: "scope", kind: "textarea", required: true },
      { key: "amount", kind: "money" },
      { key: "gst_percent", kind: "percent" },
      { key: "notes", kind: "textarea" },
    ],
  },
  {
    key: "receipt",
    category: "receipt",
    title: "Receipt",
    blurb: "Payment received",
    money: true,
    fields: [
      ...party,
      { key: "amount", kind: "money", required: true },
      { key: "gst_percent", kind: "percent" },
      { key: "notes", kind: "textarea" },
    ],
  },
  {
    key: "sow",
    category: "sow",
    title: "Scope of work",
    blurb: "Deliverables and timeline",
    money: true,
    fields: [
      ...party,
      { key: "scope", kind: "textarea", required: true },
      { key: "term", kind: "text" },
      { key: "amount", kind: "money" },
      { key: "gst_percent", kind: "percent" },
      { key: "notes", kind: "textarea" },
    ],
  },
  {
    key: "meeting_minutes",
    category: "meeting_minutes",
    title: "Meeting minutes",
    blurb: "Decisions and owners",
    money: false,
    fields: [
      { key: "project_name", kind: "text" },
      { key: "date", kind: "date", required: true },
      { key: "attendees", kind: "textarea", required: true },
      { key: "decisions", kind: "textarea", required: true },
      { key: "notes", kind: "textarea" },
    ],
  },
];

export function getTemplate(key: string): TemplateDefinition | null {
  return TEMPLATES.find((template) => template.key === key) ?? null;
}

export interface BusinessDetails {
  name: string;
  address: string | null;
  gstin: string | null;
  phone: string | null;
  email: string | null;
}

const LABELS: Record<string, string> = {
  client_name: "Client",
  client_address: "Address",
  project_name: "Project",
  date: "Date",
  reference: "Reference",
  scope: "Scope",
  amount: "Amount",
  gst_percent: "GST",
  valid_until: "Valid until",
  payment_terms: "Payment terms",
  notes: "Notes",
  attendees: "Attendees",
  decisions: "Decisions",
  term: "Term",
  signatory: "Signed for the business by",
};

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function computeTotals(
  amount: string | undefined,
  gstPercent: string | undefined,
): { base: number; gst: number; total: number; rate: number } | null {
  const base = Number(String(amount ?? "").replace(/[, ₹]/g, ""));
  if (!Number.isFinite(base) || base <= 0) return null;
  const rateRaw = Number(String(gstPercent ?? "").replace(/%/g, ""));
  const rate = Number.isFinite(rateRaw) && rateRaw >= 0 && rateRaw <= 100 ? rateRaw : 0;
  const gst = Math.round(base * rate) / 100;
  return { base, gst, total: Math.round((base + gst) * 100) / 100, rate };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraphs(value: string): string {
  return escapeHtml(value)
    .split(/\n+/)
    .map((line) => `<p>${line}</p>`)
    .join("");
}

function formatDate(value: string | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value ? escapeHtml(value) : "";
  const [y, m, d] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** A complete, printable HTML document. Everything the user typed is escaped. */
export function renderTemplateHtml(
  templateKey: string,
  data: Record<string, string>,
  business: BusinessDetails,
): string {
  const template = getTemplate(templateKey);
  const title = template?.title ?? "Document";
  const totals = template?.money ? computeTotals(data.amount, data.gst_percent) : null;

  const headerRight = [
    data.date ? `<div><span>Date</span>${formatDate(data.date)}</div>` : "",
    data.reference ? `<div><span>Reference</span>${escapeHtml(data.reference)}</div>` : "",
    data.valid_until ? `<div><span>Valid until</span>${formatDate(data.valid_until)}</div>` : "",
  ].join("");

  const party = data.client_name
    ? `<section class="party"><h3>${template?.key === "purchase_order" ? "Vendor" : "Prepared for"}</h3>
        <p class="strong">${escapeHtml(data.client_name)}</p>
        ${data.client_address ? paragraphs(data.client_address) : ""}
        ${data.project_name ? `<p class="muted">Project: ${escapeHtml(data.project_name)}</p>` : ""}
      </section>`
    : data.project_name
      ? `<section class="party"><h3>Project</h3><p class="strong">${escapeHtml(data.project_name)}</p></section>`
      : "";

  const bodyKeys = ["scope", "attendees", "decisions", "term", "payment_terms", "notes"];
  const body = bodyKeys
    .filter((key) => data[key])
    .map(
      (key) =>
        `<section><h3>${LABELS[key]}</h3>${key === "term" ? `<p>${escapeHtml(data[key])}</p>` : paragraphs(data[key])}</section>`,
    )
    .join("");

  const money = totals
    ? `<table class="totals">
        <tr><td>Amount</td><td>${inr.format(totals.base)}</td></tr>
        ${totals.rate > 0 ? `<tr><td>GST (${totals.rate}%)</td><td>${inr.format(totals.gst)}</td></tr>` : ""}
        <tr class="grand"><td>Total</td><td>${inr.format(totals.total)}</td></tr>
      </table>`
    : "";

  const signature =
    template && ["agreement", "nda", "work_order", "purchase_order"].includes(template.key)
      ? `<section class="sign"><div><span></span><p>For ${escapeHtml(business.name)}${data.signatory ? `<br>${escapeHtml(data.signatory)}` : ""}</p></div>
         <div><span></span><p>For ${escapeHtml(data.client_name || "the other party")}</p></div></section>`
      : "";

  const businessLines = [
    business.address ? escapeHtml(business.address).replace(/\n/g, "<br>") : "",
    business.gstin ? `GSTIN ${escapeHtml(business.gstin)}` : "",
    [business.phone, business.email].filter(Boolean).map((v) => escapeHtml(String(v))).join(" · "),
  ]
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — ${escapeHtml(data.client_name || business.name)}</title>
<style>
  :root { --ink:#16163a; --dim:#5b5e78; --line:#e3e4ee; --blue:#3541c4; }
  * { box-sizing:border-box; }
  body { margin:0; background:#f6f5f0; color:var(--ink);
    font:14px/1.55 Inter, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif; }
  .page { max-width:820px; margin:32px auto; background:#fff; padding:56px 60px;
    border:1px solid var(--line); border-radius:10px; }
  header { display:flex; justify-content:space-between; gap:32px; padding-bottom:24px;
    border-bottom:2px solid var(--ink); }
  header h1 { margin:0; font-size:26px; letter-spacing:-0.01em; }
  header .biz p { margin:2px 0; color:var(--dim); font-size:12.5px; }
  header .biz .name { color:var(--ink); font-weight:700; font-size:15px; margin-bottom:6px; }
  .meta { text-align:right; font-size:12.5px; }
  .meta div { margin-bottom:4px; }
  .meta span { display:block; color:var(--dim); font-size:10.5px; text-transform:uppercase; letter-spacing:.08em; }
  .doc-title { margin:28px 0 8px; font-size:13px; letter-spacing:.14em; text-transform:uppercase; color:var(--blue); font-weight:700; }
  section { margin-top:22px; }
  h3 { margin:0 0 6px; font-size:11px; text-transform:uppercase; letter-spacing:.1em; color:var(--dim); }
  p { margin:0 0 6px; }
  .strong { font-weight:600; font-size:15px; }
  .muted { color:var(--dim); }
  .totals { margin:28px 0 0 auto; border-collapse:collapse; min-width:300px; }
  .totals td { padding:8px 0; border-bottom:1px solid var(--line); }
  .totals td:last-child { text-align:right; font-variant-numeric:tabular-nums; }
  .totals .grand td { border-bottom:2px solid var(--ink); font-weight:700; font-size:16px; }
  .sign { display:flex; gap:48px; margin-top:64px; }
  .sign div { flex:1; }
  .sign span { display:block; border-bottom:1px solid var(--ink); height:40px; }
  .sign p { margin-top:8px; font-size:12.5px; color:var(--dim); }
  footer { margin-top:48px; padding-top:14px; border-top:1px solid var(--line); color:var(--dim); font-size:11px; }
  @media print {
    body { background:#fff; }
    .page { margin:0; border:0; border-radius:0; padding:18mm 16mm; max-width:none; }
  }
  @media (max-width:640px) { .page { padding:28px 20px; margin:0; } header { flex-direction:column; } .meta { text-align:left; } }
</style></head>
<body><div class="page">
<header>
  <div class="biz"><p class="name">${escapeHtml(business.name)}</p>${businessLines}</div>
  <div class="meta">${headerRight}</div>
</header>
<p class="doc-title">${escapeHtml(title)}</p>
${party}
${body}
${money}
${signature}
<footer>Prepared with Waakya</footer>
</div></body></html>`;
}
