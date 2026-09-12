/**
 * Partner credential numbers: KMN-P-2026/4002
 *   KMN      — issuer prefix
 *   P        — holder category (P = partner; extensible: M member, S staff…)
 *   2026     — issuance year (serials restart yearly, first serial 4001)
 *   4002     — serial PIN, allocated atomically by the database (next_partner_serial
 *              RPC over partner_number_counters). Never random: 4-digit random
 *              PINs collide after ~100 holders (birthday paradox) and repeat
 *              across years/isolates. The UNIQUE index on
 *              subscriptions.partner_number is the final backstop.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type RpcDb = { rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: any; error: any }> };

export const PARTNER_CATEGORIES = ["P"] as const;
export type PartnerCategory = (typeof PARTNER_CATEGORIES)[number];

/** KMN-P-2026/4002 — serial is zero-padded to at least 4 digits. */
export function formatPartnerNumber(category: string, year: number, serial: number): string {
  const cat = (category || "P").toUpperCase().slice(0, 1);
  const serialStr = String(Math.max(0, Math.floor(serial))).padStart(4, "0");
  return `KMN-${cat}-${year}/${serialStr}`;
}

export function parsePartnerNumber(input: unknown): { category: string; year: number; serial: number } | null {
  const m = /^KMN-([A-Z])-((?:19|20)\d{2})\/(\d{4,})$/.exec(String(input || "").trim().toUpperCase());
  if (!m) return null;
  return { category: m[1], year: Number(m[2]), serial: Number(m[3]) };
}

/**
 * Unguessable credential token for QR deep links: 48 hex chars (192 bits).
 * Sequential partner numbers are enumerable, so holder details are only
 * ever served behind this token. Generated app-side (no pgcrypto needed).
 */
export function randomVerifyToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function isValidVerifyToken(input: unknown): boolean {
  return /^[0-9a-f]{48}$/.test(String(input || "").trim().toLowerCase());
}

/**
 * Atomically allocate the next credential number for (category, year).
 * Returns null when the counter/RPC is unavailable (pre-migration DB) so
 * callers degrade gracefully instead of failing fulfillment.
 */
export async function issuePartnerNumber(
  db: RpcDb,
  opts?: { category?: string; year?: number }
): Promise<string | null> {
  const category = (opts?.category || "P").toUpperCase().slice(0, 1);
  const year = opts?.year || new Date().getFullYear();
  try {
    const { data, error } = await db.rpc("next_partner_serial", { p_category: category, p_year: year });
    if (error || !Number.isFinite(Number(data))) return null;
    return formatPartnerNumber(category, year, Number(data));
  } catch {
    return null;
  }
}
