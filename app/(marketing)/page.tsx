import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getViewer } from "@/lib/auth/session";
import { BRAND_NAME } from "@/lib/i18n";
import { Wordmark } from "@/components/waakya/wordmark";
import { Hero } from "./_home/hero";
import { Monday } from "./_home/monday";
import { DayBoard } from "./_home/day";
import { ConversationToWork } from "./_home/conversation";
import { OwnerAttention } from "./_home/morning";
import { CustomerLoop } from "./_home/customers";
import { TwoBusinesses } from "./_home/adapts";
import { AdaptLevels } from "./_home/levels";
import { WebsiteSystem } from "./_home/website";
import { VerifiedMark } from "./_home/verified-mark";
import "./_home/home.css";

export const metadata: Metadata = {
  title: { absolute: `${BRAND_NAME} · Your entire business. One workspace.` },
  description:
    "Customers, team, operations and the follow-ups nobody has time for, together in one workspace shaped around how your business already works. Work gets an owner, a time and proof; your customer gets a page of their own.",
};

/**
 * The homepage.
 *
 * One business runs through the whole page (ABC Interiors, Pune) and one
 * calendar runs through every chapter. Every chapter is composed on the same
 * twelve-column grid (`.w4-grid`), and each one is a different kind of
 * picture — a ledger, a convergence, a day board, a reading, a screen, two
 * worlds, a switch, a depth line, a connected system — so the page reads as a
 * story told in several ways, not as one card repeated eight times.
 *
 * Every scene is complete before it moves, while it moves and after it has
 * moved: nothing here depends on an element that has not arrived yet.
 *
 * Every call to action is real: Sign in and Start go to /login, See Waakya
 * opens the product demonstration, and in-page links go to the chapter they
 * name.
 */
const NAV = [
  { href: "#one-day", label: "What it does" },
  { href: "#adapts", label: "Your business" },
  { href: "#customers", label: "For your customers" },
];

/**
 * A chapter head. `split` puts the words in the first five columns and the
 * picture beside them; `wide` gives the words eight columns with room for a
 * short aside, and the picture the full width beneath.
 */
function Chapter({
  id,
  eyebrow,
  title,
  say,
  aside,
  layout = "wide",
  tone = "paper",
  voice = "normal",
  children,
  after,
}: {
  id?: string;
  eyebrow?: string;
  title: React.ReactNode;
  say?: React.ReactNode;
  aside?: React.ReactNode;
  layout?: "split" | "wide";
  tone?: "paper" | "tint" | "ink";
  /** Editorial pacing: a chapter may dominate or whisper; most simply speak. */
  voice?: "loud" | "normal" | "quiet";
  children: React.ReactNode;
  after?: React.ReactNode;
}) {
  return (
    <section id={id} className="w4-chapter" data-tone={tone} data-layout={layout} data-voice={voice}>
      <div className="w4-wrap">
        <div className="w4-grid w4-chapter-grid">
          <header className="w4-head">
            {eyebrow ? <p className="w4-eyebrow">{eyebrow}</p> : null}
            <h2 className="w4-h2">{title}</h2>
            {say ? <p className="w4-lede">{say}</p> : null}
          </header>
          {aside ? <div className="w4-aside">{aside}</div> : null}
          <div className="w4-body">{children}</div>
          {after ? <div className="w4-after">{after}</div> : null}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const viewer = await getViewer();
  if (viewer) redirect(viewer.org ? "/aaj" : "/setup");

  return (
    <div className="w4">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-neel-700 focus:shadow"
      >
        Skip to content
      </a>

      {/* ---------------------------------------------------------- nav -- */}
      <header className="w4-nav">
        <div className="w4-wrap flex items-center gap-6">
          <Link href="/" className="inline-flex min-h-11 items-center" aria-label={`${BRAND_NAME} home`}>
            <Wordmark size={22} />
          </Link>
          <nav aria-label="Sections" className="hidden gap-1 text-[14px] font-semibold text-[color:var(--ink-subtle)] md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="inline-flex min-h-11 items-center px-2 hover:text-neel-700">
                {n.label}
              </a>
            ))}
          </nav>
          <span className="ml-auto flex items-center gap-2 text-[14px] font-semibold sm:gap-4">
            <Link href="/login" className="inline-flex min-h-11 items-center px-2 text-[color:var(--ink-subtle)] hover:text-neel-700">
              Sign in
            </Link>
            <Link href="/demo" className="w4-primary" style={{ minHeight: 44 }}>
              See Waakya
            </Link>
          </span>
        </div>
      </header>

      <main id="main">
        {/* ------------------------------------------------ 1 · the promise */}
        <Hero />

        {/* ------------------------------------------- 2 · why it is painful */}
        <Chapter
          layout="split"
          tone="tint"
          eyebrow="Monday, 4:40 pm"
          title={<>Nothing is lost. It is just everywhere.</>}
          say="The enquiry is in your website mail, the promise is in a chat, the requirement is on somebody’s phone. By Friday only you know how it joins up, and only if nobody calls."
        >
          <Monday />
        </Chapter>

        {/* -------------------------------------------- 3 · what changes -- */}
        <Chapter
          id="one-day"
          voice="loud"
          eyebrow="One business · one day"
          title={<>A whole day of work, moving without you in it.</>}
          say="ABC Interiors on Tuesday, 23 September. Four lanes, one clock: a new enquiry, a live site, a quotation, a customer approving, a vendor confirming. Watch a decision in one lane open work in another."
        >
          <DayBoard />
        </Chapter>

        {/* --------------------------------------------- 4 · how work starts */}
        <Chapter
          layout="split"
          tone="tint"
          eyebrow="How the work starts"
          title={<>Work starts in a conversation. It should not end there.</>}
          say="One sentence anybody would say in a group chat, turned into a commitment with a name and a time on it — and then into work, proof and a record."
        >
          <ConversationToWork />
        </Chapter>

        {/* ------------------------------------------------ 5 · the owner -- */}
        <Chapter
          voice="quiet"
          eyebrow="Your morning"
          title={<>Know what needs you. The rest keeps moving.</>}
          say="Waakya’s job is to reduce how much of the business has to pass through your head, not to hand you a longer list."
          aside={
            <p className="w4-whisper">
              Four decisions.
              <br />
              Not forty messages.
            </p>
          }
          after={
            <p className="w4-sentence max-w-[58ch]">
              Work that is running does not ask for your attention. Work that is stuck, late, or waiting on your word
              comes to the top and says so, in words, not in colours you have to decode.
            </p>
          }
        >
          <OwnerAttention />
        </Chapter>

        {/* --------------------------------------------- 6 · the customer -- */}
        <Chapter
          tone="ink"
          voice="loud"
          id="customers"
          eyebrow="For your customers"
          title={<>Your customer stops asking “kya hua?”</>}
          say="Two sides of the same system. On the left, what she sees. On the right, what her one tap does inside your business."
          after={
            <div className="max-w-[56ch]">
              <h3 className="w4-h3">A customer who can see the work does not need to chase it.</h3>
              <p className="w4-lede mt-3">
                Fewer calls for your team. Faster approvals for you. And at handover, a customer who watched you do it
                properly, which is how the next job arrives.
              </p>
            </div>
          }
        >
          <CustomerLoop />
        </Chapter>

        {/* ------------------------------------------- 7 · it fits my trade */}
        <Chapter
          tone="tint"
          id="adapts"
          eyebrow="Built around the way you work"
          title={<>One builds offices. One sells flats. Both run on Waakya.</>}
          say="Switch the business and the whole workspace re-forms: what the navigation is called, what a record is, where the work happens and who does it."
        >
          <TwoBusinesses />
          <div className="w4-rule mt-12 pt-10">
            <AdaptLevels
              intro={
                <>
                  <h3 className="w4-h3">And it keeps going as far as your business does.</h3>
                  <p className="w4-lede mt-3">
                    Start with what works on day one. Then your stages, your fields, your approvals, your website and
                    WhatsApp — and, when only your business works a certain way, that too.
                  </p>
                </>
              }
            />
          </div>
        </Chapter>

        {/* ----------------------------------------------- 8 · your website */}
        <Chapter
          voice="quiet"
          eyebrow="Your website"
          title={<>Keep your website. Connect the business behind it.</>}
          say="Your site stays your site. What changes is where its enquiries land, and that your customers have somewhere to look afterwards."
        >
          <WebsiteSystem />
        </Chapter>

        {/* ------------------------------------------------------ 9 · close */}
        <section className="w4-close">
          <div className="w4-wrap">
            <div className="w4-grid w4-close-grid">
              <div className="w4-close-copy">
                <h2 className="w4-display text-[38px] leading-[1.02] sm:text-[56px]">
                  You built the business. You should not have to hold it together.
                </h2>
                <p className="w4-display mt-7 text-[22px] leading-tight text-[#b8bdf0] sm:text-[30px]">
                  Your entire business. One workspace.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3">
                  <Link href="/login" className="w4-primary w4-primary-light" style={{ minHeight: 52 }}>
                    Start with my business
                  </Link>
                  <Link href="/demo" className="inline-flex min-h-11 items-center font-bold text-white underline underline-offset-4">
                    See the product demonstration
                  </Link>
                </div>
              </div>
              <div className="w4-close-figure">
                <VerifiedMark />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w4-footer">
        <div className="w4-wrap grid w-full gap-6 py-8 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <Wordmark size={20} />
            <p className="mt-2 text-[14px] text-[color:var(--ink-subtle)]">Bolo. Ho jayega.</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 text-[14px] text-[color:var(--ink-muted)] sm:flex sm:flex-wrap sm:gap-x-6">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="inline-flex min-h-11 items-center hover:text-neel-700">
                {item.label}
              </a>
            ))}
            <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-neel-700">
              Privacy
            </Link>
            <Link href="/login" className="inline-flex min-h-11 items-center hover:text-neel-700">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
