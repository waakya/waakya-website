import type { Locale } from "./locales";

/**
 * Copy added by the Design V2 pass. Same house rules as the other
 * dictionaries: no brand name inside a translatable string, Latin digits in
 * every language, no exclamation marks, and a task is done, then verified —
 * never "completed".
 */
export interface DesignCopy {
  today: {
    /** "3 of 5 done" — a person's share of today's work. */
    staffProgress: (done: number, total: number) => string;
    /** The weekly rate before there is anything to measure. */
    rateEmpty: string;
    /** Screen-reader name for the strip of day counters. */
    dayStrip: string;
  };
  thread: {
    /** The quiet per-message action. */
    makeTask: string;
    whatLabel: string;
    whoLabel: string;
    byWhenLabel: string;
    dueToday: string;
    dueTomorrow: string;
    /** "Today, 6 pm" once 6 pm has passed. */
    dueTomorrowEvening: string;
    dueHour: string;
    /** The linked task under a message: "Rahul · In progress". */
    taskFor: (name: string) => string;
    openTask: string;
    today: string;
    yesterday: string;
    people: (n: number) => string;
    latest: string;
    listLabel: string;
    pickConversation: string;
    pickConversationHelp: string;
  };
  task: {
    nextStep: string;
    waitingOn: (name: string) => string;
    nothingToDo: string;
    backToWork: string;
    details: string;
    record: string;
  };
  updates: {
    unread: string;
    earlier: string;
    today: string;
    empty: string;
    emptyHelp: string;
  };
  /** Design V3: attention-first Today and the simpler map. */
  v3: {
    allClear: string;
    allClearHelp: string;
    teamToday: string;
    allWork: string;
    doneToday: string;
    waiting: string;
    upNext: string;
    open: string;
    leaveAsk: (name: string, when: string) => string;
    approvalAsk: (name: string) => string;
    moreLabel: string;
    record: string;
    details: string;
    showRecord: string;
    showLess: string;
    detailsHint: string;
    scopeTeam: string;
    scopeMine: string;
    searchHint: string;
    /** "+12 more" at the foot of a capped group on Today. */
    moreOf: (n: number) => string;
    leaveLabel: string;
    showingOnly: string;
    clearFilter: string;
    finished: string;
    showAll: (n: number) => string;
    manageProject: string;
    seeProof: string;
    doneLate: (d: string) => string;
    inviteFirst: string;
    allTeam: (n: number) => string;
    choosePerson: string;
  };
  /** Visual V2: Today as needs you → stuck → changed → moving normally. */
  today2: {
    needs: (n: number) => string;
    allClear: string;
    stuck: string;
    stuckCount: (n: number) => string;
    stuckEmpty: string;
    changed: string;
    changedCount: (n: number) => string;
    changedEmpty: string;
    moving: string;
    movingCount: (n: number) => string;
    movingLine: (onTime: number, dueToday: number, doneToday: number) => string;
    byPerson: string;
    yesterday: string;
    history: string;
  };
  /** Visual V2: the groups under More, smallest set that still says where things are. */
  navGroups: { sales: string; operations: string; people: string; setup: string };
}

const en: DesignCopy = {
  navGroups: { sales: "Sales", operations: "Operations", people: "People", setup: "Setup" },
  today2: {
    needs: (n) => (n === 1 ? "1 thing needs you." : `${n} things need you.`),
    allClear: "Nothing needs you right now.",
    stuck: "Stuck",
    stuckCount: (n) => `${n} stuck`,
    stuckEmpty: "Nothing is stuck.",
    changed: "Changed since yesterday",
    changedCount: (n) => `${n} changed since yesterday`,
    changedEmpty: "Nothing new since yesterday.",
    moving: "Moving normally",
    movingCount: (n) => `${n} moving on time`,
    movingLine: (a, b, c) => `${a} on time · ${b} due today · ${c} done today`,
    byPerson: "Who is behind",
    yesterday: "yesterday",
    history: "Everything that happened",
  },
  today: {
    staffProgress: (done, total) => `${done} of ${total} done`,
    rateEmpty: "Shows once work is verified this week.",
    dayStrip: "Today",
  },
  thread: {
    makeTask: "Make task",
    whatLabel: "What needs doing",
    whoLabel: "Who owns it",
    byWhenLabel: "By when",
    dueToday: "Today, 6 pm",
    dueTomorrow: "Tomorrow, 10 am",
    dueTomorrowEvening: "Tomorrow, 6 pm",
    dueHour: "In 1 hour",
    taskFor: (name) => `Task for ${name}`,
    openTask: "Open task",
    today: "Today",
    yesterday: "Yesterday",
    people: (n) => (n === 1 ? "1 person" : `${n} people`),
    latest: "Latest messages",
    listLabel: "Conversations",
    pickConversation: "Pick a conversation",
    pickConversationHelp: "Messages, and the work they turn into, open here.",
  },
  task: {
    nextStep: "Next step",
    waitingOn: (name) => `Waiting on ${name}`,
    nothingToDo: "Nothing for you to do right now.",
    backToWork: "Work",
    details: "Details",
    record: "Record",
  },
  updates: {
    unread: "New",
    earlier: "Earlier",
    today: "Today",
    empty: "You are up to date",
    emptyHelp: "When someone sends you work, finishes it, or needs a decision, it shows up here.",
  },
  v3: {
    allClear: "Nothing needs you right now.",
    allClearHelp: "Anything that slips, and every decision that waits on you, shows up here.",
    teamToday: "Your team today",
    allWork: "All work",
    doneToday: "Done today",
    waiting: "Waiting on your team",
    upNext: "Up next",
    open: "Open",
    leaveAsk: (name, when) => `${name} asked for leave · ${when}`,
    approvalAsk: (name) => `${name} asked for approval`,
    moreLabel: "More",
    record: "Record",
    details: "Details",
    showRecord: "Every step, with its time",
    showLess: "Show less",
    detailsHint: "Project and documents",
    scopeTeam: "Team",
    scopeMine: "Mine",
    searchHint: "Search work, people, chats",
    moreOf: (n) => `${n} more`,
    leaveLabel: "Leave",
    showingOnly: "Showing only",
    clearFilter: "Show all work",
    finished: "Finished",
    showAll: (n) => `Show all · ${n}`,
    manageProject: "Manage project",
    seeProof: "See proof",
    doneLate: (d) => `done ${d} late`,
    inviteFirst: "Invite your team",
    allTeam: (n) => `All ${n} people`,
    choosePerson: "Anyone",
  },
};

const hiLatn: DesignCopy = {
  navGroups: { sales: "Sales", operations: "Kaam-kaaj", people: "Log", setup: "Setup" },
  today2: {
    needs: (n) => (n === 1 ? "1 cheez aapka intezaar kar rahi hai." : `${n} cheezein aapka intezaar kar rahi hain.`),
    allClear: "Abhi aapke liye kuch baaki nahi.",
    stuck: "Atka hua",
    stuckCount: (n) => `${n} atke hue`,
    stuckEmpty: "Kuch atka nahi.",
    changed: "Kal se kya badla",
    changedCount: (n) => `kal se ${n} badlaav`,
    changedEmpty: "Kal se kuch naya nahi.",
    moving: "Baaki sab chal raha hai",
    movingCount: (n) => `${n} time par chal rahe`,
    movingLine: (a, b, c) => `${a} time par · aaj ${b} due · aaj ${c} ho gaye`,
    byPerson: "Kaun peeche hai",
    yesterday: "kal",
    history: "Sab kuch jo hua",
  },
  today: {
    staffProgress: (done, total) => `${total} mein ${done} ho gaye`,
    rateEmpty: "Is hafte kaam verify hone par dikhega.",
    dayStrip: "Aaj",
  },
  thread: {
    makeTask: "Kaam banao",
    whatLabel: "Kya karna hai",
    whoLabel: "Kaun karega",
    byWhenLabel: "Kab tak",
    dueToday: "Aaj, 6 pm",
    dueTomorrow: "Kal, 10 am",
    dueTomorrowEvening: "Kal, 6 pm",
    dueHour: "1 ghante mein",
    taskFor: (name) => `${name} ka kaam`,
    openTask: "Kaam kholo",
    today: "Aaj",
    yesterday: "Kal",
    people: (n) => `${n} log`,
    latest: "Naye message",
    listLabel: "Baat-cheet",
    pickConversation: "Koi baat-cheet chuniye",
    pickConversationHelp: "Message, aur unse bana kaam, yahan khulenge.",
  },
  task: {
    nextStep: "Aage kya",
    waitingOn: (name) => `${name} ka intezaar`,
    nothingToDo: "Abhi aapko kuch nahi karna.",
    backToWork: "Kaam",
    details: "Details",
    record: "Record",
  },
  updates: {
    unread: "Naya",
    earlier: "Pehle",
    today: "Aaj",
    empty: "Sab dekh liya",
    emptyHelp: "Jab koi aapko kaam bheje, kaam poora kare, ya faisla chahiye ho, woh yahan dikhega.",
  },
  v3: {
    allClear: "Abhi aapke liye kuch nahi.",
    allClearHelp: "Jo kaam atke, aur jo faisla aapka intezaar kare, woh yahan dikhega.",
    teamToday: "Aaj aapki team",
    allWork: "Saara kaam",
    doneToday: "Aaj ho gaye",
    waiting: "Team par baaki",
    upNext: "Ab yeh",
    open: "Kholo",
    leaveAsk: (name, when) => `${name} ne chhutti maangi · ${when}`,
    approvalAsk: (name) => `${name} ne manzoori maangi`,
    moreLabel: "Aur",
    record: "Record",
    details: "Details",
    showRecord: "Har kadam, samay ke saath",
    showLess: "Kam dikhao",
    detailsHint: "Project aur documents",
    scopeTeam: "Team",
    scopeMine: "Mera",
    searchHint: "Kaam, log, baat-cheet dhoondein",
    moreOf: (n) => `${n} aur`,
    leaveLabel: "Chhutti",
    showingOnly: "Sirf yeh dikh raha hai",
    clearFilter: "Saara kaam dikhayein",
    finished: "Ho gaye",
    showAll: (n) => `Sab dikhayein · ${n}`,
    manageProject: "Project badlein",
    seeProof: "Proof dekhein",
    doneLate: (d) => `${d} der se hua`,
    inviteFirst: "Team ko bulaayein",
    allTeam: (n) => `Saare ${n} log`,
    choosePerson: "Koi bhi",
  },
};

const hi: DesignCopy = {
  navGroups: { sales: "बिक्री", operations: "कामकाज", people: "लोग", setup: "सेटअप" },
  today2: {
    needs: (n) => (n === 1 ? "1 चीज़ आपका इंतज़ार कर रही है।" : `${n} चीज़ें आपका इंतज़ार कर रही हैं।`),
    allClear: "अभी आपके लिए कुछ बाक़ी नहीं।",
    stuck: "अटका हुआ",
    stuckCount: (n) => `${n} अटके हुए`,
    stuckEmpty: "कुछ अटका नहीं।",
    changed: "कल से क्या बदला",
    changedCount: (n) => `कल से ${n} बदलाव`,
    changedEmpty: "कल से कुछ नया नहीं।",
    moving: "बाक़ी सब चल रहा है",
    movingCount: (n) => `${n} समय पर चल रहे`,
    movingLine: (a, b, c) => `${a} समय पर · आज ${b} ड्यू · आज ${c} हो गए`,
    byPerson: "कौन पीछे है",
    yesterday: "कल",
    history: "सब कुछ जो हुआ",
  },
  today: {
    staffProgress: (done, total) => `${total} में ${done} हो गए`,
    rateEmpty: "इस हफ़्ते काम वेरिफ़ाई होने पर दिखेगा।",
    dayStrip: "आज",
  },
  thread: {
    makeTask: "काम बनाओ",
    whatLabel: "क्या करना है",
    whoLabel: "कौन करेगा",
    byWhenLabel: "कब तक",
    dueToday: "आज, 6 pm",
    dueTomorrow: "कल, 10 am",
    dueTomorrowEvening: "कल, 6 pm",
    dueHour: "1 घंटे में",
    taskFor: (name) => `${name} का काम`,
    openTask: "काम खोलें",
    today: "आज",
    yesterday: "कल",
    people: (n) => `${n} लोग`,
    latest: "नए मैसेज",
    listLabel: "बातचीत",
    pickConversation: "कोई बातचीत चुनिए",
    pickConversationHelp: "मैसेज, और उनसे बना काम, यहाँ खुलेंगे।",
  },
  task: {
    nextStep: "आगे क्या",
    waitingOn: (name) => `${name} का इंतज़ार`,
    nothingToDo: "अभी आपको कुछ नहीं करना।",
    backToWork: "काम",
    details: "विवरण",
    record: "रिकॉर्ड",
  },
  updates: {
    unread: "नया",
    earlier: "पहले",
    today: "आज",
    empty: "सब देख लिया",
    emptyHelp: "जब कोई आपको काम भेजे, काम पूरा करे, या फ़ैसला चाहिए हो, वह यहाँ दिखेगा।",
  },
  v3: {
    allClear: "अभी आपके लिए कुछ नहीं।",
    allClearHelp: "जो काम अटके, और जो फ़ैसला आपका इंतज़ार करे, वह यहाँ दिखेगा।",
    teamToday: "आज आपकी टीम",
    allWork: "सारा काम",
    doneToday: "आज हो गए",
    waiting: "टीम पर बाकी",
    upNext: "अब यह",
    open: "खोलें",
    leaveAsk: (name, when) => `${name} ने छुट्टी माँगी · ${when}`,
    approvalAsk: (name) => `${name} ने मंज़ूरी माँगी`,
    moreLabel: "और",
    record: "रिकॉर्ड",
    details: "विवरण",
    showRecord: "हर कदम, समय के साथ",
    showLess: "कम दिखाएँ",
    detailsHint: "प्रोजेक्ट और दस्तावेज़",
    scopeTeam: "टीम",
    scopeMine: "मेरा",
    searchHint: "काम, लोग, बातचीत खोजें",
    moreOf: (n) => `${n} और`,
    leaveLabel: "छुट्टी",
    showingOnly: "सिर्फ़ यह दिख रहा है",
    clearFilter: "सारा काम दिखाएँ",
    finished: "हो गए",
    showAll: (n) => `सब दिखाएँ · ${n}`,
    manageProject: "प्रोजेक्ट बदलें",
    seeProof: "प्रूफ़ देखें",
    doneLate: (d) => `${d} देर से हुआ`,
    inviteFirst: "टीम को बुलाएँ",
    allTeam: (n) => `सारे ${n} लोग`,
    choosePerson: "कोई भी",
  },
};

const COPY: Record<Locale, DesignCopy> = { en, "hi-Latn": hiLatn, hi };

export function getDesign(locale: Locale): DesignCopy {
  return COPY[locale] ?? en;
}
