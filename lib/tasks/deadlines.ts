import { atIstTime } from "./time";

/**
 * The deadline chips on the Confirm card (screens/Confirm.png): one tap for
 * the three deadlines an owner actually uses, and a custom time behind them.
 */
export type DeadlinePreset = "one_hour" | "today_evening" | "tomorrow_morning";

export const DEADLINE_PRESETS: readonly DeadlinePreset[] = [
  "today_evening",
  "one_hour",
  "tomorrow_morning",
];

/** Business hours the presets assume, in Asia/Kolkata. */
const EVENING_HOUR = 17;
const MORNING_HOUR = 9;

/**
 * Resolve a preset to an instant.
 *
 * "Aaj 5:00 pm" after 5pm would be a deadline in the past, which is a trap
 * rather than a shortcut, so it rolls to the same time tomorrow.
 */
export function resolvePreset(preset: DeadlinePreset, now: Date): Date {
  switch (preset) {
    case "one_hour":
      return new Date(now.getTime() + 60 * 60_000);
    case "today_evening": {
      const today = atIstTime(now, EVENING_HOUR, 0);
      return today.getTime() > now.getTime()
        ? today
        : atIstTime(now, EVENING_HOUR, 0, 1);
    }
    case "tomorrow_morning":
      return atIstTime(now, MORNING_HOUR, 0, 1);
  }
}

/** The label key each preset uses, so the copy stays in the dictionary. */
export const PRESET_LABEL_KEY: Record<DeadlinePreset, string> = {
  today_evening: "todayEvening",
  one_hour: "oneHour",
  tomorrow_morning: "tomorrowMorning",
};
