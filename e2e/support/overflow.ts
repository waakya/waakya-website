import type { Page } from "@playwright/test";

/**
 * How far the page reaches past the device's real width, in CSS pixels.
 *
 * Measuring against `window.innerWidth` is not enough: with mobile emulation
 * the layout viewport grows to fit overflowing content, so a 453px page on a
 * 390px phone reports innerWidth 453 and "no overflow". The configured
 * viewport is the truth, and the widest element edge catches content that
 * overflows inside a clipped container too.
 */
export async function horizontalOverflow(page: Page): Promise<number> {
  const width = page.viewportSize()?.width ?? 0;
  const reach = await page.evaluate(() => {
    let right = document.documentElement.scrollWidth;
    for (const el of Array.from(document.body.querySelectorAll("*"))) {
      const style = getComputedStyle(el);
      if (style.position === "fixed" || style.visibility === "hidden" || style.display === "none") continue;
      // Content deliberately inside a horizontal scroller does not widen the page.
      let clipped = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") { clipped = true; break; }
      }
      if (clipped) continue;
      right = Math.max(right, Math.ceil(el.getBoundingClientRect().right + window.scrollX));
    }
    return right;
  });
  return reach - width;
}
