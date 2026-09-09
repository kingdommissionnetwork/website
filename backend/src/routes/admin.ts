import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getSupabase } from "../lib/supabase";
import { requireAdmin } from "../lib/jwt";
import { rateLimit } from "../lib/rateLimiter";
import { sendAdminInviteEmail, sendPastoralBroadcastEmail } from "../lib/email";
import { fulfillPaybillRedemption } from "./subscriptions";

export const adminRoutes = new Hono();
adminRoutes.use("*", rateLimit, requireAdmin);

// Structured audit logging helper.
// Takes supabase directly — using module-level `c` was a ReferenceError.
async function logAuditEvent(
  supabase: ReturnType<typeof getSupabase>,
  actor: string,
  action: string,
  targetType: string,
  targetId: string | number,
  details: Record<string, unknown>
) {
  try {
    await supabase.from("audit_logs").insert({
      actor,
      action,
      target_type: targetType,
      target_id: String(targetId),
      details,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Fallback: log to console if audit_logs table is not yet migrated
    console.log(`[AUDIT] ${new Date().toISOString()} | ${actor} | ${action} | ${targetType}:${targetId}`, details);
  }
}

// 1. EXECUTIVE DASHBOARD & OPERATIONAL STATS
adminRoutes.get("/stats", async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);

  const { count: allPrayers } = await supabase.from("prayers").select("*", { count: "exact", head: true });
  const { count: pendingPrayers } = await supabase.from("prayers").select("*", { count: "exact", head: true }).eq("status", "pending");
  const { count: flaggedPrayers } = await supabase.from("prayers").select("*", { count: "exact", head: true }).eq("status", "flagged");
  const { count: allEvents } = await supabase.from("events").select("*", { count: "exact", head: true });
  const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true });
  const { count: totalSermons } = await supabase.from("sermons").select("*", { count: "exact", head: true });

  // Subscriptions & MRR calculation
  const { data: activeSubs } = await supabase
    .from("subscriptions")
    .select("amount, usd_amount, currency, status, plan_name");
  
  const activeSubscriptionsCount = (activeSubs || []).filter((s: { status?: string }) => s.status === "active").length;
  const mrrKes = (activeSubs || [])
    .filter((s: { status?: string }) => s.status === "active")
    .reduce((sum: number, s: { amount?: number }) => sum + (Number(s.amount) || 0), 0);
  const mrrUsd = Number((mrrKes * 0.00772).toFixed(2));
  const arrKes = mrrKes * 12;
  const arrUsd = Number((arrKes * 0.00772).toFixed(2));

  // Churn = canceled subscriptions as a share of all subscriptions on record.
  // (Matches both "canceled" canonical and legacy "cancelled" spellings.)
  const totalSubs = (activeSubs || []).length;
  const cancelledSubs = (activeSubs || []).filter((s: { status?: string }) => s.status === "canceled" || s.status === "cancelled").length;
  const churnRate = totalSubs > 0 ? `${((cancelledSubs / totalSubs) * 100).toFixed(1)}%` : "0.0%";

  // Failed payment attempts recorded in the donations ledger.
  const { count: failedPayments } = await supabase
    .from("donations")
    .select("*", { count: "exact", head: true })
    .eq("status", "failed");

  // Monthly giving YTD
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data: monthlyDonations } = await supabase
    .from("donations")
    .select("amount")
    .gte("created_at", startOfMonth);
  const monthlyGiving = (monthlyDonations || []).reduce((sum: number, d: { amount: number }) => sum + Number(d.amount), 0);

  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
  const { data: ytdDonations } = await supabase
    .from("donations")
    .select("amount, donor_name")
    .gte("created_at", startOfYear);
  const totalYtd = (ytdDonations || []).reduce((sum: number, d: { amount: number }) => sum + Number(d.amount), 0);
  const donorNames = new Set((ytdDonations || []).map((d: { donor_name?: string }) => d.donor_name || "Anonymous"));

  // Active events = gatherings whose last day has not passed yet.
  // Falls back to the total count when the end_date column is unavailable.
  let activeEvents = allEvents || 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: eventDates } = await supabase.from("events").select("date, end_date");
  if (eventDates) {
    activeEvents = eventDates.filter(
      (e: { date?: string; end_date?: string }) => String(e.end_date || e.date || "") >= todayStr
    ).length;
  }

  // Pending M-Pesa claims & donations
  const { count: pendingClaimsCount } = await supabase
    .from("payment_claims")
    .select("*", { count: "exact", head: true })
    .in("status", ["awaiting_receipt", "amount_mismatch"]);
  const { count: pendingDonationsCount } = await supabase
    .from("donations")
    .select("*", { count: "exact", head: true })
    .eq("payment_provider", "mpesa_paybill")
    .eq("status", "pending_verification");
  const pendingMpesaCount = (pendingClaimsCount || 0) + (pendingDonationsCount || 0);

  return c.json({
    totalUsers: totalUsers || 0,
    activeSubscriptions: activeSubscriptionsCount || 0,
    mrrKes,
    mrrUsd,
    arrKes,
    arrUsd,
    churnRate,
    failedPaymentsCount: failedPayments || 0,
    totalPrayers: allPrayers || 0,
    pendingPrayers: pendingPrayers || 0,
    flaggedPrayers: flaggedPrayers || 0,
    totalSermons: totalSermons || 0,
    monthlyGiving,
    activeEvents,
    totalYtd,
    donorCount: donorNames.size,
    pendingMpesaCount,
  });
});

// 2. ATTENTION CENTER ALERTS
adminRoutes.get("/attention", async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const { count: pendingPrayers } = await supabase.from("prayers").select("*", { count: "exact", head: true }).eq("status", "pending");
  const { count: flaggedPrayers } = await supabase.from("prayers").select("*", { count: "exact", head: true }).eq("status", "flagged");

  // Pending M-Pesa claims & donations
  const { count: pendingClaims } = await supabase
    .from("payment_claims")
    .select("*", { count: "exact", head: true })
    .in("status", ["awaiting_receipt", "amount_mismatch"]);
  const { count: pendingDonations } = await supabase
    .from("donations")
    .select("*", { count: "exact", head: true })
    .eq("payment_provider", "mpesa_paybill")
    .eq("status", "pending_verification");
  const totalPendingMpesa = (pendingClaims || 0) + (pendingDonations || 0);

  const alerts = [];
  if (totalPendingMpesa > 0) {
    alerts.push({
      id: "pending_mpesa",
      type: "warning" as const,
      title: `${totalPendingMpesa} M-Pesa Payment${totalPendingMpesa > 1 ? "s" : ""} Pending Approval`,
      description: "Subscribers and donors submitted Paybill 522522 confirmation codes waiting for manual verification.",
      actionLabel: "Review M-Pesa",
      tab: "mpesa",
    });
  }

  if (pendingPrayers && pendingPrayers > 0) {
    alerts.push({
      id: "pending_prayers",
      type: "warning" as const,
      title: `${pendingPrayers} Prayer Requests Pending Moderation`,
      description: "Review and approve prayer submissions for the 24/7 Global Prayer Wall.",
      actionLabel: "Review Prayers",
      tab: "prayers",
    });
  }

  if (flaggedPrayers && flaggedPrayers > 0) {
    alerts.push({
      id: "flagged_prayers",
      type: "danger" as const,
      title: `${flaggedPrayers} Flagged Content Items`,
      description: "Urgent moderation required on flagged prayer posts.",
      actionLabel: "Moderate",
      tab: "prayers",
    });
  }

  alerts.push({
    id: "system_health",
    type: "success" as const,
    title: totalPendingMpesa > 0 ? "Queues Monitored" : "No Urgent Items",
    description: totalPendingMpesa > 0 ? "Check M-Pesa Approvals tab to review pending transactions." : "All monitored queues are clear. Open the Security tab for live per-service status.",
    actionLabel: "View Health",
    tab: "security",
  });

  return c.json({ alerts });
});

// 3. MEMBERS & PARTNERS LIST WITH SEARCH & FILTERING
adminRoutes.get("/members", async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const search = c.req.query("search")?.toLowerCase();
  const statusFilter = c.req.query("status");
  const roleFilter = c.req.query("role");
  // Bounded page: search/status filters run in memory below, so keep the
  // window generous but capped instead of pulling the whole table.
  const limit = Math.min(Math.max(Number(c.req.query("limit")) || 200, 1), 1000);
  const offset = Math.max(Number(c.req.query("offset")) || 0, 0);

  let q = supabase.from("users").select("id, name, email, role, avatar, created_at").order("name");

  if (roleFilter && roleFilter !== "all") {
    q = q.eq("role", roleFilter);
  }

  const { data: users, error } = await q.range(offset, offset + limit - 1);
  if (error) {
    console.error("[ADMIN] members error:", error.message);
    return c.json({ error: "Failed to load members." }, 500);
  }

  // Fetch subscription tier only for the page's members (not the whole table).
  const pageEmails = (users || [])
    .map((u: { email?: string }) => String(u.email || "").toLowerCase())
    .filter(Boolean);
  const { data: subs } = pageEmails.length
    ? await supabase
        .from("subscriptions")
        .select("subscriber_email, plan_name, status, amount, currency, created_at")
        .in("subscriber_email", pageEmails)
        .order("created_at", { ascending: false })
    : { data: [] as { subscriber_email?: string }[] };
  const subsByEmail = new Map<string, Record<string, unknown>>();
  (subs || []).forEach((s: { subscriber_email?: string }) => {
    if (s.subscriber_email) {
      const emailLower = s.subscriber_email.toLowerCase();
      // Keep newest subscription for this email
      if (!subsByEmail.has(emailLower)) {
        subsByEmail.set(emailLower, s);
      }
    }
  });

  let enriched = (users || []).map((u: Record<string, unknown>) => {
    const userEmail = String(u.email || "").toLowerCase();
    const userSub = subsByEmail.get(userEmail);
    return {
      id: u.id,
      name: u.name || "Member",
      email: u.email,
      role: u.role || "member",
      planName: userSub?.plan_name || (u.role === "admin" || u.role === "superadmin" ? "Leadership Council" : "Registered Member"),
      subscriptionStatus: userSub?.status || "active",
      amount: userSub?.amount || 0,
      currency: userSub?.currency || "KES",
      joinedAt: u.created_at ? new Date(String(u.created_at)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent",
    };
  });

  if (search) {
    enriched = enriched.filter((m) =>
      String(m.name || "").toLowerCase().includes(search) ||
      String(m.email || "").toLowerCase().includes(search) ||
      String(m.planName || "").toLowerCase().includes(search)
    );
  }

  if (statusFilter && statusFilter !== "all") {
    enriched = enriched.filter((m) => m.subscriptionStatus === statusFilter);
  }

  return c.json(enriched);
});

// 4. MEMBER ADMINISTRATIVE ACTION CONTROLLER
const ADMIN_ROLE_ENUM = z.enum(["member", "admin", "superadmin", "super_admin", "system_admin", "finance_admin", "content_admin", "support_admin", "marketing_admin", "analyst"]);

function getActorEmail(c: { get: unknown }): string {
  try {
    const getter = c.get as unknown as (key: string) => { email?: string; userId?: string } | undefined;
    return getter("user")?.email || "admin";
  } catch {
    return "admin";
  }
}

adminRoutes.post(
  "/members/:id/action",
  zValidator(
    "json",
    z.object({
      action: z.enum(["change_plan", "suspend", "reactivate", "change_role", "send_notification"]),
      planName: z.string().max(100).optional(),
      role: ADMIN_ROLE_ENUM.optional(),
      message: z.string().max(500).optional(),
    })
  ),
  async (c) => {
    const supabase = getSupabase(c.env as Record<string, string>);
    const memberId = c.req.param("id");
    const { action, planName, role } = c.req.valid("json");
    const actor = getActorEmail(c);

    // Verify target user exists
    const { data: targetUser, error: userErr } = await supabase
      .from("users")
      .select("id, name, email, role")
      .eq("id", memberId)
      .single();

    if (userErr || !targetUser) {
      return c.json({ error: "Target member not found." }, 404);
    }

    const targetEmail = String(targetUser.email || "").toLowerCase();

    // 1. CHANGE ROLE
    if (action === "change_role" && role) {
      const self = (c.get as unknown as (key: string) => { userId?: string } | undefined)("user");
      if (self?.userId && String(self.userId) === String(memberId)) {
        return c.json({ error: "Security restriction: You cannot modify your own administrative role." }, 403);
      }
      const { error: roleUpdErr } = await supabase.from("users").update({ role }).eq("id", memberId);
      if (roleUpdErr) {
        console.error("[MEMBER ACTION] Failed to update role:", roleUpdErr.message);
        return c.json({ error: "Failed to update role: " + roleUpdErr.message }, 500);
      }
      await logAuditEvent(supabase, actor, "USER_ROLE_UPDATED", "user", memberId, { role, previousRole: targetUser.role });
      return c.json({ success: true, message: `Member role updated to ${role.toUpperCase()}` });
    }

    // 2. CHANGE PLAN / TIER
    if (action === "change_plan" && planName) {
      const { data: existingSubs } = await supabase
        .from("subscriptions")
        .select("id")
        .ilike("subscriber_email", targetEmail)
        .order("created_at", { ascending: false });

      if (existingSubs && existingSubs.length > 0) {
        const { error: planUpdErr } = await supabase
          .from("subscriptions")
          .update({
            plan_name: planName,
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .ilike("subscriber_email", targetEmail);

        if (planUpdErr) {
          console.error("[MEMBER ACTION] Failed to update plan:", planUpdErr.message);
          return c.json({ error: "Failed to update plan: " + planUpdErr.message }, 500);
        }
      } else {
        const amount = planName === "Kingdom Ambassador" ? 3000 : planName === "Global Harvest Partner" ? 7500 : planName === "Seed Partner" ? 1000 : 20000;
        const { error: planInsErr } = await supabase
          .from("subscriptions")
          .insert({
            subscriber_name: targetUser.name || "Member",
            subscriber_email: targetEmail,
            plan_name: planName,
            status: "active",
            amount,
            currency: "KES",
            interval: "monthly",
            payment_provider: "admin_override",
            payment_reference: `ADMIN-PLAN-${Date.now()}`,
            metadata: { promoted_by: actor, promoted_at: new Date().toISOString() },
          });

        if (planInsErr) {
          console.error("[MEMBER ACTION] Failed to insert plan:", planInsErr.message);
          return c.json({ error: "Failed to create subscription record: " + planInsErr.message }, 500);
        }
      }

      await logAuditEvent(supabase, actor, "SUBSCRIPTION_PLAN_CHANGED", "user", memberId, { newPlan: planName });
      return c.json({ success: true, message: `Partnership tier updated to ${planName}` });
    }

    // 3. SUSPEND ACCOUNT
    if (action === "suspend") {
      const { data: existingSubs } = await supabase
        .from("subscriptions")
        .select("id")
        .ilike("subscriber_email", targetEmail)
        .order("created_at", { ascending: false });

      if (existingSubs && existingSubs.length > 0) {
        const { error: suspUpdErr } = await supabase
          .from("subscriptions")
          .update({
            status: "suspended",
            updated_at: new Date().toISOString(),
          })
          .ilike("subscriber_email", targetEmail);

        if (suspUpdErr) {
          console.error("[MEMBER ACTION] Failed to suspend subscription:", suspUpdErr.message);
          return c.json({ error: "Failed to suspend account: " + suspUpdErr.message }, 500);
        }
      } else {
        const fallbackPlan = targetUser.role === "admin" || targetUser.role === "superadmin"
          ? "Leadership Council"
          : "Registered Member";
        const { error: suspInsErr } = await supabase
          .from("subscriptions")
          .insert({
            subscriber_name: targetUser.name || "Member",
            subscriber_email: targetEmail,
            plan_name: fallbackPlan,
            status: "suspended",
            amount: 0,
            currency: "KES",
            interval: "monthly",
            payment_provider: "admin_override",
            payment_reference: `ADMIN-SUSPEND-${Date.now()}`,
            metadata: { suspended_by: actor, suspended_at: new Date().toISOString() },
          });

        if (suspInsErr) {
          console.error("[MEMBER ACTION] Failed to insert suspended sub:", suspInsErr.message);
          return c.json({ error: "Failed to suspend account: " + suspInsErr.message }, 500);
        }
      }

      await logAuditEvent(supabase, actor, "MEMBER_SUSPENDED", "user", memberId, {});
      return c.json({ success: true, message: `Account for ${targetUser.name || targetEmail} set to SUSPENDED` });
    }

    // 4. REACTIVATE ACCOUNT
    if (action === "reactivate") {
      const { data: existingSubs } = await supabase
        .from("subscriptions")
        .select("id")
        .ilike("subscriber_email", targetEmail)
        .order("created_at", { ascending: false });

      if (existingSubs && existingSubs.length > 0) {
        const { error: reactUpdErr } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .ilike("subscriber_email", targetEmail);

        if (reactUpdErr) {
          console.error("[MEMBER ACTION] Failed to reactivate subscription:", reactUpdErr.message);
          return c.json({ error: "Failed to reactivate account: " + reactUpdErr.message }, 500);
        }
      } else {
        const fallbackPlan = targetUser.role === "admin" || targetUser.role === "superadmin"
          ? "Leadership Council"
          : "Registered Member";
        const { error: reactInsErr } = await supabase
          .from("subscriptions")
          .insert({
            subscriber_name: targetUser.name || "Member",
            subscriber_email: targetEmail,
            plan_name: fallbackPlan,
            status: "active",
            amount: 0,
            currency: "KES",
            interval: "monthly",
            payment_provider: "admin_override",
            payment_reference: `ADMIN-REACTIVATE-${Date.now()}`,
            metadata: { reactivated_by: actor, reactivated_at: new Date().toISOString() },
          });

        if (reactInsErr) {
          console.error("[MEMBER ACTION] Failed to insert active sub:", reactInsErr.message);
          return c.json({ error: "Failed to reactivate account: " + reactInsErr.message }, 500);
        }
      }

      await logAuditEvent(supabase, actor, "MEMBER_REACTIVATED", "user", memberId, {});
      return c.json({ success: true, message: `Account for ${targetUser.name || targetEmail} reactivated successfully` });
    }

    return c.json({ success: true, message: "Action processed" });
  }
);

// 5. UNIFIED SUBSCRIPTIONS LIST
adminRoutes.get("/subscriptions", async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  
  if (error || !data) return c.json([]);
  return c.json(data);
});

// 6. TRANSACTIONS & DONATIONS LEDGER
adminRoutes.get("/donations", async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const { data, error } = await supabase
    .from("donations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  
  if (error || !data) return c.json([]);
  return c.json(
    data.map((d: Record<string, unknown>) => ({
      id: d.id,
      name: d.donor_name || "Anonymous",
      email: d.donor_email || "",
      amount: d.amount,
      currency: d.currency || "KES",
      provider: d.payment_provider || "paystack",
      reference: d.payment_reference || "",
      status: d.status || "completed",
      date: d.created_at
        ? new Date(d.created_at as string).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "",
      recurring: d.recurring || false,
    }))
  );
});

// 7. PRAYER MODERATION
adminRoutes.get("/prayers", async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const statusFilter = c.req.query("status");
  let q = supabase.from("prayers").select("*");
  if (statusFilter && statusFilter !== "all") {
    q = q.eq("status", statusFilter);
  }
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) {
    console.error("[ADMIN] prayers error:", error.message);
    return c.json({ error: "Failed to load prayers." }, 500);
  }
  return c.json(data);
});

const prayerStatusSchema = z.object({
  status: z.enum(["pending", "approved", "flagged"]),
});

adminRoutes.patch("/prayers/:id/status", zValidator("json", prayerStatusSchema), async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const id = Number(c.req.param("id"));
  const { status } = c.req.valid("json");
  const { data: prayer, error } = await supabase.from("prayers").update({ status }).eq("id", id).select().single();
  if (error) return c.json({ error: "Failed to update prayer." }, 500);
  await logAuditEvent(supabase, getActorEmail(c), "PRAYER_STATUS_UPDATED", "prayer", id, { status });
  return c.json(prayer);
});

adminRoutes.delete("/prayers/:id", async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const id = Number(c.req.param("id"));
  const { error } = await supabase.from("prayers").delete().eq("id", id);
  if (error) return c.json({ error: "Failed to delete prayer." }, 500);
  await logAuditEvent(supabase, getActorEmail(c), "PRAYER_DELETED", "prayer", id, {});
  return c.json({ success: true });
});

// 8. AUDIT LOGS RETRIEVAL
adminRoutes.get("/audit-logs", async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  
  if (error || !data) {
    // No mock entries: an empty trail is the honest state until real
    // admin actions are logged.
    return c.json([]);
  }
  return c.json(data);
});

// 9. PENDING M-PESA VERIFICATION QUEUE
adminRoutes.get("/mpesa/pending", async (c) => {
  const supabase = getSupabase(c.env as Record<string, string>);

  // Fetch pending subscription claims from payment_claims table
  const { data: claims, error: claimsError } = await supabase
    .from("payment_claims")
    .select("*")
    .in("status", ["awaiting_receipt", "amount_mismatch"])
    .order("created_at", { ascending: false });

  // Fetch pending one-off donations via Paybill (not yet verified)
  const { data: pendingDonations, error: donationsError } = await supabase
    .from("donations")
    .select("*")
    .eq("payment_provider", "mpesa_paybill")
    .eq("status", "pending_verification")
    .order("created_at", { ascending: false });

  if (claimsError) console.error("[ADMIN] mpesa/pending claims error:", claimsError.message);
  if (donationsError) console.error("[ADMIN] mpesa/pending donations error:", donationsError.message);

  const normalizedClaims = (claims || []).map((c: Record<string, unknown>) => ({
    id: c.id,
    type: "subscription_claim" as const,
    name: c.name || c.subscriber_name || "Unknown",
    email: c.email || c.subscriber_email || "",
    amount: c.amount || 0,
    currency: c.currency || "KES",
    reference: c.payment_reference || c.mpesa_reference || c.reference || "",
    plan: c.plan_name || "",
    status: c.status,
    submittedAt: c.created_at,
    notes: (c.note as string) || (c.notes as string) || "",
    mpesaMessage: (c.mpesa_message as string) || "",
    phone: (c.phone as string) || "",
  }));

  const normalizedDonations = (pendingDonations || []).map((d: Record<string, unknown>) => ({
    id: d.id,
    type: "donation" as const,
    name: d.donor_name || "Anonymous",
    email: d.donor_email || "",
    amount: d.amount || 0,
    currency: d.currency || "KES",
    reference: d.payment_reference || "",
    plan: "One-Time Donation",
    status: d.status,
    submittedAt: d.created_at,
    notes: d.notes || "",
  }));

  return c.json([...normalizedClaims, ...normalizedDonations]);
});

// 9b. RESOLVE A PENDING M-PESA CLAIM (APPROVE / REJECT)
adminRoutes.post(
  "/mpesa/claims/:id/resolve",
  zValidator(
    "json",
    z.object({
      action: z.enum(["approve", "reject"]),
      type: z.enum(["subscription_claim", "donation"]).optional().default("subscription_claim"),
      notes: z.string().nullable().optional(),
      // For approvals — pass the M-Pesa receipt if admin is manually verifying
      mpesa_receipt: z.string().nullable().optional(),
    }),
    (result, c) => {
      if (!result.success) {
        const firstIssue = result.error.issues?.[0];
        const errorMsg = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Invalid claim resolution payload";
        return c.json({ error: errorMsg, details: result.error.issues }, 400);
      }
    }
  ),
  async (c) => {
    const supabase = getSupabase(c.env as Record<string, string>);
    const claimId = c.req.param("id");
    const { action, type, notes, mpesa_receipt } = c.req.valid("json");
    const actor = getActorEmail(c);
    const resolvedNotes = (notes || "").trim() || undefined;
    const resolvedReceipt = (mpesa_receipt || "").trim() || undefined;

    if (action === "reject") {
      if (type === "subscription_claim") {
        const { error: rejErr } = await supabase.from("payment_claims").update({ status: "rejected", note: resolvedNotes || "Rejected by admin" }).eq("id", claimId);
        if (rejErr) return c.json({ error: "Failed to reject claim: " + rejErr.message }, 500);
      } else {
        // donations table has no notes column — only update status
        const { error: rejErr } = await supabase.from("donations").update({ status: "rejected" }).eq("id", claimId);
        if (rejErr) return c.json({ error: "Failed to reject donation: " + rejErr.message }, 500);
      }
      await logAuditEvent(supabase, actor, "MPESA_CLAIM_REJECTED", type, claimId, { notes: resolvedNotes });
      return c.json({ success: true, message: "Claim rejected successfully." });
    }

    // APPROVE — use the unified fulfillPaybillRedemption function
    try {
      if (type === "subscription_claim") {
        // Fetch claim details to pass into fulfillPaybillRedemption
        const { data: claim, error: claimError } = await supabase
          .from("payment_claims")
          .select("*")
          .eq("id", claimId)
          .single();

        if (claimError || !claim) {
          return c.json({ error: "Claim not found" }, 404);
        }

        const receipt = resolvedReceipt || claim.payment_reference || claim.mpesa_reference || `ADMIN-APPROVED-${Date.now()}`;
        const result = await fulfillPaybillRedemption(c, receipt, {
          name: claim.subscriber_name || claim.name || "Partner",
          email: claim.subscriber_email || claim.email,
          amount: Number(claim.amount),
          planName: claim.plan_name || "Kingdom Partner",
          planId: claim.plan_id || "harvest",
          interval: (claim.interval === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly",
          phone: claim.phone || undefined,
          kind: claim.kind || "subscription",
        });

        if (result.subData) {
          await supabase.from("payment_claims").update({ status: "approved", note: resolvedNotes || "Admin-approved" }).eq("id", claimId);
        }

        await logAuditEvent(supabase, actor, "MPESA_CLAIM_APPROVED", type, claimId, { receipt, notes: resolvedNotes });
        return c.json({ success: true, message: "Subscription claim approved and activated.", result });
      } else {
        // Donation — mark as completed. donations table has no notes column.
        const { error: donErr } = await supabase.from("donations").update({ status: "completed" }).eq("id", claimId);
        if (donErr) throw new Error("Failed to update donation status: " + donErr.message);
        await logAuditEvent(supabase, actor, "MPESA_DONATION_APPROVED", type, claimId, { notes: resolvedNotes });
        return c.json({ success: true, message: "Donation verified and marked as completed." });
      }
    } catch (err) {
      console.error("[ADMIN] mpesa claim resolve error:", err);
      return c.json({ error: "Failed to process claim. Check logs.", detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
);

// 10. SYSTEM HEALTH STATUS — live checks only, no canned latencies.
adminRoutes.get("/health", async (c) => {
  const started = Date.now();
  const supabase = getSupabase(c.env as Record<string, string>);
  const env = (c.env || {}) as Record<string, string>;
  const configured = (key: string) => Boolean(env[key]);

  // Real database round-trip; its latency is measured, not invented.
  const dbStart = Date.now();
  const { error: dbError } = await supabase.from("users").select("id").limit(1);
  const dbLatency = Date.now() - dbStart;

  const services = [
    { name: "API Gateway (Cloudflare / Hono)", status: "operational", latency: `${Date.now() - started}ms` },
    {
      name: "Supabase Postgres Database",
      status: dbError ? "down" : "operational",
      latency: `${dbLatency}ms`,
    },
    {
      name: "Paystack Payment Engine",
      status: configured("PAYSTACK_SECRET_KEY") ? "operational" : "not configured",
      latency: "—",
    },
    {
      name: "PayPal International Gateway",
      status: configured("PAYPAL_CLIENT_ID") && configured("PAYPAL_CLIENT_SECRET") ? "operational" : "not configured",
      latency: "—",
    },
    {
      name: "Wise Financial Exchange Rate API",
      status: configured("WISE_API_TOKEN") ? "operational" : "not configured",
      latency: "—",
    },
    {
      name: "Email & Notification Dispatcher",
      status: configured("RESEND_API_KEY") ? "operational" : "not configured",
      latency: "—",
    },
  ];

  return c.json({
    status: dbError ? "degraded" : "healthy",
    services,
    lastChecked: new Date().toISOString(),
  });
});

// 10. ADMINISTRATOR INVITATION & PROVISIONING (INVITATION-ONLY)
adminRoutes.post(
  "/invite",
  zValidator(
    "json",
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      role: z.enum([
        "admin",
        "superadmin",
        "super_admin",
        "system_admin",
        "finance_admin",
        "content_admin",
        "support_admin",
        "marketing_admin",
        "analyst",
      ]),
    })
  ),
  async (c) => {
    const supabase = getSupabase(c.env as Record<string, string>);
    const { name, email, role } = c.req.valid("json");
    const actor = getActorEmail(c);
    // Cryptographically secure invite token. NOTE: there is currently no
    // accept-invite verification table — the link below is informational until
    // an invites table with hash + expiry + single-use is added. Provisioning
    // itself happens here, directly, by an already-authenticated admin.
    const rand = new Uint8Array(24);
    crypto.getRandomValues(rand);
    const inviteToken = `inv_${Array.from(rand).map((b) => b.toString(36)).join("").replace(/[^a-z0-9]/gi, "").slice(0, 24)}${Date.now().toString(36)}`;

    // Create or update user as invited administrator
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single();

    if (existingUser) {
      await supabase.from("users").update({ role }).eq("id", existingUser.id);
    } else {
      await supabase.from("users").insert({
        id: crypto.randomUUID(),
        name,
        email,
        role,
        created_at: new Date().toISOString(),
      });
    }

    // Never store the raw token in audit logs — it is a bearer credential.
    await logAuditEvent(supabase, actor, "ADMIN_INVITED", "admin_user", email, { role });

    try {
      await sendAdminInviteEmail(c, email, name, role, `https://admin.kingdommissionsnetwork.org/admin/accept-invite?token=${inviteToken}`, actor);
    } catch (err) {
      console.error("[EMAIL] Failed to dispatch admin invitation email:", err);
    }

    return c.json({
      success: true,
      message: `Administrator invitation generated and dispatched for ${name} (${role})`,
      inviteLink: `https://admin.kingdommissionsnetwork.org/admin/accept-invite?token=${inviteToken}`,
    });
  }
);

// 12. PASTORAL BROADCAST — fan-out email to all partners (or a segment)
adminRoutes.post(
  "/broadcast",
  zValidator(
    "json",
    z.object({
      subject: z.string().min(1).max(200),
      body: z.string().min(1).max(10000),
      audience: z.enum(["all_partners", "active_subscribers", "monthly_partners", "annual_partners"]).default("all_partners"),
    })
  ),
  async (c) => {
    const supabase = getSupabase(c.env as Record<string, string>);
    const { subject, body, audience } = c.req.valid("json");
    const actor = getActorEmail(c);

    // Build recipient query based on audience segment
    let q = supabase.from("subscriptions").select("subscriber_email, subscriber_name, interval").eq("status", "active");
    if (audience === "monthly_partners") q = q.eq("interval", "monthly");
    if (audience === "annual_partners") q = q.eq("interval", "yearly");

    const { data: subs, error } = await q;
    if (error) {
      console.error("[BROADCAST] Failed to fetch recipients:", error.message);
      return c.json({ error: "Failed to fetch subscriber list: " + error.message }, 500);
    }

    const recipients = (subs || []).filter((s: Record<string, unknown>) => s.subscriber_email);
    if (recipients.length === 0) {
      return c.json({ success: true, sent: 0, message: "No active partners found for the selected audience." });
    }

    // De-duplicate by email
    const seen = new Set<string>();
    const unique = recipients.filter((s: Record<string, unknown>) => {
      const email = String(s.subscriber_email).toLowerCase();
      if (seen.has(email)) return false;
      seen.add(email);
      return true;
    });

    // Fan-out — send in batches of 10 to avoid overwhelming Resend rate limits
    let sent = 0;
    let failed = 0;
    const BATCH = 10;
    for (let i = 0; i < unique.length; i += BATCH) {
      const batch = unique.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.map(async (s: Record<string, unknown>) => {
          try {
            await sendPastoralBroadcastEmail(
              c,
              String(s.subscriber_email),
              String(s.subscriber_name || "Kingdom Partner"),
              subject,
              body,
              audience
            );
            sent++;
          } catch (e) {
            failed++;
            console.error("[BROADCAST] Failed to send to", s.subscriber_email, e);
          }
        })
      );
    }

    await logAuditEvent(supabase, actor, "PASTORAL_BROADCAST_SENT", "broadcast", audience, {
      subject,
      audience,
      sent,
      failed,
      total: unique.length,
    });

    return c.json({
      success: true,
      sent,
      failed,
      total: unique.length,
      message: `Broadcast sent to ${sent} of ${unique.length} partners${failed > 0 ? ` (${failed} failed)` : ""}.`,
    });
  }
);
