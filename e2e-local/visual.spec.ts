import { test } from "@playwright/test";
import { signInAs } from "../e2e/support/auth";
import { horizontalOverflow } from "../e2e/support/overflow";

/** Local visual check of redesigned screens at desktop and 390px. */
const OUT = process.env.OUT_DIR ?? "/tmp/visual";
for (const vp of [
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "mobile", width: 390, height: 844, mobile: true },
]) {
  test(`visual ${vp.name}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile });
    const page = await ctx.newPage();
    const shoot = async (slug: string) => {
      await page.waitForTimeout(600);
      console.log(slug, vp.name, "overflow", await horizontalOverflow(page));
      await page.screenshot({ path: `${OUT}/${vp.name}-${slug}.jpg`, fullPage: true, type: "jpeg", quality: 60 });
    };
    await page.goto("/"); await shoot("landing");
    await page.goto("/login"); await shoot("login");
    await page.goto("/does-not-exist"); await shoot("404");
    await page.goto("/join/00000000000000000000000000000000"); await shoot("join-invalid");
    await signInAs(page, "owner", "en");
    for (const [path, slug] of [["/aaj", "today"], ["/documents", "documents"], ["/hazri", "attendance"], ["/staff", "team"], ["/more", "more"], ["/baat", "conversations"]] as const) {
      await page.goto(path); await shoot(slug);
    }
    await page.goto("/projects");
    const project = await page.locator('main a[href^="/projects/"]').first().getAttribute("href");
    if (project) { await page.goto(project); await shoot("project"); }
    await page.goto("/work?tab=done");
    const task = await page.locator('main a[href^="/kaam/"]').first().getAttribute("href");
    if (task) { await page.goto(task); await shoot("task"); }
    await page.goto("/baat");
    const conv = await page.locator('main a[href^="/baat/"]').first().getAttribute("href");
    if (conv) { await page.goto(conv); await shoot("thread"); }
    await ctx.close();
  });
}
