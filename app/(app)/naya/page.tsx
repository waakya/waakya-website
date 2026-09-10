import type { Metadata } from "next";
import { requireOrg, canManage } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/server";
import { getOrgMembers } from "@/lib/org/members";
import { redirect } from "next/navigation";
import { ConfirmCard } from "./confirm-card";
import { resolvePreset } from "@/lib/tasks/deadlines";
import { formatDeadline } from "@/lib/tasks/present";
import { getDictionary } from "@/lib/i18n";
import { isToday } from "@/lib/tasks/time";
import { formatTime } from "@/lib/tasks/time";

export const metadata: Metadata = { title: "Naya kaam" };

/**
 * The Confirm card (screens/Confirm.png). In v1 the owner fills it by touch;
 * when voice lands, the same card is what the transcript is reviewed on.
 */
export default async function NayaPage() {
  const viewer = await requireOrg();
  if (!canManage(viewer.role)) redirect("/aaj");

  const locale = await getLocale();
  const members = await getOrgMembers(viewer.org.id);
  const now = new Date();

  return (
    <ConfirmCard
      locale={locale}
      ackMinutes={viewer.org.ackMinutes}
      members={members
        .filter((m) => m.userId !== viewer.userId)
        .map((m) => ({ id: m.userId, name: m.name }))}
      // Resolved on the server so the chip reads "Aaj 5:00 pm", not "Aaj" —
      // and "Kal 5:00 pm" once today's 5 pm has passed, because that is where
      // the preset then lands.
      presetTimes={{
        today_evening: (() => {
          const at = resolvePreset("today_evening", now);
          return isToday(at, now)
            ? `${getDictionary(locale).create.todayEvening} ${formatTime(at)}`
            : capitalise(formatDeadline(at, locale, now));
        })(),
        one_hour: formatTime(resolvePreset("one_hour", now)),
        tomorrow_morning: formatTime(resolvePreset("tomorrow_morning", now)),
      }}
    />
  );
}

/** "kal 5:00 pm" is mid-sentence copy; a chip starts with a capital. */
function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
