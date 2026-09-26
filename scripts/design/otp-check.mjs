import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await fetch("http://127.0.0.1:56424/api/v1/messages", { method: "DELETE" }).catch(() => {});
await p.goto("http://localhost:3200/login");
await p.getByRole("checkbox").first().check();
await p.getByPlaceholder("name@example.com").fill("priya@sharma.test");
await p.getByRole("button", { name: /Send code|Code bhejo|कोड/ }).first().click();
let code = null;
for (let i = 0; i < 20 && !code; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  const list = await (await fetch("http://127.0.0.1:56424/api/v1/messages")).json();
  const m = list.messages?.[0];
  if (m) {
    const full = await (await fetch(`http://127.0.0.1:56424/api/v1/message/${m.ID}`)).json();
    code = (full.Text || "").match(/\b(\d{6})\b/)?.[1] ?? null;
  }
}
console.log("code received:", !!code);
if (code) {
  const inputs = p.locator('input[inputmode="numeric"], input[autocomplete="one-time-code"]');
  await inputs.first().click();
  await p.keyboard.type(code);
  // The code step does not submit itself; press its primary button.
  await p.locator("form button[type=submit]").first().click();
  await p.waitForURL(/\/aaj|\/setup/, { timeout: 20000 }).catch(() => {});
  await p.screenshot({ path: process.env.SHOT ?? "/tmp/otp.png" });
  console.log("landed on", new URL(p.url()).pathname);
}
await b.close();
