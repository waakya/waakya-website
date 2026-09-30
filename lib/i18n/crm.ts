import type { Locale } from "./locales";

/**
 * CRM copy. Who is this, where did they come from, who owns them, what
 * happened, what happens next. Same rules as every dictionary.
 */
export interface CrmCopy {
  title: string;
  subtitle: string;
  newContact: string;
  search: string;
  filters: { all: string; leads: string; customers: string; mine: string; unassigned: string; followUp: string; archived: string };
  kind: { lead: string; customer: string };
  fields: {
    name: string;
    phone: string;
    email: string;
    company: string;
    source: string;
    tags: string;
    owner: string;
    project: string;
    notes: string;
    nextAction: string;
    nextActionWhen: string;
    interest: string;
    value: string;
    stage: string;
  };
  sources: Record<"website" | "referral" | "walk_in" | "call" | "whatsapp" | "campaign" | "social" | "other", string>;
  actions: {
    save: string;
    cancel: string;
    assign: string;
    preferences: string;
    assignToMe: string;
    unassigned: string;
    logCall: string;
    logMeeting: string;
    addNote: string;
    logWhatsapp: string;
    createTask: string;
    moveStage: string;
    convert: string;
    archive: string;
    restore: string;
    setFollowUp: string;
    clearFollowUp: string;
    call: string;
    whatsapp: string;
    linkProject: string;
    openPortal: string;
  };
  activity: {
    title: string;
    empty: string;
    kinds: Record<"note" | "call" | "meeting" | "message" | "email" | "whatsapp" | "stage_change" | "task" | "campaign" | "website" | "decision" | "assignment" | "created" | "converted", string>;
    noteHint: string;
  };
  deal: { title: string; open: string; won: string; lost: string; noDeal: string; newDeal: string; dealTitle: string; closedOn: string };
  followUp: { due: string; overdue: string; scheduled: string; none: string };
  empty: { title: string; body: string; searchTitle: string; searchBody: string };
  pipeline: { title: string; subtitle: string; empty: string; manage: string; stageName: string; addStage: string; kinds: { open: string; won: string; lost: string }; cannotDelete: string };
  related: { title: string; tasks: string; records: string; noTasks: string; taskFor: (name: string) => string };
  counts: { showing: (from: number, to: number, total: number) => string; next: string; previous: string };
  list: { kind: string; lastActivity: string; nothingYet: string; none: string };
  errors: {
    notAllowed: string;
    moduleOff: string;
    badInput: string;
    needReach: string;
    duplicate: string;
    notFound: string;
    generic: string;
    stageOutside: string;
    closed: string;
  };
  today: { followUps: string; unassigned: string; open: string; call: string };
}

const copy: Record<Locale, CrmCopy> = {
  hi: {
    title: "ग्राहक",
    subtitle: "कौन है, कहाँ से आया, किसके पास है, आगे क्या।",
    newContact: "नया ग्राहक",
    search: "नाम, फ़ोन या ईमेल खोजें",
    filters: { all: "सब", leads: "पूछताछ", customers: "ग्राहक", mine: "मेरे", unassigned: "बिना मालिक", followUp: "फ़ॉलो-अप आज", archived: "आर्काइव" },
    kind: { lead: "पूछताछ", customer: "ग्राहक" },
    fields: { name: "नाम", phone: "फ़ोन", email: "ईमेल", company: "कंपनी", source: "कहाँ से आए", tags: "टैग", owner: "किसके पास", project: "प्रोजेक्ट", notes: "नोट", nextAction: "अगला कदम", nextActionWhen: "कब तक", interest: "क्या चाहिए", value: "अनुमानित रकम", stage: "स्टेज" },
    sources: { website: "वेबसाइट", referral: "रेफ़रल", walk_in: "सीधे आए", call: "फ़ोन", whatsapp: "WhatsApp", campaign: "कैंपेन", social: "सोशल मीडिया", other: "अन्य" },
    actions: { save: "सेव करें", cancel: "रहने दें", assign: "किसी को दें", assignToMe: "मुझे दें", unassigned: "किसी के पास नहीं", logCall: "कॉल दर्ज करें", logMeeting: "मीटिंग दर्ज करें", addNote: "नोट लिखें", logWhatsapp: "WhatsApp दर्ज करें", createTask: "काम बनाएँ", moveStage: "स्टेज बदलें", convert: "ग्राहक बनाएँ", archive: "आर्काइव करें", restore: "वापस लाएँ", setFollowUp: "फ़ॉलो-अप रखें", clearFollowUp: "फ़ॉलो-अप हटाएँ", call: "कॉल करें", whatsapp: "WhatsApp", linkProject: "प्रोजेक्ट जोड़ें", openPortal: "पोर्टल", preferences: "संदेश और आर्काइव" },
    activity: { title: "क्या हुआ", empty: "अभी कुछ दर्ज नहीं। पहला कॉल या नोट लिखें।", kinds: { note: "नोट", call: "कॉल", meeting: "मीटिंग", message: "संदेश", email: "ईमेल", whatsapp: "WhatsApp", stage_change: "स्टेज बदली", task: "काम", campaign: "कैंपेन", website: "वेबसाइट", decision: "फ़ैसला", assignment: "मालिक बदला", created: "जुड़े", converted: "ग्राहक बने" }, noteHint: "क्या बात हुई, आगे क्या" },
    deal: { title: "डील", open: "चल रही", won: "जीती", lost: "गई", noDeal: "कोई डील खुली नहीं", newDeal: "नई डील", dealTitle: "डील का नाम", closedOn: "बंद हुई" },
    followUp: { due: "आज", overdue: "लेट", scheduled: "तय", none: "तय नहीं" },
    empty: { title: "अभी कोई ग्राहक नहीं", body: "पहली पूछताछ जोड़ें, या वेबसाइट को जोड़ें ताकि पूछताछ अपने आप आए।", searchTitle: "कुछ नहीं मिला", searchBody: "नाम, फ़ोन या ईमेल का हिस्सा लिखकर देखें।" },
    pipeline: { title: "पाइपलाइन", subtitle: "हर डील किस स्टेज पर है।", empty: "इस स्टेज में कोई डील नहीं", manage: "स्टेज बदलें", stageName: "स्टेज का नाम", addStage: "स्टेज जोड़ें", kinds: { open: "चल रही", won: "जीती", lost: "गई" }, cannotDelete: "इस स्टेज में डील हैं" },
    related: { title: "जुड़ा हुआ", tasks: "काम", records: "रिकॉर्ड", noTasks: "कोई काम नहीं", taskFor: (n) => `${n} के लिए` },
    counts: { showing: (a, b, n) => `${a}–${b}, कुल ${n}`, next: "अगला", previous: "पिछला" },
    list: { kind: "क्या है", lastActivity: "आख़िरी हलचल", nothingYet: "अभी कुछ नहीं", none: "तय नहीं" },
    errors: { notAllowed: "यह आप नहीं कर सकते।", moduleOff: "ग्राहक (CRM) इस कारोबार में चालू नहीं है।", badInput: "कुछ जानकारी सही नहीं है।", needReach: "फ़ोन या ईमेल में से एक चाहिए।", duplicate: "इस फ़ोन या ईमेल का ग्राहक पहले से है।", notFound: "यह ग्राहक नहीं मिला।", generic: "सेव नहीं हुआ। फिर कोशिश करें।", stageOutside: "यह स्टेज इस पाइपलाइन की नहीं है।", closed: "यह डील बंद हो चुकी है।" },
    today: { followUps: "फ़ॉलो-अप", unassigned: "बिना मालिक", open: "खोलें", call: "कॉल" },
  },
  "hi-Latn": {
    title: "Customers",
    subtitle: "Kaun hai, kahan se aaya, kiske paas hai, aage kya.",
    newContact: "Naya customer",
    search: "Naam, phone ya email khojein",
    filters: { all: "Sab", leads: "Enquiries", customers: "Customers", mine: "Mere", unassigned: "Bina owner", followUp: "Follow-up aaj", archived: "Archive" },
    kind: { lead: "Enquiry", customer: "Customer" },
    fields: { name: "Naam", phone: "Phone", email: "Email", company: "Company", source: "Kahan se aaye", tags: "Tags", owner: "Kiske paas", project: "Project", notes: "Note", nextAction: "Agla kadam", nextActionWhen: "Kab tak", interest: "Kya chahiye", value: "Andaazan rakam", stage: "Stage" },
    sources: { website: "Website", referral: "Referral", walk_in: "Seedhe aaye", call: "Phone", whatsapp: "WhatsApp", campaign: "Campaign", social: "Social media", other: "Aur" },
    actions: { save: "Save karein", cancel: "Rehne dein", assign: "Kisi ko dein", assignToMe: "Mujhe dein", unassigned: "Kisi ke paas nahi", logCall: "Call likhein", logMeeting: "Meeting likhein", addNote: "Note likhein", logWhatsapp: "WhatsApp likhein", createTask: "Kaam banayein", moveStage: "Stage badlein", convert: "Customer banayein", archive: "Archive karein", restore: "Wapas layein", setFollowUp: "Follow-up rakhein", clearFollowUp: "Follow-up hatayein", call: "Call karein", whatsapp: "WhatsApp", linkProject: "Project jodein", openPortal: "Portal", preferences: "Message aur archive" },
    activity: { title: "Kya hua", empty: "Abhi kuch darj nahi. Pehla call ya note likhein.", kinds: { note: "Note", call: "Call", meeting: "Meeting", message: "Message", email: "Email", whatsapp: "WhatsApp", stage_change: "Stage badli", task: "Kaam", campaign: "Campaign", website: "Website", decision: "Faisla", assignment: "Owner badla", created: "Jude", converted: "Customer bane" }, noteHint: "Kya baat hui, aage kya" },
    deal: { title: "Deal", open: "Chal rahi", won: "Jeeti", lost: "Gayi", noDeal: "Koi deal khuli nahi", newDeal: "Nayi deal", dealTitle: "Deal ka naam", closedOn: "Band hui" },
    followUp: { due: "Aaj", overdue: "Late", scheduled: "Tay", none: "Tay nahi" },
    empty: { title: "Abhi koi customer nahi", body: "Pehli enquiry jodein, ya website ko jodein taaki enquiry apne aap aaye.", searchTitle: "Kuch nahi mila", searchBody: "Naam, phone ya email ka hissa likh kar dekhein." },
    pipeline: { title: "Pipeline", subtitle: "Har deal kis stage par hai.", empty: "Is stage mein koi deal nahi", manage: "Stages badlein", stageName: "Stage ka naam", addStage: "Stage jodein", kinds: { open: "Chal rahi", won: "Jeeti", lost: "Gayi" }, cannotDelete: "Is stage mein deals hain" },
    related: { title: "Juda hua", tasks: "Kaam", records: "Records", noTasks: "Koi kaam nahi", taskFor: (n) => `${n} ke liye` },
    counts: { showing: (a, b, n) => `${a}–${b}, kul ${n}`, next: "Agla", previous: "Pichla" },
    list: { kind: "Kya hai", lastActivity: "Aakhri halchal", nothingYet: "Abhi kuch nahi", none: "Tay nahi" },
    errors: { notAllowed: "Yeh aap nahi kar sakte.", moduleOff: "Customers (CRM) is business mein chalu nahi hai.", badInput: "Kuch jaankari sahi nahi hai.", needReach: "Phone ya email mein se ek chahiye.", duplicate: "Is phone ya email ka customer pehle se hai.", notFound: "Yeh customer nahi mila.", generic: "Save nahi hua. Phir koshish karein.", stageOutside: "Yeh stage is pipeline ki nahi hai.", closed: "Yeh deal band ho chuki hai." },
    today: { followUps: "Follow-up", unassigned: "Bina owner", open: "Kholein", call: "Call" },
  },
  en: {
    title: "Customers",
    subtitle: "Who they are, where they came from, who owns them, what is next.",
    newContact: "New customer",
    search: "Search by name, phone or email",
    filters: { all: "All", leads: "Enquiries", customers: "Customers", mine: "Mine", unassigned: "Unassigned", followUp: "Follow-up today", archived: "Archived" },
    kind: { lead: "Enquiry", customer: "Customer" },
    fields: { name: "Name", phone: "Phone", email: "Email", company: "Company", source: "Source", tags: "Tags", owner: "Owner", project: "Project", notes: "Notes", nextAction: "Next action", nextActionWhen: "By when", interest: "Interested in", value: "Estimated value", stage: "Stage" },
    sources: { website: "Website", referral: "Referral", walk_in: "Walk-in", call: "Phone call", whatsapp: "WhatsApp", campaign: "Campaign", social: "Social media", other: "Other" },
    actions: { save: "Save", cancel: "Cancel", assign: "Assign", assignToMe: "Assign to me", unassigned: "Nobody yet", logCall: "Log a call", logMeeting: "Log a meeting", addNote: "Add a note", logWhatsapp: "Log WhatsApp", createTask: "Create task", moveStage: "Move stage", convert: "Make customer", archive: "Archive", restore: "Restore", setFollowUp: "Set follow-up", clearFollowUp: "Clear follow-up", call: "Call", whatsapp: "WhatsApp", linkProject: "Link project", openPortal: "Portal", preferences: "Messages and archive" },
    activity: { title: "What happened", empty: "Nothing recorded yet. Log the first call or note.", kinds: { note: "Note", call: "Call", meeting: "Meeting", message: "Message", email: "Email", whatsapp: "WhatsApp", stage_change: "Stage moved", task: "Task", campaign: "Campaign", website: "Website", decision: "Decision", assignment: "Owner changed", created: "Added", converted: "Became a customer" }, noteHint: "What was said, what happens next" },
    deal: { title: "Deal", open: "Open", won: "Won", lost: "Lost", noDeal: "No open deal", newDeal: "New deal", dealTitle: "Deal name", closedOn: "Closed on" },
    followUp: { due: "Today", overdue: "Overdue", scheduled: "Scheduled", none: "Not set" },
    empty: { title: "No customers yet", body: "Add the first enquiry, or connect your website so enquiries arrive on their own.", searchTitle: "Nothing found", searchBody: "Try part of a name, a phone number or an email." },
    pipeline: { title: "Pipeline", subtitle: "Where every deal stands.", empty: "No deals at this stage", manage: "Edit stages", stageName: "Stage name", addStage: "Add stage", kinds: { open: "Open", won: "Won", lost: "Lost" }, cannotDelete: "This stage still has deals" },
    related: { title: "Related", tasks: "Tasks", records: "Records", noTasks: "No tasks", taskFor: (n) => `For ${n}` },
    counts: { showing: (a, b, n) => `${a}–${b} of ${n}`, next: "Next", previous: "Previous" },
    list: { kind: "Kind", lastActivity: "Last activity", nothingYet: "Nothing yet", none: "Not set" },
    errors: { notAllowed: "You cannot do that.", moduleOff: "Customers (CRM) is not switched on for this business.", badInput: "Some of that is not right.", needReach: "A phone number or an email is needed.", duplicate: "A customer with that phone or email already exists.", notFound: "That customer was not found.", generic: "Not saved. Try again.", stageOutside: "That stage is not in this pipeline.", closed: "This deal is already closed." },
    today: { followUps: "Follow-ups", unassigned: "Unassigned", open: "Open", call: "Call" },
  },
};

export function getCrm(locale: Locale): CrmCopy {
  return copy[locale];
}
