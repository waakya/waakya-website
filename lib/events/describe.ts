import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";

/**
 * A history line in the reader's language. Every event carries enough of its
 * own context that this never needs another query: titles and names travel in
 * the payload, ids only decide the link.
 */
export function describeEvent(
  locale: Locale,
  type: string,
  payload: Record<string, unknown>,
  entityId: string | null,
  names: Map<string, string>,
): { text: string; href: string | null } {
  const s = (key: string) => (typeof payload[key] === "string" ? (payload[key] as string) : "");
  const person = (key: string) => (typeof payload[key] === "string" ? (names.get(payload[key] as string) ?? "") : "");
  const state = (key: string) => {
    const value = s(key);
    const t = getDictionary(locale).stepper as unknown as Record<string, string>;
    const map: Record<string, string> = {
      delivered: t.bheja, acknowledged: t.dekha, accepted: t.maana, in_progress: t.chalRaha, done: t.hoGaya, verified: t.verified,
    };
    return map[value] ?? value;
  };
  const L = LINES[locale];
  const title = s("title") || s("name") || s("full_name");
  const task = entityId ? `/kaam/${entityId}` : null;
  switch (type) {
    case "task.created": return { text: L.taskCreated(title, person("assigned_to")), href: task };
    case "task.state_changed": return { text: L.taskMoved(title, state("to")), href: task };
    case "task.accepted": return { text: L.taskAccepted(title, person("assigned_to")), href: task };
    case "task.submitted": return { text: L.taskSubmitted(title), href: task };
    case "task.verified": return { text: L.taskVerified(title), href: task };
    case "task.reassigned": return { text: L.taskReassigned(title, person("to")), href: task };
    case "task.deadline_changed": return { text: L.taskDeadline(title), href: task };
    case "approval.requested": return { text: L.approvalRequested(title), href: "/approvals" };
    case "approval.decided": return { text: L.approvalDecided(title, s("status")), href: "/approvals" };
    case "leave.decided": return { text: L.leaveDecided(person("user_id"), s("status")), href: "/hazri" };
    case "membership.created": return { text: L.memberJoined(person("user_id"), s("role")), href: "/staff" };
    case "membership.role_changed": return { text: L.roleChanged(person("user_id"), s("from"), s("to")), href: "/staff" };
    case "membership.removed": return { text: L.memberRemoved(person("user_id")), href: "/staff" };
    case "module.changed": return { text: L.moduleChanged(s("module_key"), payload.enabled === true), href: "/settings/modules" };
    case "proof.submitted": return { text: L.proofSubmitted(title), href: typeof payload.task_id === "string" ? `/kaam/${payload.task_id}` : null };
    case "lead.created": return { text: L.leadCreated(title, s("source")), href: entityId ? `/crm/${entityId}` : "/crm" };
    case "contact.assigned": return { text: L.contactAssigned(title, person("owner_id")), href: entityId ? `/crm/${entityId}` : "/crm" };
    case "contact.converted": return { text: L.contactConverted(title), href: entityId ? `/crm/${entityId}` : "/crm" };
    case "opportunity.stage_changed": return { text: L.stageChanged(title, s("from_stage"), s("to_stage")), href: typeof payload.contact_id === "string" ? `/crm/${payload.contact_id}` : "/crm" };
    case "record.created": return { text: L.recordCreated(title, s("type_name")), href: recordHref(payload, entityId) };
    case "record.status_changed": return { text: L.recordStatus(title, s("from"), s("to")), href: recordHref(payload, entityId) };
    case "record.updated": return { text: L.recordUpdated(title), href: recordHref(payload, entityId) };
    case "project.progress_changed": return { text: L.projectProgress(title, Number(payload.to ?? 0)), href: entityId ? `/projects/${entityId}` : "/projects" };
    case "project.update_published": return { text: L.projectUpdate(title, s("body")), href: typeof payload.project_id === "string" ? `/projects/${payload.project_id}` : "/projects" };
    case "project.milestone_done": return { text: L.milestoneDone(title), href: typeof payload.project_id === "string" ? `/projects/${payload.project_id}` : "/projects" };
    case "customer_decision.requested": return { text: L.decisionRequested(title), href: typeof payload.project_id === "string" ? `/projects/${payload.project_id}` : "/projects" };
    case "customer_decision.recorded": return { text: L.decisionRecorded(title, s("option_label")), href: typeof payload.project_id === "string" ? `/projects/${payload.project_id}` : "/projects" };
    case "customer_message.received": return { text: L.customerMessage(s("project_name")), href: typeof payload.project_id === "string" ? `/projects/${payload.project_id}` : "/projects" };
    case "customer_access.granted": return { text: L.accessGranted(title), href: typeof payload.project_id === "string" ? `/projects/${payload.project_id}` : "/projects" };
    case "customer_access.revoked": return { text: L.accessRevoked(title), href: "/projects" };
    case "vendor_work.assigned": return { text: L.vendorAssigned(title, s("vendor_name")), href: entityId ? `/vendors/assignments/${entityId}` : "/vendors" };
    case "vendor_work.submitted": return { text: L.vendorSubmitted(title, s("vendor_name")), href: entityId ? `/vendors/assignments/${entityId}` : "/vendors" };
    case "vendor_work.verified": return { text: L.vendorVerified(title, s("status")), href: entityId ? `/vendors/assignments/${entityId}` : "/vendors" };
    case "vendor_payment.recorded": return { text: L.vendorPaid(title, s("amount")), href: typeof payload.assignment_id === "string" ? `/vendors/assignments/${payload.assignment_id}` : "/vendors" };
    case "campaign.sent": return { text: L.campaignSent(title, Number(payload.sent ?? 0)), href: entityId ? `/campaigns/${entityId}` : "/campaigns" };
    case "campaign.recipient_replied": return { text: L.campaignReply(title), href: typeof payload.contact_id === "string" ? `/crm/${payload.contact_id}` : "/campaigns" };
    case "integration.lead_received": return { text: L.integrationLead(title, s("source")), href: entityId ? `/crm/${entityId}` : "/crm" };
    case "automation.run_failed": return { text: L.automationFailed(title, s("error")), href: "/automations" };
    case "domain.verified": return { text: L.domainVerified(s("hostname")), href: "/settings/domains" };
    default: return { text: `${type}${title ? ` · ${title}` : ""}`, href: null };
  }
}

function recordHref(payload: Record<string, unknown>, entityId: string | null): string | null {
  const typeKey = typeof payload.type_key === "string" ? payload.type_key : null;
  if (typeKey && entityId) return `/records/${typeKey}/${entityId}`;
  return "/records";
}

type Lines = {
  taskCreated: (t: string, who: string) => string;
  taskMoved: (t: string, to: string) => string;
  taskAccepted: (t: string, who: string) => string;
  taskSubmitted: (t: string) => string;
  taskVerified: (t: string) => string;
  taskReassigned: (t: string, who: string) => string;
  taskDeadline: (t: string) => string;
  approvalRequested: (t: string) => string;
  approvalDecided: (t: string, status: string) => string;
  leaveDecided: (who: string, status: string) => string;
  memberJoined: (who: string, role: string) => string;
  roleChanged: (who: string, from: string, to: string) => string;
  memberRemoved: (who: string) => string;
  moduleChanged: (key: string, on: boolean) => string;
  proofSubmitted: (t: string) => string;
  leadCreated: (t: string, source: string) => string;
  contactAssigned: (t: string, who: string) => string;
  contactConverted: (t: string) => string;
  stageChanged: (t: string, from: string, to: string) => string;
  recordCreated: (t: string, type: string) => string;
  recordStatus: (t: string, from: string, to: string) => string;
  recordUpdated: (t: string) => string;
  projectProgress: (t: string, pct: number) => string;
  projectUpdate: (t: string, body: string) => string;
  milestoneDone: (t: string) => string;
  decisionRequested: (t: string) => string;
  decisionRecorded: (t: string, option: string) => string;
  customerMessage: (project: string) => string;
  accessGranted: (t: string) => string;
  accessRevoked: (t: string) => string;
  vendorAssigned: (t: string, vendor: string) => string;
  vendorSubmitted: (t: string, vendor: string) => string;
  vendorVerified: (t: string, status: string) => string;
  vendorPaid: (t: string, amount: string) => string;
  campaignSent: (t: string, n: number) => string;
  campaignReply: (t: string) => string;
  integrationLead: (t: string, source: string) => string;
  automationFailed: (t: string, error: string) => string;
  domainVerified: (host: string) => string;
};

const LINES: Record<Locale, Lines> = {
  hi: {
    taskCreated: (t, who) => `नया काम "${t}"${who ? ` · ${who} को` : ""}`,
    taskMoved: (t, to) => `"${t}" · ${to}`,
    taskAccepted: (t, who) => `${who || "—"} ने "${t}" माना`,
    taskSubmitted: (t) => `"${t}" हो गया, जाँच बाकी`,
    taskVerified: (t) => `"${t}" वेरिफ़ाई हुआ`,
    taskReassigned: (t, who) => `"${t}" अब ${who || "—"} के पास`,
    taskDeadline: (t) => `"${t}" की समय-सीमा बदली`,
    approvalRequested: (t) => `मंज़ूरी माँगी: ${t}`,
    approvalDecided: (t, s) => `मंज़ूरी ${s === "approved" ? "मिली" : "नहीं मिली"}: ${t}`,
    leaveDecided: (who, s) => `${who || "—"} की छुट्टी ${s === "approved" ? "मंज़ूर" : "नामंज़ूर"}`,
    memberJoined: (who, role) => `${who || "—"} जुड़े · ${role}`,
    roleChanged: (who, from, to) => `${who || "—"} की भूमिका ${from} से ${to}`,
    memberRemoved: (who) => `${who || "—"} हटाए गए`,
    moduleChanged: (key, on) => `${key} ${on ? "चालू" : "बंद"}`,
    proofSubmitted: (t) => `"${t}" का सबूत आया`,
    leadCreated: (t, source) => `नई पूछताछ: ${t}${source ? ` · ${source}` : ""}`,
    contactAssigned: (t, who) => `${t} अब ${who || "—"} के पास`,
    contactConverted: (t) => `${t} ग्राहक बने`,
    stageChanged: (t, from, to) => `${t}: ${from} → ${to}`,
    recordCreated: (t, type) => `नया ${type}: ${t}`,
    recordStatus: (t, from, to) => `${t}: ${from} → ${to}`,
    recordUpdated: (t) => `${t} बदला`,
    projectProgress: (t, pct) => `${t} · ${pct}% पूरा`,
    projectUpdate: (t, body) => `${t}: ${body}`,
    milestoneDone: (t) => `पड़ाव पूरा: ${t}`,
    decisionRequested: (t) => `ग्राहक से पूछा: ${t}`,
    decisionRecorded: (t, o) => `ग्राहक ने चुना: ${o} (${t})`,
    customerMessage: (p) => `ग्राहक का संदेश · ${p}`,
    accessGranted: (t) => `${t} को पोर्टल मिला`,
    accessRevoked: (t) => `${t} का पोर्टल बंद`,
    vendorAssigned: (t, v) => `${v} को काम: ${t}`,
    vendorSubmitted: (t, v) => `${v} ने काम भेजा: ${t}`,
    vendorVerified: (t, s) => `${t} · ${s === "verified" ? "वेरिफ़ाई" : "वापस"}`,
    vendorPaid: (t, a) => `भुगतान ${a}: ${t}`,
    campaignSent: (t, n) => `कैंपेन भेजा: ${t} · ${n}`,
    campaignReply: (t) => `कैंपेन पर जवाब: ${t}`,
    integrationLead: (t, s) => `वेबसाइट से पूछताछ: ${t}${s ? ` · ${s}` : ""}`,
    automationFailed: (t, e) => `ऑटोमेशन रुका: ${t}${e ? ` · ${e}` : ""}`,
    domainVerified: (h) => `डोमेन सत्यापित: ${h}`,
  },
  "hi-Latn": {
    taskCreated: (t, who) => `Naya kaam "${t}"${who ? ` · ${who} ko` : ""}`,
    taskMoved: (t, to) => `"${t}" · ${to}`,
    taskAccepted: (t, who) => `${who || "—"} ne "${t}" maana`,
    taskSubmitted: (t) => `"${t}" ho gaya, jaanch baaki`,
    taskVerified: (t) => `"${t}" verify hua`,
    taskReassigned: (t, who) => `"${t}" ab ${who || "—"} ke paas`,
    taskDeadline: (t) => `"${t}" ki deadline badli`,
    approvalRequested: (t) => `Manzoori maangi: ${t}`,
    approvalDecided: (t, s) => `Manzoori ${s === "approved" ? "mili" : "nahi mili"}: ${t}`,
    leaveDecided: (who, s) => `${who || "—"} ki chhutti ${s === "approved" ? "manzoor" : "namanzoor"}`,
    memberJoined: (who, role) => `${who || "—"} jude · ${role}`,
    roleChanged: (who, from, to) => `${who || "—"} ka role ${from} se ${to}`,
    memberRemoved: (who) => `${who || "—"} hataye gaye`,
    moduleChanged: (key, on) => `${key} ${on ? "chalu" : "band"}`,
    proofSubmitted: (t) => `"${t}" ka proof aaya`,
    leadCreated: (t, source) => `Nayi enquiry: ${t}${source ? ` · ${source}` : ""}`,
    contactAssigned: (t, who) => `${t} ab ${who || "—"} ke paas`,
    contactConverted: (t) => `${t} customer bane`,
    stageChanged: (t, from, to) => `${t}: ${from} → ${to}`,
    recordCreated: (t, type) => `Naya ${type}: ${t}`,
    recordStatus: (t, from, to) => `${t}: ${from} → ${to}`,
    recordUpdated: (t) => `${t} badla`,
    projectProgress: (t, pct) => `${t} · ${pct}% poora`,
    projectUpdate: (t, body) => `${t}: ${body}`,
    milestoneDone: (t) => `Milestone poora: ${t}`,
    decisionRequested: (t) => `Customer se poocha: ${t}`,
    decisionRecorded: (t, o) => `Customer ne chuna: ${o} (${t})`,
    customerMessage: (p) => `Customer ka message · ${p}`,
    accessGranted: (t) => `${t} ko portal mila`,
    accessRevoked: (t) => `${t} ka portal band`,
    vendorAssigned: (t, v) => `${v} ko kaam: ${t}`,
    vendorSubmitted: (t, v) => `${v} ne kaam bheja: ${t}`,
    vendorVerified: (t, s) => `${t} · ${s === "verified" ? "verified" : "wapas"}`,
    vendorPaid: (t, a) => `Payment ${a}: ${t}`,
    campaignSent: (t, n) => `Campaign bheja: ${t} · ${n}`,
    campaignReply: (t) => `Campaign par jawab: ${t}`,
    integrationLead: (t, s) => `Website se enquiry: ${t}${s ? ` · ${s}` : ""}`,
    automationFailed: (t, e) => `Automation ruka: ${t}${e ? ` · ${e}` : ""}`,
    domainVerified: (h) => `Domain verified: ${h}`,
  },
  en: {
    taskCreated: (t, who) => `New task "${t}"${who ? ` for ${who}` : ""}`,
    taskMoved: (t, to) => `"${t}" · ${to}`,
    taskAccepted: (t, who) => `${who || "—"} accepted "${t}"`,
    taskSubmitted: (t) => `"${t}" done, waiting for verification`,
    taskVerified: (t) => `"${t}" verified`,
    taskReassigned: (t, who) => `"${t}" now with ${who || "—"}`,
    taskDeadline: (t) => `Deadline changed on "${t}"`,
    approvalRequested: (t) => `Approval requested: ${t}`,
    approvalDecided: (t, s) => `Approval ${s === "approved" ? "given" : "refused"}: ${t}`,
    leaveDecided: (who, s) => `Leave for ${who || "—"} ${s}`,
    memberJoined: (who, role) => `${who || "—"} joined as ${role}`,
    roleChanged: (who, from, to) => `${who || "—"} changed from ${from} to ${to}`,
    memberRemoved: (who) => `${who || "—"} removed`,
    moduleChanged: (key, on) => `${key} turned ${on ? "on" : "off"}`,
    proofSubmitted: (t) => `Proof added on "${t}"`,
    leadCreated: (t, source) => `New enquiry: ${t}${source ? ` · ${source}` : ""}`,
    contactAssigned: (t, who) => `${t} now with ${who || "—"}`,
    contactConverted: (t) => `${t} became a customer`,
    stageChanged: (t, from, to) => `${t}: ${from} → ${to}`,
    recordCreated: (t, type) => `New ${type}: ${t}`,
    recordStatus: (t, from, to) => `${t}: ${from} → ${to}`,
    recordUpdated: (t) => `${t} updated`,
    projectProgress: (t, pct) => `${t} · ${pct}% complete`,
    projectUpdate: (t, body) => `${t}: ${body}`,
    milestoneDone: (t) => `Milestone reached: ${t}`,
    decisionRequested: (t) => `Customer asked to decide: ${t}`,
    decisionRecorded: (t, o) => `Customer chose ${o} (${t})`,
    customerMessage: (p) => `Customer message · ${p}`,
    accessGranted: (t) => `${t} given portal access`,
    accessRevoked: (t) => `${t} portal access revoked`,
    vendorAssigned: (t, v) => `${v} assigned: ${t}`,
    vendorSubmitted: (t, v) => `${v} submitted: ${t}`,
    vendorVerified: (t, s) => `${t} · ${s === "verified" ? "verified" : "sent back"}`,
    vendorPaid: (t, a) => `Payment ${a}: ${t}`,
    campaignSent: (t, n) => `Campaign sent: ${t} · ${n}`,
    campaignReply: (t) => `Reply to campaign: ${t}`,
    integrationLead: (t, s) => `Website enquiry: ${t}${s ? ` · ${s}` : ""}`,
    automationFailed: (t, e) => `Automation stopped: ${t}${e ? ` · ${e}` : ""}`,
    domainVerified: (h) => `Domain verified: ${h}`,
  },
};
