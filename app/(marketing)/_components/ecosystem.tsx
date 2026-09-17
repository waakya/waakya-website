import {
  Bell,
  CalendarCheck,
  CalendarDays,
  CalendarOff,
  FilePlus2,
  FileText,
  FolderKanban,
  MessageSquare,
  Search,
  ShieldCheck,
  SquareCheckBig,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Node = { icon: LucideIcon; name: string; link: string };

const WORK: Node[] = [
  { icon: MessageSquare, name: "Conversations", link: "Agree it in a chat or a group, with files." },
  { icon: SquareCheckBig, name: "Work & tasks", link: "A message becomes a task with an owner and a deadline." },
  { icon: ShieldCheck, name: "Approvals", link: "Decisions that hold work up, decided once." },
];

const PAPER: Node[] = [
  { icon: FileText, name: "Documents", link: "Files kept with the task and project they belong to." },
  { icon: FilePlus2, name: "Business templates", link: "Quotation, invoice, work order and seven more." },
  { icon: Search, name: "Search", link: "Find any task, file, message or person." },
];

const PEOPLE: Node[] = [
  { icon: Users, name: "Team", link: "Invite with a link; owners, managers and staff." },
  { icon: CalendarCheck, name: "Attendance", link: "Punch in and out, and who is in today." },
  { icon: CalendarOff, name: "Leave", link: "Full or half day, with balances." },
  { icon: CalendarDays, name: "Holidays", link: "One calendar for the whole business." },
  { icon: Bell, name: "Notifications", link: "Tell the right person what needs them." },
];

function Row({ node, side }: { node: Node; side: "left" | "right" | "none" }) {
  const Icon = node.icon;
  return (
    <li
      className={cn(
        "relative flex items-start gap-3 py-3",
        // The thread back to the project in the middle.
        side === "left" && "lg:after:absolute lg:after:top-1/2 lg:after:-right-10 lg:after:w-10 lg:after:border-t lg:after:border-dashed lg:after:border-neel-300",
        side === "right" && "lg:before:absolute lg:before:top-1/2 lg:before:-left-10 lg:before:w-10 lg:before:border-t lg:before:border-dashed lg:before:border-neel-300",
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-neel-100 bg-white">
        <Icon className="size-[18px] text-neel-700" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[15.5px] leading-tight font-bold text-neel-900">{node.name}</span>
        <span className="mt-0.5 block text-[14px] leading-[20px] text-ink-700">{node.link}</span>
      </span>
    </li>
  );
}

/**
 * The whole Phase-1 workspace around one real piece of work. Not a grid of
 * feature cards: every capability is drawn as a thread into the same project,
 * because that is the point — they know about each other.
 */
export function Ecosystem() {
  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(280px,340px)_1fr] lg:items-center lg:gap-10">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.14em] text-ink-500 uppercase">The work</p>
          <ul className="mt-1 divide-y divide-[#eceef3]">
            {WORK.map((node) => (
              <Row key={node.name} node={node} side="left" />
            ))}
          </ul>
        </div>

        <div className="relative order-first lg:order-none">
          <div className="rounded-[18px] border-2 border-neel-600 bg-white p-5 shadow-[0_20px_50px_-30px_rgba(27,32,96,0.5)]">
            <p className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.12em] text-neel-700 uppercase">
              <FolderKanban className="size-4" aria-hidden="true" /> Project
            </p>
            <p className="mt-2 font-display text-[26px] leading-[1.1] font-extrabold text-neel-900">Office renovation</p>
            <p className="text-[13.5px] text-ink-500">Sharma Interiors · Sector 62</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["4", "open tasks"],
                ["6", "documents"],
                ["3", "in today"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-[10px] bg-neel-50 px-1 py-2">
                  <dd className="num font-display text-[24px] leading-none font-extrabold text-neel-800">{value}</dd>
                  <dt className="mt-1 text-[11.5px] text-ink-700">{label}</dt>
                </div>
              ))}
            </dl>
            <ul className="mt-4 flex flex-col gap-1.5 text-[13px] text-ink-700">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-hara-600" aria-hidden="true" /> Revised quotation · verified
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-amber-600" aria-hidden="true" /> Vendor comparison · waiting for approval
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-neel-600" aria-hidden="true" /> Neha · half day on Friday
              </li>
            </ul>
          </div>
        </div>

        <div>
          <p className="text-[12px] font-semibold tracking-[0.14em] text-ink-500 uppercase">The paperwork</p>
          <ul className="mt-1 divide-y divide-[#eceef3]">
            {PAPER.map((node) => (
              <Row key={node.name} node={node} side="right" />
            ))}
          </ul>
        </div>
      </div>

      <div className="relative mt-10 lg:mt-12">
        {/* The people thread runs up into the project. */}
        <span aria-hidden="true" className="absolute -top-12 left-1/2 hidden h-12 border-l border-dashed border-neel-300 lg:block" />
        <p className="text-[12px] font-semibold tracking-[0.14em] text-ink-500 uppercase lg:text-center">The people</p>
        <ul className="mt-1 grid gap-x-6 divide-y divide-[#eceef3] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5">
          {PEOPLE.map((node) => (
            <Row key={node.name} node={node} side="none" />
          ))}
        </ul>
      </div>
    </div>
  );
}
