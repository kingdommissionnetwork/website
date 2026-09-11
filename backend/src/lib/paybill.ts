/**
 * Kingdom Missions Network — Paybill ground-truth layer.
 *
 * PROBLEM this solves: an M-Pesa SMS code is just a string. Format checks
 * prove nothing about money movement. The ONLY authentic proof that funds
 * reached Paybill 522522 / account 1335674365 is a provider confirmation:
 *   1. Daraja C2B Confirmation callback (Safaricom POSTs every successful
 *      Paybill payment to our registered ConfirmationURL), or
 *   2. KCB Buni IPN for credits to the collection account, or
 *   3. Manual admin reconciliation against the M-Pesa statement.
 *
 * ARCHITECTURE (fail-closed):
 *   provider callbacks  →  mpesa_paybill_receipts   (money truth, idempotent)
 *   user pastes code    →  payment_claims            (redemption intent)
 *   receipt + claim match (code, amount, account, freshness) + atomic consume
 *                       →  subscriptions + donations (ledger, only on approval)
 *
 * Until a receipt exists, redemption stays `awaiting_receipt` — it NEVER
 * activates a partnership. Unknown codes return 202 pending, not success.
 */

export const OUR_PAYBILL = "522522";
export const OUR_ACCOUNT = "1335674365";
/** Receipts older than this cannot be redeemed (stale-code replay window). */
export const RECEIPT_MAX_AGE_DAYS = 30;
/** Pending claims expire (user must re-submit with a fresh lookup). */
export const CLAIM_TTL_HOURS = 48;

export interface NormalizedReceipt {
  transId: string;
  amount: number;
  phone: string;
  billRef: string;
  shortcode: string;
  transTime: string | null;
  source: "daraja_c2b" | "kcb_ipn" | "admin" | "sandbox";
  raw: Record<string, unknown>;
}

function cleanStr(v: unknown): string {
  return String(v ?? "").trim();
}

/** Parse a Daraja C2B Confirmation payload into a normalized receipt. */
export function normalizeDarajaConfirmation(body: Record<string, unknown>): NormalizedReceipt | null {
  const transId = cleanStr(body.TransID).toUpperCase();
  const amount = Number(body.TransAmount);
  if (!transId || !Number.isFinite(amount) || amount <= 0) return null;
  return {
    transId,
    amount: Math.round(amount),
    phone: cleanStr(body.MSISDN),
    billRef: cleanStr(body.BillRefNumber),
    shortcode: cleanStr(body.BusinessShortCode),
    transTime: cleanStr(body.TransTime) || null,
    source: "daraja_c2b",
    raw: body,
  };
}

/** Parse a KCB Buni IPN / credit notification (flexible field names matching official KCB IPN spec). */
export function normalizeKcbIpn(body: Record<string, unknown>): NormalizedReceipt | null {
  const flat = (body.response || body.Body || body) as Record<string, unknown>;
  const transId = cleanStr(
    flat.transactionReference ??
    flat.TransID ??
    flat.transId ??
    flat.MpesaReceiptNumber ??
    flat.mpesaReceiptNumber ??
    flat.reference ??
    flat.Reference
  ).toUpperCase();
  const amount = Number(
    flat.transactionAmount ??
    flat.TransAmount ??
    flat.amount ??
    flat.Amount ??
    flat.value
  );
  if (!transId || !Number.isFinite(amount) || amount <= 0) return null;
  return {
    transId,
    amount: Math.round(amount),
    phone: cleanStr(
      flat.customerMobileNumber ??
      flat.MSISDN ??
      flat.msisdn ??
      flat.PhoneNumber ??
      flat.phone
    ),
    billRef: cleanStr(
      flat.customerReference ??
      flat.creditAccountIdentifier ??
      flat.BillRefNumber ??
      flat.billRef ??
      flat.Account ??
      flat.account
    ),
    shortcode: cleanStr(
      flat.organizationShortCode ??
      flat.tillNumber ??
      flat.BusinessShortCode ??
      flat.shortcode ??
      OUR_PAYBILL
    ),
    transTime: cleanStr(
      flat.timestamp ??
      flat.TransTime ??
      flat.time ??
      flat.TransactionDate
    ) || null,
    source: "kcb_ipn",
    raw: body,
  };
}

export type MatchVerdict =
  | { ok: true }
  | { ok: false; reason: string; code: "NO_RECEIPT" | "ALREADY_CONSUMED" | "AMOUNT_MISMATCH" | "ACCOUNT_MISMATCH" | "STALE_RECEIPT" };

/**
 * Pure matcher: does a provider-confirmed receipt satisfy a redemption claim?
 * - transId equality is checked by the caller (row lookup).
 * - Recurring tiers require the EXACT catalog price; one-time/custom require
 *   the receipt to equal the claimed gift (both directions — no short-pay,
 *   no over-claim that could mask a different payment).
 * - Receipts naming a different bill ref / account are rejected (a genuine
 *   code from ANOTHER business must never redeem here).
 */
export function matchReceiptToClaim(opts: {
  receipt: { amount: number; billRef: string; consumed: boolean; transTime: string | null };
  claimedAmount: number;
  requireExact: boolean;
  nowMs?: number;
}): MatchVerdict {
  const { receipt, claimedAmount, nowMs } = opts;
  if (receipt.consumed) {
    return { ok: false, reason: "This M-Pesa transaction code has already been redeemed.", code: "ALREADY_CONSUMED" };
  }
  if (receipt.billRef) {
    const ref = receipt.billRef.trim();
    if (ref && ref !== OUR_ACCOUNT && ref !== OUR_PAYBILL) {
      return {
        ok: false,
        reason: "This payment was sent to a different account. Only payments to account 1335674365 can be redeemed here.",
        code: "ACCOUNT_MISMATCH",
      };
    }
  }
  if (Math.round(receipt.amount) !== Math.round(claimedAmount)) {
    return {
      ok: false,
      reason: `The confirmed M-Pesa amount (KES ${Math.round(receipt.amount).toLocaleString()}) does not match the claimed KES ${Math.round(claimedAmount).toLocaleString()}.`,
      code: "AMOUNT_MISMATCH",
    };
  }
  if (receipt.transTime) {
    const parsed = parseDarajaTime(receipt.transTime);
    if (parsed && (nowMs ?? Date.now()) - parsed > RECEIPT_MAX_AGE_DAYS * 86400000) {
      return {
        ok: false,
        reason: `This transaction is older than ${RECEIPT_MAX_AGE_DAYS} days and can no longer be redeemed online. Please contact support.`,
        code: "STALE_RECEIPT",
      };
    }
  }
  return { ok: true };
}

/** Daraja TransTime is YYYYMMDDHHmmss; returns epoch ms or null if unparseable. */
export function parseDarajaTime(transTime: string): number | null {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(transTime.trim());
  if (!m) {
    const fallback = Date.parse(transTime);
    return Number.isFinite(fallback) ? fallback : null;
  }
  const [, y, mo, d, h, mi, s] = m;
  // TransTime is Africa/Nairobi (UTC+3).
  return Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h) - 3, Number(mi), Number(s));
}

// ── Row CRUD (Supabase) ──────────────────────────────────────────────────────
// `db` is the Supabase client (typed loosely to keep this module dependency-light).

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = { from: (table: string) => any };

export interface ReceiptRow {
  id: number;
  trans_id: string;
  amount: number;
  phone: string | null;
  bill_ref: string | null;
  shortcode: string | null;
  trans_time: string | null;
  source: string;
  consumed: boolean;
  consumed_by: string | null;
  consumed_at: string | null;
}

export interface ClaimRow {
  id: number;
  payment_reference: string;
  email: string;
  name: string;
  amount: number;
  plan_id: string | null;
  plan_name: string | null;
  interval: string;
  phone: string | null;
  kind: string;
  status: string;
  receipt_id: number | null;
  attempts: number;
  note: string | null;
  mpesa_message: string | null;
  created_at: string;
}

export type ClaimStatus = "awaiting_receipt" | "matched" | "amount_mismatch" | "rejected" | "expired";

/** Idempotent receipt ingest: first write wins, replays return the stored row. */
export async function recordPaybillReceipt(db: Db, r: NormalizedReceipt): Promise<ReceiptRow | null> {
  try {
    await db.from("mpesa_paybill_receipts").upsert(
      {
        trans_id: r.transId,
        amount: r.amount,
        phone: r.phone || null,
        bill_ref: r.billRef || null,
        shortcode: r.shortcode || null,
        trans_time: r.transTime,
        source: r.source,
        raw: r.raw,
      },
      { onConflict: "trans_id", ignoreDuplicates: true }
    );
    const { data } = await db.from("mpesa_paybill_receipts").select("*").eq("trans_id", r.transId).maybeSingle();
    return (data as ReceiptRow | null) || null;
  } catch {
    return null;
  }
}

export async function findReceiptByTransId(db: Db, transId: string): Promise<ReceiptRow | null> {
  try {
    const { data } = await db
      .from("mpesa_paybill_receipts")
      .select("*")
      .eq("trans_id", transId.trim().toUpperCase())
      .maybeSingle();
    return (data as ReceiptRow | null) || null;
  } catch {
    return null;
  }
}

/**
 * Atomically consume a receipt (single redemption). Returns the row only if
 * this call won the race; null means already consumed (replay attempt).
 */
export async function consumeReceipt(db: Db, id: number, consumedBy: string): Promise<ReceiptRow | null> {
  try {
    const { data } = await db
      .from("mpesa_paybill_receipts")
      .update({ consumed: true, consumed_by: consumedBy, consumed_at: new Date().toISOString() })
      .eq("id", id)
      .eq("consumed", false)
      .select()
      .maybeSingle();
    return (data as ReceiptRow | null) || null;
  } catch {
    return null;
  }
}

export interface ClaimInput {
  paymentReference: string;
  email: string;
  name: string;
  amount: number;
  planId?: string | null;
  planName?: string | null;
  interval?: string;
  phone?: string | null;
  kind?: string;
  /** Pasted full M-Pesa confirmation SMS — stored for instant admin verification. */
  mpesaMessage?: string | null;
  note?: string | null;
}

/** Create or refresh an open claim for (reference, email). */
export async function upsertPaymentClaim(db: Db, input: ClaimInput): Promise<ClaimRow | null> {
  try {
    const ref = input.paymentReference.trim().toUpperCase();
    const email = input.email.trim().toLowerCase();
    const mpesaMessage = (input.mpesaMessage || "").slice(0, 1000) || null;
    const note = (input.note || "").slice(0, 1000) || null;
    const { data: open } = await db
      .from("payment_claims")
      .select("*")
      .eq("payment_reference", ref)
      .eq("email", email)
      .eq("status", "awaiting_receipt")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (open) {
      const row = open as ClaimRow;
      const patch: Record<string, unknown> = {
        name: input.name,
        amount: input.amount,
        plan_id: input.planId || null,
        plan_name: input.planName || null,
        interval: input.interval || "monthly",
        phone: input.phone || null,
        kind: input.kind || "subscription",
        attempts: (row.attempts || 0) + 1,
        updated_at: new Date().toISOString(),
      };
      // Best-effort: older DBs without the migration lack these columns.
      if (mpesaMessage) patch.mpesa_message = mpesaMessage;
      if (note) patch.note = note;
      else if (mpesaMessage) patch.note = `M-Pesa SMS: ${mpesaMessage}`.slice(0, 1000);
      const { data: updateData, error } = await db
        .from("payment_claims")
        .update(patch)
        .eq("id", row.id)
        .select()
        .maybeSingle();
      let data = updateData;
      if (error && (patch.mpesa_message || patch.note)) {
        delete patch.mpesa_message;
        delete patch.note;
        const retry = await db.from("payment_claims").update(patch).eq("id", row.id).select().maybeSingle();
        data = retry.data;
      }
      return (data as ClaimRow | null) || row;
    }
    const payload: Record<string, unknown> = {
      payment_reference: ref,
      email,
      name: input.name,
      amount: input.amount,
      plan_id: input.planId || null,
      plan_name: input.planName || null,
      interval: input.interval || "monthly",
      phone: input.phone || null,
      kind: input.kind || "subscription",
      status: "awaiting_receipt",
      attempts: 1,
    };
    if (mpesaMessage) payload.mpesa_message = mpesaMessage;
    payload.note = note || (mpesaMessage ? `M-Pesa SMS: ${mpesaMessage}`.slice(0, 1000) : null);
    if (!payload.note) delete payload.note;
    if (!payload.mpesa_message) delete payload.mpesa_message;
    const { data: insertData, error: insertError } = await db
      .from("payment_claims")
      .insert(payload)
      .select()
      .single();
    let data = insertData;
    if (insertError && (payload.mpesa_message || payload.note)) {
      delete payload.mpesa_message;
      delete payload.note;
      const retry = await db.from("payment_claims").insert(payload).select().single();
      data = retry.data;
    }
    return data as ClaimRow | null;
  } catch {
    return null;
  }
}

export async function setClaimStatus(
  db: Db,
  id: number,
  status: ClaimStatus,
  patch: Record<string, unknown> = {}
): Promise<void> {
  try {
    await db
      .from("payment_claims")
      .update({ status, ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
  } catch {
    // non-fatal bookkeeping
  }
}

// ── Durable M-Pesa STK checkout sessions ───────────────────────────────────
// In-memory Maps are per-isolate on Cloudflare Workers: an STK callback can
// land on a different isolate than the stkpush trigger, losing the session.
// These helpers persist sessions to `mpesa_stk_sessions` (Supabase) so any
// isolate can resolve query/callback. All best-effort: on missing table/env
// they resolve null/void and callers fall back to the in-memory L1 cache.

export interface StkSessionRow {
  checkout_request_id: string;
  merchant_request_id: string | null;
  name: string;
  email: string;
  phone: string;
  amount: number;
  plan_name: string | null;
  plan_id: string | null;
  interval: string;
  status: string;
  receipt_code: string | null;
  fulfilled: boolean;
  created_at: string;
  updated_at: string;
}

export interface StkSessionInput {
  checkoutRequestId: string;
  merchantRequestId: string;
  name: string;
  email: string;
  phone: string;
  amount: number;
  planName: string;
  planId: string;
  interval: string;
}

/** Insert (or refresh) a pending STK session. Never throws. */
export async function saveStkSession(db: Db, s: StkSessionInput): Promise<void> {
  try {
    await db.from("mpesa_stk_sessions").upsert(
      {
        checkout_request_id: s.checkoutRequestId,
        merchant_request_id: s.merchantRequestId,
        name: s.name,
        email: s.email,
        phone: s.phone,
        amount: Math.round(s.amount),
        plan_name: s.planName,
        plan_id: s.planId,
        interval: s.interval,
        status: "pending",
        receipt_code: null,
        fulfilled: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "checkout_request_id", ignoreDuplicates: false }
    );
  } catch {
    // Table missing / offline — memory cache still serves single-isolate dev.
  }
}

/** Fetch a session by checkoutRequestId. Returns null on miss or DB error. */
export async function findStkSession(db: Db, checkoutRequestId: string): Promise<StkSessionRow | null> {
  try {
    const id = checkoutRequestId.trim().slice(0, 64);
    if (!id) return null;
    const { data } = await db
      .from("mpesa_stk_sessions")
      .select("*")
      .eq("checkout_request_id", id)
      .maybeSingle();
    return (data as StkSessionRow | null) || null;
  } catch {
    return null;
  }
}

/** Patch status / receipt / fulfilled flag. Never throws. */
export async function updateStkSession(
  db: Db,
  checkoutRequestId: string,
  patch: Partial<Pick<StkSessionRow, "status" | "receipt_code" | "fulfilled">>
): Promise<void> {
  try {
    await db
      .from("mpesa_stk_sessions")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("checkout_request_id", checkoutRequestId.trim().slice(0, 64));
  } catch {
    // non-fatal bookkeeping
  }
}

/** Latest open (awaiting_receipt) claim for a transaction code, any email. */
export async function findOpenClaimForReference(db: Db, transId: string): Promise<ClaimRow | null> {
  try {
    const { data } = await db
      .from("payment_claims")
      .select("*")
      .eq("payment_reference", transId.trim().toUpperCase())
      .eq("status", "awaiting_receipt")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as ClaimRow | null) || null;
  } catch {
    return null;
  }
}
