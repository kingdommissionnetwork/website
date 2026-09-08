import { createMiddleware } from "hono/factory";

const requestCounts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const MAX_STRICT = 5;

function cleanup() {
  const now = Date.now();
  for (const [key, val] of requestCounts) {
    if (val.resetAt < now) requestCounts.delete(key);
  }
}

function getClientIp(c: { req: { header: (n: string) => string | undefined } }): string {
  // Prefer Cloudflare's verified client IP. Do NOT trust X-Forwarded-For
  // (client-spoofable). NOTE: this in-memory limiter is per-isolate and is a
  // best-effort backstop — enforce real edge rate limiting in Cloudflare
  // (WAF / Rate Limiting Rules) for production.
  return c.req.header("cf-connecting-ip") || c.req.header("x-real-ip") || "unknown";
}

export const rateLimit = createMiddleware(async (c, next) => {
  if (process.env.DISABLE_RATE_LIMIT === "1" && (process.env.NODE_ENV === "test" || Boolean(process.env.VITEST))) {
    return next();
  }
  cleanup();
  const ip = getClientIp(c);
  const key = `${ip}:${c.req.path}`;
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || entry.resetAt < now) {
    requestCounts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    c.res.headers.set("X-RateLimit-Remaining", String(MAX_REQUESTS - 1));
    return next();
  }

  entry.count++;
  c.res.headers.set("X-RateLimit-Remaining", String(Math.max(0, MAX_REQUESTS - entry.count)));

  if (entry.count > MAX_REQUESTS) {
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  return next();
});

export const strictRateLimit = createMiddleware(async (c, next) => {
  if (process.env.DISABLE_RATE_LIMIT === "1" && (process.env.NODE_ENV === "test" || Boolean(process.env.VITEST))) {
    return next();
  }
  cleanup();
  const ip = getClientIp(c);
  // Per-endpoint bucket so one flow (e.g. login) can't starve another (verify).
  const key = `strict:${ip}:${c.req.path}`;
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || entry.resetAt < now) {
    requestCounts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > MAX_STRICT) {
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  return next();
});
