import type { Locale } from "./locales";

/**
 * Copy for the Phase-1 modules: work, projects, documents, templates,
 * approvals, search and the onboarding profile step.
 *
 * Kept beside the main dictionary rather than inside it, the way the landing
 * page keeps its own, so the core product vocabulary stays small. The same
 * rules apply: no brand name inside a translatable string, Latin digits, no
 * exclamation marks, and a task is never "completed" — it is done, then
 * verified.
 */
export interface Phase1Copy {
  nav: {
    today: string;
    conversations: string;
    work: string;
    projects: string;
    documents: string;
    attendance: string;
    approvals: string;
    team: string;
    search: string;
    updates: string;
    settings: string;
    more: string;
  };
  common: {
    save: string;
    cancel: string;
    create: string;
    open: string;
    download: string;
    delete: string;
    loading: string;
    all: string;
    none: string;
    by: string;
    optional: string;
    failed: string;
  };
  work: {
    title: string;
    subtitle: string;
    mine: string;
    team: string;
    pending: string;
    late: string;
    done: string;
    empty: string;
    newTask: string;
    due: string;
    noDeadline: string;
  };
  projects: {
    title: string;
    subtitle: string;
    newProject: string;
    name: string;
    description: string;
    start: string;
    end: string;
    status: string;
    statuses: { planned: string; active: string; on_hold: string; completed: string };
    empty: string;
    emptyHelp: string;
    tasks: string;
    documents: string;
    members: string;
    activity: string;
    addMember: string;
    linkTask: string;
    noTasks: string;
    noDocuments: string;
    openTasks: (n: number) => string;
  };
  documents: {
    title: string;
    subtitle: string;
    upload: string;
    uploading: string;
    templates: string;
    searchPlaceholder: string;
    category: string;
    categories: Record<string, string>;
    empty: string;
    emptyHelp: string;
    noResults: string;
    size: string;
    uploadedBy: string;
    tooBig: string;
    badType: string;
    deleteConfirm: string;
    attachToTask: string;
    attach: string;
    attached: string;
    linkedTask: string;
    linkedProject: string;
    fromTemplate: string;
  };
  templates: {
    title: string;
    subtitle: string;
    choose: string;
    fields: string;
    preview: string;
    generate: string;
    saved: string;
    print: string;
    back: string;
    fieldLabels: Record<string, string>;
  };
  approvals: {
    title: string;
    subtitle: string;
    request: string;
    titleLabel: string;
    detailsLabel: string;
    approverLabel: string;
    anyManager: string;
    waiting: string;
    decided: string;
    mine: string;
    approve: string;
    reject: string;
    approved: string;
    rejected: string;
    pending: string;
    empty: string;
    emptyHelp: string;
    requestedBy: (name: string) => string;
    decidedBy: (name: string) => string;
  };
  search: {
    title: string;
    placeholder: string;
    hint: string;
    none: string;
    tasks: string;
    projects: string;
    documents: string;
    people: string;
    messages: string;
  };
  team: {
    title: string;
    inToday: string;
    notIn: string;
    onLeave: string;
    openWork: (n: number) => string;
  };
  onboarding: {
    profileTitle: string;
    profileLead: string;
    address: string;
    gstin: string;
    phone: string;
    email: string;
    continue: string;
    skip: string;
    step: (n: number, of: number) => string;
  };
  today: {
    alsoNeedsYou: string;
    approvalsWaiting: (n: number) => string;
    leaveWaiting: (n: number) => string;
    unreadConversations: (n: number) => string;
    punchedIn: (time: string) => string;
    notPunchedIn: string;
    activeProjects: string;
    recentDocuments: string;
  };
  conversations: {
    newGroup: string;
    groupName: string;
    choosePeople: string;
    createGroup: string;
    attach: string;
    sharedFile: (name: string) => string;
    direct: string;
  };
}

const CATEGORY_EN = {
  quotation: "Quotation",
  proposal: "Proposal",
  invoice: "Invoice",
  agreement: "Agreement",
  nda: "NDA",
  purchase_order: "Purchase order",
  work_order: "Work order",
  receipt: "Receipt",
  sow: "Scope of work",
  report: "Report",
  meeting_minutes: "Meeting minutes",
  other: "Other",
};

const FIELDS_EN = {
  business_name: "Business name",
  business_address: "Business address",
  gstin: "GSTIN",
  client_name: "Client name",
  client_address: "Client address",
  project_name: "Project or site name",
  date: "Date",
  reference: "Reference number",
  amount: "Amount (before GST)",
  gst_percent: "GST %",
  payment_terms: "Payment terms",
  valid_until: "Valid until",
  scope: "Scope",
  notes: "Notes",
  attendees: "Attendees",
  decisions: "Decisions",
  term: "Term",
  signatory: "Signed for the business by",
};

const en: Phase1Copy = {
  nav: {
    today: "Today",
    conversations: "Conversations",
    work: "Work",
    projects: "Projects",
    documents: "Documents",
    attendance: "Attendance",
    approvals: "Approvals",
    team: "Team",
    search: "Search",
    updates: "Updates",
    settings: "Settings",
    more: "More",
  },
  common: {
    save: "Save",
    cancel: "Cancel",
    create: "Create",
    open: "Open",
    download: "Download",
    delete: "Delete",
    loading: "Loading",
    all: "All",
    none: "None",
    by: "by",
    optional: "optional",
    failed: "That did not go through. Please try again.",
  },
  work: {
    title: "Work",
    subtitle: "Every commitment, with an owner and a deadline.",
    mine: "Mine",
    team: "Team",
    pending: "Open",
    late: "Late",
    done: "Done",
    empty: "Nothing here right now.",
    newTask: "New task",
    due: "Due",
    noDeadline: "No deadline",
  },
  projects: {
    title: "Projects",
    subtitle: "Keep related work, people and documents together.",
    newProject: "New project",
    name: "Project name",
    description: "Description",
    start: "Start date",
    end: "End date",
    status: "Status",
    statuses: { planned: "Planned", active: "Active", on_hold: "On hold", completed: "Done" },
    empty: "No projects yet",
    emptyHelp: "A project gathers the tasks and documents for one piece of work.",
    tasks: "Tasks",
    documents: "Documents",
    members: "People",
    activity: "Activity",
    addMember: "Add person",
    linkTask: "Add a task to this project",
    noTasks: "No tasks in this project yet.",
    noDocuments: "No documents in this project yet.",
    openTasks: (n) => (n === 1 ? "1 open task" : `${n} open tasks`),
  },
  documents: {
    title: "Documents",
    subtitle: "Your business paperwork, kept next to the work it belongs to.",
    upload: "Upload",
    uploading: "Uploading",
    templates: "Templates",
    searchPlaceholder: "Search documents",
    category: "Category",
    categories: CATEGORY_EN,
    empty: "No documents yet",
    emptyHelp: "Upload a quotation, an invoice or a report, or start from a template.",
    noResults: "No documents match.",
    size: "Size",
    uploadedBy: "Uploaded by",
    tooBig: "That file is larger than 25 MB.",
    badType: "That kind of file cannot be stored here. Use PDF, an image, Word, Excel or PowerPoint.",
    deleteConfirm: "Delete this document for everyone?",
    attachToTask: "Attach a document",
    attach: "Attach",
    attached: "Attached documents",
    linkedTask: "Task",
    linkedProject: "Project",
    fromTemplate: "From a template",
  },
  templates: {
    title: "Templates",
    subtitle: "Fill in the details, check the preview, and save it as a document.",
    choose: "Choose a template",
    fields: "Details",
    preview: "Preview",
    generate: "Save as document",
    saved: "Saved to Documents",
    print: "Print or save as PDF",
    back: "All templates",
    fieldLabels: FIELDS_EN,
  },
  approvals: {
    title: "Approvals",
    subtitle: "Decisions that hold work up, kept next to the work.",
    request: "Ask for approval",
    titleLabel: "What needs approving",
    detailsLabel: "Details",
    approverLabel: "Who should approve",
    anyManager: "Any manager",
    waiting: "Waiting for you",
    decided: "Decided",
    mine: "My requests",
    approve: "Approve",
    reject: "Reject",
    approved: "Approved",
    rejected: "Rejected",
    pending: "Pending",
    empty: "Nothing waiting",
    emptyHelp: "Requests for approval appear here.",
    requestedBy: (name) => `Requested by ${name}`,
    decidedBy: (name) => `Decided by ${name}`,
  },
  search: {
    title: "Search",
    placeholder: "Search tasks, projects, documents, people",
    hint: "Type at least two letters.",
    none: "Nothing found.",
    tasks: "Tasks",
    projects: "Projects",
    documents: "Documents",
    people: "People",
    messages: "Messages",
  },
  team: {
    title: "Team",
    inToday: "In today",
    notIn: "Not punched in",
    onLeave: "On leave",
    openWork: (n) => (n === 1 ? "1 open task" : `${n} open tasks`),
  },
  onboarding: {
    profileTitle: "Tell us about your business",
    profileLead: "These details fill your quotations, invoices and other documents.",
    address: "Business address",
    gstin: "GSTIN",
    phone: "Business phone",
    email: "Business email",
    continue: "Continue",
    skip: "Skip for now",
    step: (n, of) => `Step ${n} of ${of}`,
  },
  today: {
    alsoNeedsYou: "Also waiting on you",
    approvalsWaiting: (n) => (n === 1 ? "1 approval waiting" : `${n} approvals waiting`),
    leaveWaiting: (n) => (n === 1 ? "1 leave request" : `${n} leave requests`),
    unreadConversations: (n) => (n === 1 ? "1 unread conversation" : `${n} unread conversations`),
    punchedIn: (time) => `Punched in at ${time}`,
    notPunchedIn: "You have not punched in today",
    activeProjects: "Projects in progress",
    recentDocuments: "Recent documents",
  },
  conversations: {
    newGroup: "New group",
    groupName: "Group name",
    choosePeople: "Who is in it?",
    createGroup: "Create group",
    attach: "Attach a file",
    sharedFile: (name) => `Shared ${name}`,
    direct: "Direct",
  },
};

const hiLatn: Phase1Copy = {
  ...en,
  nav: {
    today: "Aaj",
    conversations: "Baat-cheet",
    work: "Kaam",
    projects: "Projects",
    documents: "Documents",
    attendance: "Hazri",
    approvals: "Manzoori",
    team: "Team",
    search: "Khojein",
    updates: "Khabar",
    settings: "Setting",
    more: "Aur",
  },
  common: {
    save: "Save karein",
    cancel: "Rehne dein",
    create: "Banayein",
    open: "Kholein",
    download: "Download",
    delete: "Hatayein",
    loading: "Khul raha hai",
    all: "Sab",
    none: "Koi nahi",
    by: "dwara",
    optional: "zaroori nahi",
    failed: "Nahi hua. Phir se koshish karein.",
  },
  work: {
    title: "Kaam",
    subtitle: "Har kaam ka owner aur deadline.",
    mine: "Mera",
    team: "Team",
    pending: "Baaki",
    late: "Late",
    done: "Ho gaya",
    empty: "Abhi yahan kuch nahi.",
    newTask: "Naya kaam",
    due: "Deadline",
    noDeadline: "Koi deadline nahi",
  },
  projects: {
    ...en.projects,
    subtitle: "Ek kaam se jude tasks, log aur documents ek jagah.",
    newProject: "Naya project",
    name: "Project ka naam",
    description: "Jaankari",
    start: "Shuru",
    end: "Khatam",
    status: "Sthiti",
    statuses: { planned: "Planned", active: "Chal raha", on_hold: "Ruka hua", completed: "Ho gaya" },
    empty: "Abhi koi project nahi",
    emptyHelp: "Project ek kaam ke tasks aur documents ko saath rakhta hai.",
    members: "Log",
    addMember: "Vyakti jodein",
    linkTask: "Is project mein task jodein",
    noTasks: "Is project mein abhi koi task nahi.",
    noDocuments: "Is project mein abhi koi document nahi.",
    openTasks: (n) => `${n} kaam baaki`,
  },
  documents: {
    ...en.documents,
    subtitle: "Business ke kaagaz, us kaam ke saath jisse jude hain.",
    upload: "Upload karein",
    uploading: "Upload ho raha hai",
    searchPlaceholder: "Documents khojein",
    empty: "Abhi koi document nahi",
    emptyHelp: "Quotation, invoice ya report upload karein, ya template se shuru karein.",
    noResults: "Koi document nahi mila.",
    uploadedBy: "Upload kiya",
    tooBig: "File 25 MB se badi hai.",
    badType: "Yeh file yahan nahi rakh sakte. PDF, photo, Word, Excel ya PowerPoint use karein.",
    deleteConfirm: "Yeh document sabke liye hatayein?",
    attachToTask: "Document jodein",
    attach: "Jodein",
    attached: "Jude documents",
    fromTemplate: "Template se",
  },
  templates: {
    ...en.templates,
    subtitle: "Details bharein, preview dekhein, aur document ki tarah save karein.",
    choose: "Template chunein",
    fields: "Details",
    generate: "Document save karein",
    saved: "Documents mein save hua",
    print: "Print ya PDF",
    back: "Sab templates",
  },
  approvals: {
    ...en.approvals,
    title: "Manzoori",
    subtitle: "Faisle jo kaam rokte hain, kaam ke saath.",
    request: "Manzoori maangein",
    titleLabel: "Kya manzoor karna hai",
    detailsLabel: "Jaankari",
    approverLabel: "Kaun manzoor kare",
    anyManager: "Koi bhi manager",
    waiting: "Aapka intezaar",
    decided: "Faisla ho gaya",
    mine: "Meri arzi",
    approve: "Manzoor",
    reject: "Namanzoor",
    approved: "Manzoor",
    rejected: "Namanzoor",
    pending: "Intezaar",
    empty: "Kuch baaki nahi",
    emptyHelp: "Manzoori ki arzi yahan dikhegi.",
    requestedBy: (name) => `${name} ne maangi`,
    decidedBy: (name) => `${name} ne faisla kiya`,
  },
  search: {
    title: "Khojein",
    placeholder: "Kaam, project, document, log khojein",
    hint: "Kam se kam do akshar likhein.",
    none: "Kuch nahi mila.",
    tasks: "Kaam",
    projects: "Projects",
    documents: "Documents",
    people: "Log",
    messages: "Messages",
  },
  team: {
    title: "Team",
    inToday: "Aaj aaye",
    notIn: "Punch in nahi",
    onLeave: "Chhutti",
    openWork: (n) => `${n} kaam baaki`,
  },
  onboarding: {
    profileTitle: "Apne business ke baare mein batayein",
    profileLead: "Yeh details quotation, invoice aur baaki documents mein bharenge.",
    address: "Business ka pata",
    gstin: "GSTIN",
    phone: "Business phone",
    email: "Business email",
    continue: "Aage badhein",
    skip: "Abhi rehne dein",
    step: (n, of) => `Step ${n} / ${of}`,
  },
  today: {
    alsoNeedsYou: "Yeh bhi aapka intezaar kar rahe hain",
    approvalsWaiting: (n) => `${n} manzoori baaki`,
    leaveWaiting: (n) => `${n} chhutti ki arzi`,
    unreadConversations: (n) => `${n} baat-cheet unread`,
    punchedIn: (time) => `${time} par punch in`,
    notPunchedIn: "Aaj punch in nahi kiya",
    activeProjects: "Chal rahe projects",
    recentDocuments: "Naye documents",
  },
  conversations: {
    newGroup: "Naya group",
    groupName: "Group ka naam",
    choosePeople: "Group mein kaun hai?",
    createGroup: "Group banayein",
    attach: "File jodein",
    sharedFile: (name) => `${name} share kiya`,
    direct: "Seedhi baat",
  },
};

const hi: Phase1Copy = {
  ...hiLatn,
  nav: {
    today: "आज",
    conversations: "बातचीत",
    work: "काम",
    projects: "प्रोजेक्ट",
    documents: "दस्तावेज़",
    attendance: "हाज़िरी",
    approvals: "मंज़ूरी",
    team: "टीम",
    search: "खोजें",
    updates: "ख़बर",
    settings: "सेटिंग",
    more: "और",
  },
  work: {
    ...hiLatn.work,
    title: "काम",
    subtitle: "हर काम का मालिक और समय सीमा।",
    mine: "मेरा",
    team: "टीम",
    pending: "बाकी",
    late: "देर",
    done: "हो गया",
    empty: "अभी यहाँ कुछ नहीं।",
    newTask: "नया काम",
  },
  documents: {
    ...hiLatn.documents,
    title: "दस्तावेज़",
    upload: "अपलोड करें",
    empty: "अभी कोई दस्तावेज़ नहीं",
  },
  approvals: {
    ...hiLatn.approvals,
    title: "मंज़ूरी",
    approve: "मंज़ूर",
    reject: "नामंज़ूर",
  },
  search: { ...hiLatn.search, title: "खोजें" },
};

const COPY: Record<Locale, Phase1Copy> = { en, "hi-Latn": hiLatn, hi };

export function getPhase1(locale: Locale): Phase1Copy {
  return COPY[locale] ?? en;
}
