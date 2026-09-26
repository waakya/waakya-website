import type { Locale } from "./locales";

/** Copy for vendors and the work they deliver. Same rules as every dictionary. */
export interface VendorsCopy {
  title: string;
  subtitle: string;
  newVendor: string;
  fields: { name: string; phone: string; email: string; category: string; gstin: string; notes: string; status: string };
  status: { active: string; inactive: string };
  empty: string;
  emptyHelp: string;
  work: {
    title: string;
    assign: string;
    what: string;
    details: string;
    amount: string;
    dueDate: string;
    project: string;
    record: string;
    owner: string;
    ownerHint: string;
    customerVisible: string;
    onSubmit: string;
    onVerify: string;
    noChange: string;
    save: string;
    cancel: string;
    empty: string;
    statuses: Record<"assigned" | "in_progress" | "submitted" | "verified" | "rejected", string>;
    payment: Record<"unpaid" | "partial" | "paid", string>;
    start: string;
    submit: string;
    submitNote: string;
    verify: string;
    reject: string;
    rejectNote: string;
    late: string;
    proofs: string;
    noProofs: string;
    internalTask: string;
  };
  payments: { title: string; record: string; amount: string; date: string; note: string; paid: (paid: string, total: string) => string; none: string };
  errors: { notAllowed: string; moduleOff: string; badInput: string; notFound: string; generic: string; notSubmitted: string; needNote: string };
  today: { toVerify: string; late: string; open: string };
}

const copy: Record<Locale, VendorsCopy> = {
  hi: {
    title: "वेंडर", subtitle: "कौन क्या बना रहा है, कितने में, कब तक, और क्या भुगतान हुआ।", newVendor: "नया वेंडर",
    fields: { name: "नाम", phone: "फ़ोन", email: "ईमेल", category: "काम का प्रकार", gstin: "GSTIN", notes: "नोट", status: "स्टेटस" },
    status: { active: "चालू", inactive: "बंद" }, empty: "अभी कोई वेंडर नहीं", emptyHelp: "पहला वेंडर जोड़ें, फिर उसे प्रोजेक्ट का काम दें।",
    work: {
      title: "वेंडर का काम", assign: "काम दें", what: "क्या काम", details: "थोड़ा और", amount: "रकम", dueDate: "कब तक", project: "प्रोजेक्ट", record: "रिकॉर्ड", owner: "अंदर कौन देखेगा", ownerHint: "इस व्यक्ति को एक काम मिलेगा: वेंडर से काम लेकर सबूत के साथ भेजना।",
      customerVisible: "पूरा होने पर ग्राहक को बताएँ", onSubmit: "भेजने पर रिकॉर्ड स्टेटस", onVerify: "वेरिफ़ाई पर रिकॉर्ड स्टेटस", noChange: "कोई बदलाव नहीं", save: "सेव करें", cancel: "रहने दें", empty: "अभी कोई काम नहीं दिया",
      statuses: { assigned: "दिया गया", in_progress: "चल रहा", submitted: "भेजा, जाँच बाकी", verified: "वेरिफ़ाई", rejected: "वापस भेजा" },
      payment: { unpaid: "भुगतान बाकी", partial: "आंशिक भुगतान", paid: "भुगतान हुआ" },
      start: "शुरू हुआ", submit: "जाँच के लिए भेजें", submitNote: "क्या हुआ (सबूत काम पर लगाएँ)", verify: "वेरिफ़ाई करें", reject: "वापस भेजें", rejectNote: "क्या ठीक करना है", late: "लेट", proofs: "सबूत", noProofs: "अभी कोई सबूत नहीं", internalTask: "अंदर का काम",
    },
    payments: { title: "भुगतान", record: "भुगतान दर्ज करें", amount: "रकम", date: "तारीख़", note: "नोट", paid: (p, t) => `${p} / ${t} चुकाया`, none: "अभी कोई भुगतान नहीं" },
    errors: { notAllowed: "यह आप नहीं कर सकते।", moduleOff: "वेंडर इस कारोबार में चालू नहीं हैं।", badInput: "कुछ जानकारी सही नहीं है।", notFound: "नहीं मिला।", generic: "नहीं हुआ। फिर कोशिश करें।", notSubmitted: "पहले काम भेजा जाए, फिर जाँच।", needNote: "वापस भेजने की वजह लिखें।" },
    today: { toVerify: "वेंडर काम जाँचना है", late: "वेंडर लेट", open: "खोलें" },
  },
  "hi-Latn": {
    title: "Vendors", subtitle: "Kaun kya bana raha hai, kitne mein, kab tak, aur kya payment hua.", newVendor: "Naya vendor",
    fields: { name: "Naam", phone: "Phone", email: "Email", category: "Kaam ka type", gstin: "GSTIN", notes: "Note", status: "Status" },
    status: { active: "Chalu", inactive: "Band" }, empty: "Abhi koi vendor nahi", emptyHelp: "Pehla vendor jodein, phir use project ka kaam dein.",
    work: {
      title: "Vendor ka kaam", assign: "Kaam dein", what: "Kya kaam", details: "Thoda aur", amount: "Rakam", dueDate: "Kab tak", project: "Project", record: "Record", owner: "Andar kaun dekhega", ownerHint: "Is insaan ko ek kaam milega: vendor se kaam lekar proof ke saath bhejna.",
      customerVisible: "Poora hone par customer ko batayein", onSubmit: "Bhejne par record status", onVerify: "Verify par record status", noChange: "Koi badlav nahi", save: "Save karein", cancel: "Rehne dein", empty: "Abhi koi kaam nahi diya",
      statuses: { assigned: "Diya gaya", in_progress: "Chal raha", submitted: "Bheja, jaanch baaki", verified: "Verified", rejected: "Wapas bheja" },
      payment: { unpaid: "Payment baaki", partial: "Partial payment", paid: "Payment hua" },
      start: "Shuru hua", submit: "Jaanch ke liye bhejein", submitNote: "Kya hua (proof kaam par lagayein)", verify: "Verify karein", reject: "Wapas bhejein", rejectNote: "Kya theek karna hai", late: "Late", proofs: "Proof", noProofs: "Abhi koi proof nahi", internalTask: "Andar ka kaam",
    },
    payments: { title: "Payments", record: "Payment likhein", amount: "Rakam", date: "Tareekh", note: "Note", paid: (p, t) => `${p} / ${t} chukaya`, none: "Abhi koi payment nahi" },
    errors: { notAllowed: "Yeh aap nahi kar sakte.", moduleOff: "Vendors is business mein chalu nahi hain.", badInput: "Kuch jaankari sahi nahi hai.", notFound: "Nahi mila.", generic: "Nahi hua. Phir koshish karein.", notSubmitted: "Pehle kaam bheja jaaye, phir jaanch.", needNote: "Wapas bhejne ki wajah likhein." },
    today: { toVerify: "Vendor kaam jaanchna hai", late: "Vendor late", open: "Kholein" },
  },
  en: {
    title: "Vendors", subtitle: "Who is making what, for how much, by when, and what has been paid.", newVendor: "New vendor",
    fields: { name: "Name", phone: "Phone", email: "Email", category: "Kind of work", gstin: "GSTIN", notes: "Notes", status: "Status" },
    status: { active: "Active", inactive: "Inactive" }, empty: "No vendors yet", emptyHelp: "Add the first vendor, then give them work on a project.",
    work: {
      title: "Vendor work", assign: "Assign work", what: "What", details: "Details", amount: "Amount", dueDate: "Due", project: "Project", record: "Record", owner: "Owner inside the business", ownerHint: "This person gets a task: collect the work from the vendor and submit it with proof.",
      customerVisible: "Tell the customer when verified", onSubmit: "Record status on submit", onVerify: "Record status on verify", noChange: "No change", save: "Save", cancel: "Cancel", empty: "No work assigned yet",
      statuses: { assigned: "Assigned", in_progress: "In progress", submitted: "Submitted, to verify", verified: "Verified", rejected: "Sent back" },
      payment: { unpaid: "Unpaid", partial: "Partly paid", paid: "Paid" },
      start: "Started", submit: "Submit for verification", submitNote: "What was done (attach proof on the task)", verify: "Verify", reject: "Send back", rejectNote: "What needs fixing", late: "Late", proofs: "Proof", noProofs: "No proof yet", internalTask: "Internal task",
    },
    payments: { title: "Payments", record: "Record a payment", amount: "Amount", date: "Date", note: "Note", paid: (p, t) => `${p} of ${t} paid`, none: "No payments yet" },
    errors: { notAllowed: "You cannot do that.", moduleOff: "Vendors are not switched on for this business.", badInput: "Some of that is not right.", notFound: "Not found.", generic: "That did not go through. Try again.", notSubmitted: "Work is verified after it is submitted.", needNote: "Say what needs fixing." },
    today: { toVerify: "Vendor work to verify", late: "Vendors late", open: "Open" },
  },
};

export function getVendors(locale: Locale): VendorsCopy {
  return copy[locale];
}
