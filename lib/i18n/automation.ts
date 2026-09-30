import type { Locale } from "./locales";

/** Copy for automation rules and their runs. Same rules as every dictionary. */
export interface AutomationCopy {
  title: string;
  subtitle: string;
  newRule: string;
  name: string;
  when: string;
  ifWord: string;
  doWord: string;
  enabled: string;
  disabled: string;
  save: string;
  cancel: string;
  remove: string;
  addCondition: string;
  addAction: string;
  field: string;
  op: string;
  value: string;
  ops: Record<"eq" | "neq" | "in" | "contains" | "gt" | "lt" | "is_set" | "not_set", string>;
  actions: Record<"assign_contact" | "create_task" | "notify_member" | "move_opportunity" | "set_record_status" | "publish_customer_update" | "request_verification" | "send_email" | "send_whatsapp_template", string>;
  params: { member: string; anyMember: string; role: string; anyone: string; title: string; details: string; dueIn: string; priority: string; body: string; href: string; stage: string; status: string; subject: string; to: string; toContact: string; toMember: string; template: string; customerVisible: string; hint: string };
  runs: { title: string; empty: string; status: Record<"queued" | "running" | "succeeded" | "failed" | "skipped", string>; attempts: (n: number) => string; count: (n: number, failed: number) => string; log: string };
  empty: string;
  emptyHelp: string;
  examples: { title: string; websiteLead: string; vendorVerify: string; decision: string; install: string };
  /** What a trigger means, in words; unknown ones fall back to their key. */
  triggerNames: Record<string, string>;
  errors: { notAllowed: string; moduleOff: string; badInput: string; notFound: string; generic: string };
}

const ops = { hi: { eq: "बराबर", neq: "बराबर नहीं", in: "इनमें से", contains: "इसमें है", gt: "से ज़्यादा", lt: "से कम", is_set: "भरा है", not_set: "खाली है" }, hl: { eq: "barabar", neq: "barabar nahi", in: "in mein se", contains: "ismein hai", gt: "se zyada", lt: "se kam", is_set: "bhara hai", not_set: "khali hai" }, en: { eq: "is", neq: "is not", in: "is one of", contains: "contains", gt: "is more than", lt: "is less than", is_set: "is set", not_set: "is empty" } };

const copy: Record<Locale, AutomationCopy> = {
  hi: {
    title: "ऑटोमेशन", subtitle: "जब ऐसा हो, अगर ऐसा हो, तो ये करो।", newRule: "नया नियम", name: "नियम का नाम", when: "जब", ifWord: "अगर", doWord: "तो", enabled: "चालू", disabled: "बंद", save: "सेव करें", cancel: "रहने दें", remove: "हटाएँ",
    addCondition: "शर्त जोड़ें", addAction: "कदम जोड़ें", field: "फ़ील्ड", op: "तुलना", value: "मान", ops: ops.hi,
    actions: { assign_contact: "ग्राहक किसी को दें", create_task: "काम बनाएँ", notify_member: "टीम को बताएँ", move_opportunity: "डील की स्टेज बदलें", set_record_status: "रिकॉर्ड स्टेटस बदलें", publish_customer_update: "ग्राहक को अपडेट दें", request_verification: "मैनेजर से जाँच कराएँ", send_email: "ईमेल भेजें", send_whatsapp_template: "WhatsApp टेम्पलेट भेजें" },
    params: { member: "किसे", anyMember: "जिसके पास सबसे कम", role: "भूमिका", anyone: "—", title: "काम का नाम", details: "थोड़ा और", dueIn: "कितने मिनट में", priority: "प्राथमिकता", body: "संदेश", href: "लिंक", stage: "स्टेज", status: "स्टेटस", subject: "विषय", to: "किसको", toContact: "ग्राहक को", toMember: "टीम के सदस्य को", template: "टेम्पलेट", customerVisible: "ग्राहक देखे", hint: "{{title}}, {{project}}, {{source}} लिखें और वे भर जाएँगे।" },
    runs: { title: "चला कब", empty: "अभी चला नहीं।", status: { queued: "कतार में", running: "चल रहा", succeeded: "हो गया", failed: "रुका", skipped: "छोड़ा" }, attempts: (n) => `${n} कोशिश`, count: (n, f) => `${n} बार चला${f ? ` · ${f} रुके` : ""}`, log: "क्या हुआ" },
    empty: "अभी कोई नियम नहीं", emptyHelp: "एक तैयार नियम जोड़ें या अपना बनाएँ।",
    examples: { title: "तैयार नियम", websiteLead: "वेबसाइट पूछताछ: किसी को दें और फ़ॉलो-अप बनाएँ", vendorVerify: "वेंडर काम भेजे: मैनेजर से जाँच कराएँ", decision: "ग्राहक चुने: टीम को बताएँ", install: "जोड़ें" },
    triggerNames: { "lead.created": "नई पूछताछ आए", "integration.lead_received": "वेबसाइट से पूछताछ आए", "task.created": "काम बने", "task.submitted": "काम पूरा बताया जाए", "task.verified": "काम वेरिफ़ाई हो", "proof.submitted": "सबूत आए", "customer_decision.recorded": "ग्राहक फ़ैसला करे", "vendor_work.submitted": "वेंडर काम भेजे", "contact.assigned": "ग्राहक किसी को दिया जाए", "approval.requested": "मंज़ूरी माँगी जाए" },
    errors: { notAllowed: "यह आप नहीं कर सकते।", moduleOff: "ऑटोमेशन इस कारोबार में चालू नहीं है।", badInput: "कुछ जानकारी सही नहीं है।", notFound: "नहीं मिला।", generic: "सेव नहीं हुआ। फिर कोशिश करें।" },
  },
  "hi-Latn": {
    title: "Automation", subtitle: "Jab aisa ho, agar aisa ho, to yeh karo.", newRule: "Naya rule", name: "Rule ka naam", when: "Jab", ifWord: "Agar", doWord: "To", enabled: "Chalu", disabled: "Band", save: "Save karein", cancel: "Rehne dein", remove: "Hatayein",
    addCondition: "Shart jodein", addAction: "Kadam jodein", field: "Field", op: "Tulna", value: "Value", ops: ops.hl,
    actions: { assign_contact: "Customer kisi ko dein", create_task: "Kaam banayein", notify_member: "Team ko batayein", move_opportunity: "Deal ki stage badlein", set_record_status: "Record status badlein", publish_customer_update: "Customer ko update dein", request_verification: "Manager se jaanch karayein", send_email: "Email bhejein", send_whatsapp_template: "WhatsApp template bhejein" },
    params: { member: "Kise", anyMember: "Jiske paas sabse kam", role: "Role", anyone: "—", title: "Kaam ka naam", details: "Thoda aur", dueIn: "Kitne minute mein", priority: "Priority", body: "Message", href: "Link", stage: "Stage", status: "Status", subject: "Subject", to: "Kisko", toContact: "Customer ko", toMember: "Team member ko", template: "Template", customerVisible: "Customer dekhe", hint: "{{title}}, {{project}}, {{source}} likhein aur woh bhar jayenge." },
    runs: { title: "Kab chala", empty: "Abhi chala nahi.", status: { queued: "Line mein", running: "Chal raha", succeeded: "Ho gaya", failed: "Ruka", skipped: "Chhoda" }, attempts: (n) => `${n} koshish`, count: (n, f) => `${n} baar chala${f ? ` · ${f} ruke` : ""}`, log: "Kya hua" },
    empty: "Abhi koi rule nahi", emptyHelp: "Ek ready rule jodein ya apna banayein.",
    examples: { title: "Ready rules", websiteLead: "Website enquiry: kisi ko dein aur follow-up banayein", vendorVerify: "Vendor kaam bheje: manager se jaanch karayein", decision: "Customer chune: team ko batayein", install: "Jodein" },
    triggerNames: { "lead.created": "nayi enquiry aaye", "integration.lead_received": "website se enquiry aaye", "task.created": "kaam bane", "task.submitted": "kaam poora bataya jaaye", "task.verified": "kaam verify ho", "proof.submitted": "saboot aaye", "customer_decision.recorded": "customer faisla kare", "vendor_work.submitted": "vendor kaam bheje", "contact.assigned": "customer kisi ko diya jaaye", "approval.requested": "manzoori maangi jaaye" },
    errors: { notAllowed: "Yeh aap nahi kar sakte.", moduleOff: "Automation is business mein chalu nahi hai.", badInput: "Kuch jaankari sahi nahi hai.", notFound: "Nahi mila.", generic: "Save nahi hua. Phir koshish karein." },
  },
  en: {
    title: "Automation", subtitle: "When this happens, if that holds, do the following.", newRule: "New rule", name: "Rule name", when: "When", ifWord: "If", doWord: "Do", enabled: "On", disabled: "Off", save: "Save", cancel: "Cancel", remove: "Remove",
    addCondition: "Add condition", addAction: "Add step", field: "Field", op: "Comparison", value: "Value", ops: ops.en,
    actions: { assign_contact: "Assign the customer", create_task: "Create a task", notify_member: "Tell the team", move_opportunity: "Move the deal", set_record_status: "Change a record's status", publish_customer_update: "Publish a customer update", request_verification: "Ask a manager to verify", send_email: "Send an email", send_whatsapp_template: "Send a WhatsApp template" },
    params: { member: "To whom", anyMember: "Whoever has the fewest", role: "Role", anyone: "—", title: "Task title", details: "Details", dueIn: "Due in minutes", priority: "Priority", body: "Message", href: "Link", stage: "Stage", status: "Status", subject: "Subject", to: "To", toContact: "The customer", toMember: "A team member", template: "Template", customerVisible: "Customer can see", hint: "Write {{title}}, {{project}} or {{source}} and they fill in." },
    runs: { title: "Runs", empty: "Has not run yet.", status: { queued: "Queued", running: "Running", succeeded: "Done", failed: "Stopped", skipped: "Skipped" }, attempts: (n) => `${n} attempts`, count: (n, f) => `${n} runs${f ? ` · ${f} stopped` : ""}`, log: "What happened" },
    empty: "No rules yet", emptyHelp: "Add a ready-made rule or write your own.",
    examples: { title: "Ready-made rules", websiteLead: "Website enquiry: assign it and create a follow-up", vendorVerify: "Vendor submits work: ask a manager to verify", decision: "Customer decides: tell the team", install: "Add" },
    triggerNames: { "lead.created": "a new enquiry arrives", "integration.lead_received": "an enquiry arrives from the website", "task.created": "work is created", "task.submitted": "work is handed in", "task.verified": "work is verified", "proof.submitted": "proof arrives", "customer_decision.recorded": "a customer decides", "vendor_work.submitted": "a vendor hands in work", "contact.assigned": "a customer is given an owner", "approval.requested": "an approval is asked for" },
    errors: { notAllowed: "You cannot do that.", moduleOff: "Automation is not switched on for this business.", badInput: "Some of that is not right.", notFound: "Not found.", generic: "Not saved. Try again." },
  },
};

export function getAutomation(locale: Locale): AutomationCopy {
  return copy[locale];
}
