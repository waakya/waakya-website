import type { Locale } from "./locales";

/**
 * Copy for the customer experience: the customer's own page, and the panel
 * the business uses to run it. Same rules as every dictionary.
 */
export interface PortalCopy {
  portal: {
    title: string;
    yourProjects: string;
    noProjects: string;
    noProjectsHelp: string;
    signOut: string;
    progress: (pct: number) => string;
    onTrack: string;
    latestUpdate: string;
    nextMilestone: string;
    needsYou: string;
    decided: (option: string) => string;
    choose: string;
    yourChoice: string;
    noteOptional: string;
    confirm: string;
    photos: string;
    documents: string;
    records: string;
    milestones: string;
    updates: string;
    messages: string;
    writeToUs: string;
    send: string;
    you: string;
    business: string;
    nothingYet: string;
    allDone: string;
    nothingNeedsYou: string;
    open: string;
    done: string;
    planned: string;
    inProgress: string;
    invite: { title: string; help: string; accept: string; wrongAccount: string; used: string; notFound: string; signInFirst: string };
    errors: { notYours: string; closed: string; badOption: string; generic: string; empty: string };
  };
  business: {
    customer: string;
    noCustomer: string;
    setCustomer: string;
    access: string;
    noAccess: string;
    inviteLink: string;
    grantAccess: string;
    revoke: string;
    active: string;
    invited: string;
    revoked: string;
    copyLink: string;
    copied: string;
    milestones: string;
    addMilestone: string;
    milestoneName: string;
    dueDate: string;
    markDone: string;
    reopen: string;
    remove: string;
    visibleToCustomer: string;
    internalOnly: string;
    updates: string;
    publishUpdate: string;
    updateBody: string;
    publish: string;
    saveInternal: string;
    decisions: string;
    askCustomer: string;
    decisionTitle: string;
    decisionDetail: string;
    options: string;
    optionsHint: string;
    blocksTask: string;
    blocksRecord: string;
    unblockStatus: string;
    noBlock: string;
    request: string;
    cancel: string;
    waiting: string;
    chosen: (option: string) => string;
    cancelled: string;
    messages: string;
    reply: string;
    noMessages: string;
    markRead: string;
    proofVisible: string;
    docVisible: string;
    summary: string;
    summaryHint: string;
    save: string;
    errors: { notAllowed: string; moduleOff: string; badInput: string; noContact: string; noEmail: string; generic: string; notFound: string };
  };
}

const copy: Record<Locale, PortalCopy> = {
  hi: {
    portal: {
      title: "आपका प्रोजेक्ट", yourProjects: "आपके प्रोजेक्ट", noProjects: "अभी कोई प्रोजेक्ट नहीं", noProjectsHelp: "जब कारोबार आपको जोड़ेगा, यहाँ दिखेगा।", signOut: "साइन आउट",
      progress: (p) => `${p}% पूरा`, onTrack: "चल रहा है", latestUpdate: "ताज़ा अपडेट", nextMilestone: "अगला पड़ाव", needsYou: "आपसे चाहिए", decided: (o) => `आपने चुना: ${o}`, choose: "चुनें", yourChoice: "आपकी पसंद", noteOptional: "कुछ कहना है (वैकल्पिक)", confirm: "पक्का करें",
      photos: "साइट की तस्वीरें", documents: "दस्तावेज़", records: "काम की सूची", milestones: "पड़ाव", updates: "अपडेट", messages: "बातचीत", writeToUs: "हमें लिखें", send: "भेजें", you: "आप", business: "टीम", nothingYet: "अभी कुछ नहीं", allDone: "सब हो गया", nothingNeedsYou: "अभी आपसे कुछ नहीं चाहिए।",
      open: "बाकी", done: "हो गया", planned: "तय", inProgress: "चल रहा",
      invite: { title: "आपका प्रोजेक्ट पेज", help: "साइन इन करें और अपना प्रोजेक्ट देखें।", accept: "प्रोजेक्ट खोलें", wrongAccount: "उसी ईमेल से साइन इन करें जिस पर यह लिंक आया।", used: "यह लिंक किसी और ने इस्तेमाल किया।", notFound: "यह लिंक नहीं मिला।", signInFirst: "पहले साइन इन करें" },
      errors: { notYours: "यह आपका प्रोजेक्ट नहीं है।", closed: "यह फ़ैसला पहले हो चुका है। पेज ताज़ा करें।", badOption: "यह विकल्प नहीं है।", generic: "नहीं हुआ। फिर कोशिश करें।", empty: "पहले कुछ लिखें।" },
    },
    business: {
      customer: "ग्राहक", noCustomer: "कोई ग्राहक जुड़ा नहीं", setCustomer: "ग्राहक चुनें", access: "पोर्टल एक्सेस", noAccess: "ग्राहक को अभी पोर्टल नहीं मिला", inviteLink: "न्योता लिंक", grantAccess: "पोर्टल दें", revoke: "एक्सेस हटाएँ", active: "चालू", invited: "न्योता भेजा", revoked: "हटाया", copyLink: "लिंक कॉपी करें", copied: "कॉपी हो गया",
      milestones: "पड़ाव", addMilestone: "पड़ाव जोड़ें", milestoneName: "पड़ाव का नाम", dueDate: "कब तक", markDone: "हो गया", reopen: "फिर खोलें", remove: "हटाएँ", visibleToCustomer: "ग्राहक देखे", internalOnly: "सिर्फ़ अंदर",
      updates: "अपडेट", publishUpdate: "अपडेट लिखें", updateBody: "क्या हुआ", publish: "ग्राहक को दिखाएँ", saveInternal: "सिर्फ़ अंदर रखें",
      decisions: "ग्राहक के फ़ैसले", askCustomer: "ग्राहक से पूछें", decisionTitle: "क्या चुनना है", decisionDetail: "थोड़ा और (वैकल्पिक)", options: "विकल्प", optionsHint: "कॉमा से अलग करें, जैसे: Walnut, Oak, Teak", blocksTask: "यह काम रुका है", blocksRecord: "यह रिकॉर्ड रुका है", unblockStatus: "फ़ैसले के बाद स्टेटस", noBlock: "कुछ नहीं", request: "पूछें", cancel: "रद्द करें", waiting: "ग्राहक का इंतज़ार", chosen: (o) => `चुना: ${o}`, cancelled: "रद्द",
      messages: "ग्राहक की बातचीत", reply: "जवाब दें", noMessages: "अभी कोई संदेश नहीं", markRead: "पढ़ लिया", proofVisible: "ग्राहक को दिखाएँ", docVisible: "ग्राहक को दिखाएँ", summary: "ग्राहक के लिए एक लाइन", summaryHint: "जो ग्राहक अपने पेज पर सबसे ऊपर देखे", save: "सेव करें",
      errors: { notAllowed: "यह आप नहीं कर सकते।", moduleOff: "ग्राहक पोर्टल इस कारोबार में चालू नहीं है।", badInput: "कुछ जानकारी सही नहीं है।", noContact: "पहले प्रोजेक्ट का ग्राहक चुनें।", noEmail: "ग्राहक का ईमेल चाहिए ताकि वे साइन इन कर सकें।", generic: "नहीं हुआ। फिर कोशिश करें।", notFound: "नहीं मिला।" },
    },
  },
  "hi-Latn": {
    portal: {
      title: "Aapka project", yourProjects: "Aapke projects", noProjects: "Abhi koi project nahi", noProjectsHelp: "Jab business aapko jodega, yahan dikhega.", signOut: "Sign out",
      progress: (p) => `${p}% poora`, onTrack: "Chal raha hai", latestUpdate: "Taaza update", nextMilestone: "Agla milestone", needsYou: "Aapse chahiye", decided: (o) => `Aapne chuna: ${o}`, choose: "Chunein", yourChoice: "Aapki pasand", noteOptional: "Kuch kehna hai (optional)", confirm: "Pakka karein",
      photos: "Site ki photos", documents: "Documents", records: "Kaam ki list", milestones: "Milestones", updates: "Updates", messages: "Baat-cheet", writeToUs: "Humein likhein", send: "Bhejein", you: "Aap", business: "Team", nothingYet: "Abhi kuch nahi", allDone: "Sab ho gaya", nothingNeedsYou: "Abhi aapse kuch nahi chahiye.",
      open: "Baaki", done: "Ho gaya", planned: "Tay", inProgress: "Chal raha",
      invite: { title: "Aapka project page", help: "Sign in karein aur apna project dekhein.", accept: "Project kholein", wrongAccount: "Usi email se sign in karein jis par yeh link aaya.", used: "Yeh link kisi aur ne istemaal kiya.", notFound: "Yeh link nahi mila.", signInFirst: "Pehle sign in karein" },
      errors: { notYours: "Yeh aapka project nahi hai.", closed: "Yeh faisla pehle ho chuka hai. Page refresh karein.", badOption: "Yeh option nahi hai.", generic: "Nahi hua. Phir koshish karein.", empty: "Pehle kuch likhein." },
    },
    business: {
      customer: "Customer", noCustomer: "Koi customer juda nahi", setCustomer: "Customer chunein", access: "Portal access", noAccess: "Customer ko abhi portal nahi mila", inviteLink: "Invite link", grantAccess: "Portal dein", revoke: "Access hatayein", active: "Chalu", invited: "Invite bheja", revoked: "Hataya", copyLink: "Link copy karein", copied: "Copy ho gaya",
      milestones: "Milestones", addMilestone: "Milestone jodein", milestoneName: "Milestone ka naam", dueDate: "Kab tak", markDone: "Ho gaya", reopen: "Phir kholein", remove: "Hatayein", visibleToCustomer: "Customer dekhe", internalOnly: "Sirf andar",
      updates: "Updates", publishUpdate: "Update likhein", updateBody: "Kya hua", publish: "Customer ko dikhayein", saveInternal: "Sirf andar rakhein",
      decisions: "Customer ke faisle", askCustomer: "Customer se poochein", decisionTitle: "Kya chunna hai", decisionDetail: "Thoda aur (optional)", options: "Options", optionsHint: "Comma se alag karein, jaise: Walnut, Oak, Teak", blocksTask: "Yeh kaam ruka hai", blocksRecord: "Yeh record ruka hai", unblockStatus: "Faisle ke baad status", noBlock: "Kuch nahi", request: "Poochein", cancel: "Radd karein", waiting: "Customer ka intezaar", chosen: (o) => `Chuna: ${o}`, cancelled: "Radd",
      messages: "Customer ki baat-cheet", reply: "Jawab dein", noMessages: "Abhi koi message nahi", markRead: "Padh liya", proofVisible: "Customer ko dikhayein", docVisible: "Customer ko dikhayein", summary: "Customer ke liye ek line", summaryHint: "Jo customer apne page par sabse upar dekhe", save: "Save karein",
      errors: { notAllowed: "Yeh aap nahi kar sakte.", moduleOff: "Customer portal is business mein chalu nahi hai.", badInput: "Kuch jaankari sahi nahi hai.", noContact: "Pehle project ka customer chunein.", noEmail: "Customer ka email chahiye taaki woh sign in kar sake.", generic: "Nahi hua. Phir koshish karein.", notFound: "Nahi mila." },
    },
  },
  en: {
    portal: {
      title: "Your project", yourProjects: "Your projects", noProjects: "No projects yet", noProjectsHelp: "When the business adds you, it appears here.", signOut: "Sign out",
      progress: (p) => `${p}% complete`, onTrack: "In progress", latestUpdate: "Latest update", nextMilestone: "Next milestone", needsYou: "Needs you", decided: (o) => `You chose ${o}`, choose: "Choose", yourChoice: "Your choice", noteOptional: "Anything to add (optional)", confirm: "Confirm",
      photos: "Site photos", documents: "Documents", records: "Work list", milestones: "Milestones", updates: "Updates", messages: "Messages", writeToUs: "Write to us", send: "Send", you: "You", business: "Team", nothingYet: "Nothing yet", allDone: "All done", nothingNeedsYou: "Nothing needs you right now.",
      open: "Open", done: "Done", planned: "Planned", inProgress: "In progress",
      invite: { title: "Your project page", help: "Sign in to see your project.", accept: "Open my project", wrongAccount: "Sign in with the email this link was sent to.", used: "This link was used by someone else.", notFound: "This link was not found.", signInFirst: "Sign in first" },
      errors: { notYours: "This project is not yours.", closed: "This was already decided. Refresh the page.", badOption: "That option is not offered.", generic: "That did not go through. Try again.", empty: "Write something first." },
    },
    business: {
      customer: "Customer", noCustomer: "No customer linked", setCustomer: "Choose customer", access: "Portal access", noAccess: "The customer has no portal access yet", inviteLink: "Invite link", grantAccess: "Give portal access", revoke: "Revoke access", active: "Active", invited: "Invited", revoked: "Revoked", copyLink: "Copy link", copied: "Copied",
      milestones: "Milestones", addMilestone: "Add milestone", milestoneName: "Milestone name", dueDate: "Due", markDone: "Mark done", reopen: "Reopen", remove: "Remove", visibleToCustomer: "Customer can see", internalOnly: "Internal only",
      updates: "Updates", publishUpdate: "Write an update", updateBody: "What happened", publish: "Show the customer", saveInternal: "Keep internal",
      decisions: "Customer decisions", askCustomer: "Ask the customer", decisionTitle: "What to choose", decisionDetail: "A little more (optional)", options: "Options", optionsHint: "Separate with commas, for example: Walnut, Oak, Teak", blocksTask: "Blocks this task", blocksRecord: "Blocks this record", unblockStatus: "Status once decided", noBlock: "Nothing", request: "Ask", cancel: "Cancel", waiting: "Waiting on the customer", chosen: (o) => `Chose ${o}`, cancelled: "Cancelled",
      messages: "Customer messages", reply: "Reply", noMessages: "No messages yet", markRead: "Mark read", proofVisible: "Show the customer", docVisible: "Show the customer", summary: "One line for the customer", summaryHint: "What the customer reads at the top of their page", save: "Save",
      errors: { notAllowed: "You cannot do that.", moduleOff: "The customer portal is not switched on for this business.", badInput: "Some of that is not right.", noContact: "Choose the project's customer first.", noEmail: "The customer needs an email so they can sign in.", generic: "That did not go through. Try again.", notFound: "Not found." },
    },
  },
};

export function getPortal(locale: Locale): PortalCopy {
  return copy[locale];
}
