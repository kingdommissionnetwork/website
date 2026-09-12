import { expect, test, describe } from "vitest";
import { claimReceivedEmail, claimDecisionEmail } from "./emailTemplates";
import { sendClaimReceivedEmail, sendClaimDecisionEmail } from "./email";

describe("claim notification emails", () => {
  test("received email carries reference, track link, and safe-to-close message", () => {
    const { subject, html } = claimReceivedEmail({
      name: "Jane",
      reference: "TK78AB12CD",
      amount: 3000,
      planName: "Kingdom Ambassador",
      trackUrl: "/track?ref=TK78AB12CD&email=jane%40example.com",
    });
    expect(subject).toContain("TK78AB12CD");
    expect(html).toContain("TK78AB12CD");
    expect(html).toContain("/track?ref=TK78AB12CD");
    expect(html).toMatch(/safely close/i);
  });

  test("received email escapes payer-supplied HTML", () => {
    const { html } = claimReceivedEmail({
      name: "<script>alert(1)</script>",
      reference: "TK78AB12CD",
      amount: 3000,
      planName: "Kingdom Ambassador",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("rejected decision email carries the reviewer reason and resubmit path", () => {
    const { subject, html } = claimDecisionEmail({
      name: "Jane",
      reference: "TK78AB12CD",
      planName: "Kingdom Ambassador",
      decision: "rejected",
      reason: "Code not found on statement",
    });
    expect(subject).toContain("TK78AB12CD");
    expect(html).toContain("Code not found on statement");
    expect(html).toMatch(/resubmit/i);
  });

  test("mismatch and expired variants render distinct guidance", () => {
    const mismatch = claimDecisionEmail({
      name: "Jane",
      reference: "TK78AB12CD",
      planName: "Kingdom Ambassador",
      decision: "amount_mismatch",
    });
    expect(mismatch.html).toMatch(/amount/i);
    const expired = claimDecisionEmail({
      name: "Jane",
      reference: "TK78AB12CD",
      planName: "Kingdom Ambassador",
      decision: "expired",
    });
    expect(expired.html).toMatch(/window|expir/i);
    const approved = claimDecisionEmail({
      name: "Jane",
      reference: "TK78AB12CD",
      planName: "Kingdom Ambassador",
      decision: "approved",
    });
    expect(approved.subject).toMatch(/activated/i);
    expect(approved.html).toMatch(/Partner Hub/i);
  });

  test("senders are best-effort without RESEND_API_KEY (never throw)", async () => {
    delete process.env.RESEND_API_KEY;
    const c = { env: {} };
    await expect(
      sendClaimReceivedEmail(c, { email: "jane@example.com", name: "Jane", reference: "TK78AB12CD", amount: 3000, planName: "Kingdom Ambassador" })
    ).resolves.toBeUndefined();
    await expect(
      sendClaimDecisionEmail(c, { email: "jane@example.com", name: "Jane", reference: "TK78AB12CD", planName: "Kingdom Ambassador", decision: "rejected", reason: "test" })
    ).resolves.toBeUndefined();
    await expect(
      sendClaimReceivedEmail(c, { email: "", name: "Jane", reference: "TK78AB12CD", amount: 3000, planName: "Kingdom Ambassador" })
    ).resolves.toBeUndefined();
  });
});
