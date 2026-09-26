import type { Locale } from "./locales";

export interface IntegrationsCopy {
  title: string;
  subtitle: string;
  keys: string;
  newKey: string;
  keyName: string;
  create: string;
  shownOnce: string;
  copy: string;
  copied: string;
  revoke: string;
  revoked: string;
  lastUsed: string;
  never: string;
  empty: string;
  howTo: string;
  howToBody: string;
  requests: string;
  noRequests: string;
  fields: string;
  errors: { notAllowed: string; moduleOff: string; badInput: string; generic: string };
}

const copy: Record<Locale, IntegrationsCopy> = {
  hi: {
    title: "वेबसाइट से जोड़ें", subtitle: "आपकी वेबसाइट की पूछताछ सीधे ग्राहक सूची में आए।", keys: "कुंजियाँ", newKey: "नई कुंजी", keyName: "कुंजी का नाम (जैसे: मुख्य वेबसाइट)", create: "बनाएँ",
    shownOnce: "यह कुंजी सिर्फ़ अभी दिखेगी। इसे अपनी वेबसाइट में रखें।", copy: "कॉपी करें", copied: "कॉपी हो गया", revoke: "बंद करें", revoked: "बंद", lastUsed: "आख़िरी बार", never: "कभी नहीं", empty: "अभी कोई कुंजी नहीं",
    howTo: "वेबसाइट से कैसे भेजें", howToBody: "हर पूछताछ पर यह भेजें। फ़ोन या ईमेल में से एक ज़रूरी। एक ही व्यक्ति दोबारा आए तो वही रिकॉर्ड जुड़ता है।", requests: "आई हुई पूछताछ", noRequests: "अभी कोई पूछताछ नहीं आई", fields: "फ़ील्ड",
    errors: { notAllowed: "यह आप नहीं कर सकते।", moduleOff: "वेबसाइट इंटीग्रेशन चालू नहीं है।", badInput: "कुछ जानकारी सही नहीं है।", generic: "नहीं हुआ। फिर कोशिश करें।" },
  },
  "hi-Latn": {
    title: "Website se jodein", subtitle: "Aapki website ki enquiry seedhe customer list mein aaye.", keys: "Keys", newKey: "Nayi key", keyName: "Key ka naam (jaise: main website)", create: "Banayein",
    shownOnce: "Yeh key sirf abhi dikhegi. Ise apni website mein rakhein.", copy: "Copy karein", copied: "Copy ho gaya", revoke: "Band karein", revoked: "Band", lastUsed: "Aakhri baar", never: "Kabhi nahi", empty: "Abhi koi key nahi",
    howTo: "Website se kaise bhejein", howToBody: "Har enquiry par yeh bhejein. Phone ya email mein se ek zaroori. Wahi insaan dobara aaye to wahi record judta hai.", requests: "Aayi hui enquiries", noRequests: "Abhi koi enquiry nahi aayi", fields: "Fields",
    errors: { notAllowed: "Yeh aap nahi kar sakte.", moduleOff: "Website integration chalu nahi hai.", badInput: "Kuch jaankari sahi nahi hai.", generic: "Nahi hua. Phir koshish karein." },
  },
  en: {
    title: "Connect your website", subtitle: "Enquiries from your website land straight in the customer list.", keys: "Keys", newKey: "New key", keyName: "Key name (for example: main website)", create: "Create",
    shownOnce: "This key is shown only now. Put it in your website.", copy: "Copy", copied: "Copied", revoke: "Revoke", revoked: "Revoked", lastUsed: "Last used", never: "Never", empty: "No keys yet",
    howTo: "How the website sends an enquiry", howToBody: "Send this for every enquiry. A phone or an email is required. The same person arriving twice joins the same record.", requests: "Enquiries received", noRequests: "No enquiries received yet", fields: "Fields",
    errors: { notAllowed: "You cannot do that.", moduleOff: "Website integration is not switched on.", badInput: "Some of that is not right.", generic: "That did not go through. Try again." },
  },
};

export function getIntegrations(locale: Locale): IntegrationsCopy {
  return copy[locale];
}
