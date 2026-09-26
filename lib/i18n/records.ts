import type { Locale } from "./locales";

/** Copy for configurable records. Same rules as every dictionary. */
export interface RecordsCopy {
  title: string;
  subtitle: string;
  types: {
    title: string;
    subtitle: string;
    manage: string;
    install: string;
    installed: string;
    newType: string;
    name: string;
    namePlural: string;
    description: string;
    statuses: string;
    statusLabel: string;
    statusTone: string;
    defaultStatus: string;
    fields: string;
    fieldLabel: string;
    fieldType: string;
    required: string;
    inList: string;
    customerVisible: string;
    choices: string;
    choicesHint: string;
    addField: string;
    addStatus: string;
    saved: string;
    empty: string;
    emptyHelp: string;
    templates: string;
    archive: string;
    tones: Record<"neel" | "amber" | "laal" | "hara" | "muted" | "outline", string>;
    fieldTypes: Record<
      "text" | "long_text" | "number" | "money" | "date" | "boolean" | "select" | "multi_select" | "phone" | "email" | "url" | "member" | "contact" | "project" | "vendor" | "record",
      string
    >;
  };
  list: {
    newRecord: string;
    search: string;
    all: string;
    empty: (plural: string) => string;
    emptyHelp: string;
    showing: (from: number, to: number, total: number) => string;
    next: string;
    previous: string;
    byStatus: string;
    byProject: string;
  };
  record: {
    title: string;
    status: string;
    changeStatus: string;
    why: string;
    project: string;
    contact: string;
    vendor: string;
    assignee: string;
    customerVisible: string;
    customerHidden: string;
    edit: string;
    save: string;
    cancel: string;
    archive: string;
    restore: string;
    history: string;
    tasks: string;
    createTask: string;
    noTasks: string;
    yes: string;
    no: string;
    none: string;
    unit: string;
  };
  errors: {
    notAllowed: string;
    moduleOff: string;
    badInput: string;
    required: (label: string) => string;
    badStatus: string;
    notFound: string;
    generic: string;
    keyTaken: string;
  };
}

const copy: Record<Locale, RecordsCopy> = {
  hi: {
    title: "रिकॉर्ड",
    subtitle: "प्रॉपर्टी, वर्क पैकेज या कोई भी सूची, आपकी अपनी बनावट में।",
    types: {
      title: "रिकॉर्ड के प्रकार", subtitle: "हर प्रकार के अपने फ़ील्ड और स्टेटस।", manage: "प्रकार सेट करें", install: "जोड़ें", installed: "जुड़ा है", newType: "नया प्रकार",
      name: "नाम (एक)", namePlural: "नाम (कई)", description: "विवरण", statuses: "स्टेटस", statusLabel: "स्टेटस का नाम", statusTone: "रंग", defaultStatus: "शुरुआती स्टेटस",
      fields: "फ़ील्ड", fieldLabel: "फ़ील्ड का नाम", fieldType: "किस तरह का", required: "ज़रूरी", inList: "सूची में दिखे", customerVisible: "ग्राहक देख सके", choices: "विकल्प", choicesHint: "कॉमा से अलग करें",
      addField: "फ़ील्ड जोड़ें", addStatus: "स्टेटस जोड़ें", saved: "सेव हो गया", empty: "अभी कोई प्रकार नहीं", emptyHelp: "तैयार टेम्पलेट जोड़ें या अपना बनाएँ।", templates: "तैयार टेम्पलेट", archive: "आर्काइव",
      tones: { neel: "नीला", amber: "पीला", laal: "लाल", hara: "हरा", muted: "हल्का", outline: "सादा" },
      fieldTypes: { text: "छोटा टेक्स्ट", long_text: "लंबा टेक्स्ट", number: "संख्या", money: "रकम", date: "तारीख़", boolean: "हाँ/नहीं", select: "एक विकल्प", multi_select: "कई विकल्प", phone: "फ़ोन", email: "ईमेल", url: "लिंक", member: "टीम का सदस्य", contact: "ग्राहक", project: "प्रोजेक्ट", vendor: "वेंडर", record: "दूसरा रिकॉर्ड" },
    },
    list: { newRecord: "नया", search: "खोजें", all: "सब", empty: (p) => `अभी कोई ${p} नहीं`, emptyHelp: "पहला जोड़ें।", showing: (a, b, n) => `${a}–${b}, कुल ${n}`, next: "अगला", previous: "पिछला", byStatus: "स्टेटस", byProject: "प्रोजेक्ट" },
    record: { title: "रिकॉर्ड", status: "स्टेटस", changeStatus: "स्टेटस बदलें", why: "क्यों (वैकल्पिक)", project: "प्रोजेक्ट", contact: "ग्राहक", vendor: "वेंडर", assignee: "ज़िम्मेदार", customerVisible: "ग्राहक को दिखता है", customerHidden: "सिर्फ़ अंदर", edit: "बदलें", save: "सेव करें", cancel: "रहने दें", archive: "आर्काइव", restore: "वापस लाएँ", history: "इतिहास", tasks: "काम", createTask: "काम बनाएँ", noTasks: "कोई काम नहीं", yes: "हाँ", no: "नहीं", none: "—", unit: "इकाई" },
    errors: { notAllowed: "यह आप नहीं कर सकते।", moduleOff: "रिकॉर्ड इस कारोबार में चालू नहीं हैं।", badInput: "कुछ जानकारी सही नहीं है।", required: (l) => `${l} ज़रूरी है।`, badStatus: "यह स्टेटस इस प्रकार में नहीं है।", notFound: "यह रिकॉर्ड नहीं मिला।", generic: "सेव नहीं हुआ। फिर कोशिश करें।", keyTaken: "इस नाम का प्रकार पहले से है।" },
  },
  "hi-Latn": {
    title: "Records",
    subtitle: "Property, work package ya koi bhi list, aapki apni banavat mein.",
    types: {
      title: "Record types", subtitle: "Har type ke apne fields aur statuses.", manage: "Types set karein", install: "Jodein", installed: "Juda hai", newType: "Naya type",
      name: "Naam (ek)", namePlural: "Naam (kai)", description: "Vivaran", statuses: "Statuses", statusLabel: "Status ka naam", statusTone: "Rang", defaultStatus: "Shuruaati status",
      fields: "Fields", fieldLabel: "Field ka naam", fieldType: "Kis tarah ka", required: "Zaroori", inList: "List mein dikhe", customerVisible: "Customer dekh sake", choices: "Options", choicesHint: "Comma se alag karein",
      addField: "Field jodein", addStatus: "Status jodein", saved: "Save ho gaya", empty: "Abhi koi type nahi", emptyHelp: "Ready template jodein ya apna banayein.", templates: "Ready templates", archive: "Archive",
      tones: { neel: "Neela", amber: "Peela", laal: "Laal", hara: "Hara", muted: "Halka", outline: "Saada" },
      fieldTypes: { text: "Chhota text", long_text: "Lamba text", number: "Number", money: "Rakam", date: "Tareekh", boolean: "Haan/Nahi", select: "Ek option", multi_select: "Kai options", phone: "Phone", email: "Email", url: "Link", member: "Team member", contact: "Customer", project: "Project", vendor: "Vendor", record: "Doosra record" },
    },
    list: { newRecord: "Naya", search: "Khojein", all: "Sab", empty: (p) => `Abhi koi ${p} nahi`, emptyHelp: "Pehla jodein.", showing: (a, b, n) => `${a}–${b}, kul ${n}`, next: "Agla", previous: "Pichla", byStatus: "Status", byProject: "Project" },
    record: { title: "Record", status: "Status", changeStatus: "Status badlein", why: "Kyon (optional)", project: "Project", contact: "Customer", vendor: "Vendor", assignee: "Zimmedar", customerVisible: "Customer ko dikhta hai", customerHidden: "Sirf andar", edit: "Badlein", save: "Save karein", cancel: "Rehne dein", archive: "Archive", restore: "Wapas layein", history: "History", tasks: "Kaam", createTask: "Kaam banayein", noTasks: "Koi kaam nahi", yes: "Haan", no: "Nahi", none: "—", unit: "Unit" },
    errors: { notAllowed: "Yeh aap nahi kar sakte.", moduleOff: "Records is business mein chalu nahi hain.", badInput: "Kuch jaankari sahi nahi hai.", required: (l) => `${l} zaroori hai.`, badStatus: "Yeh status is type mein nahi hai.", notFound: "Yeh record nahi mila.", generic: "Save nahi hua. Phir koshish karein.", keyTaken: "Is naam ka type pehle se hai." },
  },
  en: {
    title: "Records",
    subtitle: "Properties, work packages or any list, shaped your way.",
    types: {
      title: "Record types", subtitle: "Each type has its own fields and statuses.", manage: "Set up types", install: "Add", installed: "Added", newType: "New type",
      name: "Name (one)", namePlural: "Name (many)", description: "Description", statuses: "Statuses", statusLabel: "Status name", statusTone: "Colour", defaultStatus: "Starting status",
      fields: "Fields", fieldLabel: "Field name", fieldType: "Kind", required: "Required", inList: "Show in list", customerVisible: "Customer can see", choices: "Choices", choicesHint: "Separate with commas",
      addField: "Add field", addStatus: "Add status", saved: "Saved", empty: "No record types yet", emptyHelp: "Add a ready-made template or define your own.", templates: "Ready-made templates", archive: "Archive",
      tones: { neel: "Blue", amber: "Amber", laal: "Red", hara: "Green", muted: "Quiet", outline: "Plain" },
      fieldTypes: { text: "Short text", long_text: "Long text", number: "Number", money: "Money", date: "Date", boolean: "Yes/No", select: "One choice", multi_select: "Several choices", phone: "Phone", email: "Email", url: "Link", member: "Team member", contact: "Customer", project: "Project", vendor: "Vendor", record: "Another record" },
    },
    list: { newRecord: "New", search: "Search", all: "All", empty: (p) => `No ${p.toLowerCase()} yet`, emptyHelp: "Add the first one.", showing: (a, b, n) => `${a}–${b} of ${n}`, next: "Next", previous: "Previous", byStatus: "Status", byProject: "Project" },
    record: { title: "Record", status: "Status", changeStatus: "Change status", why: "Why (optional)", project: "Project", contact: "Customer", vendor: "Vendor", assignee: "Owner", customerVisible: "Visible to the customer", customerHidden: "Internal only", edit: "Edit", save: "Save", cancel: "Cancel", archive: "Archive", restore: "Restore", history: "History", tasks: "Tasks", createTask: "Create task", noTasks: "No tasks", yes: "Yes", no: "No", none: "—", unit: "Unit" },
    errors: { notAllowed: "You cannot do that.", moduleOff: "Records are not switched on for this business.", badInput: "Some of that is not right.", required: (l) => `${l} is required.`, badStatus: "That status is not one this type uses.", notFound: "That record was not found.", generic: "Not saved. Try again.", keyTaken: "A type with that name already exists." },
  },
};

export function getRecords(locale: Locale): RecordsCopy {
  return copy[locale];
}
