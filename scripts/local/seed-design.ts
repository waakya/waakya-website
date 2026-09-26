/**
 * Local design-review data. Builds three businesses on the LOCAL Supabase
 * stack so every screen can be judged sparse, dense, long and empty:
 *
 *   Sharma Interiors   a busy interiors firm: owner, manager, four staff,
 *                      work in every state, conversations, projects,
 *                      documents, leave, approvals and notifications.
 *   Verma Constructions a second business, for cross-tenant isolation.
 *   Mehta Traders      a brand-new business with nobody and nothing in it.
 *
 * Run:  npx jiti scripts/local/seed-design.ts
 * Re-runnable: it deletes the three businesses and rebuilds them.
 *
 * It refuses to run unless NEXT_PUBLIC_SUPABASE_URL is on this machine.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

import { renderTemplateHtml } from "../../lib/documents/templates";
import { documentKey } from "../../lib/documents/rules";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(URL)) {
  throw new Error(`Refusing to seed: ${URL || "(no URL)"} is not a local Supabase stack.`);
}

const PASSWORD = "waakya-design-pass";
const db = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const now = Date.now();
const at = (offsetMs: number) => new Date(now + offsetMs).toISOString();
/** A calendar date in India, offset by whole days from today. */
const istDate = (days: number) =>
  new Date(now + days * DAY + 5.5 * HOUR).toISOString().slice(0, 10);

/** Awaits a Supabase call and throws with a label instead of returning an error. */
async function must<R extends { data: unknown; error: unknown }>(
  label: string,
  p: PromiseLike<R>,
): Promise<NonNullable<R["data"]>> {
  const { data, error } = await p;
  if (error) throw new Error(`${label}: ${JSON.stringify(error)}`);
  return data as NonNullable<R["data"]>;
}

// ------------------------------------------------------------------ people --
type Person = { key: string; email: string; name: string; language: string; phone: string; id?: string };

const people: Record<string, Person> = {
  priya: { key: "priya", email: "priya@sharma.test", name: "Priya Sharma", language: "en", phone: "9876500001" },
  arjun: { key: "arjun", email: "arjun@sharma.test", name: "Arjun Mehta", language: "en", phone: "9876500002" },
  rahul: { key: "rahul", email: "rahul@sharma.test", name: "Rahul Verma", language: "hi-Latn", phone: "9876500003" },
  neha: { key: "neha", email: "neha@sharma.test", name: "Neha Singh", language: "en", phone: "9876500004" },
  imran: {
    key: "imran",
    email: "imran@sharma.test",
    name: "Mohammed Imran Qureshi-Venkataraman",
    language: "hi-Latn",
    phone: "9876500005",
  },
  sunita: { key: "sunita", email: "sunita@sharma.test", name: "Sunita Devi", language: "hi", phone: "9876500006" },
  kavita: { key: "kavita", email: "kavita@verma.test", name: "Kavita Verma", language: "en", phone: "9876500011" },
  deepak: { key: "deepak", email: "deepak@verma.test", name: "Deepak Rawat", language: "hi-Latn", phone: "9876500012" },
  anil: { key: "anil", email: "anil@mehta.test", name: "Anil Mehta", language: "en", phone: "9876500021" },
};

async function upsertUser(p: Person) {
  const list = await must("listUsers", db.auth.admin.listUsers({ perPage: 1000 }));
  const existing = list.users.find((u) => u.email === p.email);
  if (existing) {
    await must("updateUser", db.auth.admin.updateUserById(existing.id, { password: PASSWORD, email_confirm: true }));
    p.id = existing.id;
  } else {
    const created = await must(
      "createUser",
      db.auth.admin.createUser({ email: p.email, password: PASSWORD, email_confirm: true }),
    );
    p.id = created.user!.id;
  }
  await must(
    "profile",
    db.from("profiles").upsert({ id: p.id, full_name: p.name, phone: p.phone, language: p.language }),
  );
}

// -------------------------------------------------------------- businesses --
async function resetOrg(name: string) {
  const orgs = await must("orgs", db.from("orgs").select("id").eq("name", name));
  // Rows cascade with the org. Stored files are left behind: on a local stack
  // they cost nothing, and `supabase db reset` clears them.
  for (const o of orgs ?? []) await must("delete org", db.from("orgs").delete().eq("id", o.id));
}

async function makeOrg(name: string, owner: Person, extra: Record<string, unknown> = {}) {
  const org = await must(
    "org",
    db
      .from("orgs")
      .insert({ name, created_by: owner.id, language: "en", ...extra })
      .select("id")
      .single(),
  );
  return (org as { id: string }).id;
}

async function member(orgId: string, p: Person, role: "owner" | "admin" | "manager" | "member") {
  await must("membership", db.from("memberships").insert({ org_id: orgId, user_id: p.id, role }));
}

// ------------------------------------------------------------------- tasks --
type State =
  | "delivered"
  | "acknowledged"
  | "accepted"
  | "in_progress"
  | "done"
  | "verified"
  | "cancelled";

const ORDER: State[] = ["delivered", "acknowledged", "accepted", "in_progress", "done", "verified"];

interface TaskSpec {
  title: string;
  details?: string;
  by: Person;
  to: Person;
  state: State;
  priority?: "low" | "normal" | "high" | "urgent";
  /** When it was sent, relative to now. */
  sentAgo: number;
  /** Deadline relative to now (negative = already passed). */
  due: number;
  ackMinutes?: number;
  proofRequired?: boolean;
  projectId?: string | null;
  sourceMessageId?: string | null;
  proof?: "photo" | "text" | null;
  proofText?: string;
  note?: string;
}

async function makeTask(orgId: string, spec: TaskSpec, photo: Buffer | null) {
  const sent = now - spec.sentAgo;
  const reached = spec.state === "cancelled" ? 1 : ORDER.indexOf(spec.state);
  // Space each step across the time since it was sent.
  const step = (i: number) => new Date(sent + ((spec.sentAgo * 0.8) / 6) * i).toISOString();
  const row: Record<string, unknown> = {
    org_id: orgId,
    title: spec.title,
    details: spec.details ?? null,
    created_by: spec.by.id,
    assigned_to: spec.to.id,
    state: spec.state,
    priority: spec.priority ?? "normal",
    ack_minutes: spec.ackMinutes ?? 60,
    due_at: at(spec.due),
    proof_required: spec.proofRequired ?? false,
    project_id: spec.projectId ?? null,
    source_message_id: spec.sourceMessageId ?? null,
    created_at: new Date(sent).toISOString(),
    delivered_at: new Date(sent).toISOString(),
    acknowledged_at: reached >= 1 ? step(1) : null,
    accepted_at: reached >= 2 ? step(2) : null,
    started_at: reached >= 3 ? step(3) : null,
    done_at: reached >= 4 ? step(4) : null,
    verified_at: reached >= 5 ? step(5) : null,
    cancelled_at: spec.state === "cancelled" ? step(2) : null,
  };
  const task = (await must("task", db.from("tasks").insert(row).select("id").single())) as { id: string };

  const events: Record<string, unknown>[] = [
    { from_state: "created", to_state: "delivered", actor_id: spec.by.id, created_at: new Date(sent).toISOString() },
  ];
  const lastIndex = spec.state === "cancelled" ? 1 : reached;
  for (let i = 1; i <= lastIndex; i++) {
    const actor = i >= 5 ? spec.by : spec.to;
    events.push({ from_state: ORDER[i - 1], to_state: ORDER[i], actor_id: actor.id, created_at: step(i) });
  }
  if (spec.state === "cancelled") {
    events.push({
      from_state: "acknowledged",
      to_state: "cancelled",
      actor_id: spec.by.id,
      note: spec.note ?? null,
      created_at: step(2),
    });
  }
  await must(
    "events",
    db.from("task_events").insert(events.map((e) => ({ ...e, task_id: task.id, org_id: orgId }))),
  );

  if (spec.proof === "photo" && photo) {
    const key = `orgs/${orgId}/tasks/${task.id}/${randomUUID()}.jpg`;
    const up = await db.storage.from("proofs").upload(key, photo, { contentType: "image/jpeg" });
    if (up.error) throw new Error(`proof upload: ${up.error.message}`);
    await must(
      "proof",
      db.from("proofs").insert({
        task_id: task.id,
        org_id: orgId,
        kind: "photo",
        url: key,
        body: spec.proofText ?? null,
        created_by: spec.to.id,
        created_at: step(4),
      }),
    );
  } else if (spec.proof === "text") {
    await must(
      "proof",
      db.from("proofs").insert({
        task_id: task.id,
        org_id: orgId,
        kind: "text",
        body: spec.proofText ?? "Done.",
        created_by: spec.to.id,
        created_at: step(4),
      }),
    );
  }
  return task.id;
}

/** A real photograph for proof, from the wallpapers macOS ships; else a tiny PNG. */
function proofPhoto(): Buffer | null {
  const dir = "/System/Library/Desktop Pictures";
  if (!existsSync(dir)) return null;
  const candidates = execFileSync("ls", [dir]).toString().split("\n").filter((f) => /\.(heic|jpg|png)$/i.test(f));
  const pick = candidates.find((f) => /Sequoia|Sonoma|Ventura|Monterey|Big Sur/i.test(f)) ?? candidates[0];
  if (!pick) return null;
  const out = join(mkdtempSync(join(tmpdir(), "waakya-seed-")), "proof.jpg");
  try {
    execFileSync("sips", ["-s", "format", "jpeg", "-Z", "1200", join(dir, pick), "--out", out], { stdio: "ignore" });
    return readFileSync(out);
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ helpers --
async function conversation(
  orgId: string,
  kind: "direct" | "group",
  title: string | null,
  by: Person,
  members: Person[],
  messages: { who: Person; body: string; ago: number }[],
  readUpTo: Record<string, number> = {},
) {
  const last = messages.length ? now - Math.min(...messages.map((m) => m.ago)) : now;
  const conv = (await must(
    "conversation",
    db
      .from("conversations")
      .insert({
        org_id: orgId,
        kind,
        title,
        created_by: by.id,
        created_at: new Date(now - Math.max(...messages.map((m) => m.ago), 0) - HOUR).toISOString(),
        last_message_at: new Date(last).toISOString(),
      })
      .select("id")
      .single(),
  )) as { id: string };
  await must(
    "participants",
    db.from("conversation_participants").insert(
      members.map((p) => ({
        conversation_id: conv.id,
        org_id: orgId,
        user_id: p.id,
        // Everyone has read everything unless told otherwise.
        last_read_at: new Date(readUpTo[p.key] !== undefined ? now - readUpTo[p.key] : now).toISOString(),
      })),
    ),
  );
  const ids: string[] = [];
  for (const m of messages) {
    const row = (await must(
      "message",
      db
        .from("messages")
        .insert({
          conversation_id: conv.id,
          org_id: orgId,
          author_id: m.who.id,
          body: m.body,
          created_at: new Date(now - m.ago).toISOString(),
        })
        .select("id")
        .single(),
    )) as { id: string };
    ids.push(row.id);
  }
  return { id: conv.id, messageIds: ids };
}

async function templateDoc(
  orgId: string,
  by: Person,
  key: string,
  category: string,
  title: string,
  data: Record<string, string>,
  business: { name: string; address: string | null; gstin: string | null; phone: string | null; email: string | null },
  links: { projectId?: string | null; taskId?: string | null } = {},
  ago = DAY,
) {
  const html = renderTemplateHtml(key, data, business);
  const label = data.client_name || data.project_name || data.date || "draft";
  const name = `${title} - ${label}.html`;
  const storage = documentKey(orgId, randomUUID(), name);
  const up = await db.storage.from("documents").upload(storage, new Blob([html], { type: "text/html" }), {
    contentType: "text/html",
  });
  if (up.error) throw new Error(`doc upload: ${up.error.message}`);
  await must(
    "document",
    db.from("documents").insert({
      org_id: orgId,
      name,
      category,
      mime_type: "text/html",
      size_bytes: new TextEncoder().encode(html).length,
      storage_key: storage,
      uploaded_by: by.id,
      project_id: links.projectId ?? null,
      task_id: links.taskId ?? null,
      source: "template",
      template_key: key,
      template_data: data,
      created_at: at(-ago),
    }),
  );
}

async function uploadDoc(
  orgId: string,
  by: Person,
  name: string,
  category: string,
  body: Buffer,
  mime: string,
  links: { projectId?: string | null } = {},
  ago = DAY,
) {
  const storage = documentKey(orgId, randomUUID(), name);
  const up = await db.storage.from("documents").upload(storage, body, { contentType: mime });
  if (up.error) throw new Error(`doc upload: ${up.error.message}`);
  await must(
    "document",
    db.from("documents").insert({
      org_id: orgId,
      name,
      category,
      mime_type: mime,
      size_bytes: body.length,
      storage_key: storage,
      uploaded_by: by.id,
      project_id: links.projectId ?? null,
      source: "upload",
      created_at: at(-ago),
    }),
  );
}

/** A one-page PDF that real viewers open. */
function tinyPdf(text: string): Buffer {
  const stream = `BT /F1 18 Tf 72 720 Td (${text.replace(/[()\\]/g, "")}) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out);
}

// --------------------------------------------------------------------- run --
async function main() {
  for (const p of Object.values(people)) await upsertUser(p);
  for (const name of ["Sharma Interiors", "Verma Constructions", "Mehta Traders"]) await resetOrg(name);

  const { priya, arjun, rahul, neha, imran, sunita, kavita, deepak, anil } = people as Required<
    Record<string, Person>
  >;
  const photo = proofPhoto();

  // ---------------------------------------------------- Sharma Interiors --
  const business = {
    name: "Sharma Interiors",
    address: "Plot 14, Sector 62, Noida, Uttar Pradesh 201309",
    gstin: "09ABCDE1234F1Z5",
    phone: "+91 98765 00001",
    email: "office@sharmainteriors.in",
  };
  const org = await makeOrg("Sharma Interiors", priya, {
    address: business.address,
    gstin: business.gstin,
    phone: business.phone,
    email: business.email,
  });
  await member(org, priya, "owner");
  await member(org, arjun, "manager");
  for (const p of [rahul, neha, imran, sunita]) await member(org, p, "member");

  // Projects
  const project = async (
    name: string,
    status: string,
    description: string,
    start: number,
    end: number,
    members: Person[],
  ) => {
    const row = (await must(
      "project",
      db
        .from("projects")
        .insert({
          org_id: org,
          name,
          status,
          description,
          start_date: istDate(start),
          end_date: istDate(end),
          created_by: priya.id,
          created_at: at(start * DAY),
        })
        .select("id")
        .single(),
    )) as { id: string };
    await must(
      "project members",
      db.from("project_members").insert(members.map((p) => ({ project_id: row.id, org_id: org, user_id: p.id }))),
    );
    return row.id;
  };
  const villa = await project(
    "Sector 76 Villa",
    "active",
    "Full interiors for a 4BHK villa: modular kitchen, wardrobes, false ceiling and lighting. Client: Mr. & Mrs. Kapoor.",
    -24,
    38,
    [priya, arjun, rahul, neha],
  );
  const residence = await project(
    "Sharma Residence — kitchen",
    "active",
    "Kitchen remodel with quartz counters and a tall pantry unit.",
    -10,
    12,
    [arjun, neha, sunita],
  );
  const dlf = await project(
    "DLF Office Fitout",
    "on_hold",
    "Reception and two meeting rooms. On hold until the landlord signs off the electrical plan.",
    -40,
    20,
    [arjun, imran],
  );
  await project(
    "Gupta Showroom",
    "completed",
    "Display wall, cash counter and signage for a saree showroom in Lajpat Nagar.",
    -90,
    -30,
    [priya, rahul],
  );
  await project(
    "Noida Flat Handover",
    "planned",
    "Snag list and deep clean before handing over a 2BHK in Sector 137.",
    6,
    20,
    [neha],
  );

  // Conversations (the messages trigger their own notifications)
  const site = await conversation(
    org,
    "group",
    "Site team",
    priya,
    [priya, arjun, rahul, neha, imran, sunita],
    [
      { who: arjun, body: "Morning all. Kapoor ji wants the kitchen shutters in matte, not gloss.", ago: 26 * HOUR },
      { who: priya, body: "Noted. Neha, please update the quotation before we order.", ago: 25.5 * HOUR },
      { who: neha, body: "Will do, sending the revised one by evening.", ago: 25 * HOUR },
      { who: rahul, body: "Tiles for the master bath arrived. Two boxes are chipped.", ago: 5 * HOUR },
      {
        who: priya,
        body: "Rahul, please get photos of the chipped boxes and send the return request to the supplier today.",
        ago: 4.5 * HOUR,
      },
      { who: rahul, body: "Theek hai, photo le ke bhej deta hoon.", ago: 4.4 * HOUR },
      {
        who: imran,
        body: "Electrician is coming at 3 for the false-ceiling lights. Someone needs to be on site with the keys, otherwise he will leave and we lose the slot for this whole week.",
        ago: 2 * HOUR,
      },
      { who: arjun, body: "I'll be there by 2:45.", ago: 1.5 * HOUR },
      { who: sunita, body: "Main kal subah 9 baje site pe safai karwa dungi.", ago: 40 * MIN },
    ],
    { priya: 3 * HOUR, rahul: 0, arjun: 0 },
  );
  await conversation(
    org,
    "direct",
    null,
    priya,
    [priya, neha],
    [
      { who: neha, body: "The Kapoor quotation is ready for your review.", ago: 3 * HOUR },
      { who: priya, body: "Thanks. Can you also check if the hinges are soft-close?", ago: 2.8 * HOUR },
      { who: neha, body: "Yes, Hettich soft-close. Added to the scope.", ago: 50 * MIN },
    ],
    { priya: 2 * HOUR },
  );
  await conversation(
    org,
    "direct",
    null,
    arjun,
    [arjun, imran],
    [
      { who: arjun, body: "DLF is on hold. Park the reception drawings for now.", ago: 3 * DAY },
      { who: imran, body: "Okay sir.", ago: 3 * DAY - 20 * MIN },
    ],
  );
  await conversation(
    org,
    "group",
    "Accounts",
    priya,
    [priya, arjun],
    [{ who: arjun, body: "Supplier payment for the plywood lot is due on Friday.", ago: 2 * DAY }],
  );

  // Work, in every state
  const t = {
    // Needs the owner: done, waiting for verification
    tilesReturn: await makeTask(
      org,
      {
        title: "Photograph the chipped tile boxes and send the return request",
        details: "Two boxes in the master bath lot. Supplier: Kajaria dealer, Sector 18.",
        by: priya,
        to: rahul,
        state: "done",
        priority: "high",
        sentAgo: 4.5 * HOUR,
        due: 3 * HOUR,
        proofRequired: true,
        projectId: villa,
        sourceMessageId: site.messageIds[4],
        proof: "photo",
        proofText: "Return request sent. Dealer will pick up on Monday.",
      },
      photo,
    ),
    // Late: past the deadline, still in progress
    quotation: await makeTask(
      org,
      {
        title: "Send the revised Kapoor quotation with matte shutters",
        by: priya,
        to: neha,
        state: "in_progress",
        priority: "high",
        sentAgo: 25 * HOUR,
        due: -2 * HOUR,
        projectId: villa,
        sourceMessageId: site.messageIds[1],
      },
      photo,
    ),
    // Not seen, past the ack window
    ceiling: await makeTask(
      org,
      {
        title: "Be on site with the keys for the false-ceiling electrician at 3",
        by: arjun,
        to: imran,
        state: "delivered",
        priority: "urgent",
        sentAgo: 95 * MIN,
        due: 90 * MIN,
        ackMinutes: 30,
        projectId: villa,
      },
      photo,
    ),
    // Running, past 50% of the budget (amber)
    wardrobe: await makeTask(
      org,
      {
        title: "Measure the wardrobe niches in bedrooms 2 and 3",
        by: priya,
        to: rahul,
        state: "in_progress",
        sentAgo: 6 * HOUR,
        due: 4 * HOUR,
        projectId: villa,
      },
      photo,
    ),
    accepted: await makeTask(
      org,
      {
        title: "Book the carpenter for pantry unit installation",
        by: arjun,
        to: sunita,
        state: "accepted",
        sentAgo: 3 * HOUR,
        due: 2 * DAY,
        projectId: residence,
      },
      photo,
    ),
    seen: await makeTask(
      org,
      {
        title: "Collect quartz samples from the Kirti Nagar showroom",
        by: priya,
        to: neha,
        state: "acknowledged",
        sentAgo: 70 * MIN,
        due: 30 * HOUR,
        projectId: residence,
      },
      photo,
    ),
    fresh: await makeTask(
      org,
      {
        title: "Call Kapoor ji to confirm the site visit time for Saturday",
        by: priya,
        to: rahul,
        state: "delivered",
        sentAgo: 8 * MIN,
        due: 5 * HOUR,
      },
      photo,
    ),
    cleaning: await makeTask(
      org,
      {
        title: "Site ki safai — kal subah 9 baje",
        by: arjun,
        to: sunita,
        state: "accepted",
        sentAgo: 35 * MIN,
        due: 20 * HOUR,
        projectId: villa,
        sourceMessageId: site.messageIds[8],
      },
      photo,
    ),
    verified: await makeTask(
      org,
      {
        title: "Fix the loose hinge on the kitchen tall unit",
        by: priya,
        to: rahul,
        state: "verified",
        sentAgo: 30 * HOUR,
        due: -20 * HOUR,
        proofRequired: true,
        projectId: residence,
        proof: "photo",
        proofText: "Hinge replaced, door closes flush now.",
      },
      photo,
    ),
    verified2: await makeTask(
      org,
      {
        title: "Share the updated lighting layout with the client",
        by: priya,
        to: neha,
        state: "verified",
        sentAgo: 50 * HOUR,
        due: -26 * HOUR,
        projectId: villa,
        proof: "text",
        proofText: "Emailed the PDF to Mrs. Kapoor, she approved it on call.",
      },
      photo,
    ),
    doneText: await makeTask(
      org,
      {
        title: "Get the plywood invoice signed by the supplier",
        by: arjun,
        to: imran,
        state: "done",
        sentAgo: 20 * HOUR,
        due: 2 * HOUR,
        proof: "text",
        proofText: "Signed copy is with Arjun sir.",
      },
      photo,
    ),
    cancelled: await makeTask(
      org,
      {
        title: "Order reception signage for DLF",
        by: arjun,
        to: imran,
        state: "cancelled",
        sentAgo: 4 * DAY,
        due: -2 * DAY,
        projectId: dlf,
        note: "Project on hold.",
      },
      photo,
    ),
    longTitle: await makeTask(
      org,
      {
        title:
          "Coordinate with the building society office about the lift booking for moving the modular kitchen carcasses to the 14th floor, and get the NOC in writing before Friday evening",
        details:
          "The society allows heavy material only between 11 am and 4 pm. Bring two copies of the work order and the owner's authorisation letter.",
        by: priya,
        to: arjun,
        state: "accepted",
        priority: "normal",
        sentAgo: 26 * HOUR,
        due: 30 * HOUR,
        projectId: villa,
      },
      photo,
    ),
    oldVerified: await makeTask(
      org,
      {
        title: "Install the display wall lights at Gupta Showroom",
        by: priya,
        to: rahul,
        state: "verified",
        sentAgo: 40 * DAY,
        due: -38 * DAY,
        proof: "text",
        proofText: "All 12 spots working.",
      },
      photo,
    ),
  };

  // A thread on one task
  await must(
    "task messages",
    db.from("task_messages").insert([
      {
        task_id: t.quotation,
        org_id: org,
        author_id: neha.id,
        body: "Waiting on the matte shutter rate from the vendor, should have it within the hour.",
        created_at: at(-3 * HOUR),
      },
      { task_id: t.quotation, org_id: org, author_id: priya.id, body: "Okay, send it as soon as it comes.", created_at: at(-2.5 * HOUR) },
    ]),
  );

  // An escalation for the late, unseen task
  await must(
    "escalation",
    db.from("escalations").insert({ task_id: t.ceiling, org_id: org, reason: "not_seen", notified_user: priya.id, triggered_at: at(-60 * MIN) }),
  );

  // Documents
  await templateDoc(
    org,
    neha,
    "quotation",
    "quotation",
    "Quotation",
    {
      client_name: "Mr. & Mrs. Kapoor",
      client_address: "Villa 22, Sector 76, Noida",
      project_name: "Sector 76 Villa",
      date: istDate(-1),
      reference: "SI/Q/2026/041",
      scope:
        "Modular kitchen in matte laminate with Hettich soft-close hinges\nThree wardrobes with lofts\nFalse ceiling with cove lighting in the living room",
      amount: "845000",
      gst_percent: "18",
      valid_until: istDate(14),
      payment_terms: "40% on order, 50% on delivery, 10% on handover.",
      notes: "Prices hold for 14 days.",
    },
    business,
    { projectId: villa, taskId: t.quotation },
    20 * HOUR,
  );
  await templateDoc(
    org,
    priya,
    "invoice",
    "invoice",
    "Invoice",
    {
      client_name: "Gupta Sarees",
      client_address: "Shop 4, Central Market, Lajpat Nagar, New Delhi",
      project_name: "Gupta Showroom",
      date: istDate(-30),
      reference: "SI/INV/2026/118",
      scope: "Display wall, cash counter and signage — final bill",
      amount: "312000",
      gst_percent: "18",
      payment_terms: "Due within 15 days.",
    },
    business,
    {},
    30 * DAY,
  );
  await templateDoc(
    org,
    priya,
    "agreement",
    "agreement",
    "Agreement",
    {
      client_name: "Mr. & Mrs. Kapoor",
      client_address: "Villa 22, Sector 76, Noida",
      project_name: "Sector 76 Villa",
      date: istDate(-24),
      scope: "Interior design and execution for a 4BHK villa as per the approved quotation.",
      term: "12 weeks from the date of the first payment",
      amount: "845000",
      gst_percent: "18",
      payment_terms: "As per the quotation.",
      signatory: "Priya Sharma, Proprietor",
    },
    business,
    { projectId: villa },
    24 * DAY,
  );
  await uploadDoc(org, arjun, "DLF electrical plan (landlord draft).pdf", "report", tinyPdf("DLF Office Fitout - electrical plan draft"), "application/pdf", { projectId: dlf }, 5 * DAY);
  await uploadDoc(org, neha, "Kitchen site meeting notes 12 Sep.pdf", "meeting_minutes", tinyPdf("Site meeting notes"), "application/pdf", { projectId: residence }, 6 * DAY);

  // Leave, holidays, attendance
  await must(
    "balances",
    db.from("leave_balances").insert([
      { org_id: org, user_id: rahul.id, balance_days: 10 },
      { org_id: org, user_id: neha.id, balance_days: 8.5 },
      { org_id: org, user_id: imran.id, balance_days: 12 },
      { org_id: org, user_id: sunita.id, balance_days: 4 },
      { org_id: org, user_id: arjun.id, balance_days: 14 },
    ]),
  );
  await must(
    "leave",
    db.from("leave_requests").insert([
      {
        org_id: org,
        user_id: neha.id,
        start_date: istDate(7),
        end_date: istDate(8),
        request_type: "full_day",
        days_requested: 2,
        reason: "Cousin's wedding in Jaipur.",
        status: "pending",
        created_at: at(-5 * HOUR),
      },
      {
        org_id: org,
        user_id: imran.id,
        start_date: istDate(3),
        end_date: istDate(3),
        request_type: "half_day",
        half_day_period: "second_half",
        days_requested: 0.5,
        reason: "Bank work.",
        status: "pending",
        created_at: at(-1 * HOUR),
      },
      {
        org_id: org,
        user_id: rahul.id,
        start_date: istDate(-12),
        end_date: istDate(-11),
        request_type: "full_day",
        days_requested: 2,
        reason: "Fever.",
        status: "approved",
        reviewed_by: priya.id,
        reviewed_at: at(-13 * DAY),
        created_at: at(-14 * DAY),
      },
      {
        org_id: org,
        user_id: sunita.id,
        start_date: istDate(-3),
        end_date: istDate(-3),
        request_type: "full_day",
        days_requested: 1,
        reason: "Ghar pe kaam.",
        status: "rejected",
        reviewed_by: arjun.id,
        reviewed_at: at(-4 * DAY),
        review_note: "Site cleaning was scheduled that day, please pick another date.",
        created_at: at(-5 * DAY),
      },
    ]),
  );
  await must(
    "holidays",
    db.from("holidays").insert([
      { org_id: org, holiday_date: "2026-10-02", title: "Gandhi Jayanti", created_by: priya.id },
      { org_id: org, holiday_date: "2026-10-20", title: "Dussehra", created_by: priya.id },
      { org_id: org, holiday_date: "2026-11-08", title: "Diwali", created_by: priya.id },
      { org_id: org, holiday_date: "2026-11-09", title: "Govardhan Puja", created_by: priya.id },
    ]),
  );

  // Ten working days of attendance for the team; today partly filled.
  const rows: Record<string, unknown>[] = [];
  for (let d = -14; d <= -1; d++) {
    const date = istDate(d);
    const weekday = new Date(`${date}T12:00:00+05:30`).getUTCDay();
    if (weekday === 0) continue;
    for (const [i, p] of [rahul, neha, imran, sunita, arjun].entries()) {
      if (p === rahul && (d === -12 || d === -11)) {
        rows.push({ org_id: org, user_id: p.id, work_date: date, status: "leave" });
        continue;
      }
      const inAt = new Date(`${date}T09:${String(10 + ((((i * 7 + d * 3) % 40) + 40) % 40)).padStart(2, "0")}:00+05:30`);
      const outAt = new Date(inAt.getTime() + (8 * HOUR + ((((i + d) % 5) + 5) % 5) * 20 * MIN));
      rows.push({
        org_id: org,
        user_id: p.id,
        work_date: date,
        status: "present",
        punch_in_at: inAt.toISOString(),
        punch_out_at: outAt.toISOString(),
      });
    }
  }
  const today = istDate(0);
  rows.push({ org_id: org, user_id: rahul.id, work_date: today, status: "present", punch_in_at: at(-5.2 * HOUR) });
  rows.push({ org_id: org, user_id: arjun.id, work_date: today, status: "present", punch_in_at: at(-6 * HOUR) });
  rows.push({ org_id: org, user_id: sunita.id, work_date: today, status: "present", punch_in_at: at(-7 * HOUR), punch_out_at: at(-3 * HOUR) });
  await must("attendance", db.from("attendance_records").insert(rows));

  // Approvals
  await must(
    "approvals",
    db.from("approvals").insert([
      {
        org_id: org,
        title: "Purchase matte laminate sheets for the Kapoor kitchen — ₹48,000",
        details: "Vendor: Greenlam, Kirti Nagar. Needed by Monday to keep the kitchen on schedule.",
        status: "pending",
        requested_by: arjun.id,
        approver_id: priya.id,
        project_id: villa,
        created_at: at(-3 * HOUR),
      },
      {
        org_id: org,
        title: "Advance of ₹5,000 for site labour",
        details: "Two helpers for the pantry unit installation this week.",
        status: "pending",
        requested_by: rahul.id,
        approver_id: priya.id,
        project_id: residence,
        created_at: at(-50 * MIN),
      },
      {
        org_id: org,
        title: "Extra tile spacers for the master bath — ₹1,200",
        details: "Two packets of 3 mm spacers from the Sector 18 hardware shop.",
        status: "pending",
        requested_by: imran.id,
        approver_id: arjun.id,
        project_id: villa,
        created_at: at(-40 * MIN),
      },
      {
        org_id: org,
        title: "Final quotation for the Kapoor villa",
        status: "approved",
        requested_by: neha.id,
        approver_id: priya.id,
        decided_by: priya.id,
        decided_at: at(-20 * DAY),
        project_id: villa,
        created_at: at(-21 * DAY),
      },
      {
        org_id: org,
        title: "New drill machine",
        details: "The old one is still under repair.",
        status: "rejected",
        requested_by: imran.id,
        approver_id: arjun.id,
        decided_by: arjun.id,
        decided_at: at(-2 * DAY),
        decision_note: "Borrow the one from the DLF kit for now.",
        created_at: at(-3 * DAY),
      },
    ]),
  );

  // Task notifications the app would have sent
  const note = (user: Person, event: string, body: string, taskId: string | null, ago: number, read = false) => ({
    org_id: org,
    user_id: user.id,
    event,
    body,
    task_id: taskId,
    href: taskId ? `/kaam/${taskId}` : null,
    created_at: at(-ago),
    read_at: read ? at(-ago + 5 * MIN) : null,
  });
  await must(
    "notifications",
    db.from("notifications").insert([
      note(priya, "task_done", "Rahul Verma finished: Photograph the chipped tile boxes and send the return request", t.tilesReturn, 25 * MIN),
      note(priya, "not_seen", "Mohammed Imran Qureshi-Venkataraman has not seen: Be on site with the keys for the false-ceiling electrician at 3", t.ceiling, 60 * MIN),
      note(priya, "overdue", "Late: Send the revised Kapoor quotation with matte shutters", t.quotation, 2 * HOUR),
      note(priya, "task_done", "Mohammed Imran Qureshi-Venkataraman finished: Get the plywood invoice signed by the supplier", t.doneText, 6 * HOUR, true),
      note(rahul, "task_assigned", "New work from Priya Sharma: Call Kapoor ji to confirm the site visit time for Saturday", t.fresh, 8 * MIN),
      note(rahul, "task_verified", "Verified: Fix the loose hinge on the kitchen tall unit", t.verified, 20 * HOUR, true),
      note(imran, "task_assigned", "New work from Arjun Mehta: Be on site with the keys for the false-ceiling electrician at 3", t.ceiling, 95 * MIN),
    ]),
  );

  // A daily routine
  const routine = (await must(
    "checklist",
    db
      .from("checklists")
      .insert({ org_id: org, name: "Site closing", assigned_to: sunita.id, run_at: "18:00", window_minutes: 60, created_by: priya.id })
      .select("id")
      .single(),
  )) as { id: string };
  await must(
    "checklist items",
    db.from("checklist_items").insert([
      { checklist_id: routine.id, org_id: org, title: "Lock the material store", position: 1, proof_required: true },
      { checklist_id: routine.id, org_id: org, title: "Switch off the main breaker", position: 2, proof_required: false },
      { checklist_id: routine.id, org_id: org, title: "Sweep the work area", position: 3, proof_required: false },
    ]),
  );

  // Pending invite
  await must(
    "invite",
    db.from("invites").insert({
      org_id: org,
      full_name: "Vikas Yadav",
      phone: "9876500007",
      role: "member",
      token: randomUUID().replace(/-/g, ""),
      created_by: priya.id,
      expires_at: at(6 * DAY),
    }),
  );

  // ------------------------------------------------ Verma Constructions --
  const verma = await makeOrg("Verma Constructions", kavita, { address: "Rajpur Road, Dehradun" });
  await member(verma, kavita, "owner");
  await member(verma, deepak, "member");
  await makeTask(verma, { title: "Check the cement delivery at Rajpur site", by: kavita, to: deepak, state: "in_progress", sentAgo: 3 * HOUR, due: 5 * HOUR }, photo);
  await conversation(verma, "direct", null, kavita, [kavita, deepak], [
    { who: kavita, body: "Cement truck is at the gate.", ago: 2 * HOUR },
  ]);

  // ------------------------------------------------------ Mehta Traders --
  const mehta = await makeOrg("Mehta Traders", anil);
  await member(mehta, anil, "owner");

  await ensureE2eFixture();

  console.log("Seeded:");
  console.log("  Sharma Interiors  owner priya@sharma.test · manager arjun@sharma.test · staff rahul@, neha@, imran@, sunita@sharma.test");
  console.log("  Verma Constructions  kavita@verma.test · deepak@verma.test");
  console.log("  Mehta Traders (empty)  anil@mehta.test");
  console.log(`  Password for all: ${PASSWORD}`);
  console.log(`  Proof photo: ${photo ? "real photo" : "none"}`);
}

/**
 * The business the Playwright suite signs into (seed-e2e.sql makes the two
 * people). The suite was written against a development project where this
 * business already existed, so on a fresh stack it is made here. Created once
 * and never deleted: the suite adds to it on every run.
 */
async function ensureE2eFixture() {
  const users = await must("listUsers", db.auth.admin.listUsers({ perPage: 1000 }));
  const owner = users.users.find((u) => u.email === "owner@waakya.test");
  const staff = users.users.find((u) => u.email === "staff@waakya.test");
  if (!owner || !staff) throw new Error("Run supabase/seed-e2e.sql first (supabase db reset does).");
  const existing = await must(
    "fixture membership",
    db.from("memberships").select("org_id").eq("user_id", owner.id).eq("role", "owner"),
  );
  if ((existing ?? []).length > 0) return;
  const org = (await must(
    "fixture org",
    db.from("orgs").insert({ name: "Waakya Test Co", created_by: owner.id, language: "hi-Latn" }).select("id").single(),
  )) as { id: string };
  await must(
    "fixture members",
    db.from("memberships").insert([
      { org_id: org.id, user_id: owner.id, role: "owner" },
      { org_id: org.id, user_id: staff.id, role: "member" },
    ]),
  );
  await must(
    "fixture languages",
    db.from("profiles").upsert([
      { id: owner.id, full_name: "Rakesh", language: "hi-Latn" },
      { id: staff.id, full_name: "Raju", language: "hi-Latn" },
    ]),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
