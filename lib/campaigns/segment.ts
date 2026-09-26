import { z } from "zod";

/**
 * Who a campaign goes to, as data the business can read back. Pure: the
 * segment is validated and the suppression rules are decided here; the
 * query that applies them lives beside the database.
 */
export const segmentSchema = z.object({
  kind: z.enum(["lead", "customer"]).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
  source: z.string().trim().max(40).optional().or(z.literal("")),
  ownerId: z.string().uuid().optional().or(z.literal("")),
  projectId: z.string().uuid().optional().or(z.literal("")),
  stageId: z.string().uuid().optional().or(z.literal("")),
});
export type Segment = z.infer<typeof segmentSchema>;

export interface Candidate {
  id: string;
  email: string | null;
  phone: string | null;
  emailOptOut: boolean;
  whatsappOptOut: boolean;
  archivedAt: string | null;
}

export type Suppression = "opted_out" | "no_address" | "archived" | "duplicate";

/**
 * Turn candidates into recipients: one row per person, with the address for
 * the channel, or the reason they are left out. Duplicates by address are
 * suppressed so one inbox never gets two copies.
 */
export function planRecipients(channel: "email" | "whatsapp", candidates: readonly Candidate[]): { contactId: string; address: string | null; suppressed: Suppression | null }[] {
  const seen = new Set<string>();
  return candidates.map((c) => {
    if (c.archivedAt) return { contactId: c.id, address: null, suppressed: "archived" };
    const address = channel === "email" ? c.email : c.phone;
    const optedOut = channel === "email" ? c.emailOptOut : c.whatsappOptOut;
    if (optedOut) return { contactId: c.id, address, suppressed: "opted_out" };
    if (!address) return { contactId: c.id, address: null, suppressed: "no_address" };
    const key = address.toLowerCase();
    if (seen.has(key)) return { contactId: c.id, address, suppressed: "duplicate" };
    seen.add(key);
    return { contactId: c.id, address, suppressed: null };
  });
}

/** The words that stop a WhatsApp conversation, in any of the three languages. */
export function isOptOutMessage(body: string): boolean {
  return /^\s*(stop|unsubscribe|band karo|band|बंद|रोको|nahi chahiye|नहीं चाहिए)\s*[.!]?\s*$/i.test(body);
}

/** Counts from recipient statuses, for the campaign row and the screen. */
export function tally(statuses: readonly string[]): Record<"queued" | "sent" | "delivered" | "failed" | "replied" | "suppressed", number> {
  const counts = { queued: 0, sent: 0, delivered: 0, failed: 0, replied: 0, suppressed: 0 };
  for (const s of statuses) if (s in counts) counts[s as keyof typeof counts] += 1;
  return counts;
}
