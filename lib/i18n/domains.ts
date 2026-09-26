import type { Locale } from "./locales";

export interface DomainsCopy {
  title: string;
  subtitle: string;
  hostname: string;
  hostnameHint: string;
  add: string;
  verify: string;
  remove: string;
  statuses: { pending: string; verified: string; active: string; removed: string };
  record: string;
  recordHelp: string;
  recordName: string;
  recordValue: string;
  attach: string;
  attachHelp: string;
  checked: string;
  notFound: string;
  empty: string;
  errors: { notAllowed: string; moduleOff: string; badInput: string; badHost: string; taken: string; notFound: string; generic: string };
}

const copy: Record<Locale, DomainsCopy> = {
  hi: {
    title: "अपना डोमेन", subtitle: "ग्राहक पोर्टल आपके अपने पते पर, जैसे portal.aapkacompany.com।", hostname: "होस्टनेम", hostnameHint: "जैसे: portal.aapkacompany.com", add: "जोड़ें", verify: "जाँचें", remove: "हटाएँ",
    statuses: { pending: "पुष्टि बाकी", verified: "पुष्टि हुई", active: "चालू", removed: "हटाया" }, record: "DNS TXT रिकॉर्ड", recordHelp: "अपने डोमेन प्रोवाइडर में यह TXT रिकॉर्ड जोड़ें, फिर जाँचें दबाएँ।", recordName: "नाम", recordValue: "मान",
    attach: "इसके बाद", attachHelp: "पुष्टि के बाद डोमेन को होस्टिंग से जोड़ना Waakya टीम करती है; यह अभी हाथ से होता है।", checked: "आख़िरी जाँच", notFound: "रिकॉर्ड अभी नहीं मिला। DNS फैलने में कुछ मिनट लग सकते हैं।", empty: "अभी कोई डोमेन नहीं",
    errors: { notAllowed: "यह आप नहीं कर सकते।", moduleOff: "अपना डोमेन इस कारोबार में चालू नहीं है।", badInput: "कुछ जानकारी सही नहीं है।", badHost: "यह होस्टनेम सही नहीं है।", taken: "यह होस्टनेम पहले से जुड़ा है।", notFound: "नहीं मिला।", generic: "नहीं हुआ। फिर कोशिश करें।" },
  },
  "hi-Latn": {
    title: "Apna domain", subtitle: "Customer portal aapke apne pate par, jaise portal.aapkacompany.com.", hostname: "Hostname", hostnameHint: "Jaise: portal.aapkacompany.com", add: "Jodein", verify: "Jaanchein", remove: "Hatayein",
    statuses: { pending: "Pushti baaki", verified: "Pushti hui", active: "Chalu", removed: "Hataya" }, record: "DNS TXT record", recordHelp: "Apne domain provider mein yeh TXT record jodein, phir Jaanchein dabayein.", recordName: "Naam", recordValue: "Value",
    attach: "Iske baad", attachHelp: "Pushti ke baad domain ko hosting se jodna Waakya team karti hai; yeh abhi haath se hota hai.", checked: "Aakhri jaanch", notFound: "Record abhi nahi mila. DNS failne mein kuch minute lag sakte hain.", empty: "Abhi koi domain nahi",
    errors: { notAllowed: "Yeh aap nahi kar sakte.", moduleOff: "Apna domain is business mein chalu nahi hai.", badInput: "Kuch jaankari sahi nahi hai.", badHost: "Yeh hostname sahi nahi hai.", taken: "Yeh hostname pehle se juda hai.", notFound: "Nahi mila.", generic: "Nahi hua. Phir koshish karein." },
  },
  en: {
    title: "Custom domain", subtitle: "The customer portal on your own address, such as portal.yourcompany.com.", hostname: "Hostname", hostnameHint: "For example: portal.yourcompany.com", add: "Add", verify: "Check", remove: "Remove",
    statuses: { pending: "Waiting for verification", verified: "Verified", active: "Live", removed: "Removed" }, record: "DNS TXT record", recordHelp: "Add this TXT record at your domain provider, then press Check.", recordName: "Name", recordValue: "Value",
    attach: "After that", attachHelp: "Once verified, attaching the domain to hosting is done by the Waakya team; it is a manual step in this release.", checked: "Last checked", notFound: "The record was not found yet. DNS can take a few minutes to spread.", empty: "No domains yet",
    errors: { notAllowed: "You cannot do that.", moduleOff: "Custom domains are not switched on for this business.", badInput: "Some of that is not right.", badHost: "That does not look like a hostname.", taken: "That hostname is already in use.", notFound: "Not found.", generic: "That did not go through. Try again." },
  },
};

export function getDomains(locale: Locale): DomainsCopy {
  return copy[locale];
}
