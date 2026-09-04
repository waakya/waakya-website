import type { NotifyEvent } from "./types";

/**
 * Three sounds, and no more (Character document §2.6). Each is reserved for
 * one moment so it keeps its meaning: reminders deliberately have none and use
 * the phone's own sound instead.
 */
export type WaakyaSound = "naya" | "hogaya" | "dhyan";

export const SOUND_FILES: Record<WaakyaSound, string> = {
  naya: "/sound/vaakya-naya.wav",
  hogaya: "/sound/vaakya-hogaya.wav",
  dhyan: "/sound/vaakya-dhyan.wav",
};

const FOR_EVENT: Partial<Record<NotifyEvent, WaakyaSound>> = {
  // New work, on the staff phone.
  task_assigned: "naya",
  reassigned: "naya",
  // A task is done, on the owner's phone — the sound of the haldi tick.
  task_done: "hogaya",
  task_verified: "hogaya",
  // Attention, not alarm.
  escalated: "dhyan",
  not_seen: "dhyan",
  overdue: "dhyan",
};

/** `null` means this event is not one of the three moments. */
export function soundFor(event: string): WaakyaSound | null {
  return FOR_EVENT[event as NotifyEvent] ?? null;
}
