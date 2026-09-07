import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";
import { computeKesToUsd } from "../lib/exchangeRate";
import { sendDonationEmail, sendPartnerWelcomeEmail, sendClaimOtpEmail, sendDunningReminderEmail } from "../lib/email";
import { signToken } from "../lib/jwt";
import { setCookie } from "hono/cookie";
import { requireAdmin } from "../lib/jwt";
import { rateLimit, strictRateLimit } from "../lib/rateLimiter";
import {
  CLAIM_TTL_HOURS,
  consumeReceipt,
  findOpenClaimForReference,
  findReceiptByTransId,
  matchReceiptToClaim,
  normalizeDarajaConfirmation,
  normalizeKcbIpn,
  recordPaybillReceipt,
  setClaimStatus,
  upsertPaymentClaim,
  type ClaimRow,
} from "../lib/paybill";
import {
  ONETIME_PLAN_ID,
  PARTNER_PLAN_CATALOG,
  MAX_DUNNING_ATTEMPTS,
  nextRetryDate,
  validatePaymentAmount,
  yearlyPriceFromMonthly,
} from "../lib/plans";
import { OTP_TTL_MS, OTP_MAX_ATTEMPTS, generateOtpCode, hashOtpCode, verifyOtpCode } from "../lib/otp";
import { triggerKcbStkPush, normalizeKenyanPhone } from "../lib/kcbMpesa";

function getSecret(c: { env?: unknown }, key: string): string {
  const env = c.env as Record<string, string> | undefined;
  return env?.[key] || (process.env as Record<string, string>)?.[key] || "";
}

async function generateHmacSha512Hex(text: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(text));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function paystackPost(path: string, body: unknown, secret: string) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<Record<string, unknown>>;
}

async function paystackGet(path: string, secret: string) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  return res.json() as Promise<Record<string, unknown>>;
}

async function getPayPalAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const creds = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json()) as Record<string, unknown>;
  return data.access_token as string;
}

// Structured billing audit log (audit_logs table with console fallback)
async function logBillingEvent(
  actor: string,
  action: string,
  targetType: string,
  targetId: string | number,
  details: Record<string, unknown> = {}
) {
  try {
    const supabase = getSupabase();
    await supabase.from("audit_logs").insert({
      actor,
      action,
      target_type: targetType,
      target_id: String(targetId),
      details,
      created_at: new Date().toISOString(),
    });
  } catch {
    console.log(`[BILLING-AUDIT] ${new Date().toISOString()} | ${actor} | ${action} | ${targetType}:${targetId}`, details);
  }
}

interface ProvisionedSession {
  user: { id: string | number; name: string; email: string; role: string };
  token: string | null;
  claimRequired: boolean;
}

// Mint an authenticated subscriber session (JWT + httpOnly cookie)
async function mintSubscriberSession(
  c: import("hono").Context,
  user: { id: string | number; name: string; email: string; role: string }
): Promise<{ user: ProvisionedSession["user"]; token: string }> {
  const token = await signToken({
    userId: String(user.id),
    role: user.role || "member",
    name: user.name,
    email: user.email,
  });

  setCookie(c, "token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  };
}

// Issue a single-use email-ownership code (stores only the hash, never the code)
async function issueClaimOtp(email: string): Promise<string | null> {
  try {
    const supabase = getSupabase();
    const code = generateOtpCode();
    const codeHash = await hashOtpCode(code);
    const { error } = await supabase.from("subscriber_otps").insert({
      email: email.trim().toLowerCase(),
      code_hash: codeHash,
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      attempts: 0,
      consumed: false,
    });
    if (error) return null;
    return code;
  } catch {
    return null;
  }
}

async function checkClaimOtp(email: string, code: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const supabase = getSupabase();
    const norm = email.trim().toLowerCase();
    const { data } = await supabase
      .from("subscriber_otps")
      .select("*")
      .eq("email", norm)
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1);
    const row = (data as Record<string, unknown>[] | null)?.[0] as
      | { id: number; code_hash: string; expires_at: string; attempts: number }
      | undefined;
    if (!row) return { ok: false, reason: "No verification code found. Please request a new one." };
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false, reason: "This code has expired. Please request a new one." };
    }
    if ((row.attempts || 0) >= OTP_MAX_ATTEMPTS) {
      return { ok: false, reason: "Too many incorrect attempts. Please request a new code." };
    }
    const match = await verifyOtpCode(code.trim(), row.code_hash);
    if (!match) {
      await supabase.from("subscriber_otps").update({ attempts: (row.attempts || 0) + 1 }).eq("id", row.id);
      return { ok: false, reason: "Incorrect code. Please check your email and try again." };
    }
    await supabase.from("subscriber_otps").update({ consumed: true }).eq("id", row.id);
    return { ok: true };
  } catch {
    return { ok: false, reason: "Verification is temporarily unavailable. Please try again." };
  }
}

// Seamless auto-provisioning with OTP-gated merge for existing identities.
// New emails get an instant session (conversion). Known emails must prove
// inbox ownership via code before any session is minted (anti-takeover).
async function provisionSubscriberUser(
  c: import("hono").Context,
  name: string,
  email: string
): Promise<ProvisionedSession | null> {
  if (!email) return null;
  const supabase = getSupabase();
  const normEmail = email.trim().toLowerCase();
  const displayName = name.trim() || "Kingdom Partner";
  let user: { id: string | number; name: string; email: string; role: string } | null = null;
  let isNew = false;

  try {
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", normEmail)
      .maybeSingle();

    if (existingUser) {
      user = existingUser;
    } else {
      isNew = true;
      const newId = crypto.randomUUID();
      const { data: insertedUser, error } = await supabase
        .from("users")
        .insert({ id: newId, name: displayName, email: normEmail, role: "member" })
        .select("*")
        .single();
      user = !error && insertedUser ? insertedUser : { id: newId, name: displayName, email: normEmail, role: "member" };
    }

    if (user) {
      if (!isNew) {
        // Existing identity: gate the merge behind email-ownership proof.
        const code = await issueClaimOtp(normEmail);
        if (code) {
          try {
            await sendClaimOtpEmail(c, normEmail, user.name || displayName, code);
          } catch (err) {
            console.error("[CLAIM-OTP] email dispatch error:", err);
          }
        }
        await logBillingEvent(normEmail, "partner_claim_required", "user", user.id, { source: "payment" });
        return {
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
          token: null,
          claimRequired: true,
        };
      }

      const session = await mintSubscriberSession(c, user);
      return { ...session, claimRequired: false };
    }
  } catch (err) {
    console.error("[AUTO-PROVISION] User session error:", err);
  }
  return null;
}

// Verify an ownership code and mint the claimed session (creates the user
// row from the latest subscription record when none exists yet).
async function provisionClaimSession(
  c: import("hono").Context,
  email: string
): Promise<ProvisionedSession | null> {
  try {
    const supabase = getSupabase();
    const normEmail = email.trim().toLowerCase();
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", normEmail)
      .maybeSingle();

    let user = existingUser as { id: string | number; name: string; email: string; role: string } | null;
    if (!user) {
      const { data: latestSub } = await supabase
        .from("subscriptions")
        .select("subscriber_name")
        .eq("subscriber_email", normEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const subRow = latestSub as { subscriber_name?: string } | null;
      const newId = crypto.randomUUID();
      const { data: insertedUser } = await supabase
        .from("users")
        .insert({ id: newId, name: subRow?.subscriber_name || "Kingdom Partner", email: normEmail, role: "member" })
        .select("*")
        .single();
      user = (insertedUser as typeof user) || { id: newId, name: "Kingdom Partner", email: normEmail, role: "member" };
    }
    if (!user) return null;
    const session = await mintSubscriberSession(c, user);
    return { ...session, claimRequired: false };
  } catch (err) {
    console.error("[CLAIM] session provisioning error:", err);
    return null;
  }
}

// Strict Safaricom M-Pesa Transaction Code Validator
export function isValidMpesaCode(code: string): { valid: boolean; reason?: string } {
  const clean = code.trim().toUpperCase();
  if (clean.length !== 10) {
    return { valid: false, reason: "M-Pesa transaction code must be exactly 10 characters long (e.g. TK78AB12CD)." };
  }
  if (!/^[A-Z][A-Z0-9]{9}$/.test(clean)) {
    return { valid: false, reason: "M-Pesa transaction code must start with a letter and contain only alphanumeric characters." };
  }
  const letters = (clean.match(/[A-Z]/g) || []).length;
  const digits = (clean.match(/[0-9]/g) || []).length;
  if (letters < 2 || digits < 2) {
    return { valid: false, reason: "Invalid M-Pesa code format. Must contain a valid mix of letters and numbers." };
  }
  if (/^(.)\1{9}$/.test(clean)) {
    return { valid: false, reason: "Invalid M-Pesa code: repetitive character sequences are not accepted." };
  }
  if (clean === "ABCDEFGHIJ" || clean === "1234567890" || clean === "0123456789") {
    return { valid: false, reason: "Invalid test M-Pesa code." };
  }
  return { valid: true };
}

export const subscriptionRoutes = new Hono();

export interface PaybillRedemption {
  name: string;
  email: string;
  amount: number;
  planName: string;
  planId: string;
  interval: "monthly" | "yearly";
  phone?: string | null;
  kind?: string;
}

/**
 * Fulfill an approved Paybill redemption into the ledger. Called ONLY after:
 *  - a provider receipt matched (code + amount + account + freshness), or
 *  - an admin manually approved against the M-Pesa statement.
 * Never call this on format checks alone.
 */
async function fulfillPaybillRedemption(
  c: import("hono").Context,
  cleanRef: string,
  r: PaybillRedemption
) {
  const supabase = getSupabase();
  const normEmail = r.email.trim().toLowerCase();
  const displayName = r.name.trim() || "Kingdom Partner";

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + (r.interval === "yearly" ? 12 : 1));
  const usdAmount = Number((r.amount * 0.00772).toFixed(2));

  const { data: subData, error: subError } = await supabase
    .from("subscriptions")
    .insert({
      subscriber_name: displayName,
      subscriber_email: normEmail,
      plan_name: r.planName,
      plan_id: r.planId,
      amount: r.amount,
      currency: "KES",
      usd_amount: usdAmount,
      exchange_rate: 0.00772,
      interval: r.interval,
      status: "active",
      retry_count: 0,
      next_retry_at: null,
      payment_provider: "mpesa_paybill",
      payment_reference: cleanRef,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      metadata: {
        paybill: "522522",
        account: "1335674365",
        verifiedAt: new Date().toISOString(),
        planId: r.planId,
        phone: r.phone || null,
        kind: r.kind || "subscription",
      },
    })
    .select()
    .single();

  if (subError) {
    if (subError.code === "23505" || String(subError.message || "").includes("unique")) {
      const dup: Error & { code?: string } = new Error("This M-Pesa transaction code has already been registered.");
      dup.code = "REFERENCE_ALREADY_REDEEMED";
      throw dup;
    }
    throw new Error(subError.message || "Failed to register subscription");
  }

  await supabase.from("donations").upsert(
    {
      amount: r.amount,
      currency: "KES",
      donor_email: normEmail,
      donor_name: displayName,
      recurring: r.interval === "monthly",
      payment_provider: "mpesa_paybill",
      payment_reference: cleanRef,
      status: "completed",
    },
    { onConflict: "payment_reference", ignoreDuplicates: true }
  );

  // Provision Partner profile (existing identities are OTP-gated)
  const authSession = await provisionSubscriberUser(c, displayName, normEmail);
  await logBillingEvent(normEmail, "mpesa_paybill_verified", "subscription", cleanRef, {
    planName: r.planName,
    amount: r.amount,
    claimRequired: authSession?.claimRequired || false,
  });

  try {
    await sendDonationEmail(c, normEmail, displayName, r.amount, "KES", {
      reference: cleanRef,
      planName: r.planName,
    });
  } catch (e) {
    console.error("[EMAIL] Donation receipt error:", e);
  }

  try {
    await sendPartnerWelcomeEmail(c, normEmail, displayName, r.planName, r.amount, "KES");
  } catch (e) {
    console.error("[EMAIL] Partner welcome error:", e);
  }

  return { subData, authSession, periodEnd };
}

// M-Pesa Paybill code redemption (FAIL-CLOSED).
// A code activates ONLY when a provider-confirmed receipt exists for it
// (Daraja C2B confirmation or KCB IPN) with matching amount + account.
// Unknown codes return 202 pending — the claim waits for the receipt.
subscriptionRoutes.post(
  "/mpesa/verify",
  strictRateLimit,
  zValidator(
    "json",
    z.object({
      reference: z.string().min(1).max(32),
      name: z.string().min(1).max(100),
      email: z.string().email(),
      amount: z.number().positive(),
      planName: z.string().optional().default("Kingdom Partner"),
      planId: z.string().optional().default("ambassador"),
      interval: z.enum(["monthly", "yearly"]).default("monthly"),
      phone: z.string().optional(),
    })
  ),
  async (c) => {
    const { reference, name, email, amount, planName, planId, interval, phone } = c.req.valid("json");
    const cleanRef = reference.trim().toUpperCase();

    // 1. Strict Safaricom code format verification
    const validation = isValidMpesaCode(cleanRef);
    if (!validation.valid) {
      return c.json({ error: validation.reason }, 400);
    }

    // 2. Server-side price truth: the client never sets the price.
    const priceCheck = validatePaymentAmount({ planId, planName, interval, amount });
    if (!priceCheck.ok) {
      return c.json({ error: priceCheck.error, code: priceCheck.code, expectedKes: priceCheck.expectedKes }, 400);
    }
    const canonicalAmount = priceCheck.expectedKes;
    const canonicalPlanName = priceCheck.isRecurring ? priceCheck.planName : planName;

    const supabase = getSupabase();

    // 3. Anti-Replay: Prevent duplicate redemption of the same M-Pesa code
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id, subscriber_name, status, created_at")
      .eq("payment_reference", cleanRef)
      .maybeSingle();

    if (existingSub) {
      return c.json(
        {
          error: "This M-Pesa transaction code has already been redeemed for an active covenant partnership.",
          code: "REFERENCE_ALREADY_REDEEMED",
        },
        409
      );
    }

    const { data: existingDonation } = await supabase
      .from("donations")
      .select("id, status")
      .eq("payment_reference", cleanRef)
      .maybeSingle();

    if (existingDonation && existingDonation.status === "completed") {
      return c.json(
        {
          error: "This M-Pesa transaction code has already been registered and completed.",
          code: "REFERENCE_ALREADY_USED",
        },
        409
      );
    }

    // 4. Ground truth: is there a provider-confirmed receipt for this code?
    const receipt = await findReceiptByTransId(supabase, cleanRef);

    if (!receipt) {
      // Fail closed: record the intent, activate nothing.
      const claim = await upsertPaymentClaim(supabase, {
        paymentReference: cleanRef,
        email,
        name: name.trim(),
        amount: canonicalAmount,
        planId: priceCheck.isRecurring ? planId : ONETIME_PLAN_ID,
        planName: canonicalPlanName,
        interval,
        phone: phone || null,
      });
      await logBillingEvent(email.trim().toLowerCase(), "paybill_claim_awaiting_receipt", "payment_claim", cleanRef, {
        planName: canonicalPlanName,
        amount: canonicalAmount,
      });
      return c.json(
        {
          status: "pending",
          code: "RECEIPT_NOT_FOUND",
          claimId: claim?.id || null,
          message:
            "We have not yet received confirmation of this payment from Safaricom/KCB. If you just paid, wait 1–2 minutes and retry — your claim is saved. Double-check the code from your M-Pesa SMS.",
        },
        202
      );
    }

    // 5. Match receipt → claim (amount, account, freshness) + atomic consume.
    const verdict = matchReceiptToClaim({
      receipt: { amount: Number(receipt.amount), billRef: receipt.bill_ref || "", consumed: receipt.consumed, transTime: receipt.trans_time },
      claimedAmount: canonicalAmount,
      requireExact: priceCheck.isRecurring,
    });
    if (!verdict.ok) {
      const claim = await upsertPaymentClaim(supabase, {
        paymentReference: cleanRef,
        email,
        name: name.trim(),
        amount: canonicalAmount,
        planId: priceCheck.isRecurring ? planId : ONETIME_PLAN_ID,
        planName: canonicalPlanName,
        interval,
        phone: phone || null,
      });
      if (claim) {
        await setClaimStatus(supabase, claim.id, verdict.code === "ALREADY_CONSUMED" ? "rejected" : "amount_mismatch", {
          receipt_id: receipt.id,
          note: verdict.reason,
        });
      }
      await logBillingEvent(email.trim().toLowerCase(), "paybill_claim_rejected", "payment_claim", cleanRef, {
        reason: verdict.reason,
        receiptAmount: receipt.amount,
        claimedAmount: canonicalAmount,
      });
      return c.json({ error: verdict.reason, code: verdict.code }, 409);
    }

    const consumed = await consumeReceipt(supabase, receipt.id, email.trim().toLowerCase());
    if (!consumed) {
      return c.json(
        {
          error: "This M-Pesa transaction code has already been redeemed.",
          code: "REFERENCE_ALREADY_REDEEMED",
        },
        409
      );
    }

    // 6. Approved: fulfill into the ledger.
    try {
      const { subData, authSession, periodEnd } = await fulfillPaybillRedemption(c, cleanRef, {
        name: name.trim(),
        email: email.trim(),
        amount: canonicalAmount,
        planName: canonicalPlanName,
        planId: priceCheck.isRecurring ? (planId as string) : ONETIME_PLAN_ID,
        interval,
        phone: phone || null,
      });
      const claim = await upsertPaymentClaim(supabase, {
        paymentReference: cleanRef,
        email,
        name: name.trim(),
        amount: canonicalAmount,
        planId: priceCheck.isRecurring ? planId : ONETIME_PLAN_ID,
        planName: canonicalPlanName,
        interval,
        phone: phone || null,
      });
      if (claim) {
        await setClaimStatus(supabase, claim.id, "matched", { receipt_id: receipt.id });
      }

      return c.json(
        {
          status: "success",
          message: "M-Pesa payment verified. Covenant partnership activated!",
          reference: cleanRef,
          planName: canonicalPlanName,
          amount: canonicalAmount,
          currency: "KES",
          claimRequired: authSession?.claimRequired || false,
          user: authSession?.user || {
            id: "p-" + Date.now(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            role: "member",
          },
          token: authSession?.token || null,
          subscription: subData || {
            subscriber_name: name.trim(),
            subscriber_email: email.trim().toLowerCase(),
            plan_name: canonicalPlanName,
            amount: canonicalAmount,
            currency: "KES",
            payment_provider: "mpesa_paybill",
            payment_reference: cleanRef,
            status: "active",
            current_period_end: periodEnd.toISOString(),
          },
        },
        201
      );
    } catch (err: unknown) {
      const code = (err as Error & { code?: string }).code;
      if (code === "REFERENCE_ALREADY_REDEEMED") {
        return c.json({ error: (err as Error).message, code }, 409);
      }
      return c.json({ error: err instanceof Error ? err.message : "Failed to register subscription" }, 500);
    }
  }
);

// Safaricom Daraja C2B IPN Validation Webhook
// NOTE: external validation is OFF by default on the shortcode. This endpoint
// only needs to ack; redemption strictness lives in /mpesa/verify matching.
subscriptionRoutes.post("/mpesa/c2b-validation", async (c) => {
  return c.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

/**
 * Auto-fulfill an open claim when its provider receipt arrives. Shared by the
 * Daraja confirmation and KCB IPN handlers (callbacks must always ack fast).
 */
async function tryAutoFulfillClaim(c: import("hono").Context, transId: string): Promise<void> {
  try {
    const supabase = getSupabase();
    const claim: ClaimRow | null = await findOpenClaimForReference(supabase, transId);
    if (!claim) return;

    // Claim is stale (user never came back) — leave it for expiry sweeps.
    if (Date.now() - new Date(claim.created_at).getTime() > CLAIM_TTL_HOURS * 3600000) {
      await setClaimStatus(supabase, claim.id, "expired", { note: "Claim expired before receipt arrival." });
      return;
    }

    const receipt = await findReceiptByTransId(supabase, transId);
    if (!receipt || receipt.consumed) return;

    const verdict = matchReceiptToClaim({
      receipt: { amount: Number(receipt.amount), billRef: receipt.bill_ref || "", consumed: receipt.consumed, transTime: receipt.trans_time },
      claimedAmount: Number(claim.amount),
      requireExact: true,
    });
    if (!verdict.ok) {
      await setClaimStatus(supabase, claim.id, verdict.code === "ALREADY_CONSUMED" ? "rejected" : "amount_mismatch", {
        receipt_id: receipt.id,
        note: verdict.reason,
      });
      await logBillingEvent(claim.email, "paybill_autofulfill_rejected", "payment_claim", transId, { reason: verdict.reason });
      return;
    }

    const consumed = await consumeReceipt(supabase, receipt.id, claim.email);
    if (!consumed) return;
    await fulfillPaybillRedemption(c, transId, {
      name: claim.name,
      email: claim.email,
      amount: Number(claim.amount),
      planName: claim.plan_name || "Kingdom Partner",
      planId: claim.plan_id || ONETIME_PLAN_ID,
      interval: (claim.interval === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly",
      phone: claim.phone,
      kind: claim.kind || "subscription",
    });
    await setClaimStatus(supabase, claim.id, "matched", { receipt_id: receipt.id });
    await logBillingEvent(claim.email, "paybill_claim_autofulfilled", "payment_claim", transId, { claimId: claim.id });
  } catch (err) {
    console.error("[PAYBILL AUTOFULFILL ERROR]", err);
  }
}

// Safaricom Daraja C2B IPN Confirmation Webhook.
// REGISTER this URL on paybill 522522 via the Daraja Register-URL API
// (one-time production step): every successful Paybill payment is POSTed here
// and becomes redemption truth in mpesa_paybill_receipts. NO ledger rows are
// written here — activation happens only through claim matching.
subscriptionRoutes.post("/mpesa/c2b-confirmation", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const normalized = normalizeDarajaConfirmation(body);
    if (normalized) {
      const supabase = getSupabase();
      await recordPaybillReceipt(supabase, normalized);
      await logBillingEvent("daraja-c2b", "paybill_receipt_recorded", "mpesa_receipt", normalized.transId, {
        amount: normalized.amount,
        billRef: normalized.billRef,
      });
      await tryAutoFulfillClaim(c, normalized.transId);
    } else {
      console.warn("[DARAJA C2B] unparseable confirmation payload");
    }
  } catch (err) {
    console.error("[DARAJA C2B CONFIRMATION ERROR]", err);
  }
  return c.json({ ResultCode: 0, ResultDesc: "Confirmation received successfully" });
});

// KCB Buni Instant Payment Notification for credits to the collection account.
// Register this URL in the Buni portal as the IPN / callbackUrl target so
// direct Paybill/bank credits become redemption truth the same way.
subscriptionRoutes.post("/mpesa/kcb-ipn", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const normalized = normalizeKcbIpn(body);
    if (normalized) {
      const supabase = getSupabase();
      await recordPaybillReceipt(supabase, normalized);
      await logBillingEvent("kcb-ipn", "paybill_receipt_recorded", "mpesa_receipt", normalized.transId, {
        amount: normalized.amount,
        billRef: normalized.billRef,
      });
      await tryAutoFulfillClaim(c, normalized.transId);
    } else {
      console.warn("[KCB IPN] unparseable notification payload");
    }
  } catch (err) {
    console.error("[KCB IPN ERROR]", err);
  }
  return c.json({ statusCode: "0", statusDescription: "Notification received successfully" });
});

interface MpesaCheckoutSession {
  checkoutRequestId: string;
  merchantRequestId: string;
  name: string;
  email: string;
  phoneNumber: string;
  amount: number;
  planName: string;
  planId: string;
  interval: "monthly" | "yearly";
  status: "pending" | "completed" | "failed";
  receiptCode?: string;
  createdAt: number;
  fulfilled?: boolean;
  fulfilledResult?: Record<string, unknown>;
}

const activeMpesaCheckouts = new Map<string, MpesaCheckoutSession>();

/**
 * STK session lifetime. The KCB/Daraja PIN prompt lives ~60-120s on handsets.
 * After this TTL an unconfirmed session expires (never auto-completes).
 */
const STK_SESSION_TTL_MS = 180_000;

// KCB Buni M-Pesa STK Push Trigger
subscriptionRoutes.post(
  "/mpesa/stkpush",
  strictRateLimit,
  zValidator(
    "json",
    z.object({
      phoneNumber: z.string().min(9).max(16),
      name: z.string().min(1).max(100),
      email: z.string().email(),
      amount: z.number().positive(),
      planName: z.string().optional().default("Kingdom Partner"),
      planId: z.string().optional().default("ambassador"),
      interval: z.enum(["monthly", "yearly"]).default("monthly"),
    })
  ),
  async (c) => {
    const { phoneNumber, name, email, amount, planName, planId, interval } = c.req.valid("json");

    // Server-side price truth BEFORE touching the provider.
    const priceCheck = validatePaymentAmount({ planId, planName, interval, amount });
    if (!priceCheck.ok) {
      return c.json({ error: priceCheck.error, code: priceCheck.code, expectedKes: priceCheck.expectedKes }, 400);
    }

    // STK Push is disabled until the KCB Buni gateway is live in production.
    // (Frontend hides the option via VITE_ENABLE_STK_PUSH; this is the server lock.)
    if (getSecret(c, "KCB_BUNI_ENV") !== "production") {
      return c.json(
        {
          error: "M-Pesa STK Push is temporarily unavailable. Please pay via M-Pesa Paybill 522522, account 1335674365, then enter your SMS code.",
          code: "STK_DISABLED",
        },
        503
      );
    }
    const canonicalAmount = priceCheck.expectedKes;
    const canonicalPlanName = priceCheck.isRecurring ? priceCheck.planName : planName;

    try {
      const result = await triggerKcbStkPush(c, {
        phoneNumber,
        amount: canonicalAmount,
        invoiceNumber: "1335674365",
        transactionDescription: "CovenantSeed",
      });

      activeMpesaCheckouts.set(result.checkoutRequestId, {
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: normalizeKenyanPhone(phoneNumber),
        amount: canonicalAmount,
        planName: canonicalPlanName,
        planId: priceCheck.isRecurring ? (planId as string) : ONETIME_PLAN_ID,
        interval,
        status: "pending",
        createdAt: Date.now(),
      });
      await logBillingEvent(email.trim().toLowerCase(), "stk_push_initiated", "mpesa_checkout", result.checkoutRequestId, {
        planName: canonicalPlanName,
        amount: canonicalAmount,
      });

      return c.json({
        status: "pending",
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
        customerMessage: result.customerMessage || "Please enter your M-Pesa PIN on your phone.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate M-Pesa STK Push.";
      return c.json({ error: msg }, 400);
    }
  }
);

// Fulfill a provider-confirmed STK session into the ledger (idempotent).
// ONLY called after the KCB callback marks the session completed.
async function fulfillMpesaCheckout(c: import("hono").Context, checkout: MpesaCheckoutSession) {
  if (checkout.fulfilled && checkout.fulfilledResult) {
    return checkout.fulfilledResult;
  }
  const receiptCode = checkout.receiptCode || `KCB${Date.now().toString().slice(-7)}`;
  const supabase = getSupabase();

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + (checkout.interval === "yearly" ? 12 : 1));

  // Register into subscriptions
  const { data: subData } = await supabase
    .from("subscriptions")
    .upsert(
      {
        subscriber_name: checkout.name,
        subscriber_email: checkout.email,
        plan_name: checkout.planName,
        plan_id: checkout.planId,
        amount: checkout.amount,
        currency: "KES",
        usd_amount: Number((checkout.amount * 0.00772).toFixed(2)),
        exchange_rate: 0.00772,
        interval: checkout.interval,
        status: "active",
        retry_count: 0,
        next_retry_at: null,
        payment_provider: "mpesa_paybill",
        payment_reference: receiptCode,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        metadata: {
          paybill: "522522",
          account: "1335674365",
          checkoutRequestId: checkout.checkoutRequestId,
          phone: checkout.phoneNumber,
        },
      },
      { onConflict: "payment_reference", ignoreDuplicates: true }
    )
    .select()
    .maybeSingle();

  // Register into donations
  await supabase.from("donations").upsert(
    {
      amount: checkout.amount,
      currency: "KES",
      donor_email: checkout.email,
      donor_name: checkout.name,
      recurring: checkout.interval === "monthly",
      payment_provider: "mpesa_paybill",
      payment_reference: receiptCode,
      status: "completed",
    },
    { onConflict: "payment_reference", ignoreDuplicates: true }
  );

  // Provision Partner profile (existing identities are OTP-gated)
  const authSession = await provisionSubscriberUser(c, checkout.name, checkout.email);
  await logBillingEvent(checkout.email, "stk_push_completed", "subscription", receiptCode, {
    planName: checkout.planName,
    amount: checkout.amount,
    claimRequired: authSession?.claimRequired || false,
  });

  const result = {
    status: "completed",
    receiptCode,
    planName: checkout.planName,
    amount: checkout.amount,
    currency: "KES",
    claimRequired: authSession?.claimRequired || false,
    user: authSession?.user || {
      id: "p-" + Date.now(),
      name: checkout.name,
      email: checkout.email,
      role: "member",
    },
    token: authSession?.token || null,
    subscription: subData || {
      subscriber_name: checkout.name,
      subscriber_email: checkout.email,
      plan_name: checkout.planName,
      amount: checkout.amount,
      currency: "KES",
      payment_provider: "mpesa_paybill",
      payment_reference: receiptCode,
      status: "active",
      current_period_end: periodEnd.toISOString(),
    },
  };
  checkout.fulfilled = true;
  checkout.fulfilledResult = result;
  return result;
}

// Query STK Push Checkout Status (real-time polling for dashboard unlock).
// SECURITY: a session completes ONLY via the provider callback below.
// Pending sessions expire after STK_SESSION_TTL_MS — never auto-complete.
subscriptionRoutes.get("/mpesa/query/:checkoutRequestId", rateLimit, async (c) => {
  const checkoutRequestId = c.req.param("checkoutRequestId");
  const checkout = activeMpesaCheckouts.get(checkoutRequestId);

  if (!checkout) {
    return c.json({ status: "not_found", message: "Checkout session not found." }, 404);
  }

  if (checkout.status === "failed") {
    return c.json({ status: "failed", message: "M-Pesa payment was cancelled or declined on the phone." });
  }

  if (checkout.status === "completed") {
    return c.json(await fulfillMpesaCheckout(c, checkout));
  }

  const elapsed = Date.now() - checkout.createdAt;
  if (elapsed > STK_SESSION_TTL_MS) {
    checkout.status = "failed";
    await logBillingEvent(checkout.email, "stk_push_expired", "mpesa_checkout", checkoutRequestId, {
      amount: checkout.amount,
    });
    return c.json({
      status: "failed",
      message: "The M-Pesa prompt expired. If you entered your PIN, verify using the SMS receipt code instead.",
    });
  }

  return c.json({
    status: "pending",
    message: "Waiting for partner to enter PIN on phone...",
  });
});

// KCB Buni Webhook Callback — the ONLY signal that marks a session completed.
subscriptionRoutes.post("/mpesa/kcb-callback", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const response = (body.response || body) as Record<string, unknown>;
    const checkoutId = String(response.CheckoutRequestID || response.checkoutRequestId || "").trim();
    const resultCode = String(response.ResultCode ?? response.resultCode ?? "0");

    if (!checkoutId || !activeMpesaCheckouts.has(checkoutId)) {
      console.warn("[KCB CALLBACK] unknown CheckoutRequestID:", checkoutId || "(missing)");
      await logBillingEvent("kcb-callback", "stk_callback_unknown", "mpesa_checkout", checkoutId || "missing", {});
      return c.json({ statusCode: "0", statusDescription: "Callback received successfully" });
    }

    const checkout = activeMpesaCheckouts.get(checkoutId)!;
    // Cross-check the callback amount when the provider includes one.
    const callbackAmount = Number(response.Amount ?? response.amount ?? checkout.amount);
    if (Number.isFinite(callbackAmount) && Math.round(callbackAmount) !== Math.round(checkout.amount)) {
      console.error("[KCB CALLBACK] amount mismatch:", { checkoutId, expected: checkout.amount, got: callbackAmount });
      await logBillingEvent(checkout.email, "stk_callback_amount_mismatch", "mpesa_checkout", checkoutId, {
        expected: checkout.amount,
        received: callbackAmount,
      });
      checkout.status = "failed";
      return c.json({ statusCode: "0", statusDescription: "Callback received successfully" });
    }

    if (resultCode === "0") {
      checkout.status = "completed";
      checkout.receiptCode = String(
        response.MpesaReceiptNumber || response.receipt || `KCB${Date.now().toString().slice(-7)}`
      );
      await logBillingEvent(checkout.email, "stk_callback_completed", "mpesa_checkout", checkoutId, {
        receiptCode: checkout.receiptCode,
      });
    } else {
      checkout.status = "failed";
      await logBillingEvent(checkout.email, "stk_callback_failed", "mpesa_checkout", checkoutId, { resultCode });
    }
  } catch (err) {
    console.error("[KCB CALLBACK ERROR]", err);
  }
  return c.json({ statusCode: "0", statusDescription: "Callback received successfully" });
});



// Pricing calculation endpoint
subscriptionRoutes.get("/pricing", async (c) => {
  const wiseToken = getSecret(c, "WISE_API_TOKEN");
  const amountParam = Number(c.req.query("amount")) || 1000;
  const calculation = await computeKesToUsd(amountParam, wiseToken);
  return c.json({
    planName: "Kingdom Partner",
    kesAmount: calculation.kesAmount,
    usdAmount: calculation.usdAmount,
    exchangeRate: calculation.rate,
    provider: calculation.provider,
    interval: "monthly",
    description: `Monthly partnership subscription to support Kingdom Missions Network (${calculation.kesAmount.toLocaleString()} KES / month)`,
  });
});

// Paystack Subscription Initialize
subscriptionRoutes.post(
  "/initialize",
  strictRateLimit,
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      name: z.string().min(1).default("Anonymous Partner"),
      interval: z.enum(["monthly", "yearly"]).default("monthly"),
      currency: z.enum(["KES", "USD"]).default("KES"),
      planId: z.string().optional(),
      planName: z.string().optional().default("Kingdom Partner"),
      amount: z.number().min(50).optional().default(1000),
    })
  ),
  async (c) => {
    const secret = getSecret(c, "PAYSTACK_SECRET_KEY");
    if (!secret) return c.json({ error: "Payment gateway not configured" }, 503);

    const { email, name, interval, currency, planId, planName, amount } = c.req.valid("json");

    // Server-side price truth BEFORE initializing with the provider.
    const priceCheck = validatePaymentAmount({ planId, planName, interval, amount: amount || 1000 });
    if (!priceCheck.ok) {
      return c.json({ error: priceCheck.error, code: priceCheck.code, expectedKes: priceCheck.expectedKes }, 400);
    }
    const targetKes = priceCheck.expectedKes;
    const wiseToken = getSecret(c, "WISE_API_TOKEN");
    const conversion = await computeKesToUsd(targetKes, wiseToken);

    const callbackUrl = `${c.req.header("origin") || "http://localhost:3000"}/subscribe?paystack_callback=1`;

    const chargeAmount = currency === "KES" ? Math.round(targetKes * 100) : Math.round(conversion.usdAmount * 100);

    const result = await paystackPost(
      "/transaction/initialize",
      {
        email,
        amount: chargeAmount,
        currency,
        callback_url: callbackUrl,
        metadata: {
          name,
          subscriptionType: "kingdom_partner",
          planName: planName || "Kingdom Partner",
          interval,
          kesAmount: targetKes,
          usdAmount: conversion.usdAmount,
          exchangeRate: conversion.rate,
        },
      },
      secret
    );

    if (!result.status) {
      return c.json({ error: (result.message as string) || "Subscription initialization failed" }, 400);
    }

    return c.json({
      ...(result.data as Record<string, unknown>),
      usdAmount: conversion.usdAmount,
      kesAmount: targetKes,
      exchangeRate: conversion.rate,
    });
  }
);

// Paystack Subscription Verification
subscriptionRoutes.get("/verify/:reference", async (c) => {
  const secret = getSecret(c, "PAYSTACK_SECRET_KEY");
  if (!secret) return c.json({ error: "Payment gateway not configured" }, 503);

  const reference = c.req.param("reference");
  const result = await paystackGet(`/transaction/verify/${reference}`, secret);

  if (!result.status) {
    return c.json({ error: (result.message as string) || "Verification failed" }, 400);
  }

  const data = result.data as Record<string, unknown>;

  if (data.status === "success") {
    const supabase = getSupabase();
    const customer = (data.customer as Record<string, unknown>) || {};
    const metadata = (data.metadata as Record<string, unknown>) || {};
    const subscriberEmail = (customer.email as string) || (metadata.email as string) || "";
    const subscriberName = (metadata.name as string) || "Kingdom Partner";
    const planName = (metadata.planName as string) || "Kingdom Partner";
    const kesAmount = Number(metadata.kesAmount) || 1000;
    const usdAmount = Number(metadata.usdAmount) || 7.72;
    const exchangeRate = Number(metadata.exchangeRate) || 0.00772;

    // Cross-check the provider-confirmed charge against the initialized amount.
    // Paystack reports the charged total in minor units of the charge currency.
    const chargedMajor = Number(data.amount) / 100;
    const chargeCurrency = String(data.currency || "KES").toUpperCase();
    const expectedMajor = chargeCurrency === "KES" ? kesAmount : usdAmount;
    if (Number.isFinite(chargedMajor) && Number.isFinite(expectedMajor) && Math.abs(chargedMajor - expectedMajor) > 0.009) {
      console.error("[PAYSTACK] charged-amount mismatch:", { reference, chargedMajor, chargeCurrency, expectedMajor });
      await logBillingEvent(subscriberEmail, "paystack_amount_mismatch", "subscription", reference, {
        chargedMajor,
        chargeCurrency,
        expectedMajor,
      });
      return c.json({ error: "Charged amount does not match the initialized subscription amount.", code: "AMOUNT_MISMATCH" }, 409);
    }

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabase.from("subscriptions").upsert(
      {
        subscriber_name: subscriberName,
        subscriber_email: subscriberEmail,
        plan_name: planName,
        plan_id: (metadata.planId as string) || null,
        amount: kesAmount,
        currency: "KES",
        usd_amount: usdAmount,
        exchange_rate: exchangeRate,
        interval: (metadata.interval as string) || "monthly",
        status: "active",
        retry_count: 0,
        next_retry_at: null,
        payment_provider: "paystack",
        payment_reference: reference,
        customer_code: (customer.customer_code as string) || null,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        metadata,
      },
      { onConflict: "payment_reference", ignoreDuplicates: true }
    );

    // Also record in donations ledger
    await supabase.from("donations").upsert(
      {
        amount: kesAmount,
        currency: "KES",
        donor_email: subscriberEmail,
        donor_name: subscriberName,
        recurring: true,
        payment_provider: "paystack",
        payment_reference: reference,
        status: "completed",
      },
      { onConflict: "payment_reference", ignoreDuplicates: true }
    );

    await sendDonationEmail(c, subscriberEmail, subscriberName, kesAmount, "KES", {
      reference,
      planName,
    });
    try {
      await sendPartnerWelcomeEmail(c, subscriberEmail, subscriberName, planName || "Kingdom Partner", kesAmount, "KES");
    } catch (err) {
      console.error("[EMAIL] Partner welcome error:", err);
    }

    const authSession = await provisionSubscriberUser(c, subscriberName, subscriberEmail);
    await logBillingEvent(subscriberEmail, "paystack_verified", "subscription", reference, {
      planName,
      amount: kesAmount,
      claimRequired: authSession?.claimRequired || false,
    });

    return c.json({
      status: data.status,
      amount: (data.amount as number) / 100,
      currency: data.currency,
      reference,
      claimRequired: authSession?.claimRequired || false,
      user: authSession?.user || null,
      token: authSession?.token || null,
      planName,
    });
  }

  return c.json({
    status: data.status,
    amount: (data.amount as number) / 100,
    currency: data.currency,
    reference,
    user: null,
    token: null,
  });
});

// PayPal Order Create with Live KES->USD computation
subscriptionRoutes.post(
  "/paypal/create",
  strictRateLimit,
  zValidator(
    "json",
    z.object({
      name: z.string().default("Kingdom Partner"),
      email: z.string().email().optional(),
      amount: z.number().min(50).optional().default(1000),
      planName: z.string().optional().default("Kingdom Partner"),
      planId: z.string().optional(),
      interval: z.enum(["monthly", "yearly"]).default("monthly"),
    })
  ),
  async (c) => {
    const clientId = getSecret(c, "PAYPAL_CLIENT_ID");
    const clientSecret = getSecret(c, "PAYPAL_CLIENT_SECRET");
    if (!clientId || !clientSecret) return c.json({ error: "PayPal not configured" }, 503);

    const { amount, planName, planId, interval } = c.req.valid("json");
    const priceCheck = validatePaymentAmount({ planId, planName, interval, amount: amount || 1000 });
    if (!priceCheck.ok) {
      return c.json({ error: priceCheck.error, code: priceCheck.code, expectedKes: priceCheck.expectedKes }, 400);
    }
    const targetKes = priceCheck.expectedKes;
    const wiseToken = getSecret(c, "WISE_API_TOKEN");
    const conversion = await computeKesToUsd(targetKes, wiseToken);
    const accessToken = await getPayPalAccessToken(clientId, clientSecret);

    const res = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: conversion.usdAmount.toFixed(2),
            },
            description: `${planName || "Kingdom Partner"} Monthly Subscription (${targetKes.toLocaleString()} KES ≈ $${conversion.usdAmount.toFixed(2)} USD)`,
          },
        ],
      }),
    });

    const data = (await res.json()) as Record<string, unknown>;
    return c.json({
      id: data.id as string,
      usdAmount: conversion.usdAmount,
      kesAmount: targetKes,
      exchangeRate: conversion.rate,
    });
  }
);

// PayPal Order Capture & Subscription Activation
subscriptionRoutes.post(
  "/paypal/capture",
  zValidator(
    "json",
    z.object({
      orderId: z.string(),
      subscriberName: z.string().optional(),
    })
  ),
  async (c) => {
    const clientId = getSecret(c, "PAYPAL_CLIENT_ID");
    const clientSecret = getSecret(c, "PAYPAL_CLIENT_SECRET");
    if (!clientId || !clientSecret) return c.json({ error: "PayPal not configured" }, 503);

    const { orderId, subscriberName } = c.req.valid("json");
    const accessToken = await getPayPalAccessToken(clientId, clientSecret);

    const res = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = (await res.json()) as Record<string, unknown>;

    if (data.status === "COMPLETED") {
      const supabase = getSupabase();
      const payer = (data.payer as Record<string, unknown>) || {};
      const payerName = (payer.name as Record<string, unknown>) || {};
      const fullName =
        subscriberName ||
        `${(payerName.given_name as string) || ""} ${(payerName.surname as string) || ""}`.trim() ||
        "Kingdom Partner";
      const email = (payer.email_address as string) || "";

      const pu = ((data.purchase_units as Record<string, unknown>[]) || [])[0] || {};
      const amountObj = (pu.amount as Record<string, unknown>) || {};
      const usdAmount = parseFloat(amountObj.value as string) || 7.72;

      const wiseToken = getSecret(c, "WISE_API_TOKEN");
      const conversion = await computeKesToUsd(1000, wiseToken);

      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await supabase.from("subscriptions").insert({
        subscriber_name: fullName,
        subscriber_email: email,
        plan_name: "Kingdom Partner",
        amount: 1000,
        currency: "KES",
        usd_amount: usdAmount,
        exchange_rate: conversion.rate,
        interval: "monthly",
        status: "active",
        payment_provider: "paypal",
        payment_reference: orderId,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
      });

      await supabase.from("donations").insert({
        amount: usdAmount,
        currency: "USD",
        donor_email: email,
        donor_name: fullName,
        recurring: true,
        payment_provider: "paypal",
        payment_reference: orderId,
        status: "completed",
      });

      await sendDonationEmail(c, email, fullName, usdAmount, "USD", {
        reference: orderId,
      });
      try {
        await sendPartnerWelcomeEmail(c, email, fullName, "Kingdom Partner", usdAmount, "USD");
      } catch (err) {
        console.error("[EMAIL] Partner welcome error:", err);
      }

      const authSession = await provisionSubscriberUser(c, fullName, email);
      await logBillingEvent(email, "paypal_captured", "subscription", orderId, {
        amount: usdAmount,
        claimRequired: authSession?.claimRequired || false,
      });

      return c.json({
        status: data.status,
        id: data.id,
        claimRequired: authSession?.claimRequired || false,
        user: authSession?.user || null,
        token: authSession?.token || null,
        planName: "Kingdom Partner",
      });
    }

    return c.json({ status: data.status, id: data.id, user: null, token: null });
  }
);

// Webhook Receiver (Paystack HMAC validated)
subscriptionRoutes.post("/webhook", async (c) => {
  const secret = getSecret(c, "PAYSTACK_SECRET_KEY");
  if (!secret) return c.json({ error: "Not configured" }, 503);

  const signature = c.req.header("x-paystack-signature");
  if (!signature) return c.json({ error: "No signature" }, 401);

  const rawBody = await c.req.text();
  const expectedSignature = await generateHmacSha512Hex(rawBody, secret);
  if (signature !== expectedSignature) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const body = JSON.parse(rawBody) as Record<string, unknown>;
  const event = body.event as string;
  const data = (body.data as Record<string, unknown>) || {};
  const supabase = getSupabase();

  if (event === "charge.success" || event === "subscription.create") {
    const customer = (data.customer as Record<string, unknown>) || {};
    const metadata = (data.metadata as Record<string, unknown>) || {};
    const email = (customer.email as string) || (metadata.email as string) || "";
    const name = (metadata.name as string) || "Kingdom Partner";
    const ref = (data.reference as string) || (data.subscription_code as string);

    if (ref) {
      await supabase.from("subscriptions").upsert(
        {
          subscriber_name: name,
          subscriber_email: email,
          plan_name: "Kingdom Partner",
          amount: 1000,
          currency: "KES",
          usd_amount: Number(metadata.usdAmount) || 7.72,
          exchange_rate: Number(metadata.exchangeRate) || 0.00772,
          interval: "monthly",
          status: "active",
          payment_provider: "paystack",
          payment_reference: ref,
          subscription_code: (data.subscription_code as string) || null,
          customer_code: (customer.customer_code as string) || null,
        },
        { onConflict: "payment_reference", ignoreDuplicates: false }
      );
    }
  } else if (event === "subscription.disable") {
    const subCode = data.subscription_code as string;
    if (subCode) {
      await supabase
        .from("subscriptions")
        .update({ status: "canceled", canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("subscription_code", subCode);
      await logBillingEvent((data.customer as Record<string, unknown>)?.email as string || "paystack-webhook", "subscription_canceled", "subscription", subCode, { via: "paystack_webhook" });
    }
  } else if (event === "invoice.payment_failed" || event === "charge.failed") {
    // Dunning entry: mark past_due and schedule the Day-1 retry.
    const customer = (data.customer as Record<string, unknown>) || {};
    const email = (customer.email as string) || "";
    const ref = (data.reference as string) || "";
    if (email) {
      const retryAt = nextRetryDate(0);
      await supabase
        .from("subscriptions")
        .update({ status: "past_due", retry_count: 1, next_retry_at: retryAt ? retryAt.toISOString() : null, updated_at: new Date().toISOString() })
        .eq("subscriber_email", email)
        .eq("status", "active");
      await logBillingEvent(email, "renewal_payment_failed", "subscription", ref || email, { event });
    }
  }

  return c.json({ received: true });
});

// Check Subscription Status (includes lifecycle + renewal pay-link)
subscriptionRoutes.get("/status/:email", async (c) => {
  const email = c.req.param("email");
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("subscriber_email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return c.json({ hasActiveSubscription: false, subscription: null });
    }

    const sub = data[0] as Record<string, unknown>;
    const status = String(sub.status || "active");
    const isActive = status === "active" || status === "grace";
    const planId = String(sub.plan_id || "");
    const interval = String(sub.interval || "monthly");
    return c.json({
      hasActiveSubscription: isActive,
      subscription: sub,
      lifecycle: {
        status,
        renewable: ["past_due", "grace", "suspended", "paused"].includes(status),
        renewLink: planId && planId !== ONETIME_PLAN_ID
          ? `/subscribe?step=checkout&plan=${encodeURIComponent(planId)}&type=${encodeURIComponent(interval)}`
          : "/subscribe?step=checkout",
      },
    });
  } catch {
    return c.json({ hasActiveSubscription: false, subscription: null });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Progressive-identity account claiming (P0): prove inbox ownership, then mint.
// ─────────────────────────────────────────────────────────────────────────────

// Request a one-time claim code. Always returns ok (no email enumeration).
subscriptionRoutes.post(
  "/claim/request",
  strictRateLimit,
  zValidator("json", z.object({ email: z.string().email().max(100) })),
  async (c) => {
    const { email } = c.req.valid("json");
    const norm = email.trim().toLowerCase();
    try {
      const supabase = getSupabase();
      const [{ data: user }, { data: subs }] = await Promise.all([
        supabase.from("users").select("id,name").eq("email", norm).maybeSingle(),
        supabase.from("subscriptions").select("id,subscriber_name").eq("subscriber_email", norm).limit(1),
      ]);
      const hasRecord = Boolean(user) || (Array.isArray(subs) && subs.length > 0);
      if (hasRecord) {
        const code = await issueClaimOtp(norm);
        if (code) {
          const displayName =
            (user as { name?: string } | null)?.name ||
            (subs as { subscriber_name?: string }[] | null)?.[0]?.subscriber_name ||
            "Kingdom Partner";
          try {
            await sendClaimOtpEmail(c, norm, displayName, code);
          } catch (err) {
            console.error("[CLAIM-OTP] email dispatch error:", err);
          }
        }
        await logBillingEvent(norm, "partner_claim_requested", "user", norm, {});
      }
    } catch (err) {
      console.error("[CLAIM] request error:", err);
    }
    return c.json({ ok: true, message: "If this email has a partnership record, a verification code has been sent." });
  }
);

// Verify a claim code and mint the Partner Hub session.
subscriptionRoutes.post(
  "/claim/verify",
  strictRateLimit,
  zValidator("json", z.object({ email: z.string().email().max(100), code: z.string().min(4).max(12) })),
  async (c) => {
    const { email, code } = c.req.valid("json");
    const norm = email.trim().toLowerCase();
    const check = await checkClaimOtp(norm, code);
    if (!check.ok) {
      return c.json({ error: check.reason || "Verification failed.", code: "INVALID_OTP" }, 400);
    }
    const session = await provisionClaimSession(c, norm);
    if (!session) {
      return c.json({ error: "No partnership record found for this email.", code: "NO_RECORD" }, 404);
    }
    await logBillingEvent(norm, "partner_claim_verified", "user", String(session.user.id), {});
    return c.json({ status: "verified", user: session.user, token: session.token });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Self-serve subscription lifecycle (P2): cancel / pause / resume / change-plan.
// Ownership proof = email + the subscription's own payment_reference.
// ─────────────────────────────────────────────────────────────────────────────

async function findOwnedSubscription(email: string, paymentReference?: string) {
  const supabase = getSupabase();
  const norm = email.trim().toLowerCase();
  if (paymentReference) {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("subscriber_email", norm)
      .eq("payment_reference", paymentReference.trim())
      .maybeSingle();
    return data as Record<string, unknown> | null;
  }
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("subscriber_email", norm)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as Record<string, unknown> | null;
}

const manageSchema = z.object({
  email: z.string().email().max(100),
  paymentReference: z.string().min(1).max(64).optional(),
  reason: z.string().max(255).optional(),
});

subscriptionRoutes.post("/manage/cancel", rateLimit, zValidator("json", manageSchema), async (c) => {
  const { email, paymentReference, reason } = c.req.valid("json");
  const sub = await findOwnedSubscription(email, paymentReference);
  if (!sub) return c.json({ error: "No partnership record found for this email.", code: "NO_RECORD" }, 404);
  if (String(sub.status) === "canceled") {
    return c.json({ status: "canceled", subscription: sub });
  }
  const supabase = getSupabase();
  const { data } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      cancel_reason: reason || null,
      next_retry_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id as number)
    .select()
    .maybeSingle();
  await logBillingEvent(email.trim().toLowerCase(), "subscription_canceled", "subscription", String(sub.payment_reference || sub.id), { reason: reason || null });
  return c.json({ status: "canceled", subscription: data || { ...sub, status: "canceled" } });
});

subscriptionRoutes.post("/manage/pause", rateLimit, zValidator("json", manageSchema), async (c) => {
  const { email, paymentReference } = c.req.valid("json");
  const sub = await findOwnedSubscription(email, paymentReference);
  if (!sub) return c.json({ error: "No partnership record found for this email.", code: "NO_RECORD" }, 404);
  const status = String(sub.status);
  if (!["active", "past_due", "grace"].includes(status)) {
    return c.json({ error: `Only active partnerships can be paused (current: ${status}).`, code: "INVALID_STATE" }, 409);
  }
  const supabase = getSupabase();
  const { data } = await supabase
    .from("subscriptions")
    .update({ status: "paused", paused_at: new Date().toISOString(), next_retry_at: null, updated_at: new Date().toISOString() })
    .eq("id", sub.id as number)
    .select()
    .maybeSingle();
  await logBillingEvent(email.trim().toLowerCase(), "subscription_paused", "subscription", String(sub.payment_reference || sub.id), {});
  return c.json({ status: "paused", subscription: data || { ...sub, status: "paused" } });
});

subscriptionRoutes.post("/manage/resume", rateLimit, zValidator("json", manageSchema), async (c) => {
  const { email, paymentReference } = c.req.valid("json");
  const sub = await findOwnedSubscription(email, paymentReference);
  if (!sub) return c.json({ error: "No partnership record found for this email.", code: "NO_RECORD" }, 404);
  const status = String(sub.status);
  if (!["paused", "past_due", "grace", "suspended"].includes(status)) {
    return c.json({ error: `Only paused or overdue partnerships can be resumed (current: ${status}).`, code: "INVALID_STATE" }, 409);
  }
  const supabase = getSupabase();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + (String(sub.interval) === "yearly" ? 12 : 1));
  const { data } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      retry_count: 0,
      next_retry_at: null,
      paused_at: null,
      grace_ends_at: null,
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id as number)
    .select()
    .maybeSingle();
  await logBillingEvent(email.trim().toLowerCase(), "subscription_resumed", "subscription", String(sub.payment_reference || sub.id), { from: status });
  return c.json({ status: "active", subscription: data || { ...sub, status: "active" } });
});

// Plan change with proration preview. M-Pesa cannot silent-charge, so upgrades
// take effect immediately for Hub access while the balance is collected via a
// checkout pay-link; downgrades take effect at the next renewal.
subscriptionRoutes.post(
  "/manage/change-plan",
  rateLimit,
  zValidator(
    "json",
    z.object({
      email: z.string().email().max(100),
      paymentReference: z.string().min(1).max(64).optional(),
      newPlanId: z.string().min(1).max(32),
      interval: z.enum(["monthly", "yearly"]).default("monthly"),
      apply: z.boolean().default(false),
    })
  ),
  async (c) => {
    const { email, paymentReference, newPlanId, interval, apply } = c.req.valid("json");
    const sub = await findOwnedSubscription(email, paymentReference);
    if (!sub) return c.json({ error: "No partnership record found for this email.", code: "NO_RECORD" }, 404);
    const status = String(sub.status);
    if (["canceled", "suspended"].includes(status)) {
      return c.json({ error: `Partnership is ${status} and cannot change plans. Please renew first.`, code: "INVALID_STATE" }, 409);
    }
    const newPlan = PARTNER_PLAN_CATALOG.find((p) => p.id === newPlanId);
    if (!newPlan) return c.json({ error: "Unknown partnership plan.", code: "UNKNOWN_PLAN" }, 400);
    const newAmount = interval === "yearly" ? yearlyPriceFromMonthly(newPlan.kesMonthly) : newPlan.kesMonthly;
    const currentAmount = Number(sub.amount) || 0;

    // Proration: credit unused days of the current cycle against the new price.
    const now = Date.now();
    const periodEndMs = new Date(String(sub.current_period_end || new Date().toISOString())).getTime();
    const periodStartMs = new Date(String(sub.current_period_start || new Date().toISOString())).getTime();
    const periodDays = Math.max(1, Math.ceil((periodEndMs - periodStartMs) / 86400000));
    const remainingDays = Math.max(0, Math.ceil((periodEndMs - now) / 86400000));
    const unusedCredit = Math.round((currentAmount * remainingDays) / periodDays);
    const immediateBalance = Math.max(0, newAmount - unusedCredit);

    const preview = {
      from: { planName: String(sub.plan_name), amount: currentAmount, interval: String(sub.interval) },
      to: { planId: newPlan.id, planName: newPlan.name, amount: newAmount, interval },
      remainingDays,
      unusedCredit,
      immediateBalance,
      effective: immediateBalance > 0 ? "immediate-hub-access-pending-payment" : "next-renewal",
      payLink: `/subscribe?step=checkout&plan=${encodeURIComponent(newPlan.id)}&type=${encodeURIComponent(interval)}`,
    };

    if (!apply) {
      return c.json({ preview });
    }

    const supabase = getSupabase();
    const { data } = await supabase
      .from("subscriptions")
      .update({
        plan_id: newPlan.id,
        plan_name: newPlan.name,
        amount: newAmount,
        interval,
        metadata: { ...((sub.metadata as Record<string, unknown>) || {}), pendingBalance: immediateBalance, planChangedAt: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id as number)
      .select()
      .maybeSingle();
    await logBillingEvent(email.trim().toLowerCase(), "subscription_plan_changed", "subscription", String(sub.payment_reference || sub.id), {
      from: preview.from,
      to: preview.to,
      immediateBalance,
    });
    return c.json({ preview, subscription: data || { ...sub, plan_id: newPlan.id, plan_name: newPlan.name, amount: newAmount, interval } });
  }
);

// Poll a Paybill claim (frontend waits on provider confirmation after 202).
subscriptionRoutes.get("/mpesa/claim/:reference", rateLimit, async (c) => {
  const cleanRef = c.req.param("reference").trim().toUpperCase();
  const email = (c.req.query("email") || "").trim().toLowerCase();
  try {
    const supabase = getSupabase();
    let q = supabase
      .from("payment_claims")
      .select("*")
      .eq("payment_reference", cleanRef)
      .order("created_at", { ascending: false })
      .limit(1);
    if (email) q = q.eq("email", email);
    const { data } = await q.maybeSingle();
    const claim = data as ClaimRow | null;
    if (!claim) {
      return c.json({ status: "not_found", message: "No claim found for this code." }, 404);
    }
    if (claim.status === "matched") {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("payment_reference", cleanRef)
        .maybeSingle();
      return c.json({ status: "matched", claim, subscription: sub || null });
    }
    return c.json({ status: claim.status, claim });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Lookup failed." }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Admin reconciliation queue: unmatched receipts, open claims, manual resolve.
// (Manual approval = human checked the M-Pesa statement; fully audited.)
// ─────────────────────────────────────────────────────────────────────────────

subscriptionRoutes.get("/mpesa/receipts/unmatched", requireAdmin, async (c) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 50));
    const supabase = getSupabase();
    const { data } = await supabase
      .from("mpesa_paybill_receipts")
      .select("*")
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(limit);
    return c.json({ receipts: data || [] });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Query failed." }, 500);
  }
});

subscriptionRoutes.get("/mpesa/claims/pending", requireAdmin, async (c) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 50));
    const supabase = getSupabase();
    const { data } = await supabase
      .from("payment_claims")
      .select("*")
      .in("status", ["awaiting_receipt", "amount_mismatch"])
      .order("created_at", { ascending: false })
      .limit(limit);
    return c.json({ claims: data || [] });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Query failed." }, 500);
  }
});

subscriptionRoutes.post(
  "/mpesa/claims/:id/resolve",
  requireAdmin,
  zValidator("json", z.object({ decision: z.enum(["approve", "reject"]), note: z.string().max(255).optional() })),
  async (c) => {
    const id = Number(c.req.param("id"));
    const { decision, note } = c.req.valid("json");
    if (!Number.isFinite(id)) return c.json({ error: "Invalid claim id." }, 400);
    try {
      const supabase = getSupabase();
      const { data: row } = await supabase.from("payment_claims").select("*").eq("id", id).maybeSingle();
      const claim = row as ClaimRow | null;
      if (!claim) return c.json({ error: "Claim not found." }, 404);
      if (claim.status === "matched") return c.json({ status: "matched", claim });

      const actor = ((c.get as unknown as (key: string) => { email?: string } | undefined)("user"))?.email || "admin";
      if (decision === "reject") {
        await setClaimStatus(supabase, claim.id, "rejected", { note: note || "Rejected by admin." });
        await logBillingEvent(actor, "paybill_claim_admin_rejected", "payment_claim", claim.payment_reference, { claimId: claim.id, note: note || null });
        return c.json({ status: "rejected", claim: { ...claim, status: "rejected" } });
      }

      // Approve: consume the linked receipt when present (keeps single-use true),
      // then fulfill. Works receipt-less when the admin verified the statement.
      const receipt = await findReceiptByTransId(supabase, claim.payment_reference);
      if (receipt && !receipt.consumed) {
        const won = await consumeReceipt(supabase, receipt.id, `admin:${actor}`);
        if (!won) return c.json({ error: "Receipt was already consumed.", code: "REFERENCE_ALREADY_REDEEMED" }, 409);
      }
      const { subData } = await fulfillPaybillRedemption(c, claim.payment_reference, {
        name: claim.name,
        email: claim.email,
        amount: Number(claim.amount),
        planName: claim.plan_name || "Kingdom Partner",
        planId: claim.plan_id || ONETIME_PLAN_ID,
        interval: (claim.interval === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly",
        phone: claim.phone,
        kind: claim.kind || "subscription",
      });
      await setClaimStatus(supabase, claim.id, "matched", {
        receipt_id: receipt?.id || null,
        note: note ? `Admin-approved: ${note}` : "Admin-approved against statement.",
      });
      await logBillingEvent(actor, "paybill_claim_admin_approved", "payment_claim", claim.payment_reference, { claimId: claim.id, note: note || null });
      return c.json({ status: "matched", claim: { ...claim, status: "matched" }, subscription: subData || null });
    } catch (err: unknown) {
      return c.json({ error: err instanceof Error ? err.message : "Resolve failed." }, 500);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Renewal dunning engine (P2): M-Pesa needs a PIN every cycle, so renewals are
// nudge-and-confirm. Cron calls retry-due; due lists upcoming renewals.
// Guarded by CRON_SECRET when configured.
// ─────────────────────────────────────────────────────────────────────────────

function cronGuard(c: import("hono").Context): { ok: boolean; response?: Response } {
  const secret = getSecret(c, "CRON_SECRET");
  if (!secret) {
    return { ok: false, response: c.json({ error: "Dunning is not configured (CRON_SECRET missing).", code: "CRON_NOT_CONFIGURED" }, 503) as unknown as Response };
  }
  const provided = c.req.header("x-cron-secret") || "";
  if (provided !== secret) {
    return { ok: false, response: c.json({ error: "Unauthorized.", code: "BAD_CRON_SECRET" }, 401) as unknown as Response };
  }
  return { ok: true };
}

function frontendBase(c: import("hono").Context): string {
  return c.req.header("origin") || "https://kingdommissionsnetwork.org";
}

// Subscriptions renewing within the next `days` days (renewal nudge list).
subscriptionRoutes.get("/billing/due", async (c) => {
  const guard = cronGuard(c);
  if (!guard.ok) return guard.response as unknown as never;
  const days = Math.min(30, Math.max(1, Number(c.req.query("days")) || 2));
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("subscriptions")
      .select("id,subscriber_name,subscriber_email,plan_name,plan_id,amount,currency,interval,current_period_end,status")
      .eq("status", "active")
      .lte("current_period_end", cutoff.toISOString());
    const rows = ((data as Record<string, unknown>[] | null) || []).map((r) => ({
      ...r,
      renewLink: `${frontendBase(c)}/subscribe?step=checkout&plan=${encodeURIComponent(String(r.plan_id || ""))}&type=${encodeURIComponent(String(r.interval || "monthly"))}`,
    }));
    return c.json({ due: rows, count: rows.length, withinDays: days });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Query failed." }, 500);
  }
});

// Process overdue retries: Day-1 → Day-3 → Day-7 reminders, then suspend.
subscriptionRoutes.post("/billing/retry-due", async (c) => {
  const guard = cronGuard(c);
  if (!guard.ok) return guard.response as unknown as never;
  const base = frontendBase(c);
  const nowIso = new Date().toISOString();
  const results: { processed: number; reminded: number; suspended: number; errors: number } = {
    processed: 0,
    reminded: 0,
    suspended: 0,
    errors: 0,
  };
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .in("status", ["past_due", "grace"])
      .lte("next_retry_at", nowIso)
      .limit(200);
    const rows = (data as Record<string, unknown>[] | null) || [];

    for (const sub of rows) {
      results.processed++;
      try {
        const attemptNo = (Number(sub.retry_count) || 0) + 1;
        const email = String(sub.subscriber_email || "");
        const planId = String(sub.plan_id || "");
        const interval = String(sub.interval || "monthly");
        const renewLink = `${base}/subscribe?step=checkout&plan=${encodeURIComponent(planId)}&type=${encodeURIComponent(interval)}`;

        if (attemptNo > MAX_DUNNING_ATTEMPTS) {
          await supabase
            .from("subscriptions")
            .update({ status: "suspended", next_retry_at: null, updated_at: new Date().toISOString() })
            .eq("id", sub.id as number);
          await logBillingEvent(email, "subscription_suspended", "subscription", String(sub.payment_reference || sub.id), { attempts: attemptNo - 1 });
          results.suspended++;
          continue;
        }

        const next = nextRetryDate(attemptNo - 1);
        await supabase
          .from("subscriptions")
          .update({
            status: attemptNo === 1 ? "past_due" : "grace",
            retry_count: attemptNo,
            next_retry_at: next ? next.toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id as number);

        try {
          await supabase.from("billing_attempts").insert({
            subscription_id: sub.id as number,
            subscriber_email: email,
            amount: Number(sub.amount) || 0,
            provider: String(sub.payment_provider || "mpesa_paybill"),
            status: "reminder_sent",
            attempt_no: attemptNo,
            next_retry_at: next ? next.toISOString() : null,
            detail: { renewLink },
          });
        } catch {
          // billing_attempts table optional until migration is applied
        }

        try {
          await sendDunningReminderEmail(c, email, {
            name: String(sub.subscriber_name || "Kingdom Partner"),
            planName: String(sub.plan_name || "Kingdom Partnership"),
            amount: Number(sub.amount) || 0,
            currency: String(sub.currency || "KES"),
            renewLink,
            attemptNo,
            nextRetryDate: next ? next.toLocaleDateString("en-KE", { dateStyle: "long" }) : undefined,
          });
        } catch (err) {
          console.error("[DUNNING] email error:", err);
        }
        await logBillingEvent(email, "dunning_reminder_sent", "subscription", String(sub.payment_reference || sub.id), { attemptNo });
        results.reminded++;
      } catch (err) {
        console.error("[DUNNING] row error:", err);
        results.errors++;
      }
    }
    return c.json({ ok: true, ...results });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : "Retry run failed." }, 500);
  }
});
