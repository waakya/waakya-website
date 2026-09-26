import type { Locale } from "./locales";

export interface CampaignsCopy {
  title: string;
  subtitle: string;
  newCampaign: string;
  templates: string;
  newTemplate: string;
  name: string;
  channel: string;
  channels: { email: string; whatsapp: string };
  template: string;
  noTemplate: string;
  subject: string;
  body: string;
  bodyHint: string;
  segment: string;
  segmentHelp: string;
  kind: string;
  anyKind: string;
  tags: string;
  source: string;
  owner: string;
  project: string;
  stage: string;
  any: string;
  preview: string;
  reach: (reachable: number, suppressed: number) => string;
  save: string;
  cancel: string;
  send: string;
  sendConfirm: string;
  sending: string;
  statuses: Record<"draft" | "scheduled" | "sending" | "sent" | "partially_failed" | "cancelled", string>;
  recipientStatuses: Record<"queued" | "sent" | "delivered" | "failed" | "replied" | "suppressed", string>;
  recipients: string;
  noRecipients: string;
  counts: (sent: number, failed: number, suppressed: number, replied: number) => string;
  empty: string;
  emptyHelp: string;
  templateFields: { providerName: string; providerNameHint: string; language: string; status: string; statuses: { draft: string; approved: string; rejected: string }; approvedHint: string };
  optOut: { email: string; whatsapp: string; on: string; off: string };
  replies: string;
  errors: { notAllowed: string; moduleOff: string; badInput: string; notFound: string; generic: string; needTemplate: string; needBody: string; alreadySent: string; templateNotApproved: string; emptySegment: string; nameTaken: string };
}

const copy: Record<Locale, CampaignsCopy> = {
  hi: {
    title: "कैंपेन", subtitle: "मंज़ूर किए संदेश, चुने हुए ग्राहकों को, और जो जवाब आया वह ग्राहक की टाइमलाइन में।", newCampaign: "नया कैंपेन", templates: "टेम्पलेट", newTemplate: "नया टेम्पलेट",
    name: "नाम", channel: "माध्यम", channels: { email: "ईमेल", whatsapp: "WhatsApp" }, template: "टेम्पलेट", noTemplate: "बिना टेम्पलेट (सिर्फ़ ईमेल)", subject: "विषय", body: "संदेश", bodyHint: "{{name}} लिखें, ग्राहक का नाम भर जाएगा।",
    segment: "किसे", segmentHelp: "जो सब शर्तें पूरी करें।", kind: "प्रकार", anyKind: "सब", tags: "टैग (कॉमा से)", source: "कहाँ से आए", owner: "किसके पास", project: "प्रोजेक्ट", stage: "डील स्टेज", any: "कोई भी",
    preview: "कितनों तक पहुँचेगा", reach: (r, s) => `${r} तक पहुँचेगा · ${s} छूटेंगे (ऑप्ट-आउट, पता नहीं, दोहराव)`, save: "सेव करें", cancel: "रद्द करें", send: "अभी भेजें", sendConfirm: "भेजने के बाद वापस नहीं होगा।", sending: "भेजा जा रहा है",
    statuses: { draft: "ड्राफ़्ट", scheduled: "तय", sending: "भेजा जा रहा", sent: "भेजा", partially_failed: "कुछ नहीं गए", cancelled: "रद्द" },
    recipientStatuses: { queued: "कतार में", sent: "भेजा", delivered: "पहुँचा", failed: "नहीं गया", replied: "जवाब आया", suppressed: "छोड़ा" },
    recipients: "किन्हें", noRecipients: "अभी किसी को नहीं", counts: (s, f, su, r) => `${s} भेजे · ${f} नहीं गए · ${su} छोड़े · ${r} जवाब`, empty: "अभी कोई कैंपेन नहीं", emptyHelp: "पहले एक टेम्पलेट बनाएँ, फिर कैंपेन।",
    templateFields: { providerName: "प्रोवाइडर में टेम्पलेट का नाम", providerNameHint: "WhatsApp Manager में मंज़ूर हुआ नाम", language: "भाषा कोड", status: "स्टेटस", statuses: { draft: "ड्राफ़्ट", approved: "मंज़ूर", rejected: "नामंज़ूर" }, approvedHint: "WhatsApp सिर्फ़ मंज़ूर टेम्पलेट से जाता है।" },
    optOut: { email: "ईमेल नहीं चाहिए", whatsapp: "WhatsApp नहीं चाहिए", on: "हाँ", off: "नहीं" }, replies: "जवाब",
    errors: { notAllowed: "यह आप नहीं कर सकते।", moduleOff: "कैंपेन इस कारोबार में चालू नहीं हैं।", badInput: "कुछ जानकारी सही नहीं है।", notFound: "नहीं मिला।", generic: "नहीं हुआ। फिर कोशिश करें।", needTemplate: "WhatsApp के लिए मंज़ूर टेम्पलेट चुनें।", needBody: "संदेश लिखें या टेम्पलेट चुनें।", alreadySent: "यह पहले भेजा जा चुका है।", templateNotApproved: "टेम्पलेट मंज़ूर नहीं है।", emptySegment: "इस चुनाव में कोई नहीं।", nameTaken: "इस नाम का टेम्पलेट पहले से है।" },
  },
  "hi-Latn": {
    title: "Campaigns", subtitle: "Approved messages, chune hue customers ko, aur jo jawab aaya woh customer ki timeline mein.", newCampaign: "Naya campaign", templates: "Templates", newTemplate: "Naya template",
    name: "Naam", channel: "Channel", channels: { email: "Email", whatsapp: "WhatsApp" }, template: "Template", noTemplate: "Bina template (sirf email)", subject: "Subject", body: "Message", bodyHint: "{{name}} likhein, customer ka naam bhar jayega.",
    segment: "Kise", segmentHelp: "Jo sab shartein poori karein.", kind: "Type", anyKind: "Sab", tags: "Tags (comma se)", source: "Kahan se aaye", owner: "Kiske paas", project: "Project", stage: "Deal stage", any: "Koi bhi",
    preview: "Kitno tak pahunchega", reach: (r, s) => `${r} tak pahunchega · ${s} chhootenge (opt-out, pata nahi, dohrav)`, save: "Save karein", cancel: "Radd karein", send: "Abhi bhejein", sendConfirm: "Bhejne ke baad wapas nahi hoga.", sending: "Bheja ja raha hai",
    statuses: { draft: "Draft", scheduled: "Tay", sending: "Bheja ja raha", sent: "Bheja", partially_failed: "Kuch nahi gaye", cancelled: "Radd" },
    recipientStatuses: { queued: "Line mein", sent: "Bheja", delivered: "Pahuncha", failed: "Nahi gaya", replied: "Jawab aaya", suppressed: "Chhoda" },
    recipients: "Kinhe", noRecipients: "Abhi kisi ko nahi", counts: (s, f, su, r) => `${s} bheje · ${f} nahi gaye · ${su} chhode · ${r} jawab`, empty: "Abhi koi campaign nahi", emptyHelp: "Pehle ek template banayein, phir campaign.",
    templateFields: { providerName: "Provider mein template ka naam", providerNameHint: "WhatsApp Manager mein approved naam", language: "Language code", status: "Status", statuses: { draft: "Draft", approved: "Approved", rejected: "Rejected" }, approvedHint: "WhatsApp sirf approved template se jaata hai." },
    optOut: { email: "Email nahi chahiye", whatsapp: "WhatsApp nahi chahiye", on: "Haan", off: "Nahi" }, replies: "Jawab",
    errors: { notAllowed: "Yeh aap nahi kar sakte.", moduleOff: "Campaigns is business mein chalu nahi hain.", badInput: "Kuch jaankari sahi nahi hai.", notFound: "Nahi mila.", generic: "Nahi hua. Phir koshish karein.", needTemplate: "WhatsApp ke liye approved template chunein.", needBody: "Message likhein ya template chunein.", alreadySent: "Yeh pehle bheja ja chuka hai.", templateNotApproved: "Template approved nahi hai.", emptySegment: "Is chunav mein koi nahi.", nameTaken: "Is naam ka template pehle se hai." },
  },
  en: {
    title: "Campaigns", subtitle: "Approved messages to chosen customers, and every reply back in the customer's timeline.", newCampaign: "New campaign", templates: "Templates", newTemplate: "New template",
    name: "Name", channel: "Channel", channels: { email: "Email", whatsapp: "WhatsApp" }, template: "Template", noTemplate: "No template (email only)", subject: "Subject", body: "Message", bodyHint: "Write {{name}} and the customer's name fills in.",
    segment: "Who", segmentHelp: "Everyone who matches all of these.", kind: "Kind", anyKind: "Everyone", tags: "Tags (comma-separated)", source: "Source", owner: "Owner", project: "Project", stage: "Deal stage", any: "Any",
    preview: "Reach", reach: (r, s) => `Reaches ${r} · ${s} left out (opted out, no address, duplicates)`, save: "Save", cancel: "Cancel", send: "Send now", sendConfirm: "Sending cannot be undone.", sending: "Sending",
    statuses: { draft: "Draft", scheduled: "Scheduled", sending: "Sending", sent: "Sent", partially_failed: "Some failed", cancelled: "Cancelled" },
    recipientStatuses: { queued: "Queued", sent: "Sent", delivered: "Delivered", failed: "Failed", replied: "Replied", suppressed: "Left out" },
    recipients: "Recipients", noRecipients: "Nobody yet", counts: (s, f, su, r) => `${s} sent · ${f} failed · ${su} left out · ${r} replied`, empty: "No campaigns yet", emptyHelp: "Make a template first, then a campaign.",
    templateFields: { providerName: "Template name at the provider", providerNameHint: "The name approved in WhatsApp Manager", language: "Language code", status: "Status", statuses: { draft: "Draft", approved: "Approved", rejected: "Rejected" }, approvedHint: "WhatsApp only sends approved templates." },
    optOut: { email: "No email", whatsapp: "No WhatsApp", on: "Yes", off: "No" }, replies: "Replies",
    errors: { notAllowed: "You cannot do that.", moduleOff: "Campaigns are not switched on for this business.", badInput: "Some of that is not right.", notFound: "Not found.", generic: "That did not go through. Try again.", needTemplate: "Choose an approved template for WhatsApp.", needBody: "Write a message or choose a template.", alreadySent: "This was already sent.", templateNotApproved: "The template is not approved.", emptySegment: "Nobody matches this selection.", nameTaken: "A template with that name already exists." },
  },
};

export function getCampaigns(locale: Locale): CampaignsCopy {
  return copy[locale];
}
