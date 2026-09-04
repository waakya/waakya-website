// The Vaakya copy sheet. Character document §2.4 fixes the vocabulary:
// Bolo, Dekh liya, Ho jayega, Ho gaya, Aapke liye, Verify, Late. Copy uses
// those words and does not invent synonyms — a task is never "completed",
// "closed" or "resolved"; it is *ho gaya* and then *verified*.
//
// Voice: the good munshi (§2.5). Names before verbs, no exclamation marks,
// no emoji, and the word "AI" appears nowhere.
import type { Locale } from "./locales";

/**
 * Every string the UI can render. Declared as an interface so all three
 * dictionaries are checked against the same shape — a missing key is a
 * type error, not a runtime blank.
 */
export interface Dictionary {
  /** The five states the ticks glyph reports (Character doc §2.1). */
  ticks: {
    sent: string;
    seen: string;
    accepted: string;
    done: string;
    verified: string;
  };
  /** The six stepper steps (Design Direction §5.3). */
  stepper: {
    bheja: string;
    dekha: string;
    maana: string;
    chalRaha: string;
    hoGaya: string;
    verified: string;
  };
  /** Exception and fact chips (§3.3). Always a word plus an icon. */
  chips: {
    dekhaNahi: string;
    late: string;
    lateBy: (text: string) => string;
    urgent: string;
    dikkat: string;
    samayMaanga: string;
    photoChahiye: string;
    verifyBaaki: string;
    cancelled: string;
    escalated: string;
    reassigned: string;
    naya: string;
  };
  /** Verbs on buttons — one to three words, in the reader's script. */
  actions: {
    bhejo: string;
    call: string;
    yaadDilao: string;
    kisiAurKo: string;
    samayBadlo: string;
    cancel: string;
    verify: string;
    dekhein: string;
    dekhLiyaHoJayega: string;
    baadMein: string;
    nahiHoPayega: string;
    shuruKiya: string;
    hoGaya: string;
    back: string;
    save: string;
    close: string;
    retry: string;
    undo: string;
    photoLein: string;
    awaazMeinBataayein: string;
    likhein: string;
    bhejenHoGaya: string;
  };
  /** Clock and time words. */
  time: {
    baaki: (text: string) => string;
    tak: (text: string) => string;
    aaj: string;
    kal: string;
    minShort: string;
    hourShort: string;
    dayShort: string;
    ackClock: string;
    completionClock: string;
    percentGaya: (pct: number) => string;
    reminderAt: (text: string) => string;
    metIn: (text: string) => string;
  };
  /** Priority levels. */
  priority: {
    low: string;
    normal: string;
    high: string;
    urgent: string;
  };
  /** Creating a task, and the Confirm card. */
  create: {
    newTask: string;
    confirmTitle: string;
    kisko: string;
    kya: string;
    kabTak: string;
    priorityLabel: string;
    proof: string;
    proofOn: string;
    proofOff: string;
    note: string;
    notePlaceholder: string;
    titlePlaceholder: string;
    detailsPlaceholder: string;
    choosePerson: string;
    chooseTime: string;
    customTime: string;
    todayEvening: string;
    oneHour: string;
    tomorrowMorning: string;
    ackLabel: string;
    ackHelp: string;
    sent: (name: string) => string;
    notChosen: string;
  };
  /** The task lists. */
  lists: {
    /** The staff screen's own title. */
    mereKaam: string;
    /** The owner's inbox section — work that needs a decision. */
    aapkeLiye: string;
    aajHeading: string;
    naya: string;
    late: string;
    checklist: string;
    hoGayaSection: string;
    nothingToday: string;
    allDone: string;
    noTasks: string;
    noTasksHelp: string;
    bheje: string;
    dekhe: string;
    hoGaye: string;
    verifiedCount: string;
    completionRate: string;
  };
  /** Org setup, the team screen and the invite flow. */
  org: {
    setupTitle: string;
    setupSubtitle: string;
    businessName: string;
    businessNamePlaceholder: string;
    languageLabel: string;
    createBusiness: string;
    teamTitle: string;
    teamSubtitle: (count: number) => string;
    invite: string;
    inviteTitle: string;
    inviteSubtitle: string;
    staffName: string;
    staffNamePlaceholder: string;
    staffPhone: string;
    staffPhonePlaceholder: string;
    roleLabel: string;
    makeInvite: string;
    linkReady: string;
    linkHelp: string;
    copyLink: string;
    copied: string;
    share: string;
    pendingInvites: string;
    you: string;
    noStaffYet: string;
    noStaffHelp: string;
    removeInvite: string;
    joinTitle: (org: string) => string;
    joinSubtitle: (name: string) => string;
    joinAccept: string;
    joinUsed: string;
    joinNotFound: string;
    joinSignIn: string;
    roles: { owner: string; admin: string; manager: string; member: string };
  };
  /** Settings and the bottom nav. */
  settings: {
    title: string;
    language: string;
    business: string;
    account: string;
  };
  nav: {
    aaj: string;
    hafta: string;
    staff: string;
    settings: string;
    pehle: string;
  };
  /** The login screen. */
  auth: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    consentPrefix: string;
    privacyPolicy: string;
    consentSuffix: string;
    sendOtp: string;
    codeTitle: string;
    codeSubtitle: (email: string) => string;
    verify: string;
    resend: string;
    changeEmail: string;
    staffHint: string;
    signOut: string;
  };
  /** Shared UI furniture. */
  common: {
    appName: string;
    tagline: string;
    loading: string;
    nothingHere: string;
    somethingWentWrong: string;
    tryAgain: string;
    language: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  hi: {
    ticks: {
      sent: "भेजा",
      seen: "देख लिया",
      accepted: "हो जाएगा",
      done: "हो गया",
      verified: "वेरिफ़ाई",
    },
    stepper: {
      bheja: "भेजा",
      dekha: "देखा",
      maana: "माना",
      chalRaha: "चल रहा",
      hoGaya: "हो गया",
      verified: "वेरिफ़ाई",
    },
    chips: {
      dekhaNahi: "देखा नहीं",
      late: "लेट",
      lateBy: (text) => `${text} लेट`,
      urgent: "अर्जेंट",
      dikkat: "दिक्कत",
      samayMaanga: "समय माँगा",
      photoChahiye: "फ़ोटो चाहिए",
      verifyBaaki: "वेरिफ़ाई बाकी",
      cancelled: "कैंसिल",
      escalated: "आप तक आया",
      reassigned: "किसी और को",
      naya: "नया",
    },
    actions: {
      bhejo: "भेजो",
      call: "कॉल",
      yaadDilao: "याद दिलाओ",
      kisiAurKo: "किसी और को",
      samayBadlo: "समय बदलो",
      cancel: "कैंसिल",
      verify: "वेरिफ़ाई",
      dekhein: "देखें",
      dekhLiyaHoJayega: "देख लिया, हो जाएगा",
      baadMein: "बाद में",
      nahiHoPayega: "नहीं हो पाएगा",
      shuruKiya: "शुरू किया",
      hoGaya: "हो गया",
      back: "वापस",
      save: "सेव",
      close: "बंद करें",
      retry: "फिर से भेजें",
      undo: "वापस लें",
      photoLein: "फ़ोटो लें",
      awaazMeinBataayein: "आवाज़ में बताएँ",
      likhein: "लिखें",
      bhejenHoGaya: "भेजें · हो गया",
    },
    time: {
      baaki: (text) => `${text} बाकी`,
      tak: (text) => `${text} तक`,
      aaj: "आज",
      kal: "कल",
      minShort: "मिनट",
      hourShort: "घंटे",
      dayShort: "दिन",
      ackClock: "देखना",
      completionClock: "खत्म करना",
      percentGaya: (pct) => `${pct}% गया`,
      reminderAt: (text) => `रिमाइंडर ${text}`,
      metIn: (text) => `देखा ${text} में`,
    },
    priority: { low: "कम", normal: "नॉर्मल", high: "ज़रूरी", urgent: "अर्जेंट" },
    create: {
      newTask: "नया काम",
      confirmTitle: "यह भेजें?",
      kisko: "किसको",
      kya: "क्या",
      kabTak: "कब तक",
      priorityLabel: "ज़रूरी",
      proof: "प्रूफ़",
      proofOn: "फ़ोटो चाहिए",
      proofOff: "ज़रूरत नहीं",
      note: "नोट",
      notePlaceholder: "जैसे: क्लाइंट कल आ रहा है",
      titlePlaceholder: "जैसे: सेक्टर 62 की फ़ोटो",
      detailsPlaceholder: "और कुछ बताना हो तो लिखिए",
      choosePerson: "किसको भेजना है?",
      chooseTime: "कब तक?",
      customTime: "समय चुनें",
      todayEvening: "आज",
      oneHour: "1 घंटा",
      tomorrowMorning: "कल सुबह",
      ackLabel: "देखने का समय",
      ackHelp: "{n} मिनट में न देखा तो आपको बताएँगे।",
      sent: (name) => `${name} को भेज दिया`,
      notChosen: "चुनें",
    },
    lists: {
      mereKaam: "मेरे काम",
      aapkeLiye: "आपके लिए",
      aajHeading: "आज",
      naya: "नया",
      late: "लेट",
      checklist: "चेकलिस्ट",
      hoGayaSection: "हो गया",
      nothingToday: "आज का सब हो गया",
      allDone: "बढ़िया",
      noTasks: "अभी कोई काम नहीं",
      noTasksHelp: "नया काम भेजने के लिए नीचे दबाइए।",
      bheje: "भेजे",
      dekhe: "देखे",
      hoGaye: "हो गए",
      verifiedCount: "वेरिफ़ाई",
      completionRate: "काम पूरा",
    },
    org: {
      setupTitle: "अपना बिज़नेस बनाएँ",
      setupSubtitle: "नाम डालिए। स्टाफ़ को बाद में बुला सकते हैं।",
      businessName: "बिज़नेस का नाम",
      businessNamePlaceholder: "जैसे: राकेश प्रॉपर्टीज़",
      languageLabel: "स्टाफ़ की भाषा",
      createBusiness: "बिज़नेस बनाओ",
      teamTitle: "स्टाफ़",
      teamSubtitle: (count) => `${count} लोग`,
      invite: "स्टाफ़ बुलाओ",
      inviteTitle: "स्टाफ़ बुलाओ",
      inviteSubtitle: "नाम और नंबर डालिए। लिंक आप भेजेंगे।",
      staffName: "नाम",
      staffNamePlaceholder: "जैसे: राजू",
      staffPhone: "फ़ोन नंबर",
      staffPhonePlaceholder: "98765 43210",
      roleLabel: "काम",
      makeInvite: "लिंक बनाओ",
      linkReady: "लिंक तैयार है",
      linkHelp: "यह लिंक अपने स्टाफ़ को WhatsApp पे भेजिए।",
      copyLink: "लिंक कॉपी करो",
      copied: "कॉपी हो गया",
      share: "भेजो",
      pendingInvites: "बुलावा भेजा है",
      you: "आप",
      noStaffYet: "अभी कोई स्टाफ़ नहीं",
      noStaffHelp: "पहले स्टाफ़ को बुलाइए, फिर काम भेजिए।",
      removeInvite: "हटाओ",
      joinTitle: (org) => `${org} में आपको बुलाया गया है`,
      joinSubtitle: (name) => `${name} के नाम से।`,
      joinAccept: "जुड़ जाओ",
      joinUsed: "यह लिंक पहले इस्तेमाल हो चुका है। मालिक से नया लिंक माँगें।",
      joinNotFound: "यह लिंक अब काम नहीं करता। मालिक से नया लिंक माँगें।",
      joinSignIn: "जुड़ने के लिए पहले साइन इन करें",
      roles: { owner: "मालिक", admin: "एडमिन", manager: "मैनेजर", member: "स्टाफ़" },
    },
    settings: {
      title: "सेटिंग",
      language: "भाषा",
      business: "बिज़नेस",
      account: "अकाउंट",
    },
    nav: { aaj: "आज", hafta: "हफ़्ता", staff: "स्टाफ़", settings: "सेटिंग", pehle: "पहले के काम" },
    auth: {
      title: "अपना ईमेल डालें",
      subtitle: "OTP इसी ईमेल पे आएगा।",
      emailLabel: "ईमेल",
      emailPlaceholder: "naam@example.com",
      consentPrefix: "मैं वाक्य की ",
      privacyPolicy: "प्राइवेसी पॉलिसी",
      consentSuffix: " से सहमत हूँ।",
      sendOtp: "OTP भेजो",
      codeTitle: "6 अंकों का कोड डालें",
      codeSubtitle: (email) => `कोड ${email} पे भेजा है।`,
      verify: "आगे बढ़ें",
      resend: "फिर से भेजें",
      changeEmail: "ईमेल बदलें",
      staffHint: "स्टाफ़ को मालिक का भेजा हुआ लिंक चाहिए",
      signOut: "साइन आउट",
    },
    common: {
      appName: "वाक्य",
      tagline: "बोलो। हो जाएगा।",
      loading: "खुल रहा है",
      nothingHere: "यहाँ कुछ नहीं है",
      somethingWentWrong: "नहीं हो पाया",
      tryAgain: "फिर से कोशिश करें",
      language: "भाषा",
    },
  },

  "hi-Latn": {
    ticks: {
      sent: "Bheja",
      seen: "Dekh liya",
      accepted: "Ho jayega",
      done: "Ho gaya",
      verified: "Verified",
    },
    stepper: {
      bheja: "Bheja",
      dekha: "Dekha",
      maana: "Maana",
      chalRaha: "Chal raha",
      hoGaya: "Ho gaya",
      verified: "Verified",
    },
    chips: {
      dekhaNahi: "Dekha nahi",
      late: "Late",
      lateBy: (text) => `Late ${text}`,
      urgent: "Urgent",
      dikkat: "Dikkat",
      samayMaanga: "Samay maanga",
      photoChahiye: "Photo chahiye",
      verifyBaaki: "Verify baaki",
      cancelled: "Cancelled",
      escalated: "Aap tak aaya",
      reassigned: "Kisi aur ko",
      naya: "Naya",
    },
    actions: {
      bhejo: "Bhejo",
      call: "Call",
      yaadDilao: "Yaad dilao",
      kisiAurKo: "Kisi aur ko",
      samayBadlo: "Samay badlo",
      cancel: "Cancel",
      verify: "Verify",
      dekhein: "Dekhein",
      dekhLiyaHoJayega: "Dekh liya, ho jayega",
      baadMein: "Baad mein",
      nahiHoPayega: "Nahi ho payega",
      shuruKiya: "Shuru kiya",
      hoGaya: "Ho gaya",
      back: "Wapas",
      save: "Save",
      close: "Band karein",
      retry: "Phir se bhejein",
      undo: "Wapas lein",
      photoLein: "Photo lein",
      awaazMeinBataayein: "Awaaz mein bataayein",
      likhein: "Likhein",
      bhejenHoGaya: "Bhejein · ho gaya",
    },
    time: {
      baaki: (text) => `${text} baaki`,
      tak: (text) => `${text} tak`,
      aaj: "Aaj",
      kal: "Kal",
      minShort: "min",
      hourShort: "gh",
      dayShort: "din",
      ackClock: "Dekhna",
      completionClock: "Khatam karna",
      percentGaya: (pct) => `${pct}% gaya`,
      reminderAt: (text) => `reminder ${text}`,
      metIn: (text) => `Dekha ${text} mein`,
    },
    priority: { low: "Kam", normal: "Normal", high: "Zaroori", urgent: "Urgent" },
    create: {
      newTask: "Naya kaam",
      confirmTitle: "Yeh bhejein?",
      kisko: "Kisko",
      kya: "Kya",
      kabTak: "Kab tak",
      priorityLabel: "Priority",
      proof: "Proof",
      proofOn: "Photo chahiye",
      proofOff: "Zaroorat nahi",
      note: "Note",
      notePlaceholder: "Jaise: client kal aa raha hai",
      titlePlaceholder: "Jaise: Sector 62 ki photo",
      detailsPlaceholder: "Aur kuch batana ho to likhiye",
      choosePerson: "Kisko bhejna hai?",
      chooseTime: "Kab tak?",
      customTime: "Samay chuniye",
      todayEvening: "Aaj",
      oneHour: "1 ghanta",
      tomorrowMorning: "Kal subah",
      ackLabel: "Dekhne ka samay",
      ackHelp: "{n} minute mein na dekha to aapko batayenge.",
      sent: (name) => `${name} ko bhej diya`,
      notChosen: "Chuniye",
    },
    lists: {
      mereKaam: "Mere kaam",
      aapkeLiye: "Aapke liye",
      aajHeading: "Aaj",
      naya: "Naya",
      late: "Late",
      checklist: "Checklist",
      hoGayaSection: "Ho gaya",
      nothingToday: "Aaj ka sab ho gaya",
      allDone: "Badhiya",
      noTasks: "Abhi koi kaam nahi",
      noTasksHelp: "Naya kaam bhejne ke liye neeche dabaiye.",
      bheje: "Bheje",
      dekhe: "Dekhe",
      hoGaye: "Ho gaye",
      verifiedCount: "Verified",
      completionRate: "Kaam poora",
    },
    org: {
      setupTitle: "Apna business banayein",
      setupSubtitle: "Naam daaliye. Staff ko baad mein bula sakte hain.",
      businessName: "Business ka naam",
      businessNamePlaceholder: "Jaise: Rakesh Properties",
      languageLabel: "Staff ki bhasha",
      createBusiness: "Business banao",
      teamTitle: "Staff",
      teamSubtitle: (count) => `${count} log`,
      invite: "Staff bulao",
      inviteTitle: "Staff bulao",
      inviteSubtitle: "Naam aur number daaliye. Link aap bhejenge.",
      staffName: "Naam",
      staffNamePlaceholder: "Jaise: Raju",
      staffPhone: "Phone number",
      staffPhonePlaceholder: "98765 43210",
      roleLabel: "Kaam",
      makeInvite: "Link banao",
      linkReady: "Link taiyar hai",
      linkHelp: "Yeh link apne staff ko WhatsApp pe bhejiye.",
      copyLink: "Link copy karo",
      copied: "Copy ho gaya",
      share: "Bhejo",
      pendingInvites: "Bulawa bheja hai",
      you: "Aap",
      noStaffYet: "Abhi koi staff nahi",
      noStaffHelp: "Pehle staff ko bulaiye, phir kaam bhejiye.",
      removeInvite: "Hatao",
      joinTitle: (org) => `${org} mein aapko bulaya gaya hai`,
      joinSubtitle: (name) => `${name} ke naam se.`,
      joinAccept: "Jud jao",
      joinUsed: "Yeh link pehle istemaal ho chuka hai. Owner se naya link maangein.",
      joinNotFound: "Yeh link ab kaam nahi karta. Owner se naya link maangein.",
      joinSignIn: "Judne ke liye pehle sign in karein",
      roles: { owner: "Owner", admin: "Admin", manager: "Manager", member: "Staff" },
    },
    settings: {
      title: "Setting",
      language: "Bhasha",
      business: "Business",
      account: "Account",
    },
    nav: { aaj: "Aaj", hafta: "Hafta", staff: "Staff", settings: "Setting", pehle: "Pehle ke kaam" },
    auth: {
      title: "Apna email daalein",
      subtitle: "OTP isi email pe aayega.",
      emailLabel: "Email",
      emailPlaceholder: "naam@example.com",
      consentPrefix: "Main Vaakya ki ",
      privacyPolicy: "Privacy Policy",
      consentSuffix: " se sehmat hoon.",
      sendOtp: "OTP bhejo",
      codeTitle: "6 ank ka code daalein",
      codeSubtitle: (email) => `Code ${email} pe bheja hai.`,
      verify: "Aage badhein",
      resend: "Phir se bhejein",
      changeEmail: "Email badlein",
      staffHint: "Staff ko owner ka bheja hua link chahiye",
      signOut: "Sign out",
    },
    common: {
      appName: "Vaakya",
      tagline: "Bolo. Ho jayega.",
      loading: "Khul raha hai",
      nothingHere: "Yahaan kuch nahi hai",
      somethingWentWrong: "Nahi ho paya",
      tryAgain: "Phir se koshish karein",
      language: "Bhasha",
    },
  },

  en: {
    ticks: {
      sent: "Sent",
      seen: "Seen",
      accepted: "Accepted",
      done: "Done",
      verified: "Verified",
    },
    stepper: {
      bheja: "Sent",
      dekha: "Seen",
      maana: "Accepted",
      chalRaha: "In progress",
      hoGaya: "Done",
      verified: "Verified",
    },
    chips: {
      dekhaNahi: "Not seen",
      late: "Late",
      lateBy: (text) => `Late ${text}`,
      urgent: "Urgent",
      dikkat: "Blocked",
      samayMaanga: "More time asked",
      photoChahiye: "Photo needed",
      verifyBaaki: "Verify pending",
      cancelled: "Cancelled",
      escalated: "Escalated to you",
      reassigned: "Reassigned",
      naya: "New",
    },
    actions: {
      bhejo: "Send",
      call: "Call",
      yaadDilao: "Remind",
      kisiAurKo: "Reassign",
      samayBadlo: "Change time",
      cancel: "Cancel",
      verify: "Verify",
      dekhein: "View",
      dekhLiyaHoJayega: "Seen, will do",
      baadMein: "Later",
      nahiHoPayega: "Cannot do",
      shuruKiya: "Started",
      hoGaya: "Done",
      back: "Back",
      save: "Save",
      close: "Close",
      retry: "Send again",
      undo: "Undo",
      photoLein: "Take photo",
      awaazMeinBataayein: "Record a note",
      likhein: "Write",
      bhejenHoGaya: "Send · done",
    },
    time: {
      baaki: (text) => `${text} left`,
      tak: (text) => `by ${text}`,
      aaj: "Today",
      kal: "Tomorrow",
      minShort: "min",
      hourShort: "h",
      dayShort: "d",
      ackClock: "Acknowledge",
      completionClock: "Complete",
      percentGaya: (pct) => `${pct}% gone`,
      reminderAt: (text) => `reminder ${text}`,
      metIn: (text) => `Seen in ${text}`,
    },
    priority: { low: "Low", normal: "Normal", high: "High", urgent: "Urgent" },
    create: {
      newTask: "New task",
      confirmTitle: "Send this?",
      kisko: "Who",
      kya: "What",
      kabTak: "By when",
      priorityLabel: "Priority",
      proof: "Proof",
      proofOn: "Photo needed",
      proofOff: "Not needed",
      note: "Note",
      notePlaceholder: "For example: the client comes tomorrow",
      titlePlaceholder: "For example: photos of the Sector 62 flat",
      detailsPlaceholder: "Anything else worth saying",
      choosePerson: "Who is this for?",
      chooseTime: "By when?",
      customTime: "Pick a time",
      todayEvening: "Today",
      oneHour: "1 hour",
      tomorrowMorning: "Tomorrow morning",
      ackLabel: "Time to acknowledge",
      ackHelp: "If it is not seen in {n} minutes, you will be told.",
      sent: (name) => `Sent to ${name}`,
      notChosen: "Choose",
    },
    lists: {
      mereKaam: "My tasks",
      aapkeLiye: "Needs you",
      aajHeading: "Today",
      naya: "New",
      late: "Late",
      checklist: "Checklist",
      hoGayaSection: "Done",
      nothingToday: "Everything for today is done",
      allDone: "Good",
      noTasks: "No work yet",
      noTasksHelp: "Press below to send new work.",
      bheje: "Sent",
      dekhe: "Seen",
      hoGaye: "Done",
      verifiedCount: "Verified",
      completionRate: "Work done",
    },
    org: {
      setupTitle: "Create your business",
      setupSubtitle: "Enter the name. You can invite staff afterwards.",
      businessName: "Business name",
      businessNamePlaceholder: "For example: Rakesh Properties",
      languageLabel: "Staff language",
      createBusiness: "Create business",
      teamTitle: "Staff",
      teamSubtitle: (count) => `${count} people`,
      invite: "Invite staff",
      inviteTitle: "Invite staff",
      inviteSubtitle: "Enter a name and number. You send the link yourself.",
      staffName: "Name",
      staffNamePlaceholder: "For example: Raju",
      staffPhone: "Phone number",
      staffPhonePlaceholder: "98765 43210",
      roleLabel: "Role",
      makeInvite: "Make the link",
      linkReady: "The link is ready",
      linkHelp: "Send this link to your staff on WhatsApp.",
      copyLink: "Copy link",
      copied: "Copied",
      share: "Send",
      pendingInvites: "Invited",
      you: "You",
      noStaffYet: "No staff yet",
      noStaffHelp: "Invite your staff first, then send work.",
      removeInvite: "Remove",
      joinTitle: (org) => `${org} has invited you`,
      joinSubtitle: (name) => `As ${name}.`,
      joinAccept: "Join",
      joinUsed: "This link has already been used. Ask the owner for a new one.",
      joinNotFound: "This link no longer works. Ask the owner for a new one.",
      joinSignIn: "Sign in first to join",
      roles: { owner: "Owner", admin: "Admin", manager: "Manager", member: "Staff" },
    },
    settings: {
      title: "Settings",
      language: "Language",
      business: "Business",
      account: "Account",
    },
    nav: { aaj: "Today", hafta: "Week", staff: "Staff", settings: "Settings", pehle: "Earlier" },
    auth: {
      title: "Enter your email",
      subtitle: "The code comes to this email.",
      emailLabel: "Email",
      emailPlaceholder: "name@example.com",
      consentPrefix: "I agree to the Vaakya ",
      privacyPolicy: "Privacy Policy",
      consentSuffix: ".",
      sendOtp: "Send code",
      codeTitle: "Enter the six-digit code",
      codeSubtitle: (email) => `Code sent to ${email}.`,
      verify: "Continue",
      resend: "Send again",
      changeEmail: "Change email",
      staffHint: "Staff need the link their owner sent",
      signOut: "Sign out",
    },
    common: {
      appName: "Vaakya",
      tagline: "Bolo. Ho jayega.",
      loading: "Loading",
      nothingHere: "Nothing here",
      somethingWentWrong: "That did not go through",
      tryAgain: "Try again",
      language: "Language",
    },
  },
};

/** Synchronous — the dictionaries are small and statically imported. */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
