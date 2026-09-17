import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  ChevronDown,
  FileText,
  FolderKanban,
  Home,
  Menu,
  MessageSquare,
  Search,
  ShieldCheck,
  SquareCheckBig,
  Users,
} from "lucide-react";

import { getViewer } from "@/lib/auth/session";
import { BRAND_NAME } from "@/lib/i18n";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/waakya/wordmark";
import { Annotation, Illustration } from "@/components/waakya/illustrations";
import { Bubble, Composer, DocCard, Frame, TaskCard } from "./_components/mock";
import { Walkthrough } from "./_components/walkthrough";
import { Ecosystem } from "./_components/ecosystem";

export const metadata: Metadata = {
  title: { absolute: `${BRAND_NAME} · All your business work. One workspace.` },
  description:
    "The new era of business communication. Conversations become tasks with owners and deadlines, proof and a record, alongside projects, documents, templates, attendance, leave and approvals.",
};

const NAV = [
  { href: "#how", label: "How it works" },
  { href: "#inside", label: "Everything inside" },
  { href: "#businesses", label: "For businesses" },
  { href: "#faq", label: "Questions" },
];

const CHAIN = ["Conversation", "Commitment", "Execution", "Proof", "Record"];

const FAQ = [
  {
    q: "Does my team need to install an app?",
    a: "No. Waakya works in the browser on any phone or laptop, and can be added to the home screen like an app.",
  },
  {
    q: "How do people join our business?",
    a: "You invite each person with a link. They open it, sign in with Google or a code sent to their email, and they are in your business.",
  },
  {
    q: "Can I keep attendance, leave and holidays here?",
    a: "Yes. Your team punches in and out, asks for full or half-day leave, and sees the holiday list. You approve leave and keep balances in the same place.",
  },
  {
    q: "What paperwork can I make?",
    a: "Ten business templates: quotation, proposal, invoice, agreement, NDA, purchase order, work order, receipt, scope of work and meeting minutes. They are filled with your business details and kept with the project.",
  },
  {
    q: "Who can see our information?",
    a: "Only the people you invite into your business. A conversation is visible only to the people in it.",
  },
  {
    q: "Which languages does it speak?",
    a: "English, Hinglish and हिंदी. Each person picks their own.",
  },
];

/**
 * The website. One story, told the way the product is built: a conversation
 * becomes a commitment, the commitment is carried out, proved and kept as a
 * record — inside one workspace that also holds the projects, the paperwork
 * and the people. Expressive headings in Baloo 2; the product itself in Inter.
 */
export default async function LandingPage() {
  const viewer = await getViewer();
  if (viewer) redirect(viewer.org ? "/aaj" : "/setup");

  const heading = "font-display font-extrabold tracking-[-0.01em] text-neel-900";

  return (
    <div className="flex min-h-dvh flex-col bg-[#fbfaf6] text-ink-900">
      {/* --------------------------------------------------------------- nav */}
      <header className="sticky top-0 z-40 border-b border-[#ecebe4] bg-[#fbfaf6]/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 lg:px-8">
          <Link href="/" aria-label={BRAND_NAME} className="shrink-0">
            <Wordmark size={24} />
          </Link>
          <nav aria-label="Website" className="hidden flex-1 items-center justify-center gap-7 text-[14.5px] font-medium text-ink-700 lg:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="rounded-sm hover:text-neel-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neel-600">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}>
              Sign in
            </Link>
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Get started
            </Link>
            {/* The phone menu needs no script: a disclosure that holds the same links. */}
            <details className="group relative lg:hidden">
              <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-button text-neel-900 hover:bg-neel-50 [&::-webkit-details-marker]:hidden">
                <Menu className="size-5" aria-hidden="true" />
                <span className="sr-only">Menu</span>
              </summary>
              <nav aria-label="Website" className="absolute top-12 right-0 w-60 rounded-[14px] border border-[#e3e6ee] bg-white p-2 shadow-[0_18px_40px_-20px_rgba(27,32,96,0.4)]">
                {NAV.map((item) => (
                  <a key={item.href} href={item.href} className="block rounded-[10px] px-3 py-3 text-[15px] font-semibold text-neel-900 hover:bg-neel-50">
                    {item.label}
                  </a>
                ))}
                <Link href="/login" className="block rounded-[10px] px-3 py-3 text-[15px] font-semibold text-neel-700 hover:bg-neel-50">
                  Sign in
                </Link>
              </nav>
            </details>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ------------------------------------------------------------ hero */}
        <section className="mx-auto w-full max-w-6xl px-4 pt-10 pb-12 lg:px-8 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="inline-flex items-center gap-2 text-[12.5px] font-bold tracking-[0.16em] text-neel-700 uppercase">
                <span aria-hidden="true" className="h-[3px] w-6 rounded-full bg-[#f6c85f]" />
                The new era of business communication
              </p>
              <h1 className={`${heading} mt-4 text-[44px] leading-[1.02] sm:text-[56px] lg:text-[58px]`}>
                All your business work.
                <br />
                One workspace.
              </h1>
              <p className="mt-5 max-w-lg text-[17.5px] leading-[28px] text-ink-700">
                Your team talks all day. Waakya turns what gets agreed into work with an owner and a deadline, proof that
                it was done, and a record your business keeps, next to your projects, documents, attendance and approvals.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/login" className={buttonVariants({ size: "owner" })}>
                  Get started
                  <ArrowRight aria-hidden="true" />
                </Link>
                <a href="#how" className={buttonVariants({ variant: "outline", size: "owner" })}>
                  See how it works
                </a>
              </div>
              <p className="mt-4 text-[14px] text-ink-500">Works in any browser · English, Hinglish, हिंदी</p>
            </div>

            <div className="relative">
              <Frame title="Waakya · Sharma Interiors" chrome>
                <div className="grid md:grid-cols-[minmax(0,1fr)_196px] xl:grid-cols-[156px_minmax(0,1fr)_196px]">
                  <aside className="hidden flex-col gap-0.5 border-r border-[#eceef6] p-3 xl:flex" aria-hidden="true">
                    {[
                      [Home, "Today"],
                      [MessageSquare, "Conversations"],
                      [SquareCheckBig, "Work"],
                      [FolderKanban, "Projects"],
                      [FileText, "Documents"],
                      [CalendarCheck, "Attendance"],
                      [ShieldCheck, "Approvals"],
                      [Users, "Team"],
                    ].map(([Icon, label], i) => {
                      const I = Icon as typeof Home;
                      return (
                        <span
                          key={label as string}
                          className={
                            i === 1
                              ? "flex items-center gap-2 rounded-[8px] bg-neel-50 px-2 py-1.5 text-[12px] font-semibold text-neel-700"
                              : "flex items-center gap-2 px-2 py-1.5 text-[12px] text-ink-700"
                          }
                        >
                          <I className="size-3.5 shrink-0" />
                          <span className="truncate">{label as string}</span>
                        </span>
                      );
                    })}
                  </aside>
                  <div className="flex min-w-0 flex-col gap-3 p-4">
                    <div>
                      <p className="text-[13px] font-semibold text-ink-900">Office renovation · Site team</p>
                      <p className="text-[12px] text-ink-500">Priya, Rahul and 2 others</p>
                    </div>
                    <Bubble initials="PS" name="Priya" time="11:24 AM" text="Rahul, please send the revised quotation by 5 PM." highlight>
                      <span className="mt-1.5 inline-flex items-center rounded-full bg-hara-100 px-2 py-0.5 text-[11px] font-semibold text-hara-700">
                        Task created
                      </span>
                    </Bubble>
                    <Bubble initials="RV" name="Rahul" time="11:26 AM" text="On it. Sharing it with the latest BOQ." />
                    <Composer />
                  </div>
                  <div className="flex min-w-0 flex-col gap-2.5 border-t border-[#eceef6] p-4 md:border-t-0 md:border-l">
                    <p className="text-[11px] font-semibold tracking-wide text-ink-500 uppercase">Tasks from this chat</p>
                    <TaskCard title="Revised quotation" who="Rahul" due="5 PM" state="Proof submitted" tone="amber" />
                    <DocCard name="Quotation v2.pdf" meta="PDF · 1.8 MB" />
                    <p className="flex items-center gap-1.5 text-[12px] text-ink-700">
                      <CalendarCheck className="size-3.5 shrink-0 text-neel-700" aria-hidden="true" /> Rahul in at 9:41 AM
                    </p>
                  </div>
                </div>
              </Frame>
            </div>
          </div>

          {/* The story, in one line, straight under the first screen. */}
          <ol aria-label="How work moves in Waakya" className="mt-14 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 lg:mt-16">
            {CHAIN.map((stage, index) => (
              <li key={stage} className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe2ef] bg-white py-1.5 pr-3.5 pl-1.5 text-[14.5px] font-bold text-neel-900">
                  <span className="num grid size-6 place-items-center rounded-full bg-neel-600 text-[12px] text-white">{index + 1}</span>
                  {stage}
                </span>
                {index < CHAIN.length - 1 ? <ArrowRight className="size-4 text-neel-400" aria-hidden="true" /> : null}
              </li>
            ))}
          </ol>
        </section>

        {/* --------------------------------------------------------- problem */}
        <section className="border-y border-[#ecebe4] bg-white">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1fr_1fr] lg:px-8 lg:py-16">
            <div>
              <h2 className={`${heading} text-[32px] leading-[1.08] sm:text-[38px]`}>
                Your business talks everywhere.
                <br />
                The work gets lost in between.
              </h2>
              <p className="mt-4 max-w-md text-[16.5px] leading-[26px] text-ink-700">
                Instructions sit in chats, trackers in spreadsheets, files on someone&apos;s phone, and leave in a register.
                So every day starts with the same questions.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                ["Who is doing this?", "An instruction in a group chat, and no one replied."],
                ["Is it done?", "A tick in a spreadsheet, and no proof."],
                ["Where is the file?", "Quotation_final_v2 (1).pdf, on someone's phone."],
                ["Who is in today?", "A leave register nobody updated."],
              ].map(([question, answer]) => (
                <li key={question} className="rounded-[14px] border border-[#e3e6ee] bg-[#fbfaf6] p-4">
                  <p className="text-[24px] leading-tight text-neel-700 [font-family:var(--font-hand),cursive]">{question}</p>
                  <p className="mt-1 text-[14.5px] leading-[21px] text-ink-700">{answer}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ----------------------------------------------------------- chain */}
        <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-[12.5px] font-bold tracking-[0.16em] text-neel-700 uppercase">Talk · Assign · Execute · Prove</p>
            <h2 className={`${heading} mt-2 text-[34px] leading-[1.06] sm:text-[44px]`}>From a message to a record, in five steps.</h2>
            <p className="mt-3 text-[16.5px] leading-[26px] text-ink-700">
              Follow one quotation at Sharma Interiors, from the moment it is asked for to the moment it is verified.
            </p>
          </div>
          <div className="mt-8">
            <Walkthrough />
          </div>
        </section>

        {/* ------------------------------------------------------- ecosystem */}
        <section id="inside" className="scroll-mt-20 border-y border-[#ecebe4] bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-[12.5px] font-bold tracking-[0.16em] text-neel-700 uppercase">Everything inside</p>
              <h2 className={`${heading} mt-2 text-[34px] leading-[1.06] sm:text-[44px]`}>One business. Everything connected.</h2>
              <p className="mt-3 text-[16.5px] leading-[26px] text-ink-700">
                Every part of Waakya knows about the others. A task knows the conversation it came from, the project it
                belongs to, the documents that prove it and who is in today to do it.
              </p>
            </div>
            <div className="mt-10">
              <Ecosystem />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- owner day */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-[12.5px] font-bold tracking-[0.16em] text-neel-700 uppercase">Your day</p>
            <h2 className={`${heading} mt-2 text-[34px] leading-[1.06] sm:text-[42px]`}>
              Open Waakya.
              <br />
              See what needs you.
            </h2>
            <p className="mt-4 max-w-md text-[16.5px] leading-[26px] text-ink-700">
              Late work, decisions waiting, leave to approve and who is in, on one screen. Your team sees their own day:
              what they owe, and a button to punch in.
            </p>
            <Illustration name="review" className="mt-6 hidden h-32 w-auto lg:block" />
          </div>
          <Frame title="Today · Sharma Interiors">
            <div className="p-4 sm:p-5">
              <p className="font-display text-[22px] font-extrabold text-neel-900">Hello, Priya</p>
              <ul className="mt-4 flex flex-col divide-y divide-[#eceef3] rounded-[12px] border border-[#e6e8f1]">
                {[
                  [ShieldCheck, "2 approvals waiting", "Vendor comparison · Site visit expenses", "Decide"],
                  [CalendarCheck, "Neha asked for a half day on Friday", "Leave balance: 4.5 days", "Review"],
                  [SquareCheckBig, "Revised quotation · proof submitted", "Rahul · Office renovation", "Verify"],
                  [Users, "12 of 14 in today", "2 October is a holiday", "Team"],
                ].map(([Icon, title, sub, action]) => {
                  const I = Icon as typeof Home;
                  return (
                    <li key={title as string} className="flex items-center gap-3 px-3.5 py-3">
                      <I className="size-4 shrink-0 text-neel-700" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-ink-900">{title as string}</span>
                        <span className="block text-[12.5px] text-ink-500">{sub as string}</span>
                      </span>
                      <span className="shrink-0 rounded-[8px] border border-neel-200 px-2.5 py-1 text-[12.5px] font-semibold text-neel-700">
                        {action as string}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  ["18", "Sent today"],
                  ["2", "Late"],
                  ["11", "Verified"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-[10px] bg-[#f5f6fa] py-2.5">
                    <p className={`num font-display text-[24px] leading-none font-extrabold ${label === "Late" ? "text-laal-600" : "text-neel-800"}`}>{value}</p>
                    <p className="mt-1 text-[12px] text-ink-700">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 flex items-center gap-4 text-[12.5px] text-ink-500">
                <span className="inline-flex items-center gap-1.5"><Search className="size-3.5" aria-hidden="true" /> Search anything</span>
                <span className="inline-flex items-center gap-1.5"><Bell className="size-3.5" aria-hidden="true" /> 5 updates</span>
              </p>
            </div>
          </Frame>
        </section>

        {/* ------------------------------------------------------ businesses */}
        <section id="businesses" className="scroll-mt-20 border-t border-[#ecebe4] bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 lg:px-8">
            <h2 className={`${heading} max-w-2xl text-[32px] leading-[1.1] sm:text-[40px]`}>Made for teams that get real work done.</h2>
            <ul className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
              {[
                {
                  art: "team" as const,
                  title: "Service teams",
                  eg: "Interiors, construction, facilities",
                  story: ["Supervisor punches in at site", "Gets “Measure Tower B” from the site chat", "Uploads the photos as proof", "You verify from the office"],
                },
                {
                  art: "laptop" as const,
                  title: "Agencies",
                  eg: "Design, marketing, events",
                  story: ["Client feedback agreed in the team chat", "Designer gets the revision as a task", "Final file is attached to the project", "Account lead approves it"],
                },
                {
                  art: "handoff" as const,
                  title: "Small businesses",
                  eg: "Professional services, distribution, retail",
                  story: ["Order confirmed in a conversation", "Work order made from a template", "Signed copy attached as proof", "Kept on record, findable later"],
                },
              ].map((item) => (
                <li key={item.title}>
                  <Illustration name={item.art} className="h-24 w-auto" />
                  <p className="mt-4 text-[18px] font-bold text-neel-900">{item.title}</p>
                  <p className="text-[13.5px] text-ink-500">{item.eg}</p>
                  <ol className="mt-3 flex flex-col gap-2 border-l-2 border-neel-100 pl-4">
                    {item.story.map((line, index) => (
                      <li key={line} className="text-[14.5px] leading-[20px] text-ink-700">
                        <span className="num mr-1.5 font-semibold text-neel-700">{index + 1}.</span>
                        {line}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------------------ faq */}
        <section id="faq" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className={`${heading} text-[32px] leading-[1.1] sm:text-[40px]`}>Questions owners ask.</h2>
              <ul className="mt-6 flex flex-col gap-2.5 text-[15px] text-ink-700">
                <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-neel-700" aria-hidden="true" /> Visible only to the people you invite</li>
                <li className="flex items-center gap-2"><Home className="size-4 text-neel-700" aria-hidden="true" /> Works on any phone or laptop browser</li>
                <li className="flex items-center gap-2"><MessageSquare className="size-4 text-neel-700" aria-hidden="true" /> English, Hinglish and हिंदी</li>
                <li className="flex items-center gap-2">
                  <FileText className="size-4 text-neel-700" aria-hidden="true" />
                  <Link href="/privacy" className="underline decoration-neel-300 underline-offset-4 hover:text-neel-700">Privacy under India&apos;s DPDP Act</Link>
                </li>
              </ul>
            </div>
            <div className="divide-y divide-[#e6e4dc] border-y border-[#e6e4dc]">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-1">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[16.5px] font-semibold text-neel-900 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronDown className="size-5 shrink-0 text-neel-600 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="pb-4 text-[15.5px] leading-[24px] text-ink-700">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ CTA */}
        <section className="bg-neel-50">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-14 lg:grid-cols-[1.2fr_auto_0.8fr] lg:px-8">
            <div>
              <h2 className={`${heading} text-[34px] leading-[1.05] sm:text-[42px]`}>Bring your business into one workspace.</h2>
              <p className="mt-3 max-w-lg text-[16px] leading-[25px] text-ink-700">
                Sign in with Google or email, name your business, and invite your team with a link.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className={buttonVariants({ size: "staff" })}>
                Get started
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/login" className={buttonVariants({ variant: "outline", size: "staff" })}>
                Sign in
              </Link>
            </div>
            <div className="relative hidden justify-end lg:flex">
              <Annotation text="one place for all of it" className="absolute -top-8 left-0" />
              <Illustration name="conversation" className="h-40 w-auto" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#ecebe4] bg-[#fbfaf6]">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:grid-cols-[1fr_auto] sm:items-center lg:px-8">
          <div>
            <Wordmark size={20} />
            <p className="mt-2 text-[14px] text-ink-500">The new era of business communication.</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-1 text-[14px] text-ink-700 sm:flex sm:flex-wrap sm:gap-x-6">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="py-2 hover:text-neel-700">
                {item.label}
              </a>
            ))}
            <Link href="/privacy" className="py-2 hover:text-neel-700">Privacy</Link>
            <Link href="/login" className="py-2 hover:text-neel-700">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
