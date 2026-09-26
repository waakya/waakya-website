// Call one RPC as a seeded local user and print the raw answer. Local only.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const [who, fn, json] = process.argv.slice(2);
const users = { owner: ["owner@waakya.test", "waakya-e2e-owner-pass"], staff: ["staff@waakya.test", "waakya-e2e-staff-pass"], noorg: ["noorg@waakya.test", "waakya-e2e-noorg-pass"] };
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { error: e } = await supabase.auth.signInWithPassword({ email: users[who][0], password: users[who][1] });
if (e) throw e;
const { data, error } = await supabase.rpc(fn, JSON.parse(json ?? "{}"));
console.log(JSON.stringify({ data, error }, null, 1));
