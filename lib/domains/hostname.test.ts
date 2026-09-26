import { describe, expect, it } from "vitest";
import { isPlatformHost, normalizeHostname, txtSatisfies, verificationRecord } from "./hostname";

describe("hostnames", () => {
  it("normalise what people paste and refuse what is not a host", () => {
    expect(normalizeHostname(" https://Portal.Customer.com/ ")).toBe("portal.customer.com");
    expect(normalizeHostname("portal.customer.com:443")).toBe("portal.customer.com");
    expect(normalizeHostname("customer")).toBeNull();
    expect(normalizeHostname("-bad.customer.com")).toBeNull();
    expect(normalizeHostname("evil.waakya.com")).toBeNull();
    expect(normalizeHostname("waakya.com")).toBeNull();
  });
  it("describe the record and recognise it however DNS returns it", () => {
    const rec = verificationRecord("portal.customer.com", "abc123");
    expect(rec).toEqual({ name: "_waakya-verify.portal.customer.com", value: "waakya-verify=abc123" });
    expect(txtSatisfies([["waakya-verify=abc123"]], "abc123")).toBe(true);
    expect(txtSatisfies([["waakya-", "verify=abc123"]], "abc123")).toBe(true);
    expect(txtSatisfies([['"waakya-verify=abc123"']], "abc123")).toBe(true);
    expect(txtSatisfies([["v=spf1 -all"], ["waakya-verify=other"]], "abc123")).toBe(false);
  });
  it("know the platform's own hosts", () => {
    expect(isPlatformHost("waakya.com", "https://waakya.com")).toBe(true);
    expect(isPlatformHost("www.waakya.com", "https://waakya.com")).toBe(true);
    expect(isPlatformHost("waakya-abc.vercel.app", "https://waakya.com")).toBe(true);
    expect(isPlatformHost("localhost:3000", "https://waakya.com")).toBe(true);
    expect(isPlatformHost("portal.customer.com", "https://waakya.com")).toBe(false);
  });
});
