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
