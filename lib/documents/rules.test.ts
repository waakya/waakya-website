import { describe, expect, it } from "vitest";

import {
  documentKey,
  formatBytes,
  isAllowedType,
  orgIdFromDocumentKey,
  safeFileName,
} from "./rules";
import { computeTotals, renderTemplateHtml, TEMPLATES } from "./templates";

const ORG = "11111111-2222-3333-4444-555555555555";
const FILE = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

describe("document keys", () => {
  it("puts every document inside its own org's folder", () => {
    const key = documentKey(ORG, FILE, "Quotation v2.pdf");
    expect(key).toBe(`orgs/${ORG}/documents/${FILE}/Quotation_v2.pdf`);
    expect(orgIdFromDocumentKey(key)).toBe(ORG);
  });

  it("refuses keys that are not shaped like ours", () => {
    expect(orgIdFromDocumentKey(`orgs/${ORG}/tasks/${FILE}/x.jpg`)).toBeNull();
    expect(orgIdFromDocumentKey(`orgs/not-an-org/documents/${FILE}/x.pdf`)).toBeNull();
    expect(orgIdFromDocumentKey(`orgs/${ORG}/documents/${FILE}/a/b.pdf`)).toBeNull();
  });

  it("cannot escape the folder through the file name", () => {
    expect(safeFileName("../../etc/passwd")).not.toContain("/");
    expect(safeFileName("a\\b")).not.toContain("\\");
  });

  it("accepts business paperwork and refuses executables", () => {
    expect(isAllowedType("application/pdf")).toBe(true);
    expect(isAllowedType("image/png")).toBe(true);
    expect(isAllowedType("application/x-msdownload")).toBe(false);
  });

  it("writes sizes the way people read them", () => {
    expect(formatBytes(412 * 1024)).toBe("412 KB");
    expect(formatBytes(1.2 * 1024 * 1024)).toBe("1.2 MB");
    expect(formatBytes(0)).toBe("—");
  });
});

describe("templates", () => {
  it("ships the ten Phase-1 templates", () => {
    expect(TEMPLATES.map((t) => t.key).sort()).toEqual(
      [
        "agreement",
        "invoice",
        "meeting_minutes",
        "nda",
        "proposal",
        "purchase_order",
        "quotation",
        "receipt",
        "sow",
        "work_order",
      ].sort(),
    );
  });

  it("adds GST on top of the amount", () => {
    const totals = computeTotals("100000", "18");
    expect(totals?.gst).toBe(18000);
    expect(totals?.total).toBe(118000);
  });

  it("escapes what people type, so a field cannot inject markup", () => {
    const html = renderTemplateHtml(
      "quotation",
      { client_name: "<script>alert(1)</script>", amount: "1000", gst_percent: "18" },
      { name: "Test & Co", address: null, gstin: null, phone: null, email: null },
    );
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Test &amp; Co");
  });
});
