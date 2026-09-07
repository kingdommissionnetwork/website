/**
 * Kingdom Missions Network — Server-side plan catalog & pricing truth.
 *
 * Security rule: the client NEVER sets the price. Every payment endpoint
 * must validate the submitted amount against this catalog before touching
 * any provider (KCB/Daraja STK, Paystack, PayPal) or the ledger.
 * Keep in sync with `PARTNER_PLANS` in `src/pages/SubscriptionPortal.tsx`.
 */

export interface PartnerPlanDef {
  id: string;
  name: string;
  kesMonthly: number;
}

export const PARTNER_PLAN_CATALOG: PartnerPlanDef[] = [
  { id: "seed", name: "Seed Partner", kesMonthly: 1000 },
  { id: "ambassador", name: "Kingdom Ambassador", kesMonthly: 3000 },
  { id: "harvest", name: "Global Harvest Partner", kesMonthly: 7500 },
  { id: "pillar", name: "Covenant Pillar", kesMonthly: 20000 },
];

/** Sentinel plan ids used by one-time / custom-amount giving flows (no fixed price). */
export const ONETIME_PLAN_ID = "onetime_seed";
export const CUSTOM_PLAN_ID = "custom";

export const MIN_ONETIME_KES = 50;
export const MAX_SINGLE_KES = 1_000_000;
/** Annual billing discount applied server-side (must match frontend). */
export const ANNUAL_DISCOUNT = 0.15;

export function yearlyPriceFromMonthly(monthlyKes: number): number {
  return Math.round(monthlyKes * 12 * (1 - ANNUAL_DISCOUNT));
}

export function findPlan(planId: string | undefined | null): PartnerPlanDef | null {
  if (!planId) return null;
  return PARTNER_PLAN_CATALOG.find((p) => p.id === planId) || null;
}

export type ValidateAmountResult =
  | { ok: true; isRecurring: false; planName: string; expectedKes: number }
  | { ok: true; isRecurring: true; planName: string; expectedKes: number }
  | { ok: false; error: string; code: string; expectedKes?: number };

/**
 * Validate a client-submitted amount against the catalog.
 * - One-time (`onetime_seed` or missing planId): any amount within [MIN, MAX].
 * - Recurring: amount must EXACTLY equal the catalog price for plan+interval.
 */
export function validatePaymentAmount(opts: {
  planId?: string | null;
  planName?: string | null;
  interval?: string | null;
  amount: number;
}): ValidateAmountResult {
  const { planId, interval, amount } = opts;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Invalid amount.", code: "INVALID_AMOUNT" };
  }
  if (amount > MAX_SINGLE_KES) {
    return { ok: false, error: `Amount exceeds the maximum single gift of KES ${MAX_SINGLE_KES.toLocaleString()}.`, code: "AMOUNT_TOO_LARGE" };
  }

  const isOneTime = !planId || planId === ONETIME_PLAN_ID || planId === CUSTOM_PLAN_ID;
  if (isOneTime) {
    if (amount < MIN_ONETIME_KES) {
      return { ok: false, error: `Minimum gift amount is KES ${MIN_ONETIME_KES}.`, code: "AMOUNT_TOO_SMALL" };
    }
    return { ok: true, isRecurring: false, planName: opts.planName || "Kingdom Seed Gift", expectedKes: Math.round(amount) };
  }

  const plan = findPlan(planId);
  if (!plan) {
    return { ok: false, error: "Unknown partnership plan.", code: "UNKNOWN_PLAN" };
  }
  const cycle = interval === "yearly" ? "yearly" : "monthly";
  const expectedKes = cycle === "yearly" ? yearlyPriceFromMonthly(plan.kesMonthly) : plan.kesMonthly;
  if (Math.round(amount) !== expectedKes) {
    return {
      ok: false,
      error: `Amount KES ${Math.round(amount).toLocaleString()} does not match the ${plan.name} ${cycle} price of KES ${expectedKes.toLocaleString()}. Prices are set server-side.`,
      code: "PRICE_MISMATCH",
      expectedKes,
    };
  }
  return { ok: true, isRecurring: true, planName: plan.name, expectedKes };
}

/** Subscription lifecycle states (single vocabulary across API, DB, UI). */
export const SUBSCRIPTION_STATUSES = [
  "active",
  "past_due",
  "grace",
  "suspended",
  "paused",
  "canceled",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Dunning retry delays in days after a failed renewal (Day 1 / 3 / 7). */
export const DUNNING_RETRY_DELAYS_DAYS = [1, 3, 7];
export const MAX_DUNNING_ATTEMPTS = DUNNING_RETRY_DELAYS_DAYS.length;

export function nextRetryDate(attemptNo: number, from: Date = new Date()): Date | null {
  const delay = DUNNING_RETRY_DELAYS_DAYS[attemptNo];
  if (delay === undefined) return null;
  const d = new Date(from);
  d.setDate(d.getDate() + delay);
  return d;
}
