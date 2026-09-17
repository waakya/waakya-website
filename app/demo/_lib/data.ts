/**
 * Mock content for the sales demo.
 *
 * Everything the demo shows comes from this file. Nothing here touches the
 * database, the network or any production state, so the pitch runs identically
 * on a client's patchy office connection as it does here.
 */

export interface Person {
  id: string;
  name: string;
  role: string;
  org: "urbannest" | "greenwood";
}

export const BUSINESS = {
  name: "UrbanNest Interiors",
  kind: "Interior design and turnkey fit-out",
  city: "Gurugram",
} as const;

export const CLIENT = {
  name: "Greenwood Builders",
  kind: "Residential developer",
  city: "Noida",
} as const;

export const PEOPLE: Record<string, Person> = {
  aarav: { id: "aarav", name: "Aarav Mehta", role: "Owner", org: "urbannest" },
  rahul: { id: "rahul", name: "Rahul Sharma", role: "Project Manager", org: "urbannest" },
  neha: { id: "neha", name: "Neha Verma", role: "Designer", org: "urbannest" },
  vikram: { id: "vikram", name: "Vikram Singh", role: "Site Supervisor", org: "urbannest" },
  priya: { id: "priya", name: "Priya Kapoor", role: "Accounts", org: "urbannest" },
  rohan: { id: "rohan", name: "Rohan Kapoor", role: "Project Director", org: "greenwood" },
  ananya: { id: "ananya", name: "Ananya Shah", role: "Procurement", org: "greenwood" },
};

export const PROJECTS = [
  { id: "tower-b", name: "Greenwood Residence — Tower B", client: "Greenwood Builders", open: 14 },
  { id: "skyline", name: "Skyline Apartment — Sector 76", client: "Skyline Developers", open: 6 },
  { id: "oakwood", name: "Oakwood Villa", client: "Mr. & Mrs. Nair", open: 3 },
] as const;

/* ------------------------------------------------------------------ money -- */

const inrFormat = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** 840000 → ₹8,40,000 */
export function inr(amount: number): string {
  return inrFormat.format(amount);
}

/* ------------------------------------------------------------------- home -- */

export interface AttentionItem {
  id: string;
  label: string;
  count: number;
  tone: "bad" | "warn" | "accent";
}

export const ATTENTION: AttentionItem[] = [
  { id: "overdue", label: "Overdue tasks", count: 2, tone: "bad" },
  { id: "approvals", label: "Approvals waiting", count: 2, tone: "warn" },
  { id: "client", label: "Client response", count: 1, tone: "accent" },
];

export interface TodayItem {
  id: string;
  title: string;
  personId: string;
  due: string;
  state: "in_progress" | "accepted" | "waiting" | "overdue" | "verified";
  project: string;
}

export const TODAY: TodayItem[] = [
  {
    id: "t-quote",
    title: "Update kitchen quotation",
    personId: "rahul",
    due: "Due 2:00 PM",
    state: "in_progress",
    project: "Greenwood Residence — Tower B",
  },
  {
    id: "t-measure",
    title: "Site measurement — Sector 76",
    personId: "vikram",
    due: "Due 4:30 PM",
    state: "accepted",
    project: "Skyline Apartment — Sector 76",
  },
  {
    id: "t-approve",
    title: "Client design approval",
    personId: "neha",
    due: "Waiting for approval",
    state: "waiting",
    project: "Greenwood Residence — Tower B",
  },
];

export const RECENT_ACTIVITY = [
  { id: "a1", who: "Vikram Singh", what: "submitted proof on", target: "Site measurement — Tower B", when: "12 min ago" },
  { id: "a2", who: "Rohan Kapoor", what: "approved", target: "Greenwood BOQ v4", when: "26 min ago" },
  { id: "a3", who: "Neha Verma", what: "accepted", target: "Revise living room layout", when: "1 hr ago" },
  { id: "a4", who: "Priya Kapoor", what: "sent", target: "Invoice INV-2291 to Greenwood Builders", when: "2 hrs ago" },
];

export const WORKSPACES = [
  { id: "greenwood", name: "Greenwood Builders", project: "Tower B", open: 7, unread: 2 },
  { id: "skyline", name: "Skyline Developers", project: "Sector 76", open: 4, unread: 0 },
  { id: "nair", name: "Mr. & Mrs. Nair", project: "Oakwood Villa", open: 2, unread: 1 },
];

export const CONVERSATIONS = [
  { id: "c1", name: "Rahul Sharma", preview: "Sure. I'll get it done.", when: "11:10 AM", unread: 0 },
  { id: "c2", name: "Site team — Tower B", preview: "Vikram: Measurements uploaded", when: "10:42 AM", unread: 3 },
  { id: "c3", name: "Greenwood Builders", preview: "Rohan: Please send the revised BOQ", when: "9:58 AM", unread: 2 },
];

/* ---------------------------------------------------------- conversation -- */

export interface ChatMessage {
  id: string;
  personId: string;
  text: string;
  at: string;
}

export const THREAD: ChatMessage[] = [
  {
    id: "m1",
    personId: "aarav",
    text: "Rahul, the client came back on the kitchen. Laminate rates have changed since we quoted.",
    at: "11:06 AM",
  },
  {
    id: "m2",
    personId: "rahul",
    text: "Yes, the new rates came in on Monday. The old quotation is about 9% under.",
    at: "11:07 AM",
  },
  {
    id: "m3",
    personId: "aarav",
    text: "Please revise the kitchen quotation with the new laminate pricing and send it by 4 PM.",
    at: "11:08 AM",
  },
  {
    id: "m4",
    personId: "rahul",
    text: "Sure. I'll get it done.",
    at: "11:09 AM",
  },
];

export const TASK_FROM_CHAT = {
  id: "t-quote",
  title: "Revise kitchen quotation",
  assignee: "rahul",
  creator: "aarav",
  due: "Today, 4:00 PM",
  priority: "High",
  project: "Greenwood Residence — Tower B",
  description:
    "Update the kitchen quotation with the revised laminate pricing and the new installation charges. Send to the client workspace once approved internally.",
  proofFile: "Kitchen_Quotation_v3.pdf",
  proofSize: "412 KB",
  proofNote: "Updated laminate pricing and revised installation charges.",
} as const;

export const TASK_TIMELINE = [
  { id: "created", label: "Created", at: "11:08 AM", by: "Aarav Mehta" },
  { id: "seen", label: "Seen", at: "11:09 AM", by: "Rahul Sharma" },
  { id: "accepted", label: "Accepted", at: "11:10 AM", by: "Rahul Sharma" },
  { id: "in_progress", label: "Started", at: "1:22 PM", by: "Rahul Sharma" },
  { id: "submitted", label: "Submitted", at: "3:37 PM", by: "Rahul Sharma" },
  { id: "verified", label: "Verified", at: "3:44 PM", by: "Aarav Mehta" },
] as const;

/* ------------------------------------------------------------- workspace -- */

export type StreamKind = "message" | "task" | "document" | "approval_request" | "approved";

export interface StreamEntry {
  id: string;
  kind: StreamKind;
  personId: string;
  at: string;
  title: string;
  body?: string;
  meta?: string;
}

export const WORKSPACE_STREAM: StreamEntry[] = [
  {
    id: "w1",
    kind: "message",
    personId: "rohan",
    at: "9:58 AM",
    title: "Rohan Kapoor",
    body: "Please send the revised BOQ before today's review.",
  },
  {
    id: "w2",
    kind: "task",
    personId: "aarav",
    at: "10:04 AM",
    title: "Prepare revised BOQ",
    meta: "Assigned to Neha Verma · Due 3:00 PM · High",
  },
  {
    id: "w3",
    kind: "document",
    personId: "neha",
    at: "2:31 PM",
    title: "Greenwood_BOQ_v4.pdf",
    meta: "1.2 MB · Bill of quantities · Tower B",
  },
  {
    id: "w4",
    kind: "approval_request",
    personId: "neha",
    at: "2:33 PM",
    title: "Approval requested",
    meta: "Revised BOQ — Tower B · Greenwood Builders",
  },
];

export const WORKSPACE_TASKS = [
  { id: "wt1", title: "Prepare revised BOQ", person: "Neha Verma", due: "Today, 3:00 PM", state: "Submitted" },
  { id: "wt2", title: "Share updated shaft drawings", person: "Rahul Sharma", due: "Tomorrow, 11:00 AM", state: "Accepted" },
  { id: "wt3", title: "Confirm false ceiling sample", person: "Ananya Shah", due: "Fri, 5:00 PM", state: "Seen" },
];

export const WORKSPACE_DOCS = [
  { id: "wd1", name: "Greenwood_BOQ_v4.pdf", kind: "Bill of quantities", when: "Today", size: "1.2 MB" },
  { id: "wd2", name: "Tower_B_Work_Order.pdf", kind: "Work order", when: "12 Sep", size: "318 KB" },
  { id: "wd3", name: "Site_Handover_Checklist.pdf", kind: "Checklist", when: "9 Sep", size: "96 KB" },
  { id: "wd4", name: "UrbanNest_Greenwood_Agreement.pdf", kind: "Agreement", when: "28 Aug", size: "742 KB" },
];

export const WORKSPACE_PEOPLE = [
  { id: "aarav", side: "UrbanNest Interiors" },
  { id: "rahul", side: "UrbanNest Interiors" },
  { id: "neha", side: "UrbanNest Interiors" },
  { id: "rohan", side: "Greenwood Builders" },
  { id: "ananya", side: "Greenwood Builders" },
] as const;

/* ----------------------------------------------------------------- tasks -- */

export type TaskFilter = "mine" | "team" | "pending" | "overdue" | "completed";

export interface TaskRow {
  id: string;
  title: string;
  personId: string;
  project: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  state: "Seen" | "Accepted" | "In progress" | "Submitted" | "Verified" | "Overdue";
  filters: TaskFilter[];
}

export const TASK_ROWS: TaskRow[] = [
  {
    id: "tr1",
    title: "Revise kitchen quotation",
    personId: "rahul",
    project: "Tower B",
    due: "Today, 4:00 PM",
    priority: "High",
    state: "In progress",
    filters: ["team", "pending"],
  },
  {
    id: "tr2",
    title: "Prepare revised BOQ",
    personId: "neha",
    project: "Tower B",
    due: "Today, 3:00 PM",
    priority: "High",
    state: "Submitted",
    filters: ["team", "pending"],
  },
  {
    id: "tr3",
    title: "Site measurement — Sector 76",
    personId: "vikram",
    project: "Sector 76",
    due: "Today, 4:30 PM",
    priority: "Medium",
    state: "Accepted",
    filters: ["team", "pending"],
  },
  {
    id: "tr4",
    title: "Share vendor rate comparison",
    personId: "priya",
    project: "Tower B",
    due: "Yesterday, 6:00 PM",
    priority: "High",
    state: "Overdue",
    filters: ["team", "overdue", "pending"],
  },
  {
    id: "tr5",
    title: "Confirm false ceiling sample",
    personId: "rahul",
    project: "Tower B",
    due: "Yesterday, 1:00 PM",
    priority: "Medium",
    state: "Overdue",
    filters: ["team", "overdue", "pending"],
  },
  {
    id: "tr6",
    title: "Approve final electrical layout",
    personId: "aarav",
    project: "Oakwood Villa",
    due: "Today, 6:00 PM",
    priority: "High",
    state: "Seen",
    filters: ["mine", "pending"],
  },
  {
    id: "tr7",
    title: "Send invoice INV-2291",
    personId: "priya",
    project: "Tower B",
    due: "Completed 11:40 AM",
    priority: "Medium",
    state: "Verified",
    filters: ["team", "completed"],
  },
  {
    id: "tr8",
    title: "Upload site photos — Tower B",
    personId: "vikram",
    project: "Tower B",
    due: "Completed 10:12 AM",
    priority: "Low",
    state: "Verified",
    filters: ["team", "completed"],
  },
];

export const TASK_FILTERS: { id: TaskFilter; label: string }[] = [
  { id: "mine", label: "My tasks" },
  { id: "team", label: "Team" },
  { id: "pending", label: "Pending" },
  { id: "overdue", label: "Overdue" },
  { id: "completed", label: "Completed" },
];

/* ------------------------------------------------------------- documents -- */

export interface DocTemplate {
  id: string;
  name: string;
  blurb: string;
}

export const DOC_TEMPLATES: DocTemplate[] = [
  { id: "quotation", name: "Quotation", blurb: "Priced scope for a client" },
  { id: "proposal", name: "Proposal", blurb: "Scope and approach" },
  { id: "invoice", name: "Invoice", blurb: "Billing against work done" },
  { id: "agreement", name: "Agreement", blurb: "Terms of engagement" },
  { id: "nda", name: "Non-disclosure", blurb: "Confidentiality terms" },
  { id: "po", name: "Purchase order", blurb: "Order placed on a vendor" },
  { id: "work-order", name: "Work order", blurb: "Authority to begin work" },
  { id: "challan", name: "Delivery challan", blurb: "Goods dispatched" },
  { id: "receipt", name: "Receipt", blurb: "Payment acknowledged" },
  { id: "sow", name: "Statement of work", blurb: "Deliverables and timeline" },
  { id: "report", name: "Project report", blurb: "Progress for the client" },
  { id: "minutes", name: "Meeting minutes", blurb: "Decisions and owners" },
];

export const QUOTATION_LINES = [
  { id: "q1", item: "Modular kitchen — base and wall units", qty: "1 set", amount: 486000 },
  { id: "q2", item: "Laminate finish (revised rates)", qty: "182 sq ft", amount: 214000 },
  { id: "q3", item: "Counter top — quartz", qty: "38 sq ft", amount: 96000 },
  { id: "q4", item: "Installation and site supervision", qty: "Lump sum", amount: 44000 },
];

export const QUOTATION_TOTAL = QUOTATION_LINES.reduce((sum, l) => sum + l.amount, 0);

/* ------------------------------------------------------------- approvals -- */

export interface ApprovalItem {
  id: string;
  title: string;
  context: string;
  requestedBy: string;
  amount?: number;
  when: string;
  detail: string;
}

export const APPROVALS: ApprovalItem[] = [
  {
    id: "ap1",
    title: "Kitchen design revision",
    context: "Greenwood Residence — Tower B",
    requestedBy: "neha",
    when: "Requested 11:20 AM",
    detail:
      "Revised kitchen layout after the client moved the sink to the island. Adds one base unit and changes the plumbing route.",
  },
  {
    id: "ap2",
    title: "Revised quotation",
    context: "Greenwood Residence — Tower B",
    requestedBy: "rahul",
    amount: 840000,
    when: "Requested 3:37 PM",
    detail:
      "Kitchen quotation v3 with updated laminate pricing and revised installation charges. Replaces v2 sent on 2 September.",
  },
  {
    id: "ap3",
    title: "Project milestone — Phase 2 start",
    context: "Skyline Apartment — Sector 76",
    requestedBy: "vikram",
    when: "Requested 1:05 PM",
    detail:
      "Civil work complete and site cleared. Requesting sign-off to begin carpentry from Monday.",
  },
  {
    id: "ap4",
    title: "Vendor selection — laminates",
    context: "Common to all live projects",
    requestedBy: "priya",
    amount: 1250000,
    when: "Requested yesterday",
    detail:
      "Three vendor quotes compared. Recommending the second on price and lead time, with a 12-month rate lock.",
  },
];
