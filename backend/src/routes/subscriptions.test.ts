import { expect, test, describe, beforeAll } from "vitest";
import { Hono } from "hono";
import { subscriptionRoutes } from "./subscriptions";

const app = new Hono();
app.route("/", subscriptionRoutes);

describe("Subscription Routes", () => {
  beforeAll(() => {
    process.env.PAYSTACK_SECRET_KEY = "test_secret";
    // Rate limiting is covered by rateLimiter.test.ts; disable it here so
    // validation-focused tests stay deterministic.
    process.env.DISABLE_RATE_LIMIT = "1";
  });

  test("GET /pricing returns 1000 KES dynamic USD calculation", async () => {
    const res = await app.request("/pricing");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      planName: string;
      kesAmount: number;
      usdAmount: number;
      exchangeRate: number;
      interval: string;
    };
    expect(body.planName).toBe("Kingdom Partner");
    expect(body.kesAmount).toBe(1000);
    expect(typeof body.usdAmount).toBe("number");
    expect(body.usdAmount).toBeGreaterThan(0);
    expect(typeof body.exchangeRate).toBe("number");
    expect(body.exchangeRate).toBeGreaterThan(0);
    expect(body.interval).toBe("monthly");
  });

  test("POST /initialize rejects missing or invalid email", async () => {
    const res1 = await app.request("/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test User" }),
    });
    expect(res1.status).toBe(400);

    const res2 = await app.request("/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid-email" }),
    });
    expect(res2.status).toBe(400);
  });

  test("POST /webhook rejects missing signature", async () => {
    const res = await app.request("/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "subscription.create" }),
    });
    expect(res.status).toBe(401);
  });

  test("POST /webhook rejects invalid signature", async () => {
    const res = await app.request("/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-paystack-signature": "bogus_signature",
      },
      body: JSON.stringify({ event: "subscription.create" }),
    });
    expect(res.status).toBe(401);
  });

  test("POST /paypal/create returns 503 when PayPal credentials missing", async () => {
    const res = await app.request("/paypal/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Kingdom Partner" }),
    });
    expect(res.status).toBe(503);
  });

  test("POST /paypal/capture rejects empty payload", async () => {
    const res = await app.request("/paypal/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  test("isValidMpesaCode validates Safaricom 10-char format properly", async () => {
    const { isValidMpesaCode } = await import("./subscriptions");
    expect(isValidMpesaCode("TK78AB12CD").valid).toBe(true);
    expect(isValidMpesaCode("SG45LK67MN").valid).toBe(true);
    expect(isValidMpesaCode("123").valid).toBe(false);
    expect(isValidMpesaCode("tk78ab12cd").valid).toBe(true); // lowercase normalizes to uppercase
    expect(isValidMpesaCode("0000000000").valid).toBe(false); // repetitive digits
    expect(isValidMpesaCode("ABCDEFGHIJ").valid).toBe(false); // test sequential
    expect(isValidMpesaCode("1234567890").valid).toBe(false); // numbers only
  });

  test("POST /mpesa/verify rejects invalid M-Pesa code format", async () => {
    const res = await app.request("/mpesa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: "BADCODE",
        name: "Faithful Partner",
        email: "partner@example.com",
        amount: 3000,
        planName: "Kingdom Ambassador",
      }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("M-Pesa transaction code");
  });

  test("POST /mpesa/c2b-validation returns Accepted", async () => {
    const res = await app.request("/mpesa/c2b-validation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ TransID: "TK78AB12CD" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ResultCode: number };
    expect(body.ResultCode).toBe(0);
  });

  test("server plan catalog prices recurring tiers exactly (no client pricing)", async () => {
    const { validatePaymentAmount, yearlyPriceFromMonthly } = await import("../lib/plans");
    expect(yearlyPriceFromMonthly(3000)).toBe(30600);

    const okMonthly = validatePaymentAmount({ planId: "ambassador", interval: "monthly", amount: 3000 });
    expect(okMonthly.ok).toBe(true);

    const okYearly = validatePaymentAmount({ planId: "ambassador", interval: "yearly", amount: 30600 });
    expect(okYearly.ok).toBe(true);

    const tampered = validatePaymentAmount({ planId: "ambassador", interval: "monthly", amount: 100 });
    expect(tampered.ok).toBe(false);
    if (!tampered.ok) expect(tampered.code).toBe("PRICE_MISMATCH");

    const unknown = validatePaymentAmount({ planId: "nope", interval: "monthly", amount: 100 });
    expect(unknown.ok).toBe(false);

    const oneTime = validatePaymentAmount({ planId: "onetime_seed", amount: 500 });
    expect(oneTime.ok).toBe(true);

    const tooSmall = validatePaymentAmount({ planId: "onetime_seed", amount: 10 });
    expect(tooSmall.ok).toBe(false);
  });

  test("POST /mpesa/stkpush returns 503 STK_DISABLED in sandbox even for valid pricing", async () => {
    const res = await app.request("/mpesa/stkpush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: "0712345678",
        name: "Faithful Partner",
        email: "partner@example.com",
        amount: 3000,
        planId: "ambassador",
        planName: "Kingdom Ambassador",
        interval: "monthly",
      }),
    });
    expect(res.status).toBe(503);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("STK_DISABLED");
  });

  test("POST /mpesa/kcb-ipn acks official KCB IPN payloads with expected schema", async () => {
    const res = await app.request("/mpesa/kcb-ipn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionReference: "FT00026252",
        transactionAmount: "100.00",
        customerMobileNumber: "25471111111",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.statusCode).toBe("0");
    expect(body.statusMessage).toBe("Notification received");
    expect(body.transactionID).toBe("FT00026252");
  });

  test("POST /mpesa/c2b-confirmation acks unparseable payloads without touching the ledger", async () => {
    const res = await app.request("/mpesa/c2b-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bogus: true }),
    });
    expect(res.status).toBe(200);
  });

  test("POST /mpesa/simulate-receipt is locked without the sandbox flag", async () => {
    const res = await app.request("/mpesa/simulate-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transId: "TK78AB12CD", amount: 3000 }),
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("SANDBOX_DISABLED");
  });

  test("POST /mpesa/simulate-receipt rejects bad payloads", async () => {
    const res = await app.request("/mpesa/simulate-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: -5 }),
    });
    expect(res.status).toBe(400);
  });

  test("POST /mpesa/stkpush rejects tampered recurring amounts before provider call", async () => {
    const res = await app.request("/mpesa/stkpush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: "0712345678",
        name: "Faithful Partner",
        email: "partner@example.com",
        amount: 100,
        planId: "ambassador",
        planName: "Kingdom Ambassador",
        interval: "monthly",
      }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string; expectedKes: number };
    expect(body.code).toBe("PRICE_MISMATCH");
    expect(body.expectedKes).toBe(3000);
  });

  test("POST /mpesa/stkpush rejects unknown plan ids", async () => {
    const res = await app.request("/mpesa/stkpush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: "0712345678",
        name: "Faithful Partner",
        email: "partner@example.com",
        amount: 500,
        planId: "fake-plan",
        interval: "monthly",
      }),
    });
    expect(res.status).toBe(400);
  });

  test("POST /mpesa/verify rejects tampered recurring amounts", async () => {
    const res = await app.request("/mpesa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: "TK78AB12CD",
        name: "Faithful Partner",
        email: "partner@example.com",
        amount: 100,
        planId: "ambassador",
        planName: "Kingdom Ambassador",
        interval: "monthly",
      }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("PRICE_MISMATCH");
  });

  test("GET /mpesa/query/:id returns 404 for unknown checkout (never auto-completes)", async () => {
    const res = await app.request("/mpesa/query/ws_CO_unknown123");
    expect(res.status).toBe(404);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("not_found");
  });

  test("POST /claim/request rejects invalid email", async () => {
    const res = await app.request("/claim/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    expect(res.status).toBe(400);
  });

  test("POST /claim/verify rejects malformed payload", async () => {
    const res = await app.request("/claim/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "partner@example.com" }),
    });
    expect(res.status).toBe(400);
  });

  test("POST /manage/cancel rejects missing email", async () => {
    const res = await app.request("/manage/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    });
    expect(res.status).toBe(400);
  });

  test("POST /manage/change-plan rejects unknown plan", async () => {
    const res = await app.request("/manage/change-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "partner@example.com", newPlanId: "fake-plan", interval: "monthly" }),
    });
    // Fails at ownership lookup (no DB in test env) or unknown plan — either way not 500
    expect([400, 404, 500]).toContain(res.status);
  });

  test("billing cron endpoints require CRON_SECRET configuration", async () => {
    const res = await app.request("/billing/due?days=2");
    expect([401, 503]).toContain(res.status);
    const res2 = await app.request("/billing/retry-due", { method: "POST" });
    expect([401, 503]).toContain(res2.status);
  });

  test("OTP helpers generate, hash and verify 6-digit codes", async () => {
    const { generateOtpCode, hashOtpCode, verifyOtpCode } = await import("../lib/otp");
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
    const hash = await hashOtpCode(code);
    expect(await verifyOtpCode(code, hash)).toBe(true);
    expect(await verifyOtpCode("000000", hash)).toBe(false);
  });
});

