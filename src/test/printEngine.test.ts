import { describe, it, expect } from "vitest";
import { buildPartnerIdCardHtml, toDisplayId, credentialVerifyUrl } from "../lib/printEngine";

const card = {
  id: "KMN-2026-48213",
  name: "Abazion Partner",
  email: "abazion230@gmail.com",
  role: "Global Harvest Partner",
  planName: "Global Harvest Partner",
  subscriptionStatus: "active",
  joinedAt: "2026",
};

describe("toDisplayId (canonical card numbers)", () => {
  it("prints issued KMN-P numbers as-is with no prefix stacking", () => {
    expect(toDisplayId("KMN-P-2026/4002")).toBe("KMN-P-2026/4002");
    expect(toDisplayId("kmn-p-2026/4002")).toBe("KMN-P-2026/4002");
  });

  it("keeps legacy ids whole (never truncates the unique suffix)", () => {
    expect(toDisplayId("KMN-2026-48213")).toBe("KMN-2026-48213");
    expect(toDisplayId("TK78AB12CD")).toBe("HKN-TK78AB12CD");
  });
});

describe("credentialVerifyUrl (QR deep links)", () => {
  const token = "a".repeat(48);
  it("prefers the unguessable /v/<token> link when a token exists", () => {
    expect(credentialVerifyUrl("https://x.org", "KMN-P-2026/4002", token)).toBe(`https://x.org/v/${token}`);
  });

  it("falls back to the manual verify page for legacy cards", () => {
    expect(credentialVerifyUrl("https://x.org", "HKN-TK78AB12CD", null)).toBe(
      "https://x.org/verify?partner=HKN-TK78AB12CD"
    );
    expect(credentialVerifyUrl("https://x.org", "KMN-P-2026/4002", "bogus")).toContain("/verify?partner=");
  });
});

describe("buildPartnerIdCardHtml (partner ID back side)", () => {
  it("keeps the FULL credential id (no truncation of the unique suffix)", async () => {
    const html = await buildPartnerIdCardHtml({ ...card, partnerNumber: "KMN-P-2026/4002" });
    expect(html).toContain("KMN-P-2026/4002");
    expect(html).not.toContain("HKN-KMN-P-2026/4002");
  });

  it("renders the holder's actual signature data in the signature strip", async () => {
    const html = await buildPartnerIdCardHtml(card);
    expect(html).toContain("sig-holder");
    expect(html).toContain("Abazion Partner");
    expect(html).toContain("Authorized Holder Signature:");
  });

  it("matches the covenant statement and secretariat block", async () => {
    const html = await buildPartnerIdCardHtml(card);
    expect(html).toContain("COVENANT DEPLOYMENT STATEMENT:");
    expect(html).toContain("church planting, and humanitarian relief");
    expect(html).toContain("Luke 8:1-3");
    expect(html).toContain("+254 700 000 000 | kingdommissions.org");
  });
});
