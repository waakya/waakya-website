import type { Locale } from "./locales";

/**
 * The marketing page's copy.
 *
 * It lives beside the product dictionary rather than inside it because it is a
 * different kind of writing with a different audience — but it obeys the same
 * rules: the fixed vocabulary, no exclamation marks, no emoji, Latin digits,
 * and the brand name interpolated rather than typed in (`lib/i18n/brand.ts`).
 *
 * It also describes **what v1 actually does**. The brand kit's landing leans on
 * voice capture and a WhatsApp bot; neither ships in v1, so anything not built
 * is either absent or marked as coming. A landing page that promises a feature
 * the product does not have is the same lie as a task marked done before the
 * photo arrives.
 */
export interface LandingCopy {
  navHow: string;
  navWho: string;
  navPrice: string;
  navFaq: string;
  navLogin: string;
  heroBadge: string;
  heroTitle: string;
  heroLead: string;
  heroCta: string;
  heroCtaSecondary: string;
  heroNote: string;
  ladderTitle: string;
  ladderLead: string;
  ladder: { word: string; note: string }[];
  problemTitle: string;
  problemLead: string;
  problems: { title: string; body: string }[];
  problemFooter: (brand: string) => string;
  stepsTitle: string;
  steps: { title: string; body: string }[];
  featuresTitle: string;
  features: { title: string; body: string }[];
  whatsappTitle: string;
  whatsappLead: (brand: string) => string;
  whatsapp: { title: string; body: string; soon?: boolean }[];
  soonLabel: string;
  whoTitle: string;
  whoLead: string;
  who: { title: string; body: string; quote: string }[];
  priceTitle: string;
  priceLead: string;
  plans: {
    name: string;
    price: string;
    per: string;
    badge?: string;
    features: string[];
    cta: string;
  }[];
  priceNote: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
  finalTitle: string;
  finalLead: string;
  finalCta: string;
  footerTagline: string;
  footerPrivacy: string;
  footerLogin: string;
}

export const landing: Record<Locale, LandingCopy> = {
  "hi-Latn": {
    navHow: "Kaise chalta hai",
    navWho: "Kiske liye",
    navPrice: "Price",
    navFaq: "Sawaal",
    navLogin: "Login",
    heroBadge: "Indian MSMEs ke liye · Hindi, Hinglish, English",
    heroTitle: "Bolo. Ho jayega.",
    heroLead:
      "Kaam bhejiye. Staff ke phone pe pahunchta hai, dekha jaata hai, aur ho jaane par photo ke saath wapas aata hai. Har kadam samay ke saath record mein.",
    heroCta: "Shuru karein",
    heroCtaSecondary: "Kaise chalta hai",
    heroNote: "Card ki zaroorat nahi. Staff ko sirf ek link chahiye.",
    ladderTitle: "Har kaam ka ek hi raasta",
    ladderLead:
      "Do lakeerein aur ek tick. Ek baar seekh lijiye, phir har kaam ki haalat ek nazar mein.",
    ladder: [
      { word: "Bheja", note: "Owner ne bola" },
      { word: "Dekh liya", note: "Staff ne dekha" },
      { word: "Ho jayega", note: "Staff ne maana" },
      { word: "Ho gaya", note: "Photo ke saath" },
      { word: "Verified", note: "Owner ne check kiya" },
    ],
    problemTitle: "WhatsApp group mein bola. Phir?",
    problemLead: "Business group mein chala hai. Kaam group mein kho bhi jaata hai.",
    problems: [
      {
        title: "Message upar chala gaya",
        body: "Group mein 40 message aaye. Aapka kaam 12th hai. Kisi ne scroll nahi kiya.",
      },
      {
        title: "Kisne dekha, pata nahi",
        body: "Blue tick group ka hota hai, aadmi ka nahi. Dekha ya nahi, maana ya nahi, koi record nahi.",
      },
      {
        title: "Hua ki nahi? Call karke pucho",
        body: "Shaam ko wahi sawaal: hua? Har kaam ke liye ek call. Har din.",
      },
    ],
    problemFooter: (brand) =>
      `${brand} group ko hataata nahi. Jo group mein kaha, use hone tak le jaata hai.`,
    stepsTitle: "Teen kadam. Har baar.",
    steps: [
      {
        title: "Kaam bhejo",
        body: "Kisko, kya, kab tak. Ek card pe teen nazar, phir Bhejo. Photo chahiye to switch on.",
      },
      {
        title: "Dekh liya, ho jayega",
        body: "Staff ke phone pe ek bada button. Dabate hi do baatein pakki: dekh liya, aur ho jayega.",
      },
      {
        title: "Ho gaya, photo ke saath",
        body: "Kaam khatam, photo attach, done. Aapko puchna nahi padta; aap verify karte hain.",
      },
    ],
    featuresTitle: "Jo puchna padta tha, ab dikh jaata hai",
    features: [
      {
        title: "Ghadi chalti hai",
        body: "Har kaam pe do ghadi: dekhne ki, khatam karne ki. 50% aur 90% pe staff ko yaad. Late pe aapko.",
      },
      {
        title: "Photo proof",
        body: "Jo hua, dikhe. Photo, awaaz ya likh ke. Record mein rehta hai, bahas khatam.",
      },
      {
        title: "Roz ki checklist",
        body: "Opening, closing, stock count. Roz subah apne aap staff ke phone pe.",
      },
      {
        title: "Hafte ka hisaab",
        body: "Kaun samay pe, kaun late. Ek screen, koi report banani nahi.",
      },
    ],
    whatsappTitle: "WhatsApp ke saath. WhatsApp ke khilaaf nahi.",
    whatsappLead: (brand) =>
      `Aapki team WhatsApp pe hai. ${brand} wahin se shuru hota hai.`,
    whatsapp: [
      {
        title: "Invite WhatsApp se",
        body: "Staff ko aap apne number se link bhejte ho. Koi app store nahi, koi password nahi.",
      },
      {
        title: "Shaam ka hisaab, group mein",
        body: "8 baje ek card: kitne kaam, kitne hue, kaun late. Ek tap se group mein.",
        soon: true,
      },
      {
        title: "Stickers aur voice note",
        body: '"Dekh liya", "Ho gaya" stickers, aur WhatsApp se seedha kaam dena.',
        soon: true,
      },
    ],
    soonLabel: "Jald",
    whoTitle: "Kiske liye",
    whoLead: "Jahaan owner bolta hai aur team karti hai. 3 se 30 log tak.",
    who: [
      {
        title: "Property brokers",
        body: "Site visit, photos, client follow-up. Aap gaadi mein, team field mein.",
        quote: '"Raju, Sector 62 wale flat ki photo 5 baje tak."',
      },
      {
        title: "Retail stores",
        body: "Opening, closing, stock count. Roz ka wahi kaam, roz ka wahi sawaal.",
        quote: '"Amit, godown stock count 11 baje tak."',
      },
      {
        title: "Service businesses",
        body: "Salon, repair, clinic. Har din alag kaam, safai wahi.",
        quote: '"Pooja, Verma ji ko confirm kar do."',
      },
    ],
    priceTitle: "Ek chai se kam, roz",
    priceLead: "Pilot mein 14 din free. Pilot ke baad hi paisa.",
    plans: [
      {
        name: "Starter",
        price: "499",
        per: "mahina",
        badge: "Pilot price",
        features: [
          "1 owner, 5 staff tak",
          "Unlimited kaam",
          "Awaaz se kaam do",
          "Photo proof",
          "Hindi, Hinglish, English",
        ],
        cta: "14 din free shuru karein",
      },
      {
        name: "Growth",
        price: "1,499",
        per: "mahina",
        badge: "Pilot price",
        features: [
          "15 staff tak, 2 owners",
          "Sab kuch Starter ka",
          "Roz ki checklist",
          "Hafte ka hisaab",
          "WhatsApp share",
        ],
        cta: "14 din free shuru karein",
      },
    ],
    priceNote: "Card nahi chahiye. UPI se pay.",
    faqTitle: "Sawaal jo sab puchte hain",
    faq: [
      {
        q: "Staff ko app install karni padegi?",
        a: "Nahi. Aap link bhejte ho, woh link khulta hai, home screen pe lag jaata hai. Ek minute.",
      },
      {
        q: "Hindi mein chalega?",
        a: "Haan. Hindi, Hinglish aur English, teeno. Staff apni bhasha khud chun sakta hai.",
      },
      {
        q: "Internet slow ho to?",
        a: "Kaam khulne mein bhaari nahi hai. Photo bheji jaati hai jab line milti hai.",
      },
      {
        q: "Mera data safe hai?",
        a: "Aapka data sirf aapke business ke log dekh sakte hain. Kisi ko becha nahi jaata. DPDP Act ke hisaab se.",
      },
      {
        q: "Chhodna ho to?",
        a: "Jab chahe. Mahine ka plan hai, saal ka nahi. Data export karke le jaiye.",
      },
    ],
    finalTitle: "Pehla kaam aaj bhejo. Haldi tick shaam tak.",
    finalLead:
      "14 din free. Ek kaam bhejiye, ek staff bulaiye, aur dekhiye ki shaam ko puchna nahi padta.",
    finalCta: "Shuru karein",
    footerTagline: "Bolo. Ho jayega.",
    footerPrivacy: "Privacy",
    footerLogin: "Login",
  },

  hi: {
    navHow: "कैसे चलता है",
    navWho: "किसके लिए",
    navPrice: "कीमत",
    navFaq: "सवाल",
    navLogin: "लॉगिन",
    heroBadge: "भारतीय छोटे बिज़नेस के लिए · हिंदी, Hinglish, English",
    heroTitle: "बोलो। हो जाएगा।",
    heroLead:
      "काम भेजिए। स्टाफ़ के फ़ोन पे पहुँचता है, देखा जाता है, और हो जाने पर फ़ोटो के साथ वापस आता है। हर कदम समय के साथ रिकॉर्ड में।",
    heroCta: "शुरू करें",
    heroCtaSecondary: "कैसे चलता है",
    heroNote: "कार्ड की ज़रूरत नहीं। स्टाफ़ को सिर्फ़ एक लिंक चाहिए।",
    ladderTitle: "हर काम का एक ही रास्ता",
    ladderLead:
      "दो लकीरें और एक टिक। एक बार सीख लीजिए, फिर हर काम की हालत एक नज़र में।",
    ladder: [
      { word: "भेजा", note: "मालिक ने कहा" },
      { word: "देख लिया", note: "स्टाफ़ ने देखा" },
      { word: "हो जाएगा", note: "स्टाफ़ ने माना" },
      { word: "हो गया", note: "फ़ोटो के साथ" },
      { word: "वेरिफ़ाई", note: "मालिक ने देखा" },
    ],
    problemTitle: "WhatsApp ग्रुप में कहा। फिर?",
    problemLead: "काम ग्रुप में चलता है। ग्रुप में खो भी जाता है।",
    problems: [
      {
        title: "मैसेज ऊपर चला गया",
        body: "ग्रुप में 40 मैसेज आए। आपका काम 12वें नंबर पे है। किसी ने स्क्रॉल नहीं किया।",
      },
      {
        title: "किसने देखा, पता नहीं",
        body: "ब्लू टिक ग्रुप का होता है, आदमी का नहीं। देखा या नहीं, माना या नहीं, कोई रिकॉर्ड नहीं।",
      },
      {
        title: "हुआ कि नहीं? कॉल करके पूछो",
        body: "शाम को वही सवाल: हुआ? हर काम के लिए एक कॉल। हर दिन।",
      },
    ],
    problemFooter: (brand) =>
      `${brand} ग्रुप को हटाता नहीं। जो ग्रुप में कहा, उसे होने तक ले जाता है।`,
    stepsTitle: "तीन कदम। हर बार।",
    steps: [
      {
        title: "काम भेजो",
        body: "किसको, क्या, कब तक। एक कार्ड पे तीन नज़र, फिर भेजो। फ़ोटो चाहिए तो स्विच ऑन।",
      },
      {
        title: "देख लिया, हो जाएगा",
        body: "स्टाफ़ के फ़ोन पे एक बड़ा बटन। दबाते ही दो बातें पक्की: देख लिया, और हो जाएगा।",
      },
      {
        title: "हो गया, फ़ोटो के साथ",
        body: "काम खत्म, फ़ोटो साथ में। आपको पूछना नहीं पड़ता; आप वेरिफ़ाई करते हैं।",
      },
    ],
    featuresTitle: "जो पूछना पड़ता था, अब दिख जाता है",
    features: [
      {
        title: "घड़ी चलती है",
        body: "हर काम पे दो घड़ी: देखने की, खत्म करने की। 50% और 90% पे स्टाफ़ को याद। लेट पे आपको।",
      },
      {
        title: "फ़ोटो प्रूफ़",
        body: "जो हुआ, दिखे। फ़ोटो, आवाज़ या लिख के। रिकॉर्ड में रहता है, बहस खत्म।",
      },
      {
        title: "रोज़ की चेकलिस्ट",
        body: "ओपनिंग, क्लोज़िंग, स्टॉक काउंट। रोज़ सुबह अपने आप स्टाफ़ के फ़ोन पे।",
      },
      {
        title: "हफ़्ते का हिसाब",
        body: "कौन समय पे, कौन लेट। एक स्क्रीन, कोई रिपोर्ट बनानी नहीं।",
      },
    ],
    whatsappTitle: "WhatsApp के साथ। WhatsApp के खिलाफ़ नहीं।",
    whatsappLead: (brand) =>
      `आपकी टीम WhatsApp पे है। ${brand} वहीं से शुरू होता है।`,
    whatsapp: [
      {
        title: "इनवाइट WhatsApp से",
        body: "स्टाफ़ को आप अपने नंबर से लिंक भेजते हैं। कोई ऐप स्टोर नहीं, कोई पासवर्ड नहीं।",
      },
      {
        title: "शाम का हिसाब, ग्रुप में",
        body: "8 बजे एक कार्ड: कितने काम, कितने हुए, कौन लेट। एक टैप से ग्रुप में।",
        soon: true,
      },
      {
        title: "स्टिकर और वॉइस नोट",
        body: '"देख लिया", "हो गया" स्टिकर, और WhatsApp से सीधा काम देना।',
        soon: true,
      },
    ],
    soonLabel: "जल्द",
    whoTitle: "किसके लिए",
    whoLead: "जहाँ मालिक बोलता है और टीम करती है। 3 से 30 लोग तक।",
    who: [
      {
        title: "प्रॉपर्टी ब्रोकर",
        body: "साइट विज़िट, फ़ोटो, क्लाइंट फ़ॉलो-अप। आप गाड़ी में, टीम फ़ील्ड में।",
        quote: '"राजू, सेक्टर 62 वाले फ़्लैट की फ़ोटो 5 बजे तक।"',
      },
      {
        title: "रिटेल स्टोर",
        body: "ओपनिंग, क्लोज़िंग, स्टॉक काउंट। रोज़ का वही काम, रोज़ का वही सवाल।",
        quote: '"अमित, गोदाम स्टॉक काउंट 11 बजे तक।"',
      },
      {
        title: "सर्विस बिज़नेस",
        body: "सैलून, रिपेयर, क्लिनिक। हर दिन अलग काम, सफ़ाई वही।",
        quote: '"पूजा, वर्मा जी को कन्फ़र्म कर दो।"',
      },
    ],
    priceTitle: "एक चाय से कम, रोज़",
    priceLead: "पायलट में 14 दिन फ्री। पायलट के बाद ही पैसा।",
    plans: [
      {
        name: "Starter",
        price: "499",
        per: "महीना",
        badge: "पायलट कीमत",
        features: [
          "1 मालिक, 5 स्टाफ़ तक",
          "काम की कोई सीमा नहीं",
          "आवाज़ से काम दो",
          "फ़ोटो प्रूफ़",
          "हिंदी, Hinglish, English",
        ],
        cta: "14 दिन फ्री शुरू करें",
      },
      {
        name: "Growth",
        price: "1,499",
        per: "महीना",
        badge: "पायलट कीमत",
        features: [
          "15 स्टाफ़ तक, 2 मालिक",
          "Starter का सब कुछ",
          "रोज़ की चेकलिस्ट",
          "हफ़्ते का हिसाब",
          "WhatsApp शेयर",
        ],
        cta: "14 दिन फ्री शुरू करें",
      },
    ],
    priceNote: "कार्ड नहीं चाहिए। UPI से पे।",
    faqTitle: "सवाल जो सब पूछते हैं",
    faq: [
      {
        q: "स्टाफ़ को ऐप इंस्टॉल करनी पड़ेगी?",
        a: "नहीं। आप लिंक भेजते हैं, वह लिंक खुलता है, होम स्क्रीन पे लग जाता है। एक मिनट।",
      },
      {
        q: "हिंदी में चलेगा?",
        a: "हाँ। हिंदी, Hinglish और English, तीनों। स्टाफ़ अपनी भाषा खुद चुन सकता है।",
      },
      {
        q: "इंटरनेट धीमा हो तो?",
        a: "काम खुलने में भारी नहीं है। फ़ोटो तब भेजी जाती है जब लाइन मिलती है।",
      },
      {
        q: "मेरा डेटा सेफ़ है?",
        a: "आपका डेटा सिर्फ़ आपके बिज़नेस के लोग देख सकते हैं। किसी को बेचा नहीं जाता। DPDP Act के हिसाब से।",
      },
      {
        q: "छोड़ना हो तो?",
        a: "जब चाहें। महीने का प्लान है, साल का नहीं। डेटा एक्सपोर्ट करके ले जाइए।",
      },
    ],
    finalTitle: "पहला काम आज भेजो। हल्दी टिक शाम तक।",
    finalLead:
      "14 दिन फ्री। एक काम भेजिए, एक स्टाफ़ बुलाइए, और देखिए कि शाम को पूछना नहीं पड़ता।",
    finalCta: "शुरू करें",
    footerTagline: "बोलो। हो जाएगा।",
    footerPrivacy: "प्राइवेसी",
    footerLogin: "लॉगिन",
  },

  en: {
    navHow: "How it works",
    navWho: "Who it is for",
    navPrice: "Pricing",
    navFaq: "Questions",
    navLogin: "Log in",
    heroBadge: "For Indian small businesses · Hindi, Hinglish, English",
    heroTitle: "Say it. It gets done.",
    heroLead:
      "Send the work. It reaches your staff member's phone, gets seen, and comes back with a photo when it is finished. Every step recorded, with its time.",
    heroCta: "Get started",
    heroCtaSecondary: "How it works",
    heroNote: "No card needed. Your staff need only a link.",
    ladderTitle: "One path for every task",
    ladderLead:
      "Two bars and a tick. Learn it once, and every task's state reads at a glance.",
    ladder: [
      { word: "Sent", note: "the owner asked" },
      { word: "Seen", note: "your staff looked" },
      { word: "Accepted", note: "they committed" },
      { word: "Done", note: "with the photo" },
      { word: "Verified", note: "you checked it" },
    ],
    problemTitle: "You said it in the group. Then what?",
    problemLead: "Work happens in the group. Work gets lost in the group too.",
    problems: [
      {
        title: "The message scrolled away",
        body: "Forty messages arrived. Yours is the twelfth. Nobody scrolled back.",
      },
      {
        title: "You cannot tell who read it",
        body: "The blue tick belongs to the group, not to a person. Seen or not, agreed or not, there is no record.",
      },
      {
        title: "Did it happen? Ring and ask",
        body: "The same question every evening. One call per task. Every day.",
      },
    ],
    problemFooter: (brand) =>
      `${brand} does not replace the group. It carries what was said there through to done.`,
    stepsTitle: "Three steps. Every time.",
    steps: [
      {
        title: "Send the work",
        body: "Who, what, by when. Three glances on one card, then send. Ask for a photo with one switch.",
      },
      {
        title: "Seen, and it will be done",
        body: "One big button on your staff member's phone. One tap says two things: seen, and committed to.",
      },
      {
        title: "Done, with the photo",
        body: "Finished, photo attached. You do not have to ask; you verify.",
      },
    ],
    featuresTitle: "What you used to ask about, you can now see",
    features: [
      {
        title: "The clock runs",
        body: "Two clocks per task: one to acknowledge, one to finish. Reminders at 50% and 90%. If it runs out, you hear.",
      },
      {
        title: "Photo proof",
        body: "What happened, shown. A photo, a voice note or writing. It stays on record, and the argument ends.",
      },
      {
        title: "Daily routines",
        body: "Opening, closing, stock count. On your staff member's phone every morning, by itself.",
      },
      {
        title: "The week at a glance",
        body: "Who was on time, who was late. One screen, no report to build.",
      },
    ],
    whatsappTitle: "With WhatsApp. Not against it.",
    whatsappLead: (brand) =>
      `Your team is on WhatsApp. ${brand} starts there.`,
    whatsapp: [
      {
        title: "Invites come from you",
        body: "You send your staff the link from your own number. No app store, no password.",
      },
      {
        title: "The evening card, in the group",
        body: "At 8pm, one card: how many tasks, how many done, who was late. One tap into the group.",
        soon: true,
      },
      {
        title: "Stickers and voice notes",
        body: '"Seen" and "Done" as stickers, and assigning work straight from WhatsApp.',
        soon: true,
      },
    ],
    soonLabel: "Coming",
    whoTitle: "Who it is for",
    whoLead: "Wherever the owner asks and the team does. Three to thirty people.",
    who: [
      {
        title: "Property brokers",
        body: "Site visits, photos, client follow-ups. You are in the car; the team is in the field.",
        quote: '"Raju, photos of the Sector 62 flat by 5."',
      },
      {
        title: "Retail stores",
        body: "Opening, closing, stock counts. The same work daily, and the same question daily.",
        quote: '"Amit, godown stock count by 11."',
      },
      {
        title: "Service businesses",
        body: "Salons, repairs, clinics. Different work each day, the same cleaning up after.",
        quote: '"Pooja, confirm with Verma ji."',
      },
    ],
    priceTitle: "Less than a cup of chai, a day",
    priceLead: "Fourteen days free in the pilot. You pay only after.",
    plans: [
      {
        name: "Starter",
        price: "499",
        per: "month",
        badge: "Pilot price",
        features: [
          "1 owner, up to 5 staff",
          "Unlimited tasks",
          "Assign by voice",
          "Photo proof",
          "Hindi, Hinglish, English",
        ],
        cta: "Start 14 days free",
      },
      {
        name: "Growth",
        price: "1,499",
        per: "month",
        badge: "Pilot price",
        features: [
          "Up to 15 staff, 2 owners",
          "Everything in Starter",
          "Daily routines",
          "The week at a glance",
          "WhatsApp share",
        ],
        cta: "Start 14 days free",
      },
    ],
    priceNote: "No card needed. Pay by UPI.",
    faqTitle: "What everybody asks",
    faq: [
      {
        q: "Do my staff have to install an app?",
        a: "No. You send a link, it opens, and it sits on their home screen. It takes a minute.",
      },
      {
        q: "Does it work in Hindi?",
        a: "Yes. Hindi, Hinglish and English. Each person picks their own.",
      },
      {
        q: "What if the connection is slow?",
        a: "The screens are light. A photo is sent when the line comes back.",
      },
      {
        q: "Is my data safe?",
        a: "Only people in your business can see it. It is never sold. In line with the DPDP Act.",
      },
      {
        q: "What if I want to leave?",
        a: "Whenever you like. It is a monthly plan, not a yearly one. Export your data and take it with you.",
      },
    ],
    finalTitle: "Send the first task today. Haldi tick by evening.",
    finalLead:
      "Fourteen days free. Send one task, invite one person, and see that you do not have to ask in the evening.",
    finalCta: "Get started",
    footerTagline: "Bolo. Ho jayega.",
    footerPrivacy: "Privacy",
    footerLogin: "Log in",
  },
};

export function getLanding(locale: Locale): LandingCopy {
  return landing[locale];
}
