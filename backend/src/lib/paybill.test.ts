import { expect, test, describe } from "vitest";
import {
  findStkSession,
  matchReceiptToClaim,
  normalizeDarajaConfirmation,
  normalizeKcbIpn,
  parseDarajaTime,
  saveStkSession,
  updateStkSession,
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

  test("normalizeKcbIpn parses official KCB IPN specification payload", () => {
    const officialPayload = {
      transactionReference: "FT00026252",
      requestId: "c7d702cb-6b5f-4fa6-8b57-436d0f789017",
      channelCode: "202",
      timestamp: "2021111103005",
      transactionAmount: "100.00",
      currency: "KES",
      customerReference: "INV-0001",
      customerName: "John Doe",
      customerMobileNumber: "25471111111",
      balance: "",
      narration: "Payment for goods",
      creditAccountIdentifier: "JD001",
      organizationShortCode: "777777",
      tillNumber: "150150",
    };
    const r = normalizeKcbIpn(officialPayload);
    expect(r).not.toBeNull();
    expect(r?.transId).toBe("FT00026252");
    expect(r?.amount).toBe(100);
    expect(r?.phone).toBe("25471111111");
    expect(r?.billRef).toBe("INV-0001");
    expect(r?.shortcode).toBe("777777");
    expect(r?.transTime).toBe("2021111103005");
    expect(r?.source).toBe("kcb_ipn");
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

  test("durable STK sessions round-trip via Supabase-shaped client", async () => {
    const store = new Map<string, Record<string, unknown>>();
    const db = {
      from: (table: string) => {
        if (table !== "mpesa_stk_sessions") throw new Error("unexpected table " + table);
        return {
          upsert: async (row: Record<string, unknown>) => {
            store.set(row.checkout_request_id as string, {
              ...row,
              created_at: new Date().toISOString(),
            });
            return { data: null };
          },
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: store.get("ws_CO_test123") || null }),
            }),
          }),
          update: (patch: Record<string, unknown>) => ({
            eq: () => {
              const row = store.get("ws_CO_test123");
              if (row) store.set("ws_CO_test123", { ...row, ...patch });
              return Promise.resolve({ data: null });
            },
          }),
        };
      },
    };
    await saveStkSession(db, {
      checkoutRequestId: "ws_CO_test123",
      merchantRequestId: "m1",
      name: "Test User",
      email: "test@example.com",
      phone: "254712345678",
      amount: 3000,
      planName: "Kingdom Ambassador",
      planId: "ambassador",
      interval: "monthly",
    });
    const found = await findStkSession(db, "ws_CO_test123");
    expect(found?.checkout_request_id).toBe("ws_CO_test123");
    expect(found?.status).toBe("pending");
    await updateStkSession(db, "ws_CO_test123", { status: "completed", receipt_code: "QHX1" });
    const updated = await findStkSession(db, "ws_CO_test123");
    expect(updated?.status).toBe("completed");
    expect(updated?.receipt_code).toBe("QHX1");
  });

  test("STK helpers never throw when the table is missing", async () => {
    const broken = {
      from: () => {
        throw new Error("relation mpesa_stk_sessions does not exist");
      },
    };
    await expect(
      saveStkSession(broken, {
        checkoutRequestId: "x",
        merchantRequestId: "m",
        name: "n",
        email: "e@x.com",
        phone: "2547",
        amount: 100,
        planName: "p",
        planId: "ambassador",
        interval: "monthly",
      })
    ).resolves.toBeUndefined();
    await expect(findStkSession(broken, "x")).resolves.toBeNull();
    await expect(updateStkSession(broken, "x", { status: "failed" })).resolves.toBeUndefined();
  });
});
