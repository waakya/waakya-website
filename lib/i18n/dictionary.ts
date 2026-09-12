// The Waakya copy sheet. Character document §2.4 fixes the vocabulary:
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
    /** The same state seen by the staff member who raised it. */
    escalatedToOwner: string;
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
  /** The privacy notice. */
  privacy: {
    /** The document's name; see PRIVACY_POLICY_NAME in lib/i18n/brand.ts. */
    title: string;
    updated: string;
    intro: (brand: string) => string;
    whatHeading: string;
    what: string[];
    whyHeading: string;
    why: string[];
    keepHeading: string;
    keep: (brand: string) => string;
    shareHeading: string;
    share: string;
    rightsHeading: string;
    rights: string[];
    contactHeading: string;
    contact: string;
  };
  /** Daily routines. */
  checklists: {
    title: string;
    subtitle: string;
    add: string;
    name: string;
    namePlaceholder: string;
    runAt: string;
    windowLabel: string;
    who: string;
    items: string;
    addItem: string;
    itemPlaceholder: string;
    save: string;
    empty: string;
    emptyHelp: string;
    progress: (done: number, total: number) => string;
    paused: string;
    pause: string;
    resume: string;
    remove: string;
    /** Opens the editor for an existing checklist. */
    edit: string;
    /** The toast after Save, so a slow refresh never looks like a failure. */
    saved: string;
  };
  /** The proof sheet and the proof list. */
  proof: {
    title: string;
    help: (owner: string) => string;
    /** When no photo was asked for: proof is welcome, not required. */
    helpOptional: string;
    takePhoto: string;
    photoCount: (n: number) => string;
    write: string;
    writePlaceholder: string;
    send: string;
    onRecord: string;
    heading: string;
    byAt: (name: string, time: string) => string;
    photoAlt: (name: string) => string;
    voiceNote: string;
    skip: string;
    uploading: string;
  };
  /** The notification inbox. */
  inbox: {
    title: string;
    empty: string;
    emptyHelp: string;
    markAllRead: string;
    unread: (n: number) => string;
    checkNow: string;
    checked: string;
  };
  /** The task detail screens. */
  detail: {
    title: string;
    newTaskTitle: string;
    timeline: string;
    thread: string;
    threadPlaceholder: string;
    noMessages: string;
    sentBy: (name: string, time: string) => string;
    sentAt: (time: string) => string;
    remaining: (text: string) => string;
    proofNeededHelp: string;
    recordLine: string;
    declineTitle: string;
    declineHelp: string;
    declineReason: string;
    laterHelp: string;
    reassignTitle: string;
    deadlineTitle: string;
    verifyDone: string;
    sendBack: string;
    cancelTitle: string;
    cancelHelp: string;
    cancelConfirm: string;
    startWork: string;
    reminderSent: string;
    callNoNumber: string;
    eventBy: (name: string, what: string) => string;
    /** Timeline row after Change time; follows the actor's name. */
    timeChanged: (when: string) => string;
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
    greeting: (name: string) => string;
    nothingNeedsYou: string;
    unseenCard: (who: string, task: string) => string;
    doneCard: (who: string, task: string) => string;
    escalatedCard: (who: string, task: string) => string;
    lateCard: (who: string, task: string) => string;
    weekTitle: string;
    weekEmpty: string;
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
    /** The person's own name, editable, shown to their team on every task. */
    yourName: string;
    namePlaceholder: string;
    saveName: string;
    nameSaved: string;
    nameInvalid: string;
    nameSaveFailed: string;
  };
  nav: {
    aaj: string;
    hafta: string;
    staff: string;
    hazri: string;
    settings: string;
    pehle: string;
    /** The sidebar's label above the business name, on desktop. */
    businessLabel: string;
    checklists: string;
    khabar: string;
  };
  /** Panels that only appear where there is room for them. */
  desktop: {
    thisWeek: string;
    onTime: string;
    staffToday: string;
    staffActive: (n: number) => string;
    columnTask: string;
    columnWho: string;
    columnWhen: string;
    columnStatus: string;
    columnAction: string;
    todaysWork: string;
    filterAll: string;
    noOne: string;
  };
  /** The login screen. */
  auth: {
    title: string;
    subtitle: string;
    /** The Google button. "Google" is a proper noun and stays in Latin script. */
    google: string;
    /** The line between the Google button and the email field. */
    orEmail: string;
    /** Shown when Google sends someone back without a session. */
    oauthFailed: string;
    emailLabel: string;
    emailPlaceholder: string;
    /** Takes the brand name; see lib/i18n/brand.ts for why it is a parameter. */
    consentPrefix: (brand: string) => string;
    consentSuffix: string;
    sendOtp: string;
    codeTitle: string;
    codeSubtitle: (email: string) => string;
    verify: string;
    resend: string;
    changeEmail: string;
    staffHint: string;
    /** The guest door; shown only when ALLOW_GUEST_LOGIN is on. */
    guestLogin: string;
    guestTitle: string;
    guestSubtitle: string;
    guestNameLabel: string;
    guestNamePlaceholder: string;
    guestReasonLabel: string;
    guestReasonPlaceholder: string;
    guestEnter: string;
    guestBack: string;
    signOut: string;
  };
  /** Attendance, leave and holidays. */
  hazri: {
    today: string;
    notPunched: string;
    notPunchedYet: string;
    working: string;
    completed: string;
    onLeave: string;
    onLeaveToday: string;
    halfDay: string;
    fullDay: string;
    holiday: string;
    holidayToday: string;
    present: string;
    absent: string;
    punchIn: string;
    punchOut: string;
    punchedIn: string;
    punchedOut: string;
    worked: string;
    thisMonth: string;
    noHistory: string;
    leave: string;
    balance: string;
    applyLeave: string;
    from: string;
    to: string;
    reason: string;
    /** Takes the cost in words, e.g. "half day". */
    thisCosts: (days: string) => string;
    sendRequest: string;
    approved: string;
    rejected: string;
    pending: string;
    teamToday: string;
    pendingLeave: string;
    nothingWaiting: string;
    approve: string;
    reject: string;
    balances: string;
    addHalf: string;
    addDay: string;
    holidays: string;
    holidayDate: string;
    holidayName: string;
    addHoliday: string;
  };
  /** Shared UI furniture. */
  common: {
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
      escalatedToOwner: "मालिक को बताया",
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
    privacy: {
      title: "Privacy Policy",
      updated: "आखिरी बदलाव: 4 सितंबर 2026",
      intro: (brand) =>
        `${brand} सिर्फ़ वही जानकारी रखता है जो आपका काम चलाने के लिए ज़रूरी है। इससे ज़्यादा कुछ नहीं।`,
      whatHeading: "हम क्या रखते हैं",
      what: [
        "आपका नाम, ईमेल और फ़ोन नंबर — ताकि आप साइन इन कर सकें और आपका मालिक आपको पहचान सके।",
        "आपके बिज़नेस का नाम और उसमें कौन-कौन है।",
        "काम: क्या भेजा गया, किसको, कब तक, और हर कदम कब हुआ।",
        "प्रूफ़: जो फ़ोटो, आवाज़ या लिखा हुआ आप भेजते हैं।",
      ],
      whyHeading: "क्यों रखते हैं",
      why: [
        "काम भेजने, देखने और पूरा करने के लिए।",
        "समय पर याद दिलाने और मालिक को बताने के लिए कि क्या बाकी है।",
        "यह रिकॉर्ड रखने के लिए कि किसने क्या और कब किया।",
      ],
      keepHeading: "कितने समय तक",
      keep: (brand) =>
        `जब तक आपका बिज़नेस ${brand} इस्तेमाल करता है। बिज़नेस बंद करने पर मालिक के कहने पर सब हटा दिया जाता है।`,
      shareHeading: "किसके साथ बाँटते हैं",
      share: "किसी के साथ नहीं बेचा जाता। आपका डेटा सिर्फ़ आपके बिज़नेस के लोग देख सकते हैं। ईमेल भेजने और डेटा रखने के लिए हम भरोसेमंद सर्विस इस्तेमाल करते हैं, और उन्हें भी उतना ही मिलता है जितना ज़रूरी है।",
      rightsHeading: "आपके हक़ (DPDP Act, 2023)",
      rights: [
        "अपना डेटा देखने का हक़।",
        "गलत जानकारी ठीक करवाने का हक़।",
        "डेटा हटवाने का हक़, जहाँ कानून इजाज़त देता है।",
        "शिकायत करने का हक़।",
      ],
      contactHeading: "संपर्क",
      contact: "किसी भी सवाल के लिए अपने बिज़नेस के मालिक से या privacy@waakya.com पर लिखें।",
    },
    checklists: {
      title: "रोज़ का काम",
      subtitle: "हर दिन अपने आप भेजा जाएगा।",
      add: "नई चेकलिस्ट",
      name: "नाम",
      namePlaceholder: "जैसे: ओपनिंग चेकलिस्ट",
      runAt: "कितने बजे",
      windowLabel: "कितनी देर में",
      who: "किसको",
      items: "काम",
      addItem: "काम जोड़ें",
      itemPlaceholder: "जैसे: शटर खोलो",
      save: "सेव करें",
      empty: "अभी कोई चेकलिस्ट नहीं",
      emptyHelp: "रोज़ के काम एक बार बनाइए, फिर अपने आप जाएँगे।",
      progress: (done, total) => `${done}/${total}`,
      paused: "रुका हुआ",
      pause: "रोकें",
      resume: "चालू करें",
      remove: "हटाएँ",
      edit: "बदलें",
      saved: "सेव हो गया",
    },
    proof: {
      title: "हो गया? प्रूफ़ भेजें",
      help: (owner) => `${owner} ने फ़ोटो माँगी है। कैमरा खुला है, बस खींचिए।`,
      helpOptional: "चाहें तो फ़ोटो या नोट जोड़ें, फिर भेजें।",
      takePhoto: "फ़ोटो लें",
      photoCount: (n) => `${n} फ़ोटो`,
      write: "लिखें",
      writePlaceholder: "क्या किया, वह लिखिए",
      send: "भेजें · हो गया",
      onRecord: "आपका प्रूफ़ रिकॉर्ड में रहेगा",
      heading: "प्रूफ़",
      byAt: (name, time) => `${name} · ${time}`,
      photoAlt: (name) => `${name} की भेजी फ़ोटो`,
      voiceNote: "आवाज़",
      skip: "बिना प्रूफ़ के",
      uploading: "भेजा जा रहा है",
    },
    inbox: {
      title: "खबर",
      empty: "कोई नई खबर नहीं",
      emptyHelp: "काम की हर हलचल यहाँ आएगी।",
      markAllRead: "सब पढ़ लिया",
      unread: (n) => `${n} नई`,
      checkNow: "अभी जाँचें",
      checked: "जाँच हो गई",
    },
    detail: {
      title: "काम",
      newTaskTitle: "नया काम",
      timeline: "टाइमलाइन",
      thread: "बातचीत",
      threadPlaceholder: "कुछ कहना हो तो लिखिए",
      noMessages: "अभी कोई बात नहीं हुई",
      sentBy: (name, time) => `${name} ने ${time} भेजा`,
      sentAt: (time) => `${time} भेजा`,
      remaining: (text) => `${text} बाकी`,
      proofNeededHelp: "हो जाने पर फ़ोटो भेजनी होगी",
      recordLine: "आपका हर कदम समय के साथ रिकॉर्ड होता है",
      declineTitle: "नहीं हो पाएगा?",
      declineHelp: "मालिक को बता देंगे। कारण लिखिए तो अच्छा रहेगा।",
      declineReason: "कारण",
      laterHelp: "ठीक है। यह काम आपकी लिस्ट में रहेगा।",
      reassignTitle: "किसको दें?",
      deadlineTitle: "नया समय",
      verifyDone: "वेरिफ़ाई करें",
      sendBack: "वापस भेजें",
      cancelTitle: "काम कैंसिल करें?",
      cancelHelp: "यह वापस नहीं होगा।",
      cancelConfirm: "हाँ, कैंसिल करें",
      startWork: "शुरू किया",
      reminderSent: "याद दिला दिया",
      callNoNumber: "इनका नंबर नहीं है",
      eventBy: (name, what) => `${name} ने ${what}`,
      timeChanged: (when) => `ने समय बदला · ${when}`,
    },
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
      completionRate: "वेरिफ़ाई काम",
      greeting: (name) => `नमस्ते, ${name} जी`,
      nothingNeedsYou: "आपके लिए अभी कुछ नहीं",
      unseenCard: (who, task) => `${who} ने '${task}' अभी तक नहीं देखा`,
      doneCard: (who, task) => `${who}: '${task}' हो गया`,
      escalatedCard: (who, task) => `${who} से '${task}' नहीं हो पाएगा`,
      lateCard: (who, task) => `${who} का '${task}' लेट है`,
      weekTitle: "इस हफ़्ते",
      weekEmpty: "इस हफ़्ते कुछ नहीं",
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
      yourName: "आपका नाम",
      namePlaceholder: "जैसे राकेश शर्मा",
      saveName: "नाम सेव करें",
      nameSaved: "नाम सेव हो गया।",
      nameInvalid: "नाम लिखें, 60 अक्षर तक।",
      nameSaveFailed: "नाम सेव नहीं हुआ। फिर से कोशिश करें।",
    },
    nav: {
      aaj: "आज",
      hafta: "हफ़्ता",
      staff: "स्टाफ़",
      hazri: "हाज़िरी",
      settings: "सेटिंग",
      pehle: "पहले के काम",
      businessLabel: "बिज़नेस",
      checklists: "रोज़ का काम",
      khabar: "खबर",
    },
    desktop: {
      thisWeek: "इस हफ़्ते",
      onTime: "समय पे",
      staffToday: "आज का स्टाफ़",
      staffActive: (n) => `${n} लोग`,
      columnTask: "काम",
      columnWho: "किसको",
      columnWhen: "कब तक",
      columnStatus: "स्टेटस",
      columnAction: "एक्शन",
      todaysWork: "आज के काम",
      filterAll: "सब",
      noOne: "कोई नहीं",
    },
    auth: {
      title: "लॉग इन करें",
      subtitle: "Google से, या ईमेल पे OTP से।",
      google: "Google से आगे बढ़ें",
      orEmail: "या ईमेल से",
      oauthFailed: "Google से लॉग इन नहीं हुआ। फिर से कोशिश करें।",
      emailLabel: "ईमेल",
      emailPlaceholder: "naam@example.com",
      consentPrefix: (brand) => `मैं ${brand} की `,
      consentSuffix: " से सहमत हूँ।",
      sendOtp: "OTP भेजो",
      codeTitle: "6 अंकों का कोड डालें",
      codeSubtitle: (email) => `कोड ${email} पे भेजा है।`,
      verify: "आगे बढ़ें",
      resend: "फिर से भेजें",
      changeEmail: "ईमेल बदलें",
      staffHint: "स्टाफ़ को मालिक का भेजा हुआ लिंक चाहिए",
      guestLogin: "गेस्ट बनकर देखें",
      guestTitle: "गेस्ट बनकर देखें",
      guestSubtitle: "बस नाम, ईमेल और वजह बताएँ। कोई OTP नहीं।",
      guestNameLabel: "नाम",
      guestNamePlaceholder: "आपका नाम",
      guestReasonLabel: "वजह",
      guestReasonPlaceholder: "आप ऐप क्यों देखना चाहते हैं?",
      guestEnter: "अंदर जाएँ",
      guestBack: "वापस",
      signOut: "साइन आउट",
    },
    hazri: {
      today: "आज",
      notPunched: "पंच नहीं किया",
      notPunchedYet: "आज अभी पंच इन नहीं किया।",
      working: "काम पर",
      completed: "पूरा",
      onLeave: "छुट्टी",
      onLeaveToday: "आज आपकी छुट्टी है।",
      halfDay: "आधा दिन",
      fullDay: "पूरा दिन",
      holiday: "अवकाश",
      holidayToday: "आज अवकाश है।",
      present: "हाज़िर",
      absent: "गैरहाज़िर",
      punchIn: "पंच इन",
      punchOut: "पंच आउट",
      punchedIn: "पंच इन",
      punchedOut: "पंच आउट",
      worked: "काम",
      thisMonth: "इस महीने",
      noHistory: "इस महीने का कोई रिकॉर्ड नहीं।",
      leave: "छुट्टी",
      balance: "बची छुट्टी",
      applyLeave: "छुट्टी माँगें",
      from: "से",
      to: "तक",
      reason: "वजह",
      thisCosts: (days) => `इसमें ${days} लगेगी।`,
      sendRequest: "भेजें",
      approved: "मंज़ूर",
      rejected: "नामंज़ूर",
      pending: "इंतज़ार",
      teamToday: "आज की टीम",
      pendingLeave: "छुट्टी की अर्ज़ी",
      nothingWaiting: "कुछ बाकी नहीं।",
      approve: "मंज़ूर करें",
      reject: "मना करें",
      balances: "छुट्टी का हिसाब",
      addHalf: "आधा",
      addDay: "एक दिन",
      holidays: "अवकाश",
      holidayDate: "तारीख",
      holidayName: "अवकाश का नाम",
      addHoliday: "जोड़ें",
    },
    common: {
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
      escalatedToOwner: "Malik ko bataya",
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
    privacy: {
      title: "Privacy Policy",
      updated: "Aakhri badlaav: 4 September 2026",
      intro: (brand) =>
        `${brand} sirf wahi jaankari rakhta hai jo aapka kaam chalane ke liye zaroori hai. Isse zyada kuch nahi.`,
      whatHeading: "Hum kya rakhte hain",
      what: [
        "Aapka naam, email aur phone number — taaki aap sign in kar sakein aur aapka owner aapko pehchan sake.",
        "Aapke business ka naam aur usmein kaun-kaun hai.",
        "Kaam: kya bheja gaya, kisko, kab tak, aur har kadam kab hua.",
        "Proof: jo photo, awaaz ya likha hua aap bhejte hain.",
      ],
      whyHeading: "Kyun rakhte hain",
      why: [
        "Kaam bhejne, dekhne aur poora karne ke liye.",
        "Samay par yaad dilane aur owner ko batane ke liye ki kya baaki hai.",
        "Yeh record rakhne ke liye ki kisne kya aur kab kiya.",
      ],
      keepHeading: "Kitne samay tak",
      keep: (brand) =>
        `Jab tak aapka business ${brand} istemaal karta hai. Business band karne par owner ke kehne par sab hata diya jaata hai.`,
      shareHeading: "Kiske saath baantte hain",
      share: "Kisi ke saath becha nahi jaata. Aapka data sirf aapke business ke log dekh sakte hain. Email bhejne aur data rakhne ke liye hum bharosemand service istemaal karte hain, aur unhein bhi utna hi milta hai jitna zaroori hai.",
      rightsHeading: "Aapke haq (DPDP Act, 2023)",
      rights: [
        "Apna data dekhne ka haq.",
        "Galat jaankari theek karvane ka haq.",
        "Data hatvane ka haq, jahaan kanoon ijaazat deta hai.",
        "Shikayat karne ka haq.",
      ],
      contactHeading: "Sampark",
      contact: "Kisi bhi sawaal ke liye apne business ke owner se ya privacy@waakya.com par likhein.",
    },
    checklists: {
      title: "Roz ka kaam",
      subtitle: "Har din apne aap bheja jayega.",
      add: "Nayi checklist",
      name: "Naam",
      namePlaceholder: "Jaise: Opening checklist",
      runAt: "Kitne baje",
      windowLabel: "Kitni der mein",
      who: "Kisko",
      items: "Kaam",
      addItem: "Kaam jodein",
      itemPlaceholder: "Jaise: Shutter kholo",
      save: "Save karein",
      empty: "Abhi koi checklist nahi",
      emptyHelp: "Roz ke kaam ek baar banaiye, phir apne aap jayenge.",
      progress: (done, total) => `${done}/${total}`,
      paused: "Ruka hua",
      pause: "Rokein",
      resume: "Chaalu karein",
      remove: "Hatayein",
      edit: "Badlein",
      saved: "Save ho gaya",
    },
    proof: {
      title: "Ho gaya? Proof bhejein",
      help: (owner) => `${owner} ne photo maangi hai. Camera khula hai, bas khinchiye.`,
      helpOptional: "Chahein to photo ya note jodein, phir bhejein.",
      takePhoto: "Photo lein",
      photoCount: (n) => `${n} photo`,
      write: "Likhein",
      writePlaceholder: "Kya kiya, woh likhiye",
      send: "Bhejein · ho gaya",
      onRecord: "Aapka proof record mein rahega",
      heading: "Proof",
      byAt: (name, time) => `${name} · ${time}`,
      photoAlt: (name) => `${name} ki bheji photo`,
      voiceNote: "Awaaz",
      skip: "Bina proof ke",
      uploading: "Bheja ja raha hai",
    },
    inbox: {
      title: "Khabar",
      empty: "Koi nayi khabar nahi",
      emptyHelp: "Kaam ki har halchal yahaan aayegi.",
      markAllRead: "Sab padh liya",
      unread: (n) => `${n} nayi`,
      checkNow: "Abhi jaanchein",
      checked: "Jaanch ho gayi",
    },
    detail: {
      title: "Task",
      newTaskTitle: "Naya kaam",
      timeline: "Timeline",
      thread: "Baat-cheet",
      threadPlaceholder: "Kuch kehna ho to likhiye",
      noMessages: "Abhi koi baat nahi hui",
      sentBy: (name, time) => `${name} ne ${time} bheja`,
      sentAt: (time) => `${time} bheja`,
      remaining: (text) => `${text} baaki`,
      proofNeededHelp: "Ho jaane par photo bhejni hogi",
      recordLine: "Aapka har kadam samay ke saath record hota hai",
      declineTitle: "Nahi ho payega?",
      declineHelp: "Owner ko bata denge. Kaaran likhiye to achha rahega.",
      declineReason: "Kaaran",
      laterHelp: "Theek hai. Yeh kaam aapki list mein rahega.",
      reassignTitle: "Kisko dein?",
      deadlineTitle: "Naya samay",
      verifyDone: "Verify karein",
      sendBack: "Wapas bhejein",
      cancelTitle: "Kaam cancel karein?",
      cancelHelp: "Yeh wapas nahi hoga.",
      cancelConfirm: "Haan, cancel karein",
      startWork: "Shuru kiya",
      reminderSent: "Yaad dila diya",
      callNoNumber: "Inka number nahi hai",
      eventBy: (name, what) => `${name} ne ${what}`,
      timeChanged: (when) => `ne samay badla · ${when}`,
    },
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
      completionRate: "Verified kaam",
      greeting: (name) => `Namaste, ${name} ji`,
      nothingNeedsYou: "Aapke liye abhi kuch nahi",
      unseenCard: (who, task) => `${who} ne '${task}' abhi tak nahi dekha`,
      doneCard: (who, task) => `${who}: '${task}' ho gaya`,
      escalatedCard: (who, task) => `${who} se '${task}' nahi ho payega`,
      lateCard: (who, task) => `${who} ka '${task}' late hai`,
      weekTitle: "Is hafte",
      weekEmpty: "Is hafte kuch nahi",
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
      yourName: "Aapka naam",
      namePlaceholder: "Jaise Rakesh Sharma",
      saveName: "Naam save karein",
      nameSaved: "Naam save ho gaya.",
      nameInvalid: "Naam likhein, 60 akshar tak.",
      nameSaveFailed: "Naam save nahi hua. Phir se koshish karein.",
    },
    nav: {
      aaj: "Aaj",
      hafta: "Hafta",
      staff: "Staff",
      hazri: "Hazri",
      settings: "Setting",
      pehle: "Pehle ke kaam",
      businessLabel: "Business",
      checklists: "Roz ka kaam",
      khabar: "Khabar",
    },
    desktop: {
      thisWeek: "Is hafte",
      onTime: "samay pe",
      staffToday: "Staff aaj",
      staffActive: (n) => `${n} staff active`,
      columnTask: "Kaam",
      columnWho: "Kisko",
      columnWhen: "Kab tak",
      columnStatus: "Status",
      columnAction: "Action",
      todaysWork: "Aaj ke kaam",
      filterAll: "Sab",
      noOne: "Koi nahi",
    },
    auth: {
      title: "Login karein",
      subtitle: "Google se, ya email pe OTP se.",
      google: "Google se aage badhein",
      orEmail: "ya email se",
      oauthFailed: "Google se login nahi hua. Phir se koshish karein.",
      emailLabel: "Email",
      emailPlaceholder: "naam@example.com",
      consentPrefix: (brand) => `Main ${brand} ki `,
      consentSuffix: " se sehmat hoon.",
      sendOtp: "OTP bhejo",
      codeTitle: "6 ank ka code daalein",
      codeSubtitle: (email) => `Code ${email} pe bheja hai.`,
      verify: "Aage badhein",
      resend: "Phir se bhejein",
      changeEmail: "Email badlein",
      staffHint: "Staff ko owner ka bheja hua link chahiye",
      guestLogin: "Guest banke dekhein",
      guestTitle: "Guest banke dekhein",
      guestSubtitle: "Bas naam, email aur wajah batayein. Koi OTP nahi.",
      guestNameLabel: "Naam",
      guestNamePlaceholder: "Aapka naam",
      guestReasonLabel: "Wajah",
      guestReasonPlaceholder: "Aap app kyun dekhna chahte hain?",
      guestEnter: "Andar jaayein",
      guestBack: "Wapas",
      signOut: "Sign out",
    },
    hazri: {
      today: "Aaj",
      notPunched: "Punch nahi kiya",
      notPunchedYet: "Aaj abhi punch in nahi kiya.",
      working: "Kaam par",
      completed: "Poora",
      onLeave: "Chhutti",
      onLeaveToday: "Aaj aapki chhutti hai.",
      halfDay: "Aadha din",
      fullDay: "Poora din",
      holiday: "Avkash",
      holidayToday: "Aaj avkash hai.",
      present: "Haazir",
      absent: "Gairhaazir",
      punchIn: "Punch in",
      punchOut: "Punch out",
      punchedIn: "Punch in",
      punchedOut: "Punch out",
      worked: "Kaam",
      thisMonth: "Is mahine",
      noHistory: "Is mahine ka koi record nahi.",
      leave: "Chhutti",
      balance: "Bachi chhutti",
      applyLeave: "Chhutti maangein",
      from: "Se",
      to: "Tak",
      reason: "Wajah",
      thisCosts: (days) => `Ismein ${days} lagegi.`,
      sendRequest: "Bhejein",
      approved: "Manzoor",
      rejected: "Namanzoor",
      pending: "Intezaar",
      teamToday: "Aaj ki team",
      pendingLeave: "Chhutti ki arzi",
      nothingWaiting: "Kuch baaki nahi.",
      approve: "Manzoor karein",
      reject: "Mana karein",
      balances: "Chhutti ka hisaab",
      addHalf: "Aadha",
      addDay: "Ek din",
      holidays: "Avkash",
      holidayDate: "Tareekh",
      holidayName: "Avkash ka naam",
      addHoliday: "Jodein",
    },
    common: {
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
      escalatedToOwner: "Sent to owner",
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
    privacy: {
      title: "Privacy Policy",
      updated: "Last updated: 4 September 2026",
      intro: (brand) =>
        `${brand} keeps only the information needed to run your work. Nothing more.`,
      whatHeading: "What we keep",
      what: [
        "Your name, email and phone number, so you can sign in and your owner can recognise you.",
        "Your business name and who is in it.",
        "Work: what was sent, to whom, by when, and when each step happened.",
        "Proof: the photos, voice notes or text you send.",
      ],
      whyHeading: "Why we keep it",
      why: [
        "To send work, see it and finish it.",
        "To remind on time, and to tell the owner what is still outstanding.",
        "To keep a record of who did what, and when.",
      ],
      keepHeading: "How long",
      keep: (brand) =>
        `For as long as your business uses ${brand}. When a business closes, everything is deleted at the owner's request.`,
      shareHeading: "Who we share it with",
      share: "It is never sold. Only people in your business can see your data. We use trusted services to send email and store data, and they receive only what is necessary.",
      rightsHeading: "Your rights (DPDP Act, 2023)",
      rights: [
        "The right to see your data.",
        "The right to have wrong information corrected.",
        "The right to have data erased, where the law allows.",
        "The right to complain.",
      ],
      contactHeading: "Contact",
      contact: "For any question, ask your business owner or write to privacy@waakya.com.",
    },
    checklists: {
      title: "Daily routine",
      subtitle: "Sent automatically, every day.",
      add: "New checklist",
      name: "Name",
      namePlaceholder: "For example: Opening checklist",
      runAt: "At what time",
      windowLabel: "Within",
      who: "For whom",
      items: "Tasks",
      addItem: "Add a task",
      itemPlaceholder: "For example: Open the shutter",
      save: "Save",
      empty: "No checklists yet",
      emptyHelp: "Set the daily work up once, and it sends itself.",
      progress: (done, total) => `${done}/${total}`,
      paused: "Paused",
      pause: "Pause",
      resume: "Resume",
      remove: "Remove",
      edit: "Edit",
      saved: "Saved",
    },
    proof: {
      title: "Done? Send the proof",
      help: (owner) => `${owner} asked for a photo. The camera is open, just take it.`,
      helpOptional: "Add a photo or a note if you like, then send.",
      takePhoto: "Take a photo",
      photoCount: (n) => (n === 1 ? "1 photo" : `${n} photos`),
      write: "Write",
      writePlaceholder: "Write what you did",
      send: "Send · done",
      onRecord: "Your proof stays on record",
      heading: "Proof",
      byAt: (name, time) => `${name} · ${time}`,
      photoAlt: (name) => `Photo sent by ${name}`,
      voiceNote: "Voice note",
      skip: "Without a proof",
      uploading: "Sending",
    },
    inbox: {
      title: "Updates",
      empty: "Nothing new",
      emptyHelp: "Everything that happens to your work appears here.",
      markAllRead: "Mark all read",
      unread: (n) => `${n} new`,
      checkNow: "Check now",
      checked: "Checked",
    },
    detail: {
      title: "Task",
      newTaskTitle: "New task",
      timeline: "Timeline",
      thread: "Messages",
      threadPlaceholder: "Write something if you need to",
      noMessages: "Nothing said yet",
      sentBy: (name, time) => `${name} sent this at ${time}`,
      sentAt: (time) => `sent ${time}`,
      remaining: (text) => `${text} left`,
      proofNeededHelp: "A photo is needed when this is finished",
      recordLine: "Every step you take is recorded with its time",
      declineTitle: "Cannot do this?",
      declineHelp: "The owner will be told. A reason helps.",
      declineReason: "Reason",
      laterHelp: "Fine. This stays on your list.",
      reassignTitle: "Give it to whom?",
      deadlineTitle: "New time",
      verifyDone: "Verify",
      sendBack: "Send back",
      cancelTitle: "Cancel this task?",
      cancelHelp: "This cannot be undone.",
      cancelConfirm: "Yes, cancel it",
      startWork: "Started",
      reminderSent: "Reminder sent",
      callNoNumber: "No number on file",
      eventBy: (name, what) => `${name} ${what}`,
      timeChanged: (when) => `changed the time to ${when}`,
    },
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
      completionRate: "Verified work",
      greeting: (name) => `Hello, ${name}`,
      nothingNeedsYou: "Nothing needs you right now",
      unseenCard: (who, task) => `${who} has not seen '${task}' yet`,
      doneCard: (who, task) => `${who}: '${task}' is done`,
      escalatedCard: (who, task) => `${who} cannot do '${task}'`,
      lateCard: (who, task) => `${who}'s '${task}' is late`,
      weekTitle: "This week",
      weekEmpty: "Nothing this week",
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
      yourName: "Your name",
      namePlaceholder: "For example, Rakesh Sharma",
      saveName: "Save name",
      nameSaved: "Name saved.",
      nameInvalid: "Write your name, up to 60 letters.",
      nameSaveFailed: "Your name was not saved. Please try again.",
    },
    nav: {
      aaj: "Today",
      hafta: "Week",
      staff: "Staff",
      hazri: "Attendance",
      settings: "Settings",
      pehle: "Earlier",
      businessLabel: "Business",
      checklists: "Daily routine",
      khabar: "Updates",
    },
    desktop: {
      thisWeek: "This week",
      onTime: "on time",
      staffToday: "Staff today",
      staffActive: (n) => `${n} staff active`,
      columnTask: "Task",
      columnWho: "Who",
      columnWhen: "By when",
      columnStatus: "Status",
      columnAction: "Action",
      todaysWork: "Today's work",
      filterAll: "All",
      noOne: "Nobody",
    },
    auth: {
      title: "Sign in",
      subtitle: "With Google, or with a code by email.",
      google: "Continue with Google",
      orEmail: "or with email",
      oauthFailed: "Google sign-in did not finish. Please try again.",
      emailLabel: "Email",
      emailPlaceholder: "name@example.com",
      consentPrefix: (brand) => `I agree to ${brand}'s `,
      consentSuffix: ".",
      sendOtp: "Send code",
      codeTitle: "Enter the six-digit code",
      codeSubtitle: (email) => `Code sent to ${email}.`,
      verify: "Continue",
      resend: "Send again",
      changeEmail: "Change email",
      staffHint: "Staff need the link their owner sent",
      guestLogin: "Continue as guest",
      guestTitle: "Try it as a guest",
      guestSubtitle: "Just your name, email and reason. No OTP.",
      guestNameLabel: "Name",
      guestNamePlaceholder: "Your name",
      guestReasonLabel: "Reason",
      guestReasonPlaceholder: "Why would you like to try the app?",
      guestEnter: "Enter",
      guestBack: "Back",
      signOut: "Sign out",
    },
    hazri: {
      today: "Today",
      notPunched: "Not punched in",
      notPunchedYet: "You have not punched in today.",
      working: "Working",
      completed: "Done",
      onLeave: "On leave",
      onLeaveToday: "You are on leave today.",
      halfDay: "Half day",
      fullDay: "Full day",
      holiday: "Holiday",
      holidayToday: "Today is a holiday.",
      present: "Present",
      absent: "Absent",
      punchIn: "Punch in",
      punchOut: "Punch out",
      punchedIn: "Punched in",
      punchedOut: "Punched out",
      worked: "Worked",
      thisMonth: "This month",
      noHistory: "Nothing recorded this month yet.",
      leave: "Leave",
      balance: "Leave balance",
      applyLeave: "Apply leave",
      from: "From",
      to: "To",
      reason: "Reason",
      thisCosts: (days) => `This costs ${days}.`,
      sendRequest: "Send request",
      approved: "Approved",
      rejected: "Rejected",
      pending: "Waiting",
      teamToday: "Team today",
      pendingLeave: "Leave requests",
      nothingWaiting: "Nothing waiting.",
      approve: "Approve",
      reject: "Reject",
      balances: "Leave balances",
      addHalf: "Half",
      addDay: "1 day",
      holidays: "Holidays",
      holidayDate: "Date",
      holidayName: "Holiday name",
      addHoliday: "Add",
    },
    common: {
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
