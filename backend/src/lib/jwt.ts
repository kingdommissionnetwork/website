import { sign, verify } from "hono/jwt";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { getEnv } from "./env";

const ADMIN_ROLES = new Set([
  "admin", "superadmin", "super_admin", "system_admin",
  "finance_admin", "content_admin", "support_admin",
  "marketing_admin", "analyst",
]);

const SUPER_ROLES = new Set(["admin", "superadmin", "super_admin", "system_admin"]);

/**
 * Least-privilege map for admin routes. `requireAdmin` still gates "is staff",
 * but mutations require a matching scope:
 * - analyst: read-only (GET only, no role changes, no broadcasts, no finance approvals)
 * - finance_admin: finance mutations (M-Pesa claim resolve) + read
 * - content_admin: prayer moderation + read
 * - support_admin: member suspend/reactivate/notify (never change_role) + read
 * - marketing_admin: broadcast + read
 * - super roles: everything, including change_role and invites
 */
function hasAdminScope(role: string, method: string, path: string): boolean {
  if (SUPER_ROLES.has(role)) return true;
  const m = method.toUpperCase();
  const p = path;
  if (m === "GET") return true; // all staff can read (analyst included)
  if (role === "analyst") return false;
  if (role === "finance_admin") {
    return p.includes("/mpesa/claims/") || p.includes("/members/");
  }
  if (role === "content_admin") {
    return p.includes("/prayers/");
  }
  if (role === "support_admin") {
    return p.includes("/members/") && !p.includes("/invite");
  }
  if (role === "marketing_admin") {
    return p.includes("/broadcast");
  }
  return false;
}

export async function requireAdminScope(c: Context, next: () => Promise<void>) {
  const user = (c.get as unknown as (key: string) => JwtPayload | undefined)("user");
  if (!user) return c.json({ error: "Forbidden" }, 403);
  // change_role and invites are super-only regardless of scope above.
  const path = c.req.path;
  let bodyAction = "";
  try {
    if (c.req.method !== "GET") {
      const clone = c.req.raw.clone();
      const json = (await clone.json().catch(() => null)) as { action?: string; role?: string } | null;
      bodyAction = String(json?.action || "");
      if (bodyAction === "change_role") {
        if (!SUPER_ROLES.has(user.role)) return c.json({ error: "Forbidden: role changes require a super admin." }, 403);
        return next();
      }
    }
  } catch {
    // fall through to path-based check
  }
  if (path.includes("/invite")) {
    if (!SUPER_ROLES.has(user.role)) return c.json({ error: "Forbidden: invites require a super admin." }, 403);
    return next();
  }
  if (!hasAdminScope(user.role, c.req.method, path)) {
    return c.json({ error: "Forbidden: insufficient admin scope." }, 403);
  }
  await next();
}

function getJwtSecret(env?: Record<string, string>): string {
  const secret =
    (env && env["JWT_SECRET"]) ||
    getEnv("JWT_SECRET") ||
    process.env.JWT_SECRET ||
    "";
  if (!secret) throw new Error("JWT_SECRET is not configured");
  const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
  if (!isTest && secret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");
  return secret;
}

export interface JwtPayload {
  userId: string;
  role: string;
  name: string;
  email?: string;
}

export async function signToken(payload: JwtPayload, env?: Record<string, string>): Promise<string> {
  return sign({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, getJwtSecret(env), "HS256");
}

export async function verifyToken(token: string, env?: Record<string, string>): Promise<JwtPayload> {
  return verify(token, getJwtSecret(env), "HS256") as unknown as Promise<JwtPayload>;
}

export async function requireAuth(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : getCookie(c, "token");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const env = (c.env || {}) as Record<string, string>;
    const payload = await verifyToken(token, env);
    c.set("user", payload);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
}

export async function requireAdmin(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : getCookie(c, "token");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const env = (c.env || {}) as Record<string, string>;
    const payload = await verifyToken(token, env);
    if (!ADMIN_ROLES.has(payload.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    c.set("user", payload);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
}
