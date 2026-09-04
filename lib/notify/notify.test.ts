import { describe, expect, it, vi } from "vitest";
import { notify } from "./index";
import { writeMessage, writeSubject } from "./messages";
import type { ChannelOutcome, NotifyChannel, NotifyMessage } from "./types";

const message: NotifyMessage = {
  orgId: "org-1",
  userId: "user-1",
  event: "task_assigned",
  taskId: "task-1",
  locale: "hi-Latn",
  body: 'Rakesh ne naya kaam bheja: "Sector 62 photos"',
  email: "raju@example.com",
};

function channel(
  name: NotifyChannel["name"],
  outcome: ChannelOutcome | (() => Promise<never>),
): NotifyChannel {
  return {
    name,
    send:
      typeof outcome === "function"
        ? (outcome as NotifyChannel["send"])
        : async () => outcome,
  };
}

describe("notify", () => {
  it("sends over every channel it is given", async () => {
    const inApp = vi.fn(async (): Promise<ChannelOutcome> => ({ ok: true }));
    const email = vi.fn(async (): Promise<ChannelOutcome> => ({ ok: true }));

    const result = await notify(message, [
      { name: "in_app", send: inApp },
      { name: "email", send: email },
    ]);

    expect(inApp).toHaveBeenCalledWith(message);
    expect(email).toHaveBeenCalledWith(message);
    expect(result.delivered).toBe(true);
    expect(result.outcomes).toEqual({
      in_app: { ok: true },
      email: { ok: true },
    });
  });

  it("keeps the in-app record when email fails", async () => {
    // Email is best effort; the inbox row is the record and must survive.
    const result = await notify(message, [
      channel("in_app", { ok: true }),
      channel("email", { ok: false, error: "resend_500" }),
    ]);

    expect(result.delivered).toBe(true);
    expect(result.outcomes.in_app).toEqual({ ok: true });
    expect(result.outcomes.email).toEqual({ ok: false, error: "resend_500" });
  });

  it("does not let one channel throwing take down the others", async () => {
    const result = await notify(message, [
      channel("in_app", { ok: true }),
      channel("email", async () => {
        throw new Error("boom");
      }),
    ]);

    expect(result.delivered).toBe(true);
    expect(result.outcomes.email).toEqual({ ok: false, error: "threw" });
  });

  it("reports not delivered when every channel fails", async () => {
    const result = await notify(message, [
      channel("in_app", { ok: false, error: "insert_failed" }),
      channel("email", { ok: false, error: "network" }),
    ]);
    expect(result.delivered).toBe(false);
  });

  it("treats a duplicate as delivered, because it already was", async () => {
    const result = await notify(message, [
      channel("in_app", { ok: true, skipped: "duplicate" }),
    ]);
    expect(result.delivered).toBe(true);
    expect(result.outcomes.in_app).toEqual({ ok: true, skipped: "duplicate" });
  });

  it("treats an unconfigured channel as delivered rather than as an error", async () => {
    // Resend has no key yet (BLOCKERS B2); that must not look like a failure.
    const result = await notify(message, [
      channel("in_app", { ok: true }),
      channel("email", { ok: true, skipped: "not_configured" }),
    ]);
    expect(result.delivered).toBe(true);
  });

  it("sends nothing when given no channels", async () => {
    const result = await notify(message, []);
    expect(result.delivered).toBe(false);
    expect(result.outcomes).toEqual({});
  });

  it("passes the dedupe key through untouched", async () => {
    const send = vi.fn(
      async (): Promise<ChannelOutcome> => ({ ok: true }),
    );
    const keyed: NotifyMessage = {
      ...message,
      dedupeKey: "task-1:ack_reminder:0.5",
    };
    await notify(keyed, [{ name: "in_app", send }]);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ dedupeKey: "task-1:ack_reminder:0.5" }),
    );
  });
});

describe("the words", () => {
  const context = {
    actor: "Rakesh",
    task: "Sector 62 photos",
    when: "5:00 pm",
  };

  it("puts the name before the verb, in every language", () => {
    expect(writeMessage("task_assigned", "hi-Latn", context)).toBe(
      'Rakesh ne naya kaam bheja: "Sector 62 photos" · 5:00 pm tak',
    );
    expect(writeMessage("task_done", "hi-Latn", context)).toBe(
      'Rakesh ne "Sector 62 photos" kar diya',
    );
    expect(writeMessage("task_done", "hi", context)).toBe(
      'Rakesh ने "Sector 62 photos" कर दिया',
    );
    expect(writeMessage("task_done", "en", context)).toBe(
      'Rakesh finished "Sector 62 photos"',
    );
  });

  it("writes every event in every language", () => {
    const events = [
      "task_assigned",
      "ack_reminder",
      "completion_reminder",
      "not_seen",
      "overdue",
      "escalated",
      "task_done",
      "task_verified",
      "reassigned",
      "cancelled",
      "sent_back",
    ] as const;

    for (const locale of ["hi", "hi-Latn", "en"] as const) {
      for (const event of events) {
        const line = writeMessage(event, locale, context);
        expect(line.length, `${locale}/${event}`).toBeGreaterThan(0);
        // The munshi does not shout, does not use emoji, and never says "AI".
        expect(line, `${locale}/${event}`).not.toMatch(/!/);
        expect(line, `${locale}/${event}`).not.toMatch(
          /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
        );
        expect(line, `${locale}/${event}`).not.toMatch(/\bAI\b/);
        // One line, never a paragraph.
        expect(line.split("\n"), `${locale}/${event}`).toHaveLength(1);
      }
    }
  });

  it("works without a time", () => {
    const line = writeMessage("task_assigned", "hi-Latn", {
      actor: "Rakesh",
      task: "Godown stock count",
    });
    expect(line).toBe('Rakesh ne naya kaam bheja: "Godown stock count"');
    expect(line).not.toContain("undefined");
  });

  it("puts the business name in the email subject", () => {
    expect(writeSubject("Rakesh Properties", "Raju ne kaam kiya")).toBe(
      "Rakesh Properties · Raju ne kaam kiya",
    );
  });
});
