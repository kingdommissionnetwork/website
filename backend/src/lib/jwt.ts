import { sign, verify } from "hono/jwt";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { getEnv } from "./env";

const ADMIN_ROLES = new Set([
  "admin", "superadmin", "super_admin", "system_admin",
  "finance_admin", "content_admin", "support_admin",
  "marketing_admin", "analyst",
]);

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
