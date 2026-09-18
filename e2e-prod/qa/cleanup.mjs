/**
 * Remove the QA organizations and accounts this suite created — nothing else.
 *
 * Only organizations named like "Sharma Interiors QA <run>" or "QA Cutover
 * <run>" and only accounts at @waakya.test. Real businesses and real people
 * are never touched. Run with `node e2e-prod/qa/cleanup.mjs --yes`.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const QA_ORG = /^(QA Cutover|.+ QA) [a-z0-9]{6,}$/;
const QA_EMAIL = /@waakya\.test$/;
// The local suite signs in with these two; they are fixtures, not QA leftovers.
const FIXTURES = new Set(["owner@waakya.test", "staff@waakya.test"]);
const dryRun = !process.argv.includes("--yes");

async function main() {
  const { data: orgs } = await db.from("orgs").select("id, name");
  const doomed = (orgs ?? []).filter((o) => QA_ORG.test(o.name));
  const kept = (orgs ?? []).filter((o) => !QA_ORG.test(o.name));
  console.log(`organizations: ${doomed.length} QA to remove, ${kept.length} kept`);
  console.log(`kept: ${kept.map((o) => o.name).join(" / ")}`);

  const { data: users } = await db.auth.admin.listUsers({ perPage: 1000 });
  const testAccounts = (users?.users ?? []).filter((u) => QA_EMAIL.test(u.email ?? "") && !FIXTURES.has(u.email ?? ""));
  console.log(`accounts: ${testAccounts.length} @waakya.test to remove, ${(users?.users ?? []).length - testAccounts.length} kept`);
  if (dryRun) return console.log("dry run — pass --yes to delete");

  for (const org of doomed) {
    for (const bucket of ["documents", "proofs"]) {
      const { data: files } = await db.storage.from(bucket).list(`orgs/${org.id}`, { limit: 1000 });
      const paths = (files ?? []).map((f) => `orgs/${org.id}/${f.name}`);
      if (paths.length) await db.storage.from(bucket).remove(paths);
    }
    const { error } = await db.from("orgs").delete().eq("id", org.id);
    console.log(`${error ? "FAILED" : "removed"} ${org.name}${error ? ` — ${error.message}` : ""}`);
  }
  for (const account of testAccounts) {
    const { error } = await db.auth.admin.deleteUser(account.id);
    if (error) console.log(`FAILED ${account.email} — ${error.message}`);
  }
  console.log(`removed ${testAccounts.length} test accounts`);
}

main();
