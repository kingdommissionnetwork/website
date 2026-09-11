import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { setEnv } from "./lib/env";
import { authRoutes } from "./routes/auth";
import { prayerRoutes } from "./routes/prayers";
import { sermonRoutes } from "./routes/sermons";
import { eventRoutes } from "./routes/events";
import { bibleRoutes } from "./routes/bible";
import { adminRoutes } from "./routes/admin";
import { streamRoutes } from "./routes/streams";
import { donationRoutes } from "./routes/donations";
import { paymentRoutes } from "./routes/payments";
import { subscriptionRoutes } from "./routes/subscriptions";
import * as Sentry from "@sentry/cloudflare";

// Canonical Hono app: single source of truth for CORS, middleware, and route
// mounts. Both deployment entries wrap this — `backend/src/index.ts` (Worker
// with assets, canonical) and `functions/api/[[path]].ts` (Pages Functions
// legacy). Change middleware here once.
export const app = new Hono<{ Bindings: Record<string, string> }>();

app.use("*", async (c, next) => {
  setEnv(c.env as Record<string, string>);
  await next();
});

app.use("*", cors({
  origin: (origin, c) => {
    const allowed = [
      "https://kingdommissionsnetwork.org",
      "https://www.kingdommissionsnetwork.org",
      "https://kingdommissionnetwork.org",
      "https://www.kingdommissionnetwork.org",
      "https://website.pages.dev",
      "https://hkn-website.pages.dev",
      "https://heavenlykingdomnetwork.org",
      "https://www.heavenlykingdomnetwork.org",
      "https://KingdomMissionNetwork.hkmministries.org",
    ];
    const env = (c.env as Record<string, string> | undefined) || {};
    // Localhost is allowed only outside production. Set ENVIRONMENT=production
    // in prod to block credentialed localhost origins.
    const isProd = env.ENVIRONMENT === "production";
    if (!origin) return "";
    if (origin.startsWith("http://localhost:")) return isProd ? "" : origin;
    if (allowed.includes(origin)) return origin;
    const frontendUrl = env.FRONTEND_URL;
    if (frontendUrl && origin === frontendUrl) return origin;
    return "";
  },
  credentials: true,
}));

// Minimal API security headers (static assets are covered by public/_headers).
app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  c.res.headers.set("X-Frame-Options", "DENY");
});
app.use("*", logger());

app.get("/api/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

app.route("/api/auth", authRoutes);
app.route("/api/prayers", prayerRoutes);
app.route("/api/sermons", sermonRoutes);
app.route("/api/events", eventRoutes);
app.route("/api/bible", bibleRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/streams", streamRoutes);
app.route("/api/donations", donationRoutes);
app.route("/api/payments", paymentRoutes);
app.route("/api/subscriptions", subscriptionRoutes);

app.onError((err, c) => {
  console.error("[Worker Error]", err, { url: c.req.url, method: c.req.method });
  try {
    Sentry.captureException(err, {
      extra: { url: c.req.url, method: c.req.method },
    });
  } catch {
    // Sentry not configured — console log above is the fallback.
  }
  return c.json({ error: "Internal Server Error" }, 500);
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));
