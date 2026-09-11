import * as Sentry from "@sentry/cloudflare";
import { app } from "./app";

// Canonical deployment: Cloudflare Worker with assets (see wrangler.toml).
// `functions/api/[[path]].ts` is a thin legacy Pages wrapper over the same app.
export default Sentry.withSentry((env: Record<string, string>) => ({
  dsn: env.SENTRY_DSN || "",
  tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE ? parseFloat(env.SENTRY_TRACES_SAMPLE_RATE) : 0.1,
  environment: env.SENTRY_ENVIRONMENT || env.CF_PAGES_BRANCH || "development",
  release: env.SENTRY_RELEASE || undefined,
}), app);
