import { expect, test, describe } from "vitest";
import {
  matchReceiptToClaim,
  normalizeDarajaConfirmation,
  normalizeKcbIpn,
  parseDarajaTime,
  OUR_ACCOUNT,
} from "./paybill";

describe("Paybill ground-truth matching", () => {
  test("parseDarajaTime converts Nairobi TransTime to epoch ms", () => {
    // 2026-09-07 12:00:00 EAT = 09:00:00Z
    expect(parseDarajaTime("20260907120000")).toBe(Date.UTC(2026, 8, 7, 9, 0, 0));
    expect(parseDarajaTime("garbage")).toBeNull();
  });

  test("normalizeDarajaConfirmation parses C2B payloads", () => {
    const r = normalizeDarajaConfirmation({
      TransID: "TK78AB12CD",
      TransAmount: "3000.00",
      MSISDN: "254722000000",
      BillRefNumber: OUR_ACCOUNT,
      BusinessShortCode: "522522",
      TransTime: "20260907120000",
      FirstName: "John",
    });
    expect(r?.transId).toBe("TK78AB12CD");
    expect(r?.amount).toBe(3000);
    expect(r?.source).toBe("daraja_c2b");
    expect(normalizeDarajaConfirmation({ TransID: "", TransAmount: "10" })).toBeNull();
    expect(normalizeDarajaConfirmation({ TransID: "X", TransAmount: "abc" })).toBeNull();
  });

  test("normalizeKcbIpn tolerates alternate field names", () => {
    const r = normalizeKcbIpn({
      response: { MpesaReceiptNumber: "RBC12ABC34", Amount: 500, PhoneNumber: "254722000000" },
    });
    expect(r?.transId).toBe("RBC12ABC34");
    expect(r?.amount).toBe(500);
    expect(r?.source).toBe("kcb_ipn");
    expect(normalizeKcbIpn({ hello: "world" })).toBeNull();
  });

  test("exact recurring match approves", () => {
    const v = matchReceiptToClaim({
      receipt: { amount: 3000, billRef: OUR_ACCOUNT, consumed: false, transTime: null },
      claimedAmount: 3000,
      requireExact: true,
    });
    expect(v).toEqual({ ok: true });
  });

  test("consumed receipts reject (replay)", () => {
    const v = matchReceiptToClaim({
      receipt: { amount: 3000, billRef: OUR_ACCOUNT, consumed: true, transTime: null },
      claimedAmount: 3000,
      requireExact: true,
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.code).toBe("ALREADY_CONSUMED");
  });

  test("short-pay rejects (genuine SMS, wrong amount)", () => {
    const v = matchReceiptToClaim({
      receipt: { amount: 100, billRef: OUR_ACCOUNT, consumed: false, transTime: null },
      claimedAmount: 3000,
      requireExact: true,
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.code).toBe("AMOUNT_MISMATCH");
  });

  test("over-claim rejects (receipt smaller than claim)", () => {
    const v = matchReceiptToClaim({
      receipt: { amount: 500, billRef: "", consumed: false, transTime: null },
      claimedAmount: 5000,
      requireExact: false,
    });
    expect(v.ok).toBe(false);
  });

  test("foreign-account receipts reject (code from another business)", () => {
    const v = matchReceiptToClaim({
      receipt: { amount: 3000, billRef: "999999", consumed: false, transTime: null },
      claimedAmount: 3000,
      requireExact: true,
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.code).toBe("ACCOUNT_MISMATCH");
  });

  test("stale receipts reject", () => {
    const v = matchReceiptToClaim({
      receipt: { amount: 3000, billRef: OUR_ACCOUNT, consumed: false, transTime: "20200101120000" },
      claimedAmount: 3000,
      requireExact: true,
      nowMs: Date.UTC(2026, 8, 7),
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.code).toBe("STALE_RECEIPT");
  });
});
