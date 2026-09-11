import * as Sentry from "@sentry/cloudflare";
import { handle } from "hono/cloudflare-pages";
import { app } from "../../backend/src/app";

// Legacy Pages Functions wrapper over the canonical app in backend/src/app.ts.
// Canonical deployment is the Worker with assets (`wrangler deploy`); this
// file exists only for backwards compatibility. Do not add middleware here.
export const onRequest = Sentry.withSentry(
  (env: Record<string, string>) => ({
    dsn: env.SENTRY_DSN || "",
    tracesSampleRate: 0.1,
    release: env.CF_PAGES_COMMIT_SHA || "unknown",
  }),
  handle(app)
);
