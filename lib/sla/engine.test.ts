import { describe, expect, it } from "vitest";
import { deliveredAfterQuiet, isQuietHour, planSlaActions, type SlaOrg, type SlaTask } from "./engine";

const ORG: SlaOrg = {
  id: "org",
  name: "Rakesh Properties",
  ackMinutes: 15,
  quietStart: "21:00",
  quietEnd: "08:00",
};

/** 10:00 IST. */
const DELIVERED = "2026-09-04T04:30:00.000Z";
/** 5:00 pm IST — a seven-hour window. */
const DUE = "2026-09-04T11:30:00.000Z";
const at = (minutesLater: number) =>
  new Date(Date.parse(DELIVERED) + minutesLater * 60_000);

function task(overrides: Partial<SlaTask> = {}): SlaTask {
  return {
    id: "task-1",
    orgId: "org",
    title: "Sector 62 photos",
    state: "delivered",
    assignedTo: "raju",
    createdBy: "rakesh",
    deliveredAt: DELIVERED,
    dueAt: DUE,
    acknowledgedAt: null,
    doneAt: null,
    ackMinutes: 15,
    escalated: [],
    ...overrides,
  };
}

const kinds = (result: ReturnType<typeof planSlaActions>) =>
  result.send.map((a) =>
    a.kind === "reminder" ? `${a.clock}:${a.fraction}` : `escalate:${a.reason}`,
  );

describe("nothing is owed at the start", () => {
  it("sends nothing the moment a task is delivered", () => {
    expect(planSlaActions([task()], ORG, at(0)).send).toEqual([]);
  });

  it("ignores work that is finished", () => {
    for (const state of ["done", "verified", "cancelled"] as const) {
      const result = planSlaActions(
        [task({ state, doneAt: at(1).toISOString() })],
        ORG,
        at(600),
      );
      expect(result.send, state).toEqual([]);
    }
  });

  it("ignores a task that was never delivered", () => {
    expect(
      planSlaActions([task({ deliveredAt: null })], ORG, at(600)).send,
    ).toEqual([]);
  });
});

describe("reminders", () => {
  it("go out at 50% and 90% of the acknowledge window", () => {
    // The ack window is 15 minutes: 50% is 7.5, 90% is 13.5.
    expect(kinds(planSlaActions([task()], ORG, at(7)))).toEqual([]);
    expect(kinds(planSlaActions([task()], ORG, at(8)))).toEqual(["ack:0.5"]);
    expect(kinds(planSlaActions([task()], ORG, at(14)))).toEqual([
      "ack:0.5",
      "ack:0.9",
    ]);
  });

  it("go out at 50% and 90% of the completion window", () => {
    // The completion window is 7 hours: 50% is 3h30, 90% is 6h18.
    const acknowledged = task({
      state: "accepted",
      acknowledgedAt: at(3).toISOString(),
    });
    expect(kinds(planSlaActions([acknowledged], ORG, at(209)))).toEqual([]);
    expect(kinds(planSlaActions([acknowledged], ORG, at(211)))).toEqual([
      "completion:0.5",
    ]);
    expect(kinds(planSlaActions([acknowledged], ORG, at(380)))).toEqual([
      "completion:0.5",
      "completion:0.9",
    ]);
  });

  it("go to the person doing the work, never to the owner", () => {
    const result = planSlaActions([task()], ORG, at(14));
    for (const action of result.send) {
      expect(action.userId).toBe("raju");
    }
  });

  it("stop once the task has been acknowledged", () => {
    const seen = task({
      state: "acknowledged",
      acknowledgedAt: at(2).toISOString(),
    });
    expect(kinds(planSlaActions([seen], ORG, at(14)))).toEqual([]);
  });

  it("are keyed so a retry cannot send twice", () => {
    const first = planSlaActions([task()], ORG, at(8));
    const again = planSlaActions([task()], ORG, at(9));
    expect(first.send[0].dedupeKey).toBe(again.send[0].dedupeKey);
    expect(first.send[0].dedupeKey).toBe("task-1:ack_reminder:0.5");
  });

  it("still owe the earlier reminder when the job runs late", () => {
    // A job that has not run for an hour must not skip the 50% reminder.
    expect(kinds(planSlaActions([task()], ORG, at(14)))).toEqual([
      "ack:0.5",
      "ack:0.9",
    ]);
  });

  it("are not sent for a task with nobody assigned", () => {
    expect(
      planSlaActions([task({ assignedTo: null })], ORG, at(14)).send.filter(
        (a) => a.kind === "reminder",
      ),
    ).toEqual([]);
  });
});

describe("escalation", () => {
  it("goes to the owner when the acknowledge SLA runs out", () => {
    const result = planSlaActions([task()], ORG, at(16));
    expect(kinds(result)).toContain("escalate:ack_sla");
    const escalation = result.send.find((a) => a.kind === "escalation");
    expect(escalation?.userId).toBe("rakesh");
  });

  it("goes to the owner when the deadline passes", () => {
    const accepted = task({
      state: "accepted",
      acknowledgedAt: at(2).toISOString(),
    });
    expect(kinds(planSlaActions([accepted], ORG, at(430)))).toContain(
      "escalate:completion_sla",
    );
  });

  it("stops reminding once the deadline has passed", () => {
    const accepted = task({
      state: "accepted",
      acknowledgedAt: at(2).toISOString(),
    });
    // Past the deadline there is nothing to warn about; it is late, and the
    // owner is being told.
    expect(kinds(planSlaActions([accepted], ORG, at(430)))).toEqual([
      "escalate:completion_sla",
    ]);
  });

  it("marks a fresh escalation as needing a row, and a retry as not", () => {
    const fresh = planSlaActions([task()], ORG, at(16)).send.find(
      (a) => a.kind === "escalation",
    );
    expect(fresh?.kind === "escalation" && fresh.alreadyRecorded).toBe(false);

    const chasing = planSlaActions(
      [
        task({
          escalated: [{ reason: "ack_sla", at: at(16).toISOString() }],
        }),
      ],
      ORG,
      at(60),
    ).send.find((a) => a.kind === "escalation");
    expect(chasing?.kind === "escalation" && chasing.alreadyRecorded).toBe(true);
  });

  it("is keyed once per task per reason, for all time", () => {
    const a = planSlaActions([task()], ORG, at(16)).send.find(
      (x) => x.kind === "escalation",
    );
    // Much later the same day — still inside working hours, so it is sent
    // rather than held back.
    const b = planSlaActions([task()], ORG, at(400)).send.find(
      (x) => x.kind === "escalation",
    );
    expect(a?.dedupeKey).toBe("task-1:escalated:ack_sla");
    expect(b?.dedupeKey).toBe(a?.dedupeKey);
  });

  it("can raise both reasons on one task", () => {
    const stale = task();
    const reasons = planSlaActions([stale], ORG, at(430))
      .send.filter((a) => a.kind === "escalation")
      .map((a) => (a.kind === "escalation" ? a.reason : ""));
    expect(reasons.sort()).toEqual(["ack_sla", "completion_sla"]);
  });
});

describe("quiet hours", () => {
  const nightOrg = ORG;

  it("cover the night and wrap midnight", () => {
    // 21:00 to 08:00 is the night, not a nineteen-hour daytime window.
    expect(isQuietHour(nightOrg, new Date("2026-09-04T16:00:00.000Z"))).toBe(true); // 21:30 IST
    expect(isQuietHour(nightOrg, new Date("2026-09-04T20:00:00.000Z"))).toBe(true); // 01:30 IST
    expect(isQuietHour(nightOrg, new Date("2026-09-04T04:30:00.000Z"))).toBe(false); // 10:00 IST
    expect(isQuietHour(nightOrg, new Date("2026-09-04T02:00:00.000Z"))).toBe(true); // 07:30 IST
    expect(isQuietHour(nightOrg, new Date("2026-09-04T02:45:00.000Z"))).toBe(false); // 08:15 IST
  });

  it("send no reminder at 11pm", () => {
    const night = new Date("2026-09-04T17:45:00.000Z"); // 23:15 IST
    const late = task({
      deliveredAt: "2026-09-04T17:30:00.000Z",
      dueAt: "2026-09-04T18:30:00.000Z",
    });
    expect(planSlaActions([late], nightOrg, night).send).toEqual([]);
  });

  it("still record an escalation at 11pm, and send it in the morning", () => {
    // The record must be true even at 11pm; the phone can wait until 8am.
    const night = new Date("2026-09-04T17:45:00.000Z"); // 23:15 IST
    const overdue = task({ dueAt: "2026-09-04T17:00:00.000Z" });

    const atNight = planSlaActions([overdue], nightOrg, night);
    expect(atNight.send).toEqual([]);
    expect(atNight.recordOnly.map((a) => a.dedupeKey)).toContain(
      "task-1:escalated:completion_sla",
    );

    // Next morning, with the row already written, the message goes out once.
    const morning = new Date("2026-09-05T03:30:00.000Z"); // 09:00 IST
    const already = {
      ...overdue,
      escalated: [{ reason: "completion_sla" as const, at: night.toISOString() }],
    };
    const atMorning = planSlaActions([already], nightOrg, morning);
    expect(atMorning.send.map((a) => a.dedupeKey)).toContain(
      "task-1:escalated:completion_sla",
    );
  });

  it("are off when an org sets start and end to the same time", () => {
    const always = { ...ORG, quietStart: "00:00", quietEnd: "00:00" };
    expect(isQuietHour(always, new Date("2026-09-04T20:00:00.000Z"))).toBe(false);
  });

  it("ignore a malformed setting rather than muting the product", () => {
    const broken = { ...ORG, quietStart: "not a time", quietEnd: "08:00" };
    expect(isQuietHour(broken, new Date("2026-09-04T20:00:00.000Z"))).toBe(false);
  });
});

describe("a per-task SLA", () => {
  it("overrides the org default", () => {
    const urgent = task({ ackMinutes: 5 });
    expect(kinds(planSlaActions([urgent], ORG, at(6)))).toContain(
      "escalate:ack_sla",
    );
    const relaxed = task({ ackMinutes: 60 });
    expect(kinds(planSlaActions([relaxed], ORG, at(6)))).toEqual([]);
  });
});

describe("many tasks", () => {
  it("are planned independently", () => {
    const result = planSlaActions(
      [
        task({ id: "a" }),
        task({ id: "b", acknowledgedAt: at(1).toISOString(), state: "accepted" }),
        task({ id: "c", state: "verified" }),
      ],
      ORG,
      at(16),
    );
    const ids = new Set(result.send.map((a) => a.taskId));
    expect(ids.has("a")).toBe(true);
    expect(ids.has("c")).toBe(false);
  });
});

describe("an escalation stops being retried", () => {
  // Acknowledged, so only the completion clock is in play here.
  const overdue = task({
    state: "accepted",
    acknowledgedAt: "2026-09-04T04:32:00.000Z",
    dueAt: "2026-09-04T05:00:00.000Z",
  });

  it("is attempted again the morning after a quiet-hours hold-back", () => {
    const raisedLastNight = {
      ...overdue,
      escalated: [
        { reason: "completion_sla" as const, at: "2026-09-04T17:45:00.000Z" },
      ],
    };
    const morning = new Date("2026-09-05T03:30:00.000Z"); // 09:00 IST, ~10h later
    expect(
      planSlaActions([raisedLastNight], ORG, morning).send.map((a) => a.kind),
    ).toContain("escalation");
  });

  it("is left alone once it is more than a day old", () => {
    // Without this, every task that ever went late would be re-attempted on
    // every tick forever, and the job would get slower every week.
    const raisedLongAgo = {
      ...overdue,
      escalated: [
        { reason: "completion_sla" as const, at: "2026-09-01T06:00:00.000Z" },
      ],
    };
    const later = new Date("2026-09-04T06:00:00.000Z");
    expect(planSlaActions([raisedLongAgo], ORG, later).send).toEqual([]);
  });

  it("ignores an unparseable timestamp rather than retrying forever", () => {
    const broken = {
      ...overdue,
      escalated: [{ reason: "completion_sla" as const, at: "not a date" }],
    };
    const later = new Date("2026-09-04T06:00:00.000Z");
    expect(planSlaActions([broken], ORG, later).send).toEqual([]);
  });
});


describe("deliveredAfterQuiet", () => {
  const quiet = { quietStart: "21:00", quietEnd: "08:00" };
  const iso = (d: Date) => d.toISOString();

  it("leaves a daytime reminder alone", () => {
    const at = new Date("2026-09-10T12:00:00.000Z"); // 5:30 pm IST
    expect(iso(deliveredAfterQuiet(quiet, at))).toBe(iso(at));
  });

  it("moves a small-hours reminder to 8:00 am the same morning", () => {
    const at = new Date("2026-09-10T23:50:00.000Z"); // 5:20 am IST, 11 Sept
    expect(iso(deliveredAfterQuiet(quiet, at))).toBe("2026-09-11T02:30:00.000Z");
  });

  it("moves a late-evening reminder to 8:00 am the next morning", () => {
    const at = new Date("2026-09-10T17:00:00.000Z"); // 10:30 pm IST, 10 Sept
    expect(iso(deliveredAfterQuiet(quiet, at))).toBe("2026-09-11T02:30:00.000Z");
  });
});
