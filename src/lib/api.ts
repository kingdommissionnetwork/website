import { type PrayerRequest, type Sermon, type Event, type BibleBook, type BibleVerse } from "../data/demoData";
import { normalizeEvent } from "./events";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ── Quota guard: SWR cache + in-flight dedupe ─────────────────────────────
// Every GET here costs a Cloudflare Worker invocation (100k/day free) plus a
// Supabase round-trip (5GB egress free). Repeat visits must not refetch.
// GET-only: POST/PUT/PATCH/DELETE always hit the network.
const swrCache = new Map<string, { time: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
const DEFAULT_TTL_MS = 2 * 60 * 1000;

function swrGet<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const hit = swrCache.get(key);
  if (hit && Date.now() - hit.time < ttlMs) return Promise.resolve(hit.data as T);
  const ongoing = inflight.get(key);
  if (ongoing) return ongoing as Promise<T>;
  const p = fetcher()
    .then((data) => {
      // Cap entries so long-lived tabs can't grow memory unbounded.
      if (swrCache.size > 300) swrCache.clear();
      swrCache.set(key, { time: Date.now(), data });
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, p);
  return p;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = API_BASE ? `${API_BASE}/api${path}` : `/api${path}`;
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    let errorMsg = res.statusText;
    if (typeof body.error === "string") {
      errorMsg = body.error;
    } else if (typeof body.message === "string") {
      errorMsg = body.message;
    } else if (body.error && typeof body.error === "object") {
      if (Array.isArray(body.error.issues)) {
        errorMsg = body.error.issues.map((i: { message?: string; path?: (string | number)[] }) => i.message || String(i)).join(", ");
      } else {
        errorMsg = JSON.stringify(body.error);
      }
    }
    throw new ApiError(res.status, errorMsg);
  }
  return res.json();
}

function getToken(): string | null {
  // Cookie-only auth: JWT lives in an httpOnly SameSite=Lax cookie set by the
  // backend. Nothing is stored in localStorage (XSS-safe). Kept for compat.
  try {
    localStorage.removeItem("hkn-token");
  } catch {
    // storage unavailable — ignore
  }
  return null;
}

function authHeaders(): Record<string, string> {
  // Auth relies on the httpOnly cookie (fetch uses credentials:include).
  // No Authorization header is sent to avoid token theft via XSS.
  return {};
}

export type UserRole = "member" | "admin" | "superadmin";

export interface AuthUser {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

/** Fail-closed user normalizer: unknown roles collapse to "member" (no admin access). */
export function normalizeAuthUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = r.id;
  const name = r.name;
  const email = r.email;
  if ((typeof id !== "number" && typeof id !== "string") || typeof name !== "string" || typeof email !== "string") {
    return null;
  }
  const role: UserRole = r.role === "admin" || r.role === "superadmin" ? r.role : "member";
  const avatar = typeof r.avatar === "string" ? r.avatar : undefined;
  return { id, name, email, role, avatar };
}

export const api = {
  getToken,
  setToken() {
    // Token is now set via httpOnly cookie by the backend
  },
  clearToken() {
    try {
      localStorage.removeItem("hkn-token");
    } catch {
      // ignore
    }
    request("/auth/logout", { method: "POST" }).catch(() => {});
  },

  auth: {
    forgotPassword: async (email: string) => {
      return request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
    },
    resetPassword: async (password: string, token: string) => {
      return request("/auth/reset-password", { method: "POST", body: JSON.stringify({ password, token }) });
    },
    login: async (email: string, password: string) => {
      return request<{ user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    register: async (name: string, email: string, password: string) => {
      return request<{ user: AuthUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
    },
    google: async (token: string) => {
      return request<{ user: AuthUser }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
    },
    me: async () => {
      return request<AuthUser>("/auth/me");
    },
  },

  prayers: {
    list: async (category?: string, limit?: number): Promise<PrayerRequest[]> => {
      const params = new URLSearchParams();
      if (category && category !== "All Prayers") params.set("category", category);
      if (limit) params.set("limit", String(limit));
      const qs = params.toString();
      const key = `prayers:list:${qs || "all"}`;
      const data = await swrGet(key, DEFAULT_TTL_MS, () =>
        request<(PrayerRequest & { created_at?: string })[]>(`/prayers${qs ? `?${qs}` : ""}`)
      );
      return data.map((p) => ({ ...p, timestamp: p.created_at || "recent" }));
    },
    submit: async (prayer: { name?: string; category: string; text: string }): Promise<PrayerRequest> => {
      const data = await request<PrayerRequest & { created_at?: string }>("/prayers", {
        method: "POST",
        body: JSON.stringify(prayer),
      });
      return { ...data, timestamp: data.created_at || "Just now" };
    },
    pray: async (id: string): Promise<void> => {
      await request(`/prayers/${id}/pray`, { method: "POST" });
    },
    getCategories: async (): Promise<string[]> => {
      return swrGet("prayers:categories", 60 * 60 * 1000, () => request<string[]>("/prayers/categories"));
    },
  },

  sermons: {
    list: async (category?: string, query?: string, limit?: number): Promise<Sermon[]> => {
      const params = new URLSearchParams();
      if (category && category !== "All") params.set("category", category);
      if (query) params.set("q", query);
      if (limit) params.set("limit", String(limit));
      const qs = params.toString();
      // Search queries are user-specific; cache briefly. Plain lists cache longer.
      const ttl = query ? 60 * 1000 : DEFAULT_TTL_MS;
      return swrGet(`sermons:list:${qs || "all"}`, ttl, () =>
        request<Sermon[]>(`/sermons${qs ? `?${qs}` : ""}`)
      );
    },
    getCategories: async (): Promise<string[]> => {
      return swrGet("sermons:categories", 60 * 60 * 1000, () => request<string[]>("/sermons/categories"));
    },
    create: async (data: Partial<Sermon>): Promise<Sermon> => {
      return request<Sermon>("/sermons", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<Sermon>): Promise<Sermon> => {
      return request<Sermon>(`/sermons/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string): Promise<void> => {
      await request(`/sermons/${id}`, { method: "DELETE", headers: authHeaders() });
    },
  },

  events: {
    list: async (limit?: number): Promise<Event[]> => {
      const qs = limit ? `?limit=${limit}` : "";
      try {
        const res = await swrGet(`events:list:${qs || "all"}`, DEFAULT_TTL_MS, () =>
          request<Record<string, unknown>[]>(`/events${qs}`)
        );
        return Array.isArray(res) ? res.map(normalizeEvent) : [];
      } catch {
        return [];
      }
    },
    create: async (eventData: {
      title: string; date: string; time: string; location: string;
      description: string; isOnline?: boolean; month?: string;
      day?: string; timezone?: string; image?: string;
    }) => {
      return request("/events", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(eventData),
      });
    },
    update: async (id: string, data: Partial<Event>): Promise<Event> => {
      return request<Event>(`/events/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return request(`/events/${id}`, { method: "DELETE", headers: authHeaders() });
    },
    rsvp: async (eventId: number, name: string, email: string) => {
      return request(`/events/${eventId}/rsvp`, {
        method: "POST",
        body: JSON.stringify({ name, email }),
      });
    },
  },

  bible: {
    dailyVerse: async (translation = "kjv"): Promise<{ text: string; reference: string; translation: string }> => {
      return swrGet(`bible:daily:${translation}`, 60 * 60 * 1000, () =>
        request(`/bible/daily?translation=${translation}`)
      );
    },
    books: async () => {
      return swrGet("bible:books", 60 * 60 * 1000, () =>
        request<{ books: BibleBook[]; translations: string[]; translationNames: Record<string, string> }>("/bible/books")
      );
    },
    verses: async (book: string, chapter: number, translation = "kjv") => {
      return swrGet(`bible:verses:${translation}:${book}:${chapter}`, 30 * 60 * 1000, () =>
        request<{ verses: BibleVerse[]; book: string; chapter: number; translation: string; translationName: string }>(
          `/bible/verses/${encodeURIComponent(book)}/${chapter}?translation=${translation}`
        )
      );
    },
    search: async (query: string, translation = "kjv") => {
      return swrGet(`bible:search:${translation}:${query.toLowerCase().slice(0, 80)}`, 5 * 60 * 1000, () =>
        request<{ results: { book: string; chapter: number; verse: number; text: string }[]; query: string; translation: string }>(
          `/bible/search?q=${encodeURIComponent(query)}&translation=${translation}`
        )
      );
    },
  },

  streams: {
    upcoming: async (): Promise<{ id: string; title: string; host: string; time: string }[]> => {
      return swrGet("streams:upcoming", DEFAULT_TTL_MS, () => request("/streams/upcoming"));
    },
  },

  donations: {
    create: async (data: { amount: number; recurring?: boolean; donor_name?: string; donor_email?: string }) => {
      return request("/donations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    history: async (email: string): Promise<{ amount: number; donor_name: string; donor_email: string; recurring: boolean; created_at: string }[]> => {
      return await request(`/donations/history?email=${encodeURIComponent(email)}`, { headers: authHeaders() });
    },
  },

  payments: {
    initialize: async (data: { email: string; amount: number; currency?: string; metadata?: Record<string, unknown> }) => {
      return request("/payments/initialize", { method: "POST", body: JSON.stringify(data) });
    },
    verify: async (reference: string) => {
      return request(`/payments/verify/${reference}`);
    },
    paypalCreate: async (data: { amount: number; currency?: string }) => {
      return request("/payments/paypal/create", { method: "POST", body: JSON.stringify(data) });
    },
    paypalCapture: async (data: { orderId: string }) => {
      return request("/payments/paypal/capture", { method: "POST", body: JSON.stringify(data) });
    },
    getRate: async (from = "KES", to = "USD") => {
      return swrGet(`payments:rate:${from}:${to}`, 60 * 60 * 1000, () =>
        request<{ rate: number; source: string; target: string; provider: string }>(`/payments/rate?from=${from}&to=${to}`)
      );
    },
    reportOffline: async (data: {
      amount: number;
      currency?: string;
      donor_name: string;
      donor_email: string;
      payment_provider: "mpesa_paybill" | "bank_transfer";
      payment_reference: string;
      recurring?: boolean;
      notes?: string;
    }) => {
      return request<{ status: string; claimStatus?: string; message?: string; donation?: Record<string, unknown> }>("/payments/report-offline", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  subscriptions: {
    getPricing: async (amount: number = 1000) => {
      return swrGet(`subscriptions:pricing:${amount}`, 60 * 60 * 1000, () =>
        request<{
          planName: string;
          kesAmount: number;
          usdAmount: number;
          exchangeRate: number;
          interval: string;
          provider: string;
          description: string;
        }>(`/subscriptions/pricing?amount=${amount}`)
      );
    },
    initialize: async (data: { email: string; name?: string; interval?: "monthly" | "yearly"; currency?: "KES" | "USD"; planId?: string; planName?: string; amount?: number }) => {
      return request<{
        authorization_url?: string;
        reference?: string;
        access_code?: string;
        usdAmount: number;
        kesAmount: number;
        exchangeRate: number;
      }>("/subscriptions/initialize", { method: "POST", body: JSON.stringify(data) });
    },
    verify: async (reference: string) => {
      return request<{
        status: string;
        amount: number;
        currency: string;
        reference: string;
        claimRequired?: boolean;
        user?: AuthUser | null;
        token?: string | null;
        planName?: string;
      }>(`/subscriptions/verify/${reference}`);
    },
    verifyMpesa: async (data: {
      reference: string;
      name: string;
      email: string;
      amount: number;
      planName?: string;
      planId?: string;
      interval?: "monthly" | "yearly";
      phone?: string;
      mpesaMessage?: string;
    }) => {
      return request<{
        status: string;
        message?: string;
        code?: string;
        claimId?: number | null;
        reference: string;
        planName: string;
        amount: number;
        currency: string;
        partnerNumber?: string | null;
        verifyToken?: string | null;
        claimRequired?: boolean;
        user?: AuthUser | null;
        token?: string | null;
        subscription?: Record<string, unknown>;
      }>("/subscriptions/mpesa/verify", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getClaimStatus: async (reference: string, email?: string) => {
      const qs = email ? `?email=${encodeURIComponent(email)}` : "";
      return request<{
        status: string;
        claim?: Record<string, unknown>;
        subscription?: Record<string, unknown> | null;
      }>(`/subscriptions/mpesa/claim/${encodeURIComponent(reference)}${qs}`);
    },
    initiateMpesaStk: async (data: {
      phoneNumber: string;
      name: string;
      email: string;
      amount: number;
      planName?: string;
      planId?: string;
      interval?: "monthly" | "yearly";
    }) => {
      return request<{
        status: string;
        checkoutRequestId: string;
        merchantRequestId: string;
        customerMessage: string;
      }>("/subscriptions/mpesa/stkpush", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    queryMpesaStk: async (checkoutRequestId: string) => {
      return request<{
        status: "pending" | "completed" | "failed" | "not_found";
        message?: string;
        receiptCode?: string;
        planName?: string;
        amount?: number;
        currency?: string;
        partnerNumber?: string | null;
        verifyToken?: string | null;
        claimRequired?: boolean;
        user?: AuthUser | null;
        token?: string | null;
        subscription?: Record<string, unknown>;
      }>(`/subscriptions/mpesa/query/${checkoutRequestId}`);
    },
    paypalCreate: async (data: { name?: string; email?: string; amount?: number; planName?: string }) => {
      return request<{ id: string; usdAmount: number; kesAmount: number; exchangeRate: number }>("/subscriptions/paypal/create", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    paypalCapture: async (data: { orderId: string; subscriberName?: string; planId?: string; interval?: "monthly" | "yearly" }) => {
      return request<{
        status: string;
        id: string;
        duplicate?: boolean;
        claimRequired?: boolean;
        user?: AuthUser | null;
        token?: string | null;
        planName?: string;
      }>("/subscriptions/paypal/capture", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getStatus: async (email: string) => {
      // Short TTL: membership state changes slowly, and this fires on every
      // dashboard mount. Claim/mutation flows refetch explicitly via request.
      return swrGet(`subscriptions:status:${email.trim().toLowerCase()}`, 60 * 1000, () =>
        request<{
          hasActiveSubscription: boolean;
          subscription?: Record<string, unknown>;
          lifecycle?: { status: string; renewable: boolean; renewLink: string };
        }>(`/subscriptions/status/${encodeURIComponent(email)}`)
      );
    },
    // Progressive-identity account claiming (verify inbox ownership, then mint hub session)
    requestClaim: async (email: string) => {
      return request<{ ok: boolean; message?: string }>("/subscriptions/claim/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    verifyClaim: async (email: string, code: string) => {
      return request<{ status: string; user: AuthUser | null; token: string | null }>("/subscriptions/claim/verify", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
    },
    // Self-serve lifecycle: cancel / pause / resume. Ownership = email + payment reference.
    manageSubscription: async (action: "cancel" | "pause" | "resume", data: { email: string; paymentReference?: string; reason?: string }) => {
      return request<{ status: string; subscription?: Record<string, unknown> }>(`/subscriptions/manage/${action}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    previewPlanChange: async (data: { email: string; paymentReference?: string; newPlanId: string; interval?: "monthly" | "yearly"; apply?: boolean }) => {
      return request<{
        preview: {
          from: { planName: string; amount: number; interval: string };
          to: { planId: string; planName: string; amount: number; interval: string };
          remainingDays: number;
          unusedCredit: number;
          immediateBalance: number;
          effective: string;
          payLink: string;
        };
        subscription?: Record<string, unknown>;
      }>("/subscriptions/manage/change-plan", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  admin: {
    stats: async (): Promise<{
      totalUsers: number;
      activeSubscriptions: number;
      mrrKes: number;
      mrrUsd: number;
      arrKes: number;
      arrUsd: number;
      churnRate: string;
      failedPaymentsCount: number;
      totalPrayers: number;
      pendingPrayers: number;
      flaggedPrayers: number;
      totalSermons: number;
      monthlyGiving: number;
      activeEvents: number;
      totalYtd: number;
      donorCount: number;
      pendingMpesaCount: number;
    }> => {
      return swrGet("admin:stats", 30 * 1000, () => request("/admin/stats", { headers: authHeaders() }));
    },
    pendingMpesa: async (): Promise<{
      id: string | number;
      type: "subscription_claim" | "donation";
      name: string;
      email: string;
      amount: number;
      currency: string;
      reference: string;
      plan: string;
      status: string;
      submittedAt: string;
      notes: string;
      mpesaMessage?: string;
      phone?: string;
    }[]> => {
      return await request("/admin/mpesa/pending", { headers: authHeaders() });
    },
    resolveMpesaClaim: async (
      id: string | number,
      data: {
        action: "approve" | "reject";
        type: "subscription_claim" | "donation";
        notes?: string;
        mpesa_receipt?: string;
      }
    ): Promise<{ success: boolean; message: string }> => {
      return await request(`/admin/mpesa/claims/${id}/resolve`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
    },
    attention: async (): Promise<{
      alerts: { id: string; type: "warning" | "danger" | "success" | "info"; title: string; description: string; actionLabel: string; tab: string }[];
    }> => {
      return await request("/admin/attention", { headers: authHeaders() });
    },
    members: async (params?: { search?: string; status?: string; role?: string }): Promise<{
      id: string | number;
      name: string;
      email: string;
      role: string;
      planName: string;
      subscriptionStatus: string;
      amount: number;
      currency: string;
      joinedAt: string;
    }[]> => {
      const q = new URLSearchParams();
      if (params?.search) q.set("search", params.search);
      if (params?.status) q.set("status", params.status);
      if (params?.role) q.set("role", params.role);
      const qs = q.toString() ? `?${q.toString()}` : "";
      return await request(`/admin/members${qs}`, { headers: authHeaders() });
    },
    memberAction: async (id: string | number, data: { action: string; planName?: string; role?: string; message?: string }): Promise<{ success: boolean; message: string }> => {
      return request(`/admin/members/${id}/action`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
    },
    subscriptions: async (): Promise<Record<string, unknown>[]> => {
      return await request("/admin/subscriptions", { headers: authHeaders() });
    },
    users: async (): Promise<{ id: number; name: string; email: string; role: string; status: string }[]> => {
      return await request("/admin/users", { headers: authHeaders() });
    },
    donations: async (): Promise<{ id?: number; name: string; email?: string; amount: number; currency?: string; provider?: string; reference?: string; status?: string; date: string; recurring: boolean }[]> => {
      return await request("/admin/donations", { headers: authHeaders() });
    },
    prayers: async (status?: string): Promise<Record<string, unknown>[]> => {
      const params = status && status !== "all" ? `?status=${status}` : "";
      return await request(`/admin/prayers${params}`, { headers: authHeaders() });
    },
    updatePrayerStatus: async (id: number, status: string) => {
      return request(`/admin/prayers/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
    },
    deletePrayer: async (id: number) => {
      return request(`/admin/prayers/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
    },
    auditLogs: async (): Promise<{ id: number; actor: string; action: string; target_type: string; target_id: string; details: Record<string, unknown>; created_at: string }[]> => {
      return await request("/admin/audit-logs", { headers: authHeaders() });
    },
    health: async (): Promise<{ status: string; services: { name: string; status: string; latency: string }[]; lastChecked: string }> => {
      return await request("/admin/health", { headers: authHeaders() });
    },
    invite: async (data: { name: string; email: string; role: string }): Promise<{ success: boolean; message: string; inviteLink: string }> => {
      return await request("/admin/invite", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
    },
    broadcast: async (data: { subject: string; body: string; audience: string }): Promise<{ success: boolean; message: string; sent: number; failed: number; total: number }> => {
      return await request("/admin/broadcast", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
    },
  },
  verifyDocument: async (params: { ref?: string; inv?: string; partner?: string; statement?: string }): Promise<{
    verified: boolean;
    type: "invoice" | "partner" | "statement";
    reference?: string;
    invoiceNumber?: string;
    amount?: number;
    currency?: string;
    donorName?: string;
    donorEmail?: string;
    recurring?: boolean;
    provider?: string;
    status?: string;
    date?: string;
    partnerId?: string;
    name?: string;
    tier?: string;
    joinedAt?: string;
    year?: string;
    verifiedAt?: string;
    notice?: string;
    error?: string;
  }> => {
    const q = new URLSearchParams();
    if (params.ref) q.set("ref", params.ref);
    if (params.inv) q.set("inv", params.inv);
    if (params.partner) q.set("partner", params.partner);
    if (params.statement) q.set("statement", params.statement);
    const qs = q.toString();
    return swrGet(`verify:${qs}`, DEFAULT_TTL_MS, () => request(`/donations/verify-receipt?${qs}`));
  },
  /** QR deep-link credential: opens holder details directly, no form. Public
   *  data only (name/tier/status) behind the unguessable token. */
  verifyCredential: async (token: string): Promise<{
    verified: boolean;
    type?: string;
    name?: string;
    tier?: string;
    status?: string;
    partnerNumber?: string | null;
    joinedAt?: string;
    validThrough?: string | null;
    verifiedAt?: string;
    error?: string;
  }> => {
    const clean = token.trim().toLowerCase();
    return swrGet(`credential:${clean}`, DEFAULT_TTL_MS, () =>
      request(`/donations/verify-credential/${encodeURIComponent(clean)}`)
    );
  },
};

