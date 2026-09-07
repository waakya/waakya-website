// Supabase Edge Function: the scheduler for the SLA job.
//
// It deliberately holds no logic. The engine and the runner are TypeScript in
// the app, unit-tested there, and duplicating them in Deno would mean two
// copies of the rule that decides whether somebody's work is late. This just
// wakes the app up every five minutes.
//
// Deploy:
//   supabase functions deploy sla-tick --no-verify-jwt
//   supabase secrets set WAAKYA_APP_URL=https://waakya.com CRON_SECRET=<secret>
//
// Schedule (Supabase dashboard → Edge Functions → Schedules, or pg_cron):
//   */5 * * * *
Deno.serve(async () => {
  const appUrl = Deno.env.get("WAAKYA_APP_URL");
  const secret = Deno.env.get("CRON_SECRET");

  if (!appUrl || !secret) {
    return new Response(
      JSON.stringify({ ok: false, reason: "WAAKYA_APP_URL or CRON_SECRET missing" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/cron/sla`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
});
