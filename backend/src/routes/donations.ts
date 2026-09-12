import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";
import { requireAdmin, verifyToken } from "../lib/jwt";
import { getCookie } from "hono/cookie";
import { rateLimit } from "../lib/rateLimiter";
import { publicCache } from "../lib/httpCache";
import { isValidVerifyToken } from "../lib/partnerNumber";
import { sendDonationEmail } from "../lib/email";

export const donationRoutes = new Hono();

// Quota guard: verification results change slowly (records are immutable once
// written). Cache hits AND misses briefly so repeated scans and probing
// floods don't each cost Supabase queries. 120s keeps fraud data fresh.
const verifyCache = new Map<string, { time: number; status: number; body: unknown }>();
const VERIFY_TTL_MS = 120_000;

/** Test-only: reset the verification result cache between cases. */
export function clearVerifyCache(): void {
  verifyCache.clear();
}

const createDonationSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  recurring: z.boolean().optional().default(false),
  donor_name: z.string().optional().default("Anonymous"),
  donor_email: z.string().email().optional().default(""),
});

donationRoutes.post("/", requireAdmin, zValidator("json", createDonationSchema), async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const data = c.req.valid("json");
  const { data: donation, error } = await supabase.from("donations").insert({
    amount: data.amount,
    recurring: data.recurring,
    donor_name: data.donor_name,
    donor_email: data.donor_email,
  }).select().single();
  if (error) return c.json({ error: "Failed to record donation." }, 500);

  await sendDonationEmail(c, data.donor_email, data.donor_name, data.amount, "KES");

  return c.json(donation, 201);
});

donationRoutes.get("/history", rateLimit, async (c) => {
  const email = c.req.query("email");
  if (!email) return c.json([]);

  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : getCookie(c, "token");
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  const payload = await verifyToken(token).catch(() => null);
  if (!payload) return c.json({ error: "Invalid token" }, 401);

  if (payload.role !== "admin" && payload.role !== "superadmin" && payload.email !== email) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const supabase = getSupabase(c.env as Record<string, string>);
  const { data, error } = await supabase.from("donations").select("*").eq("donor_email", email).order("created_at", { ascending: false });
  if (error) return c.json({ error: "Failed to load history." }, 500);
  return c.json(data);
});

// Fail-closed verification: only records present in the registry are ever
// reported as verified. Unknown references, partners, and statements return
// verified:false — never a synthetic "verified" payload.
donationRoutes.get("/verify-receipt", rateLimit, async (c) => {
  const ref = (c.req.query("ref") || "").trim();
  const inv = (c.req.query("inv") || "").trim();
  const partner = (c.req.query("partner") || "").trim();
  const statement = (c.req.query("statement") || "").trim();

  if (!ref && !inv && !partner && !statement) {
    return c.json({ error: "Reference, invoice number, or partner ID is required." }, 400);
  }

  const cacheKey = `v:${ref}|${inv}|${partner}|${statement}`;
  const cachedV = verifyCache.get(cacheKey);
  if (cachedV && Date.now() - cachedV.time < VERIFY_TTL_MS) {
    publicCache(c, 120, 120);
    return c.json(cachedV.body, cachedV.status as 200 | 404);
  }
  // Cache genuine results (hits and not-founds). Transient registry errors
  // bypass the cache so recovery is immediate.
  const respond = (body: unknown, status?: 200 | 404) => {
    if (verifyCache.size > 1000) verifyCache.clear();
    verifyCache.set(cacheKey, { time: Date.now(), status: status ?? 200, body });
    publicCache(c, 120, 120);
    return c.json(body, status);
  };
  const notVerified = (message: string) => respond({ verified: false, message });
  const registryDown = () => c.json({ verified: false, message: "Verification registry is temporarily unavailable. Please try again later." });

  let supabase = null;
  try {
    supabase = getSupabase(c.env as Record<string, string>);
  } catch {
    return registryDown();
  }

  // Exact-match subscription resolution for partner IDs and statements.
  // Partial email matching is deliberately avoided: it would let anyone probe
  // the registry for partner identities.
  const resolveSubscription = async (partnerInput: string) => {
    const rawId = partnerInput.replace(/^HKN-PTN-/i, "").replace(/^HKN-/i, "").replace(/^PTN-/i, "");
    let query = supabase!.from("subscriptions").select("id, subscriber_name, subscriber_email, plan_name, status, created_at, billing_cycle");
    if (/^[0-9a-fA-F-]{36}$/.test(rawId) || /^\d+$/.test(rawId)) {
      query = query.or(`id.eq.${rawId},subscriber_email.eq.${partnerInput.toLowerCase()}`);
    } else {
      query = query.eq("subscriber_email", partnerInput.toLowerCase());
    }
    const { data: subs, error } = await query.limit(1);
    if (error) throw new Error("lookup failed");
    return subs && subs[0];
  };

  // Partner Credential Verification (a statement QR carries both params, so
  // the statement branch below takes precedence)
  if (partner && !statement) {
    try {
      const sub = await resolveSubscription(partner);
      if (sub) {
        return respond({
          verified: true,
          type: "partner",
          partnerId: partner.toUpperCase(),
          name: sub.subscriber_name || "Covenant Partner",
          tier: sub.plan_name || "Kingdom Partner",
          status: sub.status === "active" ? "Active" : sub.status,
          joinedAt: sub.created_at,
          verifiedAt: new Date().toISOString(),
        });
      }
    } catch {
      return registryDown();
    }
    return notVerified("No matching partner credential found in the registry.");
  }

  // Invoice / Receipt Verification
  if (ref || inv) {
    let donation = null;
    try {
      if (ref) {
        const { data } = await supabase
          .from("donations")
          .select("id, amount, currency, donor_name, donor_email, recurring, payment_provider, payment_reference, status, created_at")
          .eq("payment_reference", ref)
          .limit(1);
        if (data && data[0]) donation = data[0];
      }

      if (!donation && inv) {
        const numericMatch = inv.match(/\d+/);
        if (numericMatch) {
          const { data } = await supabase
            .from("donations")
            .select("id, amount, currency, donor_name, donor_email, recurring, payment_provider, payment_reference, status, created_at")
            .eq("id", numericMatch[0])
            .limit(1);
          if (data && data[0]) donation = data[0];
        }
      }
    } catch {
      return registryDown();
    }

    if (donation) {
      return respond({
        verified: true,
        type: "invoice",
        reference: donation.payment_reference || ref,
        invoiceNumber: inv || `KMN-REC-${donation.id}`,
        amount: donation.amount,
        currency: donation.currency || "KES",
        donorName: donation.donor_name || "Kingdom Covenant Giver",
        donorEmail: donation.donor_email ? donation.donor_email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : undefined,
        recurring: donation.recurring,
        provider: donation.payment_provider || "Paystack / M-Pesa",
        status: donation.status || "completed",
        date: donation.created_at,
        verifiedAt: new Date().toISOString(),
      });
    }

    return notVerified("No matching donation record found in the registry. If you were given this document, please contact finance@kingdommissionsnetwork.org.");
  }

  // Annual Statement Verification — requires both the year and the partner
  // credential the statement was issued for (both are embedded in the QR).
  if (statement) {
    if (!/^\d{4}$/.test(statement) || !partner) {
      return notVerified("Statement verification requires a valid year and partner credential.");
    }
    try {
      const sub = await resolveSubscription(partner);
      if (sub) {
        return respond({
          verified: true,
          type: "statement",
          year: statement,
          partnerId: partner.toUpperCase(),
          partnerName: sub.subscriber_name || "Covenant Partner",
          tier: sub.plan_name || "Kingdom Partner",
          status: sub.status === "active" ? "Certified & Audited" : `Certified (${sub.status})`,
          verifiedAt: new Date().toISOString(),
        });
      }
    } catch {
      return registryDown();
    }
    return notVerified("No matching partner record found for this statement.");
  }

  return respond({ verified: false, error: "Invalid verification parameters." }, 404);
});

// QR deep-link verification: /v/<token> opens the holder's public credential
// DIRECTLY — no form, no code entry (best practice for verifiable IDs).
// The 48-hex-char token is unguessable, so this link is safe to print and
// share; sequential partner numbers alone never unlock holder details.
// PII-minimized: name + tier + status only, never email.
donationRoutes.get("/verify-credential/:token", rateLimit, async (c) => {
  const token = (c.req.param("token") || "").trim().toLowerCase();
  if (!isValidVerifyToken(token)) {
    return c.json({ verified: false, error: "This credential link is invalid." }, 404);
  }
  let supabase = null;
  try {
    supabase = getSupabase(c.env as Record<string, string>);
  } catch {
    return c.json({ verified: false, error: "Verification registry is temporarily unavailable." }, 503);
  }
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("subscriber_name, plan_name, status, partner_number, created_at, current_period_end")
      .eq("verify_token", token)
      .maybeSingle();
    if (error || !data) {
      return c.json({ verified: false, error: "Credential not found." }, 404);
    }
    publicCache(c, 60, 300);
    return c.json({
      verified: true,
      type: "credential",
      name: data.subscriber_name || "Covenant Partner",
      tier: data.plan_name || "Kingdom Partner",
      status: data.status === "active" ? "Active" : String(data.status || "Active"),
      partnerNumber: data.partner_number || null,
      joinedAt: data.created_at,
      validThrough: data.current_period_end || null,
      verifiedAt: new Date().toISOString(),
    });
  } catch {
    return c.json({ verified: false, error: "Verification registry is temporarily unavailable." }, 503);
  }
});

