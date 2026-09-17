import type { Locale } from "./locales";

/**
 * Copy added by the positioning and discoverability pass: the first-run guide,
 * the closed-task record band, contextual entry points to templates and leave,
 * and a few renamed labels.
 *
 * Same rules as the other dictionaries: no brand name inside a translatable
 * string, Latin digits, no exclamation marks, and a task is never "completed"
 * — it is done, then verified.
 */
export interface UxCopy {
  nav: {
    main: string;
    attendance: string;
    leaveHolidays: string;
    templates: string;
    desktopMoreLead: string;
  };
  task: {
    recordVerified: (time: string) => string;
    recordDone: (time: string) => string;
    recordCancelled: string;
    recordLead: string;
    fromConversation: string;
    openConversation: string;
    sendBackTitle: string;
    sendBackHelp: string;
    sendBackReason: string;
    reasonRequired: string;
  };
  thread: {
    makeTask: string;
    linkedWork: string;
  };
  guide: {
    title: string;
    lead: string;
    progress: (done: number, total: number) => string;
    steps: {
      invite: { title: string; body: string; action: string };
      conversation: { title: string; body: string; action: string };
      task: { title: string; body: string; action: string };
      attendance: { title: string; body: string; action: string };
      template: { title: string; body: string; action: string };
    };
    waitingForTeam: string;
    doneLabel: string;
  };
  templates: {
    createFromTemplate: string;
    rowLead: string;
    allTemplates: string;
    linkProject: string;
    linkedTask: string;
  };
  attendance: {
    sectionToday: string;
    sectionLeave: string;
    sectionHolidays: string;
    sectionTeam: string;
    punchedOut: (time: string, worked: string) => string;
    punchedOutChip: string;
    addHalf: string;
    addDay: string;
    colDate: string;
    colIn: string;
    colOut: string;
    colWorked: string;
    pendingCount: (n: number) => string;
  };
  team: {
    title: string;
    people: (n: number) => string;
    invite: string;
    noTeamYet: string;
    noTeamHelp: string;
  };
  today: {
    nothingOpen: string;
    nothingOpenWithDone: (n: number) => string;
    sendWork: string;
    inviteFirst: string;
  };
  newTask: {
    title: string;
  };
  join: {
    signIn: string;
    home: string;
  };
  setup: {
    step: (n: number, of: number) => string;
    asideTitle: string;
    asideSteps: string[];
  };
  login: {
    nextSteps: string[];
  };
  notFound: {
    title: string;
    body: string;
    home: string;
    signIn: string;
  };
}

const en: UxCopy = {
  nav: {
    main: "Main",
    attendance: "Attendance & leave",
    leaveHolidays: "Leave & holidays",
    templates: "Templates",
    desktopMoreLead: "Everything is in the sidebar on the left. On a phone, this page holds what the bottom bar has no room for.",
  },
  task: {
    recordVerified: (time) => `Verified · ${time}`,
    recordDone: (time) => `Done · ${time} · waiting to be verified`,
    recordCancelled: "Cancelled",
    recordLead: "This task is closed. Its full record stays below.",
    fromConversation: "From a conversation",
    openConversation: "Open conversation",
    sendBackTitle: "Send it back?",
    sendBackHelp: "Say what needs to change. It goes on the record and to the person doing the work.",
    sendBackReason: "What needs to change",
    reasonRequired: "Say what needs to change before sending it back.",
  },
  thread: {
    makeTask: "Make task",
    linkedWork: "Task created",
  },
  guide: {
    title: "Get your workspace ready",
    lead: "Five steps, and your business runs from one place.",
    progress: (done, total) => `${done} of ${total} done`,
    steps: {
      invite: {
        title: "Invite your team",
        body: "Everyone joins with a link. Nothing else works until someone is here.",
        action: "Invite",
      },
      conversation: {
        title: "Start a conversation",
        body: "Talk with one person or a whole group, and share files.",
        action: "Open conversations",
      },
      task: {
        title: "Turn a message into a task",
        body: "Give it an owner and a deadline. Proof and verification follow.",
        action: "New task",
      },
      attendance: {
        title: "Punch in, and set up leave",
        body: "Attendance, leave balances and your holiday list in one place.",
        action: "Open attendance",
      },
      template: {
        title: "Make a quotation from a template",
        body: "Ten business templates, filled with your business details.",
        action: "See templates",
      },
    },
    waitingForTeam: "Invite someone first",
    doneLabel: "Done",
  },
  templates: {
    createFromTemplate: "Create from a template",
    rowLead: "Quotation, invoice, work order and more, filled with your business details.",
    allTemplates: "All templates",
    linkProject: "Keep it with a project",
    linkedTask: "It will be attached to the task you came from.",
  },
  attendance: {
    sectionToday: "Today",
    sectionLeave: "Leave",
    sectionHolidays: "Holidays",
    sectionTeam: "Team",
    punchedOut: (time, worked) => `Punched out at ${time} · ${worked}`,
    punchedOutChip: "Punched out",
    addHalf: "Add ½ day",
    addDay: "Add 1 day",
    colDate: "Date",
    colIn: "In",
    colOut: "Out",
    colWorked: "Worked",
    pendingCount: (n) => (n === 1 ? "1 request waiting" : `${n} requests waiting`),
  },
  team: {
    title: "Team",
    people: (n) => (n === 1 ? "1 person" : `${n} people`),
    invite: "Invite to team",
    noTeamYet: "Nobody has joined yet",
    noTeamHelp: "Invite your team first. Conversations, tasks and attendance start working once someone joins.",
  },
  today: {
    nothingOpen: "Nothing open right now",
    nothingOpenWithDone: (n) => (n === 1 ? "Nothing open. 1 task finished today." : `Nothing open. ${n} tasks finished today.`),
    sendWork: "Use New task to send work.",
    inviteFirst: "Invite your team to start sending work.",
  },
  newTask: {
    title: "New task",
  },
  join: {
    signIn: "I already have an account",
    home: "Go to the home page",
  },
  setup: {
    step: (n, of) => `Step ${n} of ${of}`,
    asideTitle: "What happens next",
    asideSteps: [
      "Name your business",
      "Add the details your documents need",
      "Invite your team with a link",
    ],
  },
  login: {
    nextSteps: ["Sign in", "Name your business", "Invite your team with a link"],
  },
  notFound: {
    title: "This page does not exist",
    body: "The link may be old or mistyped.",
    home: "Go to the home page",
    signIn: "Sign in",
  },
};

const hiLatn: UxCopy = {
  nav: {
    main: "Main",
    attendance: "Hazri aur chhutti",
    leaveHolidays: "Chhutti aur holiday",
    templates: "Templates",
    desktopMoreLead: "Sab kuch baayi taraf sidebar mein hai. Phone par yeh page woh sab rakhta hai jo neeche ki bar mein nahi aata.",
  },
  task: {
    recordVerified: (time) => `Verified · ${time}`,
    recordDone: (time) => `Ho gaya · ${time} · verify baaki`,
    recordCancelled: "Cancel hua",
    recordLead: "Yeh kaam band ho gaya. Poora record neeche hai.",
    fromConversation: "Baat-cheet se bana",
    openConversation: "Baat-cheet kholein",
    sendBackTitle: "Wapas bhejein?",
    sendBackHelp: "Batayein kya badalna hai. Yeh record mein aur kaam karne wale tak jayega.",
    sendBackReason: "Kya badalna hai",
    reasonRequired: "Wapas bhejne se pehle batayein kya badalna hai.",
  },
  thread: {
    makeTask: "Kaam banao",
    linkedWork: "Kaam bana",
  },
  guide: {
    title: "Apna workspace taiyaar karein",
    lead: "Paanch kadam, aur aapka business ek jagah se chalega.",
    progress: (done, total) => `${total} mein se ${done} ho gaye`,
    steps: {
      invite: {
        title: "Team ko bulaayein",
        body: "Sab ek link se judte hain. Kisi ke aaye bina kuch nahi chalta.",
        action: "Bulaayein",
      },
      conversation: {
        title: "Baat-cheet shuru karein",
        body: "Ek insaan ya poore group se baat karein, files bhejein.",
        action: "Baat-cheet kholein",
      },
      task: {
        title: "Message ko kaam banayein",
        body: "Kaam ka maalik aur deadline tay karein. Proof aur verify saath aate hain.",
        action: "Naya kaam",
      },
      attendance: {
        title: "Punch in karein, chhutti set karein",
        body: "Hazri, chhutti ka balance aur holiday list ek jagah.",
        action: "Hazri kholein",
      },
      template: {
        title: "Template se quotation banayein",
        body: "Das business templates, aapke business ki details ke saath.",
        action: "Templates dekhein",
      },
    },
    waitingForTeam: "Pehle kisi ko bulaayein",
    doneLabel: "Ho gaya",
  },
  templates: {
    createFromTemplate: "Template se banayein",
    rowLead: "Quotation, invoice, work order aur baaki, aapke business ki details ke saath.",
    allTemplates: "Saare templates",
    linkProject: "Kisi project ke saath rakhein",
    linkedTask: "Yeh us kaam ke saath jud jayega jahan se aap aaye.",
  },
  attendance: {
    sectionToday: "Aaj",
    sectionLeave: "Chhutti",
    sectionHolidays: "Holiday",
    sectionTeam: "Team",
    punchedOut: (time, worked) => `${time} par punch out · ${worked}`,
    punchedOutChip: "Punch out",
    addHalf: "½ din jodein",
    addDay: "1 din jodein",
    colDate: "Tareekh",
    colIn: "In",
    colOut: "Out",
    colWorked: "Kaam",
    pendingCount: (n) => `${n} request baaki`,
  },
  team: {
    title: "Team",
    people: (n) => `${n} log`,
    invite: "Team mein bulaayein",
    noTeamYet: "Abhi koi nahi juda",
    noTeamHelp: "Pehle team ko bulaayein. Kisi ke judte hi baat-cheet, kaam aur hazri chalne lagte hain.",
  },
  today: {
    nothingOpen: "Abhi koi kaam baaki nahi",
    nothingOpenWithDone: (n) => `Koi kaam baaki nahi. Aaj ${n} ho gaye.`,
    sendWork: "Naya kaam se kaam bhejein.",
    inviteFirst: "Kaam bhejne ke liye team ko bulaayein.",
  },
  newTask: {
    title: "Naya kaam",
  },
  join: {
    signIn: "Mera account pehle se hai",
    home: "Home page par jaayein",
  },
  setup: {
    step: (n, of) => `Step ${n} / ${of}`,
    asideTitle: "Aage kya hoga",
    asideSteps: [
      "Business ka naam",
      "Documents ke liye details",
      "Link se team ko bulaayein",
    ],
  },
  login: {
    nextSteps: ["Sign in karein", "Business ka naam", "Link se team bulaayein"],
  },
  notFound: {
    title: "Yeh page nahi mila",
    body: "Link purana ya galat ho sakta hai.",
    home: "Home page par jaayein",
    signIn: "Sign in",
  },
};

const hi: UxCopy = {
  ...hiLatn,
  nav: {
    ...hiLatn.nav,
    main: "मुख्य",
    attendance: "हाज़िरी और छुट्टी",
    leaveHolidays: "छुट्टी और हॉलिडे",
    templates: "टेम्पलेट",
  },
  task: {
    ...hiLatn.task,
    recordCancelled: "कैंसल हुआ",
    fromConversation: "बातचीत से बना",
    openConversation: "बातचीत खोलें",
  },
  thread: { makeTask: "काम बनाओ", linkedWork: "काम बना" },
  guide: {
    ...hiLatn.guide,
    title: "अपना वर्कस्पेस तैयार करें",
  },
  templates: {
    ...hiLatn.templates,
    createFromTemplate: "टेम्पलेट से बनाएँ",
    allTemplates: "सारे टेम्पलेट",
  },
  team: { ...hiLatn.team, title: "टीम", invite: "टीम में बुलाएँ" },
  newTask: { title: "नया काम" },
  notFound: { ...hiLatn.notFound, title: "यह पेज नहीं मिला" },
};

const COPY: Record<Locale, UxCopy> = { en, "hi-Latn": hiLatn, hi };

export function getUx(locale: Locale): UxCopy {
  return COPY[locale] ?? en;
}
