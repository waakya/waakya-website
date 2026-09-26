import { describe, expect, it } from "vitest";
import { isOptOutMessage, planRecipients, tally } from "./segment";

const c = (id: string, extra: Partial<{ email: string | null; phone: string | null; emailOptOut: boolean; whatsappOptOut: boolean; archivedAt: string | null }> = {}) => ({
  id,
  email: null,
  phone: null,
  emailOptOut: false,
  whatsappOptOut: false,
  archivedAt: null,
  ...extra,
});

describe("planning recipients", () => {
  it("suppresses opt-outs, missing addresses, archived people and duplicates", () => {
    const plan = planRecipients("email", [
      c("a", { email: "a@x.com" }),
      c("b", { email: "A@X.COM" }),
      c("c", { email: "c@x.com", emailOptOut: true }),
      c("d", { phone: "+911234567890" }),
      c("e", { email: "e@x.com", archivedAt: "2026-01-01" }),
    ]);
    expect(plan.map((p) => p.suppressed)).toEqual([null, "duplicate", "opted_out", "no_address", "archived"]);
  });
  it("uses the phone for WhatsApp and its own opt-out flag", () => {
    const plan = planRecipients("whatsapp", [c("a", { phone: "+919876543210", emailOptOut: true }), c("b", { phone: "+919876543211", whatsappOptOut: true })]);
    expect(plan[0]).toEqual({ contactId: "a", address: "+919876543210", suppressed: null });
    expect(plan[1].suppressed).toBe("opted_out");
  });
});

describe("opt-out words", () => {
  it("recognise STOP in three languages and nothing else", () => {
    for (const w of ["STOP", "stop.", " Unsubscribe ", "band karo", "बंद", "नहीं चाहिए"]) expect(isOptOutMessage(w)).toBe(true);
    for (const w of ["please stop calling at night", "ok", "band baja"]) expect(isOptOutMessage(w)).toBe(false);
  });
});

describe("tally", () => {
  it("counts statuses and ignores strangers", () => {
    expect(tally(["sent", "sent", "failed", "suppressed", "weird"])).toEqual({ queued: 0, sent: 2, delivered: 0, failed: 1, replied: 0, suppressed: 1 });
  });
});
