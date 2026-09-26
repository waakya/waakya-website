import type { Locale } from "./locales";
import type { ModuleKey } from "@/lib/modules/catalog";

/**
 * Copy for the platform layer: modules, history and where a task came from.
 * Same rules as every dictionary: no brand name inside a string, Latin
 * digits, no exclamation marks.
 */
export interface PlatformCopy {
  modules: {
    title: string;
    subtitle: string;
    on: string;
    off: string;
    alwaysOn: string;
    needs: (names: string) => string;
    areas: Record<"core" | "operations" | "customers" | "growth" | "platform", string>;
    names: Record<ModuleKey, string>;
    descriptions: Record<ModuleKey, string>;
    presets: { title: string; help: string; real_estate_sales: string; interior_projects: string; minimal: string; apply: string };
    errors: {
      notAllowed: string;
      unknown: string;
      core: string;
      generic: string;
      needsFirst: (names: string) => string;
      stillUsedBy: (names: string) => string;
    };
  };
  audit: {
    title: string;
    subtitle: string;
    empty: string;
    by: (name: string) => string;
    system: string;
    automation: string;
    integration: string;
    customer: string;
    filterAll: string;
    loadMore: string;
  };
  switchOrg: { title: string; help: string; current: string };
  origin: {
    title: string;
    manual: string;
    conversation: string;
    checklist: string;
    crm: string;
    project: string;
    approval: string;
    automation: string;
    customer_action: string;
    vendor_action: string;
    integration: string;
  };
  today: {
    needsYou: string;
    approvalsWaiting: (n: number) => string;
    decisionsOpen: (n: number) => string;
    customerMessages: (n: number) => string;
    vendorToVerify: (n: number) => string;
    vendorLate: (n: number) => string;
    followUpsDue: (n: number) => string;
    leadsUnassigned: (n: number) => string;
    automationsFailed: (n: number) => string;
  };
}

const names: Record<Locale, Record<ModuleKey, string>> = {
  hi: {
    today: "आज", conversations: "बात", work: "काम", projects: "प्रोजेक्ट", documents: "दस्तावेज़",
    approvals: "मंज़ूरी", team: "टीम", search: "खोज", notifications: "ख़बर", attendance: "हाज़िरी",
    checklists: "रोज़ का काम", crm: "ग्राहक (CRM)", records: "रिकॉर्ड", vendors: "वेंडर",
    customer_experience: "ग्राहक पोर्टल", automation: "ऑटोमेशन", website_integration: "वेबसाइट लीड",
    campaigns: "कैंपेन", custom_domains: "अपना डोमेन",
  },
  "hi-Latn": {
    today: "Aaj", conversations: "Baat", work: "Kaam", projects: "Projects", documents: "Documents",
    approvals: "Manzoori", team: "Team", search: "Khoj", notifications: "Khabar", attendance: "Hazri",
    checklists: "Roz ka kaam", crm: "Customers (CRM)", records: "Records", vendors: "Vendors",
    customer_experience: "Customer portal", automation: "Automation", website_integration: "Website leads",
    campaigns: "Campaigns", custom_domains: "Apna domain",
  },
  en: {
    today: "Today", conversations: "Conversations", work: "Work", projects: "Projects", documents: "Documents",
    approvals: "Approvals", team: "Team", search: "Search", notifications: "Updates", attendance: "Attendance",
    checklists: "Daily routines", crm: "Customers (CRM)", records: "Records", vendors: "Vendors",
    customer_experience: "Customer portal", automation: "Automation", website_integration: "Website leads",
    campaigns: "Campaigns", custom_domains: "Custom domain",
  },
};

const descriptions: Record<Locale, Record<ModuleKey, string>> = {
  hi: {
    today: "जो आज आपका ध्यान चाहता है।", conversations: "टीम से बात, जो काम बन जाती है।", work: "हर काम, उसकी मंज़ूरी और सबूत।",
    projects: "एक ग्राहक का पूरा काम एक जगह।", documents: "कागज़ात, टेम्पलेट और फ़ाइलें।", approvals: "जो पूछा गया और जो तय हुआ।",
    team: "लोग, भूमिकाएँ और न्योते।", search: "पूरे कारोबार में खोज।", notifications: "जो हुआ, आपके इनबॉक्स में।",
    attendance: "हाज़िरी, छुट्टी और अवकाश।", checklists: "रोज़ खुलने-बंद होने के काम अपने आप बनें।",
    crm: "ग्राहक कहाँ से आए, किसके पास हैं, आगे क्या।", records: "प्रॉपर्टी, वर्क पैकेज या कोई भी सूची, अपनी बनावट के साथ।",
    vendors: "वेंडर, उनका काम, भुगतान और सबूत।", customer_experience: "ग्राहक अपना प्रोजेक्ट देखे, वही जो आप दिखाएँ।",
    automation: "जब ऐसा हो, तो ये करो।", website_integration: "वेबसाइट की पूछताछ सीधे ग्राहक सूची में।",
    campaigns: "मंज़ूर किए संदेश चुने हुए ग्राहकों को।", custom_domains: "ग्राहक पोर्टल आपके अपने डोमेन पर।",
  },
  "hi-Latn": {
    today: "Jo aaj aapka dhyan chahta hai.", conversations: "Team se baat, jo kaam ban jaati hai.", work: "Har kaam, uski manzoori aur saboot.",
    projects: "Ek customer ka poora kaam ek jagah.", documents: "Kagzaat, templates aur files.", approvals: "Jo poocha gaya aur jo tay hua.",
    team: "Log, roles aur invites.", search: "Poore business mein khoj.", notifications: "Jo hua, aapke inbox mein.",
    attendance: "Hazri, chhutti aur holidays.", checklists: "Roz ke opening-closing kaam apne aap banein.",
    crm: "Customer kahan se aaya, kiske paas hai, aage kya.", records: "Property, work package ya koi bhi list, apni banavat ke saath.",
    vendors: "Vendors, unka kaam, payment aur proof.", customer_experience: "Customer apna project dekhe, wahi jo aap dikhayein.",
    automation: "Jab aisa ho, to yeh karo.", website_integration: "Website ki enquiry seedhe customer list mein.",
    campaigns: "Approved messages chune hue customers ko.", custom_domains: "Customer portal aapke apne domain par.",
  },
  en: {
    today: "What needs your attention today.", conversations: "Talk with the team; talk becomes work.", work: "Every task, its acceptance and its proof.",
    projects: "One customer's whole job in one place.", documents: "Papers, templates and files.", approvals: "What was asked and what was decided.",
    team: "People, roles and invites.", search: "Search across the business.", notifications: "What happened, in your inbox.",
    attendance: "Attendance, leave and holidays.", checklists: "Daily opening and closing work created on its own.",
    crm: "Where customers came from, who owns them, what happens next.", records: "Properties, work packages or any list, shaped your way.",
    vendors: "Vendors, their work, payments and proof.", customer_experience: "Customers see their project, and only what you show.",
    automation: "When this happens, do that.", website_integration: "Website enquiries straight into the customer list.",
    campaigns: "Approved messages to chosen customers.", custom_domains: "The customer portal on your own domain.",
  },
};

const copy: Record<Locale, PlatformCopy> = {
  hi: {
    modules: {
      title: "क्षमताएँ", subtitle: "आपका कारोबार क्या-क्या इस्तेमाल करता है। बंद करने पर डेटा नहीं मिटता।",
      on: "चालू", off: "बंद", alwaysOn: "हमेशा चालू", needs: (n) => `पहले चाहिए: ${n}`,
      areas: { core: "बुनियादी", operations: "काम-काज", customers: "ग्राहक", growth: "बढ़त", platform: "प्लेटफ़ॉर्म" },
      names: names.hi, descriptions: descriptions.hi,
      presets: { title: "तैयार सेटअप", help: "एक तरह के कारोबार की क्षमताएँ एक साथ चालू करें।", real_estate_sales: "प्रॉपर्टी बिक्री", interior_projects: "इंटीरियर प्रोजेक्ट", minimal: "सिर्फ़ बुनियादी", apply: "चालू करें" },
      errors: {
        notAllowed: "सिर्फ़ मालिक या एडमिन क्षमताएँ बदल सकते हैं।", unknown: "यह क्षमता नहीं मिली।", core: "यह हमेशा चालू रहती है।",
        generic: "बदलाव नहीं हुआ। फिर कोशिश करें।", needsFirst: (n) => `पहले चालू करें: ${n}`, stillUsedBy: (n) => `पहले बंद करें: ${n}`,
      },
    },
    audit: {
      title: "इतिहास", subtitle: "कारोबार में जो बदला, किसने और कब।", empty: "अभी कोई बदलाव दर्ज नहीं।",
      by: (n) => `${n} ने`, system: "सिस्टम", automation: "ऑटोमेशन", integration: "वेबसाइट", customer: "ग्राहक", filterAll: "सब", loadMore: "और देखें",
    },
    switchOrg: { title: "कारोबार बदलें", help: "आप एक से ज़्यादा कारोबार में हैं।", current: "अभी यहाँ" },
    origin: {
      title: "यह काम कहाँ से आया", manual: "सीधे बनाया गया", conversation: "बातचीत से", checklist: "रोज़ के काम से", crm: "ग्राहक से",
      project: "प्रोजेक्ट से", approval: "मंज़ूरी से", automation: "ऑटोमेशन से", customer_action: "ग्राहक के फ़ैसले से", vendor_action: "वेंडर के काम से", integration: "वेबसाइट से",
    },
    today: {
      needsYou: "आपका ध्यान चाहिए", approvalsWaiting: (n) => `${n} मंज़ूरी बाकी`, decisionsOpen: (n) => `${n} ग्राहक फ़ैसले बाकी`,
      customerMessages: (n) => `${n} ग्राहक संदेश बिना जवाब`, vendorToVerify: (n) => `${n} वेंडर काम जाँचना है`, vendorLate: (n) => `${n} वेंडर लेट`,
      followUpsDue: (n) => `${n} फ़ॉलो-अप आज`, leadsUnassigned: (n) => `${n} नई पूछताछ बिना मालिक`, automationsFailed: (n) => `${n} ऑटोमेशन रुके`,
    },
  },
  "hi-Latn": {
    modules: {
      title: "Capabilities", subtitle: "Aapka business kya-kya istemaal karta hai. Band karne par data nahi mitta.",
      on: "Chalu", off: "Band", alwaysOn: "Hamesha chalu", needs: (n) => `Pehle chahiye: ${n}`,
      areas: { core: "Buniyadi", operations: "Kaam-kaaj", customers: "Customers", growth: "Growth", platform: "Platform" },
      names: names["hi-Latn"], descriptions: descriptions["hi-Latn"],
      presets: { title: "Ready setup", help: "Ek tarah ke business ki capabilities ek saath chalu karein.", real_estate_sales: "Property sales", interior_projects: "Interior projects", minimal: "Sirf buniyadi", apply: "Chalu karein" },
      errors: {
        notAllowed: "Sirf owner ya admin capabilities badal sakte hain.", unknown: "Yeh capability nahi mili.", core: "Yeh hamesha chalu rehti hai.",
        generic: "Badlav nahi hua. Phir koshish karein.", needsFirst: (n) => `Pehle chalu karein: ${n}`, stillUsedBy: (n) => `Pehle band karein: ${n}`,
      },
    },
    audit: {
      title: "History", subtitle: "Business mein jo badla, kisne aur kab.", empty: "Abhi koi badlav darj nahi.",
      by: (n) => `${n} ne`, system: "System", automation: "Automation", integration: "Website", customer: "Customer", filterAll: "Sab", loadMore: "Aur dekhein",
    },
    switchOrg: { title: "Business badlein", help: "Aap ek se zyada business mein hain.", current: "Abhi yahan" },
    origin: {
      title: "Yeh kaam kahan se aaya", manual: "Seedhe banaya gaya", conversation: "Baat se", checklist: "Roz ke kaam se", crm: "Customer se",
      project: "Project se", approval: "Manzoori se", automation: "Automation se", customer_action: "Customer ke faisle se", vendor_action: "Vendor ke kaam se", integration: "Website se",
    },
    today: {
      needsYou: "Aapka dhyan chahiye", approvalsWaiting: (n) => `${n} manzoori baaki`, decisionsOpen: (n) => `${n} customer faisle baaki`,
      customerMessages: (n) => `${n} customer message bina jawab`, vendorToVerify: (n) => `${n} vendor kaam jaanchna hai`, vendorLate: (n) => `${n} vendor late`,
      followUpsDue: (n) => `${n} follow-up aaj`, leadsUnassigned: (n) => `${n} nayi enquiry bina owner`, automationsFailed: (n) => `${n} automation ruke`,
    },
  },
  en: {
    modules: {
      title: "Capabilities", subtitle: "What your business uses. Turning something off keeps its data.",
      on: "On", off: "Off", alwaysOn: "Always on", needs: (n) => `Needs: ${n}`,
      areas: { core: "Core", operations: "Operations", customers: "Customers", growth: "Growth", platform: "Platform" },
      names: names.en, descriptions: descriptions.en,
      presets: { title: "Ready-made setup", help: "Turn on the capabilities one kind of business uses, together.", real_estate_sales: "Property sales", interior_projects: "Interior projects", minimal: "Core only", apply: "Turn on" },
      errors: {
        notAllowed: "Only an owner or admin can change capabilities.", unknown: "That capability was not found.", core: "That is always on.",
        generic: "The change was not saved. Try again.", needsFirst: (n) => `Turn on first: ${n}`, stillUsedBy: (n) => `Turn off first: ${n}`,
      },
    },
    audit: {
      title: "History", subtitle: "What changed in the business, by whom and when.", empty: "No changes recorded yet.",
      by: (n) => `${n}`, system: "System", automation: "Automation", integration: "Website", customer: "Customer", filterAll: "All", loadMore: "Show more",
    },
    switchOrg: { title: "Switch business", help: "You belong to more than one business.", current: "Working here" },
    origin: {
      title: "Why this task exists", manual: "Created directly", conversation: "From a conversation", checklist: "From a daily routine", crm: "From a customer",
      project: "From a project", approval: "From an approval", automation: "From an automation", customer_action: "From a customer decision", vendor_action: "From vendor work", integration: "From the website",
    },
    today: {
      needsYou: "Needs you", approvalsWaiting: (n) => `${n} approvals waiting`, decisionsOpen: (n) => `${n} customer decisions open`,
      customerMessages: (n) => `${n} customer messages unanswered`, vendorToVerify: (n) => `${n} vendor jobs to verify`, vendorLate: (n) => `${n} vendors late`,
      followUpsDue: (n) => `${n} follow-ups due`, leadsUnassigned: (n) => `${n} new enquiries unassigned`, automationsFailed: (n) => `${n} automations stopped`,
    },
  },
};

export function getPlatform(locale: Locale): PlatformCopy {
  return copy[locale];
}

export const platformCopy = copy;
