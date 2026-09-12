import { describe, it, expect } from "vitest";
import { buildPartnerIdCardHtml } from "../lib/printEngine";

const card = {
  id: "KMN-2026-48213",
  name: "Abazion Partner",
  email: "abazion230@gmail.com",
  role: "Global Harvest Partner",
  planName: "Global Harvest Partner",
  subscriptionStatus: "active",
  joinedAt: "2026",
};

describe("buildPartnerIdCardHtml (partner ID back side)", () => {
  it("keeps the FULL credential id (no truncation of the unique suffix)", async () => {
    const html = await buildPartnerIdCardHtml(card);
    expect(html).toContain("HKN-KMN-2026-48213");
    expect(html).not.toContain("HKN-KMN-2026<");
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
